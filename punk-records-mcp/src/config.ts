import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const RECORDS_ROOT = path.resolve(__dirname, "../../punk-records");
export const DATA_ROOT = path.resolve(RECORDS_ROOT, ".brain");

export const PATHS = {
  core: path.join(RECORDS_ROOT, "core"),
  projects: path.join(RECORDS_ROOT, "memory/projects"),
  clients: path.join(RECORDS_ROOT, "memory/clients"),
  experiments: path.join(RECORDS_ROOT, "memory/experiments"),
  codePatterns: path.join(RECORDS_ROOT, "patterns/code"),
  designPatterns: path.join(RECORDS_ROOT, "patterns/design"),
  strategyPatterns: path.join(RECORDS_ROOT, "patterns/strategy"),
  context: path.join(RECORDS_ROOT, "context"),
  active: path.join(RECORDS_ROOT, "active"),
  sessionNotes: path.join(RECORDS_ROOT, "active/session-notes"),
} as const;

export const DATA_FILES = {
  searchIndex: path.join(DATA_ROOT, "search-index.json"),
  graph: path.join(DATA_ROOT, "graph.jsonl"),
  queryLog: path.join(DATA_ROOT, "query-log.jsonl"),
  database: path.join(DATA_ROOT, "punk-records.db"),
} as const;

export const SEARCH_CONFIG = {
  embeddingModel: "Xenova/all-MiniLM-L6-v2",
  embeddingDimensions: 384,
  chunkSize: 500,
  chunkOverlap: 50,
  hybridWeights: { text: 0.4, vector: 0.6 },
  minSimilarity: 0.3,
  maxResults: 10,
} as const;

const pkgPath = path.resolve(__dirname, "../package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as {
  version: string;
};

export const SERVER_INFO = {
  name: "punk-records-mcp",
  version: pkg.version,
} as const;
