import { getDatabase } from "../graph/database.js";
import { embedder } from "../search/embedder.js";
import type {
  Tension,
  TensionRow,
  TensionStatus,
  NodeRow,
  EdgeRow,
} from "../graph/types.js";
import { tensionFromRow, nodeFromRow } from "../graph/types.js";

function generateId(): string {
  return `tension-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

class TensionEngine {
  /**
   * Run all tension detection strategies.
   * Returns newly detected tensions.
   */
  async detectTensions(): Promise<Tension[]> {
    const newTensions: Tension[] = [];

    // Strategy 1: Direct contradictions from graph edges
    newTensions.push(...this.detectDirectContradictions());

    // Strategy 2: Philosophy-action mismatch (uses embeddings)
    const mismatches = await this.detectPhilosophyMismatches();
    newTensions.push(...mismatches);

    // Strategy 3: Stale knowledge
    newTensions.push(...this.detectStaleKnowledge());

    return newTensions;
  }

  /**
   * Find nodes with contradiction/tension edges that don't have tension records.
   */
  private detectDirectContradictions(): Tension[] {
    const db = getDatabase();
    const now = new Date().toISOString();
    const newTensions: Tension[] = [];

    const contradictionEdges = db
      .prepare(
        `SELECT e.*, sn.name as source_name, tn.name as target_name
         FROM edges e
         JOIN nodes sn ON e.source_id = sn.id
         JOIN nodes tn ON e.target_id = tn.id
         WHERE e.type IN ('contradicts', 'tensions-with')
         AND NOT EXISTS (
           SELECT 1 FROM tensions t
           WHERE (t.node_a_id = e.source_id AND t.node_b_id = e.target_id)
           OR (t.node_a_id = e.target_id AND t.node_b_id = e.source_id)
         )`,
      )
      .all() as (EdgeRow & { source_name: string; target_name: string })[];

    for (const edge of contradictionEdges) {
      const tension: Tension = {
        id: generateId(),
        nodeAId: edge.source_id,
        nodeBId: edge.target_id,
        description: `Direct contradiction between "${edge.source_name}" and "${edge.target_name}"`,
        tensionType: "contradiction",
        severity: 0.7,
        status: "active",
        detectedAt: now,
        resolvedAt: null,
        resolution: null,
        surfacedCount: 0,
      };

      this.insertTension(tension);
      newTensions.push(tension);
    }

    return newTensions;
  }

  /**
   * Embed philosophy nodes and recent decision nodes, flag low similarity pairs.
   */
  private async detectPhilosophyMismatches(): Promise<Tension[]> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const newTensions: Tension[] = [];

    const philosophyNodes = db
      .prepare(
        "SELECT * FROM nodes WHERE entity_type IN ('philosophy', 'identity')",
      )
      .all() as NodeRow[];
    const decisionNodes = db
      .prepare(
        "SELECT * FROM nodes WHERE entity_type = 'decision' ORDER BY updated_at DESC LIMIT 20",
      )
      .all() as NodeRow[];

    if (philosophyNodes.length === 0 || decisionNodes.length === 0) {
      return [];
    }

    // Embed all nodes
    const philTexts = philosophyNodes.map((n) => `${n.name}: ${n.content}`);
    const decTexts = decisionNodes.map((n) => `${n.name}: ${n.content}`);

    const philEmbeds = await embedder.embedBatch(philTexts);
    const decEmbeds = await embedder.embedBatch(decTexts);

    // Check each decision against each philosophy
    for (let d = 0; d < decisionNodes.length; d++) {
      for (let p = 0; p < philosophyNodes.length; p++) {
        const similarity = cosineSimilarity(decEmbeds[d], philEmbeds[p]);

        // Low similarity with opposing sentiment suggests mismatch
        if (similarity < 0.3) {
          const decNode = nodeFromRow(decisionNodes[d]);
          const philNode = nodeFromRow(philosophyNodes[p]);

          // Check if tension already exists
          const existing = db
            .prepare(
              `SELECT id FROM tensions
               WHERE ((node_a_id = ? AND node_b_id = ?) OR (node_a_id = ? AND node_b_id = ?))
               AND tension_type = 'philosophy-action-mismatch'
               AND status = 'active'`,
            )
            .get(decNode.id, philNode.id, philNode.id, decNode.id) as
            | { id: string }
            | undefined;

          if (existing === undefined) {
            const tension: Tension = {
              id: generateId(),
              nodeAId: philNode.id,
              nodeBId: decNode.id,
              description: `Decision "${decNode.name}" may conflict with philosophy "${philNode.name}" (similarity: ${similarity.toFixed(2)})`,
              tensionType: "philosophy-action-mismatch",
              severity: 1.0 - similarity, // Lower similarity = higher severity
              status: "active",
              detectedAt: now,
              resolvedAt: null,
              resolution: null,
              surfacedCount: 0,
            };

            this.insertTension(tension);
            newTensions.push(tension);
          }
        }
      }
    }

    return newTensions;
  }

  /**
   * Flag context/pattern nodes not accessed in 90+ days.
   */
  private detectStaleKnowledge(): Tension[] {
    const db = getDatabase();
    const now = new Date().toISOString();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoff = ninetyDaysAgo.toISOString();
    const newTensions: Tension[] = [];

    const staleNodes = db
      .prepare(
        `SELECT * FROM nodes
         WHERE entity_type IN ('context', 'pattern')
         AND last_accessed < ?
         AND id NOT IN (
           SELECT node_a_id FROM tensions WHERE tension_type = 'stale-knowledge' AND status = 'active'
           UNION
           SELECT node_b_id FROM tensions WHERE tension_type = 'stale-knowledge' AND status = 'active'
         )`,
      )
      .all(cutoff) as NodeRow[];

    for (const row of staleNodes) {
      const node = nodeFromRow(row);
      const tension: Tension = {
        id: generateId(),
        nodeAId: node.id,
        nodeBId: node.id, // Self-referential for stale knowledge
        description: `"${node.name}" (${node.entityType}) has not been accessed since ${node.lastAccessed}`,
        tensionType: "stale-knowledge",
        severity: 0.3,
        status: "active",
        detectedAt: now,
        resolvedAt: null,
        resolution: null,
        surfacedCount: 0,
      };

      this.insertTension(tension);
      newTensions.push(tension);
    }

    return newTensions;
  }

  /**
   * Get surfacing priority for a tension given context.
   */
  getSurfacingPriority(
    tension: Tension,
    projectId?: string,
  ): "critical" | "contextual" | "deferred" | "silent" {
    // Critical: contradictions and high-severity mismatches
    if (tension.tensionType === "contradiction" && tension.severity > 0.6) {
      return "critical";
    }
    if (
      tension.tensionType === "philosophy-action-mismatch" &&
      tension.severity > 0.7
    ) {
      return "critical";
    }

    // Contextual: related to current project
    if (projectId !== undefined) {
      const db = getDatabase();
      const related = db
        .prepare(
          `SELECT 1 FROM edges
           WHERE (source_id = ? OR target_id = ?)
           AND (source_id IN (?, ?) OR target_id IN (?, ?))`,
        )
        .get(
          projectId,
          projectId,
          tension.nodeAId,
          tension.nodeBId,
          tension.nodeAId,
          tension.nodeBId,
        );
      if (related !== undefined) return "contextual";
    }

    // Deferred: stale knowledge
    if (tension.tensionType === "stale-knowledge") {
      return "deferred";
    }

    // Silent: low severity, surfaced many times
    if (tension.severity < 0.3 || tension.surfacedCount > 5) {
      return "silent";
    }

    return "deferred";
  }

  /**
   * Get all active critical tensions.
   */
  getCriticalTensions(): Tension[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM tensions
         WHERE status = 'active'
         AND (severity > 0.6 OR tension_type IN ('contradiction', 'philosophy-action-mismatch'))
         ORDER BY severity DESC`,
      )
      .all() as TensionRow[];

    return rows.map(tensionFromRow);
  }

  /**
   * Get tensions contextual to a project.
   */
  getContextualTensions(projectId: string): Tension[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT t.* FROM tensions t
         WHERE t.status = 'active'
         AND (
           t.node_a_id IN (SELECT source_id FROM edges WHERE target_id = ? UNION SELECT target_id FROM edges WHERE source_id = ?)
           OR t.node_b_id IN (SELECT source_id FROM edges WHERE target_id = ? UNION SELECT target_id FROM edges WHERE source_id = ?)
         )
         ORDER BY t.severity DESC`,
      )
      .all(projectId, projectId, projectId, projectId) as TensionRow[];

    return rows.map(tensionFromRow);
  }

  /**
   * Get all active tensions.
   */
  getActiveTensions(): Tension[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        "SELECT * FROM tensions WHERE status = 'active' ORDER BY severity DESC",
      )
      .all() as TensionRow[];

    // Increment surfaced count
    for (const row of rows) {
      db.prepare(
        "UPDATE tensions SET surfaced_count = surfaced_count + 1 WHERE id = ?",
      ).run(row.id);
    }

    return rows.map(tensionFromRow);
  }

  /**
   * Resolve a tension with explanation.
   */
  resolveTension(
    tensionId: string,
    resolution: string,
    newStatus: TensionStatus = "resolved",
  ): Tension | undefined {
    const db = getDatabase();
    const now = new Date().toISOString();

    db.prepare(
      "UPDATE tensions SET status = ?, resolution = ?, resolved_at = ? WHERE id = ?",
    ).run(newStatus, resolution, now, tensionId);

    const row = db
      .prepare("SELECT * FROM tensions WHERE id = ?")
      .get(tensionId) as TensionRow | undefined;

    return row !== undefined ? tensionFromRow(row) : undefined;
  }

  /**
   * Check a proposed decision against existing philosophies and patterns.
   */
  async checkDecisionTensions(proposedAction: string): Promise<{
    tensions: Array<{
      philosophy: string;
      similarity: number;
      concern: string;
    }>;
    recommendation: string;
  }> {
    const db = getDatabase();

    const philosophyNodes = db
      .prepare(
        "SELECT * FROM nodes WHERE entity_type IN ('philosophy', 'identity')",
      )
      .all() as NodeRow[];

    if (philosophyNodes.length === 0) {
      return {
        tensions: [],
        recommendation:
          "No philosophies recorded yet — proceed with awareness.",
      };
    }

    const philTexts = philosophyNodes.map((n) => `${n.name}: ${n.content}`);
    const allTexts = [proposedAction, ...philTexts];
    const embeddings = await embedder.embedBatch(allTexts);
    const actionEmbed = embeddings[0];
    const philEmbeds = embeddings.slice(1);

    const tensions: Array<{
      philosophy: string;
      similarity: number;
      concern: string;
    }> = [];

    for (let i = 0; i < philosophyNodes.length; i++) {
      const similarity = cosineSimilarity(actionEmbed, philEmbeds[i]);
      if (similarity < 0.4) {
        tensions.push({
          philosophy: philosophyNodes[i].name,
          similarity,
          concern:
            similarity < 0.2
              ? "Strong potential conflict"
              : "Possible misalignment",
        });
      }
    }

    // Sort by severity (lowest similarity first)
    tensions.sort((a, b) => a.similarity - b.similarity);

    const recommendation =
      tensions.length === 0
        ? "No conflicts detected — action aligns with recorded philosophies."
        : tensions.length <= 2
          ? "Minor concerns detected — review before proceeding."
          : "Multiple conflicts detected — strongly consider revisiting this approach.";

    return { tensions, recommendation };
  }

  private insertTension(tension: Tension): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO tensions (id, node_a_id, node_b_id, description, tension_type, severity, status, detected_at, resolved_at, resolution, surfaced_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      tension.id,
      tension.nodeAId,
      tension.nodeBId,
      tension.description,
      tension.tensionType,
      tension.severity,
      tension.status,
      tension.detectedAt,
      tension.resolvedAt,
      tension.resolution,
      tension.surfacedCount,
    );
  }
}

export const tensionEngine = new TensionEngine();
