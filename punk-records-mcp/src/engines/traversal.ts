import { getDatabase } from "../graph/database.js";
import { embedder } from "../search/embedder.js";
import type { NodeRow, EdgeRow } from "../graph/types.js";
import { nodeFromRow } from "../graph/types.js";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

interface TraversalPath {
  nodes: Array<{ id: string; name: string; entityType: string }>;
  edges: Array<{ type: string; from: string; to: string }>;
  unexpectedness: number;
  insight: string;
}

class TraversalEngine {
  /**
   * Perform creative traversal from seed nodes.
   * Uses random walks with unexpectedness scoring.
   */
  creativeTraverse(
    seedIds: string[],
    distance: number = 3,
    walksPerSeed: number = 5,
  ): TraversalPath[] {
    const allPaths: TraversalPath[] = [];
    const visited = new Set<string>();

    for (const seedId of seedIds) {
      for (let walk = 0; walk < walksPerSeed; walk++) {
        const path = this.randomWalk(seedId, distance, visited);
        if (path !== null && this.isInteresting(path)) {
          path.insight = this.generateInsight(path);
          allPaths.push(path);
        }
      }
    }

    // Sort by unexpectedness
    allPaths.sort((a, b) => b.unexpectedness - a.unexpectedness);

    // Deduplicate by end node
    const seen = new Set<string>();
    return allPaths.filter((p) => {
      const endId = p.nodes[p.nodes.length - 1].id;
      if (seen.has(endId)) return false;
      seen.add(endId);
      return true;
    });
  }

  /**
   * Challenge an assumption by finding counter-evidence.
   */
  async challengeAssumption(assumption: string): Promise<{
    counterEvidence: Array<{
      node: string;
      relevance: number;
      challenge: string;
    }>;
    strengthOfChallenge: string;
  }> {
    const db = getDatabase();

    // Embed the assumption
    const assumptionEmbed = await embedder.embed(assumption);

    // Get all nodes and embed them
    const nodes = db
      .prepare("SELECT * FROM nodes ORDER BY access_count DESC LIMIT 50")
      .all() as NodeRow[];

    const nodeTexts = nodes.map((n) => `${n.name}: ${n.content}`);
    const nodeEmbeds = await embedder.embedBatch(nodeTexts);

    // Find nodes that are somewhat related but potentially contradictory
    const candidates: Array<{
      node: string;
      nodeId: string;
      relevance: number;
    }> = [];

    for (let i = 0; i < nodes.length; i++) {
      const sim = cosineSimilarity(assumptionEmbed, nodeEmbeds[i]);
      // We want moderate similarity (related topic, potentially different conclusion)
      // Not too high (that's agreement) and not too low (unrelated)
      if (sim > 0.2 && sim < 0.7) {
        candidates.push({
          node: nodes[i].name,
          nodeId: nodes[i].id,
          relevance: sim,
        });
      }
    }

    // Sort by relevance (prefer middle range - related but not agreeing)
    candidates.sort(
      (a, b) => Math.abs(0.4 - a.relevance) - Math.abs(0.4 - b.relevance),
    );

    // Check for contradiction edges from candidates
    const counterEvidence: Array<{
      node: string;
      relevance: number;
      challenge: string;
    }> = [];

    for (const candidate of candidates.slice(0, 10)) {
      // Check if this node has contradiction edges
      const contradictions = db
        .prepare(
          `SELECT e.*, n.name as other_name FROM edges e
           JOIN nodes n ON (n.id = CASE WHEN e.source_id = ? THEN e.target_id ELSE e.source_id END)
           WHERE (e.source_id = ? OR e.target_id = ?)
           AND e.type IN ('contradicts', 'tensions-with', 'violates')`,
        )
        .all(
          candidate.nodeId,
          candidate.nodeId,
          candidate.nodeId,
        ) as (EdgeRow & {
        other_name: string;
      })[];

      let challenge: string;
      if (contradictions.length > 0) {
        challenge = `"${candidate.node}" has known tensions with ${contradictions.map((c) => c.other_name).join(", ")}`;
      } else {
        challenge = `"${candidate.node}" represents a different perspective (similarity: ${candidate.relevance.toFixed(2)})`;
      }

      counterEvidence.push({
        node: candidate.node,
        relevance: candidate.relevance,
        challenge,
      });
    }

    const strength =
      counterEvidence.length === 0
        ? "No counter-evidence found — assumption appears unchallenged."
        : counterEvidence.length <= 2
          ? "Mild challenge — some alternative perspectives exist."
          : counterEvidence.length <= 5
            ? "Moderate challenge — multiple perspectives to consider."
            : "Strong challenge — significant counter-evidence found.";

    return {
      counterEvidence: counterEvidence.slice(0, 7),
      strengthOfChallenge: strength,
    };
  }

  // --- Private helpers ---

  private randomWalk(
    startId: string,
    maxSteps: number,
    globalVisited: Set<string>,
  ): TraversalPath | null {
    const db = getDatabase();
    const getNode = db.prepare("SELECT * FROM nodes WHERE id = ?");
    const getEdges = db.prepare(
      "SELECT * FROM edges WHERE source_id = ? OR target_id = ?",
    );
    const pathNodes: TraversalPath["nodes"] = [];
    const pathEdges: TraversalPath["edges"] = [];
    let currentId = startId;
    let unexpectedness = 0;
    let prevEdgeType = "";
    const localVisited = new Set<string>();

    for (let step = 0; step <= maxSteps; step++) {
      const nodeRow = getNode.get(currentId) as NodeRow | undefined;
      if (nodeRow === undefined) break;

      const node = nodeFromRow(nodeRow);
      pathNodes.push({
        id: node.id,
        name: node.name,
        entityType: node.entityType,
      });
      localVisited.add(currentId);

      if (step === maxSteps) break;

      // Get all edges from current node
      const edges = getEdges.all(currentId, currentId) as EdgeRow[];
      if (edges.length === 0) break;

      // Score each possible next step
      const scored = edges
        .map((edge) => {
          const nextId =
            edge.source_id === currentId ? edge.target_id : edge.source_id;
          let score = 1.0;

          // Unvisited globally = more interesting
          if (!globalVisited.has(nextId)) score *= 2.0;
          // Unvisited in this walk
          if (!localVisited.has(nextId)) score *= 1.5;
          // Low weight edges = non-obvious connections
          if (edge.weight < 0.5) score *= 1.5;
          // Different edge type from previous step = more variety
          if (edge.type !== prevEdgeType && prevEdgeType !== "") score *= 1.3;
          // Low access count = rarely explored
          const nextNode = getNode.get(nextId) as NodeRow | undefined;
          if (nextNode !== undefined && nextNode.access_count < 3) score *= 1.5;

          return { edge, nextId, score };
        })
        .filter((s) => !localVisited.has(s.nextId));

      if (scored.length === 0) break;

      // Weighted random selection
      const totalScore = scored.reduce((sum, s) => sum + s.score, 0);
      let random = Math.random() * totalScore;
      let chosen = scored[0];
      for (const s of scored) {
        random -= s.score;
        if (random <= 0) {
          chosen = s;
          break;
        }
      }

      pathEdges.push({
        type: chosen.edge.type,
        from: chosen.edge.source_id,
        to: chosen.edge.target_id,
      });

      unexpectedness += chosen.score;
      prevEdgeType = chosen.edge.type;
      currentId = chosen.nextId;
    }

    if (pathNodes.length < 2) return null;

    globalVisited.add(pathNodes[pathNodes.length - 1].id);

    return {
      nodes: pathNodes,
      edges: pathEdges,
      unexpectedness: unexpectedness / pathNodes.length,
      insight: "",
    };
  }

  private isInteresting(path: TraversalPath): boolean {
    if (path.nodes.length < 2) return false;

    const start = path.nodes[0];
    const end = path.nodes[path.nodes.length - 1];

    // Cross-type connection is interesting
    if (start.entityType !== end.entityType) return true;

    // Longer paths are more interesting
    if (path.nodes.length >= 3) return true;

    // High unexpectedness is interesting
    if (path.unexpectedness > 3.0) return true;

    return false;
  }

  private generateInsight(path: TraversalPath): string {
    const start = path.nodes[0];
    const end = path.nodes[path.nodes.length - 1];
    const via =
      path.nodes.length > 2
        ? path.nodes
            .slice(1, -1)
            .map((n) => n.name)
            .join(" → ")
        : "direct";

    if (start.entityType !== end.entityType) {
      return `Cross-domain connection: "${start.name}" (${start.entityType}) connects to "${end.name}" (${end.entityType}) via ${via}`;
    }

    if (path.unexpectedness > 4.0) {
      return `Unexpected link: "${start.name}" reaches "${end.name}" through rarely-explored path via ${via}`;
    }

    return `"${start.name}" connects to "${end.name}" via ${via}`;
  }
}

export const traversalEngine = new TraversalEngine();
