import { getDatabase } from "../graph/database.js";
import { embedder } from "../search/embedder.js";
import { evolutionEngine } from "./evolution.js";
import type {
  Inference,
  InferenceRow,
  NodeRow,
} from "../graph/types.js";
import { inferenceFromRow, nodeFromRow } from "../graph/types.js";

function generateId(): string {
  return `inf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

class InferenceEngine {
  /**
   * Run all inference strategies. Returns newly created inferences.
   */
  async runInference(): Promise<Inference[]> {
    const newInferences: Inference[] = [];

    // Strategy 1: Edge inference — find co-occurring nodes without direct edges
    const edgeInferences = await this.inferEdges();
    newInferences.push(...edgeInferences);

    // Strategy 2: Layer transitions — check if any nodes are ready to level up
    newInferences.push(...this.inferLayerTransitions());

    // Strategy 3: Confidence updates based on usage
    newInferences.push(...this.inferConfidenceUpdates());

    return newInferences;
  }

  /**
   * Find node pairs that co-occur in projects but have no direct edge.
   * Uses embedding similarity to validate the connection.
   */
  private async inferEdges(): Promise<Inference[]> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const inferences: Inference[] = [];

    // Find node pairs connected to the same project but not to each other
    const candidates = db
      .prepare(
        `SELECT DISTINCT n1.id as id1, n1.name as name1, n2.id as id2, n2.name as name2
         FROM edges e1
         JOIN edges e2 ON (
           (e1.source_id = e2.source_id OR e1.target_id = e2.target_id
            OR e1.source_id = e2.target_id OR e1.target_id = e2.source_id)
         )
         JOIN nodes n1 ON n1.id = CASE WHEN e1.source_id IN (SELECT id FROM nodes WHERE entity_type = 'project') THEN e1.target_id ELSE e1.source_id END
         JOIN nodes n2 ON n2.id = CASE WHEN e2.source_id IN (SELECT id FROM nodes WHERE entity_type = 'project') THEN e2.target_id ELSE e2.source_id END
         WHERE n1.id < n2.id
         AND n1.entity_type != 'project'
         AND n2.entity_type != 'project'
         AND NOT EXISTS (
           SELECT 1 FROM edges e3
           WHERE (e3.source_id = n1.id AND e3.target_id = n2.id)
           OR (e3.source_id = n2.id AND e3.target_id = n1.id)
         )
         AND NOT EXISTS (
           SELECT 1 FROM inferences i
           WHERE i.inference_type = 'edge-inference'
           AND i.status IN ('pending', 'applied')
           AND i.content LIKE '%' || n1.id || '%'
           AND i.content LIKE '%' || n2.id || '%'
         )
         LIMIT 20`,
      )
      .all() as {
      id1: string;
      name1: string;
      id2: string;
      name2: string;
    }[];

    if (candidates.length === 0) return [];

    // Embed candidate pairs and check similarity
    const texts = candidates.flatMap((c) => [c.name1, c.name2]);
    const embeddings = await embedder.embedBatch(texts);

    for (let i = 0; i < candidates.length; i++) {
      const sim = cosineSimilarity(embeddings[i * 2], embeddings[i * 2 + 1]);
      if (sim > 0.5) {
        const candidate = candidates[i];
        const inference: Inference = {
          id: generateId(),
          inferenceType: "edge-inference",
          content: {
            sourceId: candidate.id1,
            sourceName: candidate.name1,
            targetId: candidate.id2,
            targetName: candidate.name2,
            suggestedType: "co-occurs-with",
            similarity: sim,
          },
          confidence: sim,
          status: "pending",
          createdAt: now,
          reviewedAt: null,
        };

        this.insertInference(inference);
        inferences.push(inference);
      }
    }

    return inferences;
  }

  /**
   * Check all nodes for layer transition eligibility.
   */
  private inferLayerTransitions(): Inference[] {
    const db = getDatabase();
    const now = new Date().toISOString();
    const inferences: Inference[] = [];

    const nodes = db
      .prepare("SELECT * FROM nodes WHERE layer != 'instinct' AND version >= 3")
      .all() as NodeRow[];

    for (const row of nodes) {
      const node = nodeFromRow(row);
      const transition = evolutionEngine.checkLayerTransition(node.id);

      if (transition.eligible && transition.suggestedLayer !== null) {
        // Check if we already have a pending inference for this
        const existing = db
          .prepare(
            `SELECT id FROM inferences
             WHERE inference_type = 'layer-transition'
             AND status = 'pending'
             AND content LIKE '%' || ? || '%'`,
          )
          .get(node.id) as { id: string } | undefined;

        if (existing === undefined) {
          const inference: Inference = {
            id: generateId(),
            inferenceType: "layer-transition",
            content: {
              nodeId: node.id,
              nodeName: node.name,
              currentLayer: transition.currentLayer,
              suggestedLayer: transition.suggestedLayer,
              reason: transition.reason,
            },
            confidence: node.confidence,
            status: "pending",
            createdAt: now,
            reviewedAt: null,
          };

          this.insertInference(inference);
          inferences.push(inference);
        }
      }
    }

    return inferences;
  }

  /**
   * Update confidence for nodes based on access patterns.
   * Frequently accessed nodes get a confidence boost.
   */
  private inferConfidenceUpdates(): Inference[] {
    const db = getDatabase();
    const now = new Date().toISOString();
    const inferences: Inference[] = [];

    // Find nodes with high access but low confidence
    const underconfident = db
      .prepare(
        `SELECT * FROM nodes
         WHERE access_count >= 5
         AND confidence < 0.7
         AND id NOT IN (
           SELECT json_extract(content, '$.nodeId') FROM inferences
           WHERE inference_type = 'confidence-update'
           AND status = 'pending'
         )`,
      )
      .all() as NodeRow[];

    for (const row of underconfident) {
      const node = nodeFromRow(row);
      // Scale confidence boost by access count (log scale)
      const suggestedConfidence = Math.min(
        0.9,
        node.confidence + Math.log10(node.accessCount) * 0.1,
      );

      if (suggestedConfidence - node.confidence > 0.05) {
        const inference: Inference = {
          id: generateId(),
          inferenceType: "confidence-update",
          content: {
            nodeId: node.id,
            nodeName: node.name,
            currentConfidence: node.confidence,
            suggestedConfidence,
            reason: `High usage (${node.accessCount} accesses) suggests this knowledge is reliable`,
          },
          confidence: suggestedConfidence,
          status: "pending",
          createdAt: now,
          reviewedAt: null,
        };

        this.insertInference(inference);
        inferences.push(inference);
      }
    }

    return inferences;
  }

  /**
   * Get all pending inferences for review.
   */
  getPendingInferences(): Inference[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        "SELECT * FROM inferences WHERE status = 'pending' ORDER BY confidence DESC",
      )
      .all() as InferenceRow[];
    return rows.map(inferenceFromRow);
  }

  /**
   * Apply an inference — create the suggested edge/node/update.
   */
  applyInference(inferenceId: string): string {
    const db = getDatabase();
    const now = new Date().toISOString();

    const row = db
      .prepare("SELECT * FROM inferences WHERE id = ?")
      .get(inferenceId) as InferenceRow | undefined;

    if (row === undefined) return `Inference not found: ${inferenceId}`;

    const inference = inferenceFromRow(row);
    const content = inference.content;

    let result: string;

    switch (inference.inferenceType) {
      case "edge-inference": {
        const edgeId = `${content.sourceId as string}-${content.suggestedType as string}-${content.targetId as string}`;
        db.prepare(
          `INSERT OR IGNORE INTO edges (id, type, source_id, target_id, weight, confidence, created_at, created_by, evidence)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          edgeId,
          content.suggestedType,
          content.sourceId,
          content.targetId,
          1.0,
          inference.confidence,
          now,
          "inference",
          JSON.stringify({ inferenceId }),
        );
        result = `Edge created: ${content.sourceName as string} --[${content.suggestedType as string}]--> ${content.targetName as string}`;
        break;
      }

      case "layer-transition": {
        const nodeId = content.nodeId as string;
        const suggestedLayer = content.suggestedLayer as string;
        evolutionEngine.evolveNode(
          nodeId,
          { layer: suggestedLayer as "instinct" | "pattern" | "reflection" | "meta" },
          `Layer transition: ${content.currentLayer as string} → ${suggestedLayer} (inferred)`,
          "inference",
        );
        result = `Layer transition: ${content.nodeName as string} moved to ${suggestedLayer}`;
        break;
      }

      case "confidence-update": {
        const nodeId = content.nodeId as string;
        const newConf = content.suggestedConfidence as number;
        db.prepare("UPDATE nodes SET confidence = ?, updated_at = ? WHERE id = ?").run(
          newConf,
          now,
          nodeId,
        );
        result = `Confidence updated: ${content.nodeName as string} → ${newConf.toFixed(2)}`;
        break;
      }

      default:
        result = `Unknown inference type: ${inference.inferenceType}`;
    }

    // Mark as applied
    db.prepare(
      "UPDATE inferences SET status = 'applied', reviewed_at = ? WHERE id = ?",
    ).run(now, inferenceId);

    return result;
  }

  /**
   * Reject an inference.
   */
  rejectInference(inferenceId: string): string {
    const db = getDatabase();
    const now = new Date().toISOString();

    const row = db
      .prepare("SELECT * FROM inferences WHERE id = ?")
      .get(inferenceId) as InferenceRow | undefined;

    if (row === undefined) return `Inference not found: ${inferenceId}`;

    db.prepare(
      "UPDATE inferences SET status = 'rejected', reviewed_at = ? WHERE id = ?",
    ).run(now, inferenceId);

    return `Inference rejected: ${inferenceId}`;
  }

  /**
   * Auto-apply high-confidence inferences (called from session end).
   */
  autoApplyHighConfidence(threshold: number = 0.85): string[] {
    const pending = this.getPendingInferences();
    const results: string[] = [];

    for (const inf of pending) {
      if (inf.confidence >= threshold) {
        const result = this.applyInference(inf.id);
        results.push(result);
      }
    }

    return results;
  }

  private insertInference(inference: Inference): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO inferences (id, inference_type, content, confidence, status, created_at, reviewed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      inference.id,
      inference.inferenceType,
      JSON.stringify(inference.content),
      inference.confidence,
      inference.status,
      inference.createdAt,
      inference.reviewedAt,
    );
  }
}

export const inferenceEngine = new InferenceEngine();
