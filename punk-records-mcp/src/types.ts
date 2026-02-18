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
    | "technology";
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
    | "evolved-from";
  properties?: Record<string, string>;
}

export interface QueryLogEntry {
  timestamp: string;
  tool: string;
  params: Record<string, unknown>;
  resultCount: number;
  durationMs: number;
}
