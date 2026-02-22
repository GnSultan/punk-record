export interface PunkDocument {
  filePath: string;
  relativePath: string;
  title: string;
  domain: string;
  tags: string[];
  content: string;
  rawContent: string;
  frontmatter: Record<string, unknown>;
  created: string;
  updated: string;
}

export interface IndexedChunk {
  id: string;
  filePath: string;
  relativePath: string;
  title: string;
  domain: string;
  tags: string;
  text: string;
  embedding: number[];
}

export interface GraphEntity {
  id: string;
  name: string;
  entityType:
    | "project"
    | "concept"
    | "decision"
    | "pattern"
    | "person"
    | "client"
    | "technology"
    // Extended types from Phase 0+
    | "identity"
    | "philosophy"
    | "anti-pattern"
    | "outcome"
    | "lesson"
    | "tension"
    | "question"
    | "experiment"
    | "context"
    | "influence";
  properties: Record<string, string>;
}

export interface GraphRelation {
  from: string;
  to: string;
  relationType:
    | "uses"
    | "influenced-by"
    | "shares-pattern-with"
    | "was-decided-for"
    | "contradicts"
    | "supports"
    | "depends-on"
    | "evolved-from"
    // Extended types from Phase 0+
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
  properties?: Record<string, string>;
}

// Re-export expanded graph types for engines
export type {
  GraphNode,
  GraphEdge,
  NodeVersion,
  Tension,
  Inference,
  ConsciousnessLayer,
  EntityType,
  RelationType,
  TensionType,
  TensionStatus,
  InferenceType,
  InferenceStatus,
} from "./graph/types.js";

export interface QueryLogEntry {
  timestamp: string;
  tool: string;
  params: Record<string, unknown>;
  resultCount: number;
  durationMs: number;
}
