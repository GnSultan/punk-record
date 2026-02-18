import { getDatabase } from "../graph/database.js";
import { graphStore } from "../graph/store.js";
import { embedder } from "../search/embedder.js";
import type {
  GraphNode,
  NodeVersion,
  NodeVersionRow,
  ConsciousnessLayer,
} from "../graph/types.js";
import { nodeFromRow } from "../graph/types.js";
import type { NodeRow } from "../graph/types.js";

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

function versionFromRow(row: NodeVersionRow): NodeVersion {
  return {
    nodeId: row.node_id,
    version: row.version,
    content: JSON.parse(row.content) as Record<string, unknown>,
    layer: row.layer as ConsciousnessLayer,
    confidence: row.confidence,
    properties: JSON.parse(row.properties) as Record<string, string>,
    changedAt: row.changed_at,
    changedBy: row.changed_by,
    changeReason: row.change_reason,
    diff: row.diff,
  };
}

class EvolutionEngine {
  /**
   * Evolve a node: archive current state as a version, apply changes, bump version.
   * Runs as an atomic SQLite transaction.
   */
  evolveNode(
    nodeId: string,
    changes: {
      name?: string;
      content?: Record<string, unknown>;
      properties?: Record<string, string>;
      confidence?: number;
      layer?: ConsciousnessLayer;
    },
    reason: string,
    changedBy: string = "user",
  ): GraphNode {
    const db = getDatabase();
    const now = new Date().toISOString();

    const result = db.transaction(() => {
      // Get current node
      const row = db.prepare("SELECT * FROM nodes WHERE id = ?").get(nodeId) as
        | NodeRow
        | undefined;
      if (row === undefined) {
        throw new Error(`Node not found: ${nodeId}`);
      }
      const current = nodeFromRow(row);

      // Archive current state as a version
      db.prepare(
        `INSERT INTO node_versions (node_id, version, content, layer, confidence, properties, changed_at, changed_by, change_reason, diff)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        nodeId,
        current.version,
        JSON.stringify(current.content),
        current.layer,
        current.confidence,
        JSON.stringify(current.properties),
        now,
        changedBy,
        reason,
        this.computeDiff(current, changes),
      );

      // Apply changes
      const newVersion = current.version + 1;
      const newName = changes.name ?? current.name;
      const newContent =
        changes.content !== undefined
          ? JSON.stringify(changes.content)
          : JSON.stringify(current.content);
      const newProperties =
        changes.properties !== undefined
          ? JSON.stringify(changes.properties)
          : JSON.stringify(current.properties);
      const newConfidence = changes.confidence ?? current.confidence;
      const newLayer = changes.layer ?? current.layer;

      db.prepare(
        `UPDATE nodes SET name = ?, content = ?, properties = ?, confidence = ?, layer = ?, version = ?, updated_at = ?
         WHERE id = ?`,
      ).run(
        newName,
        newContent,
        newProperties,
        newConfidence,
        newLayer,
        newVersion,
        now,
        nodeId,
      );

      // Create evolved-from edge (self-referential version tracking)
      const edgeId = `${nodeId}-evolved-from-v${current.version}`;
      db.prepare(
        `INSERT OR IGNORE INTO edges (id, type, source_id, target_id, weight, confidence, created_at, created_by, evidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        edgeId,
        "evolved-from",
        nodeId,
        nodeId,
        1.0,
        1.0,
        now,
        changedBy,
        JSON.stringify({
          fromVersion: current.version,
          toVersion: newVersion,
          reason,
        }),
      );

      // Return updated node
      const updatedRow = db
        .prepare("SELECT * FROM nodes WHERE id = ?")
        .get(nodeId) as NodeRow;
      return nodeFromRow(updatedRow);
    })();

    return result;
  }

  /**
   * Get full version history for a node.
   */
  getEvolutionHistory(nodeId: string): {
    current: GraphNode | undefined;
    versions: NodeVersion[];
    totalVersions: number;
  } {
    const db = getDatabase();

    const current = graphStore.getNode(nodeId);
    const rows = db
      .prepare(
        "SELECT * FROM node_versions WHERE node_id = ? ORDER BY version ASC",
      )
      .all(nodeId) as NodeVersionRow[];

    return {
      current,
      versions: rows.map(versionFromRow),
      totalVersions: rows.length + (current !== undefined ? 1 : 0),
    };
  }

  /**
   * Analyze semantic drift from v1 to current using embeddings.
   * Returns similarity score (1.0 = identical, 0.0 = completely different).
   */
  async analyzeDrift(nodeId: string): Promise<{
    similarity: number;
    driftDescription: string;
    versionsAnalyzed: number;
  }> {
    const history = this.getEvolutionHistory(nodeId);
    if (history.current === undefined) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    if (history.versions.length === 0) {
      return {
        similarity: 1.0,
        driftDescription:
          "No evolution history — node unchanged since creation.",
        versionsAnalyzed: 1,
      };
    }

    // Compare first version to current using embeddings
    const firstVersion = history.versions[0];
    const firstName =
      "name" in firstVersion.properties ? firstVersion.properties.name : nodeId;
    const firstText = `${firstName}: ${JSON.stringify(firstVersion.content)}`;
    const currentText = `${history.current.name}: ${JSON.stringify(history.current.content)}`;

    const [firstEmbed, currentEmbed] = await embedder.embedBatch([
      firstText,
      currentText,
    ]);
    const similarity = cosineSimilarity(firstEmbed, currentEmbed);

    let driftDescription: string;
    if (similarity > 0.9) {
      driftDescription = "Minimal drift — node meaning has been stable.";
    } else if (similarity > 0.7) {
      driftDescription =
        "Moderate drift — node has evolved but retains core meaning.";
    } else if (similarity > 0.5) {
      driftDescription =
        "Significant drift — node meaning has substantially shifted.";
    } else {
      driftDescription =
        "Major drift — node has fundamentally changed from its original form.";
    }

    return {
      similarity,
      driftDescription,
      versionsAnalyzed: history.totalVersions,
    };
  }

  /**
   * Check if a node is ready for a consciousness layer transition.
   * Rules:
   * - pattern → instinct: confidence > 0.9, version >= 5
   * - reflection → pattern: confidence > 0.7, version >= 3
   * - meta → reflection: confidence > 0.8, version >= 4
   */
  checkLayerTransition(nodeId: string): {
    eligible: boolean;
    currentLayer: ConsciousnessLayer;
    suggestedLayer: ConsciousnessLayer | null;
    reason: string;
  } {
    const node = graphStore.getNode(nodeId);
    if (node === undefined) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    const transitions: Record<
      ConsciousnessLayer,
      {
        targetLayer: ConsciousnessLayer;
        minConfidence: number;
        minVersion: number;
      }
    > = {
      pattern: { targetLayer: "instinct", minConfidence: 0.9, minVersion: 5 },
      reflection: { targetLayer: "pattern", minConfidence: 0.7, minVersion: 3 },
      meta: { targetLayer: "reflection", minConfidence: 0.8, minVersion: 4 },
      instinct: {
        targetLayer: "instinct",
        minConfidence: 1.0,
        minVersion: 999,
      }, // No transition from instinct
    };

    const rule = transitions[node.layer];
    if (node.layer === "instinct") {
      return {
        eligible: false,
        currentLayer: node.layer,
        suggestedLayer: null,
        reason: "Already at instinct layer — no further transitions.",
      };
    }

    const eligible =
      node.confidence >= rule.minConfidence && node.version >= rule.minVersion;

    return {
      eligible,
      currentLayer: node.layer,
      suggestedLayer: eligible ? rule.targetLayer : null,
      reason: eligible
        ? `Ready for transition: confidence ${node.confidence.toFixed(2)} >= ${rule.minConfidence}, version ${node.version} >= ${rule.minVersion}`
        : `Not yet eligible: confidence ${node.confidence.toFixed(2)}/${rule.minConfidence}, version ${node.version}/${rule.minVersion}`,
    };
  }

  private computeDiff(
    current: GraphNode,
    changes: Record<string, unknown>,
  ): string {
    const diffs: string[] = [];
    for (const [key, value] of Object.entries(changes)) {
      if (value !== undefined) {
        const currentVal = current[key as keyof GraphNode];
        diffs.push(
          `${key}: ${JSON.stringify(currentVal)} → ${JSON.stringify(value)}`,
        );
      }
    }
    return diffs.join("; ");
  }
}

export const evolutionEngine = new EvolutionEngine();
