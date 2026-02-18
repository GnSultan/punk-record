// Expanded type system for the graph-structured consciousness

export type ConsciousnessLayer = "instinct" | "pattern" | "reflection" | "meta";

export type EntityType =
  | "identity"
  | "philosophy"
  | "pattern"
  | "anti-pattern"
  | "project"
  | "decision"
  | "outcome"
  | "lesson"
  | "tension"
  | "question"
  | "experiment"
  | "context"
  | "influence"
  // Legacy types from existing data
  | "concept"
  | "person"
  | "client"
  | "technology";

export type RelationType =
  // Core relationships
  | "uses"
  | "influenced-by"
  | "shares-pattern-with"
  | "was-decided-for"
  | "contradicts"
  | "supports"
  | "depends-on"
  | "evolved-from"
  // Extended relationships
  | "tensions-with"
  | "led-to"
  | "learned-from"
  | "applies-to"
  | "resulted-in"
  | "guides"
  | "violates"
  | "reinforces"
  | "challenges"
  | "co-occurs-with";

// --- Node (entity) as stored in SQLite ---

export interface GraphNode {
  id: string;
  name: string;
  entityType: EntityType;
  layer: ConsciousnessLayer;
  content: Record<string, unknown>;
  properties: Record<string, string>;
  confidence: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastAccessed: string;
  accessCount: number;
}

// --- Edge (relation) as stored in SQLite ---

export interface GraphEdge {
  id: string;
  type: RelationType;
  sourceId: string;
  targetId: string;
  weight: number;
  confidence: number;
  createdAt: string;
  createdBy: string;
  evidence: Record<string, unknown>;
}

// --- Node version history ---

export interface NodeVersion {
  nodeId: string;
  version: number;
  content: Record<string, unknown>;
  layer: ConsciousnessLayer;
  confidence: number;
  properties: Record<string, string>;
  changedAt: string;
  changedBy: string;
  changeReason: string;
  diff: string;
}

// --- Tension record ---

export type TensionType =
  | "contradiction"
  | "philosophy-action-mismatch"
  | "pattern-violation"
  | "outcome-contradiction"
  | "stale-knowledge";

export type TensionStatus = "active" | "resolved" | "deferred" | "dismissed";

export interface Tension {
  id: string;
  nodeAId: string;
  nodeBId: string;
  description: string;
  tensionType: TensionType;
  severity: number;
  status: TensionStatus;
  detectedAt: string;
  resolvedAt: string | null;
  resolution: string | null;
  surfacedCount: number;
}

// --- Inference record ---

export type InferenceType =
  | "edge-inference"
  | "node-inference"
  | "confidence-update"
  | "layer-transition";

export type InferenceStatus = "pending" | "applied" | "rejected";

export interface Inference {
  id: string;
  inferenceType: InferenceType;
  content: Record<string, unknown>;
  confidence: number;
  status: InferenceStatus;
  createdAt: string;
  reviewedAt: string | null;
}

// --- SQLite row types (snake_case as stored) ---

export interface NodeRow {
  id: string;
  name: string;
  entity_type: string;
  layer: string;
  content: string; // JSON string
  properties: string; // JSON string
  confidence: number;
  version: number;
  created_at: string;
  updated_at: string;
  last_accessed: string;
  access_count: number;
}

export interface EdgeRow {
  id: string;
  type: string;
  source_id: string;
  target_id: string;
  weight: number;
  confidence: number;
  created_at: string;
  created_by: string;
  evidence: string; // JSON string
}

export interface NodeVersionRow {
  node_id: string;
  version: number;
  content: string;
  layer: string;
  confidence: number;
  properties: string;
  changed_at: string;
  changed_by: string;
  change_reason: string;
  diff: string;
}

export interface TensionRow {
  id: string;
  node_a_id: string;
  node_b_id: string;
  description: string;
  tension_type: string;
  severity: number;
  status: string;
  detected_at: string;
  resolved_at: string | null;
  resolution: string | null;
  surfaced_count: number;
}

export interface InferenceRow {
  id: string;
  inference_type: string;
  content: string;
  confidence: number;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}

// --- Conversion helpers ---

export function nodeFromRow(row: NodeRow): GraphNode {
  return {
    id: row.id,
    name: row.name,
    entityType: row.entity_type as EntityType,
    layer: row.layer as ConsciousnessLayer,
    content: JSON.parse(row.content) as Record<string, unknown>,
    properties: JSON.parse(row.properties) as Record<string, string>,
    confidence: row.confidence,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastAccessed: row.last_accessed,
    accessCount: row.access_count,
  };
}

export function edgeFromRow(row: EdgeRow): GraphEdge {
  return {
    id: row.id,
    type: row.type as RelationType,
    sourceId: row.source_id,
    targetId: row.target_id,
    weight: row.weight,
    confidence: row.confidence,
    createdAt: row.created_at,
    createdBy: row.created_by,
    evidence: JSON.parse(row.evidence) as Record<string, unknown>,
  };
}

export function tensionFromRow(row: TensionRow): Tension {
  return {
    id: row.id,
    nodeAId: row.node_a_id,
    nodeBId: row.node_b_id,
    description: row.description,
    tensionType: row.tension_type as TensionType,
    severity: row.severity,
    status: row.status as TensionStatus,
    detectedAt: row.detected_at,
    resolvedAt: row.resolved_at,
    resolution: row.resolution,
    surfacedCount: row.surfaced_count,
  };
}

export function inferenceFromRow(row: InferenceRow): Inference {
  return {
    id: row.id,
    inferenceType: row.inference_type as InferenceType,
    content: JSON.parse(row.content) as Record<string, unknown>,
    confidence: row.confidence,
    status: row.status as InferenceStatus,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  };
}
