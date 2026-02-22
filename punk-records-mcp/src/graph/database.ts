import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { DATA_FILES } from "../config.js";

let db: Database.Database | null = null;

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    layer TEXT NOT NULL DEFAULT 'pattern',
    content TEXT NOT NULL DEFAULT '{}',
    properties TEXT NOT NULL DEFAULT '{}',
    confidence REAL NOT NULL DEFAULT 0.5,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_accessed TEXT NOT NULL,
    access_count INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS edges (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    weight REAL NOT NULL DEFAULT 1.0,
    confidence REAL NOT NULL DEFAULT 0.5,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL DEFAULT 'system',
    evidence TEXT NOT NULL DEFAULT '{}',
    UNIQUE(source_id, target_id, type),
    FOREIGN KEY (source_id) REFERENCES nodes(id),
    FOREIGN KEY (target_id) REFERENCES nodes(id)
  );

  CREATE TABLE IF NOT EXISTS node_versions (
    node_id TEXT NOT NULL,
    version INTEGER NOT NULL,
    content TEXT NOT NULL DEFAULT '{}',
    layer TEXT NOT NULL,
    confidence REAL NOT NULL,
    properties TEXT NOT NULL DEFAULT '{}',
    changed_at TEXT NOT NULL,
    changed_by TEXT NOT NULL DEFAULT 'system',
    change_reason TEXT NOT NULL DEFAULT '',
    diff TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (node_id, version),
    FOREIGN KEY (node_id) REFERENCES nodes(id)
  );

  CREATE TABLE IF NOT EXISTS tensions (
    id TEXT PRIMARY KEY,
    node_a_id TEXT NOT NULL,
    node_b_id TEXT NOT NULL,
    description TEXT NOT NULL,
    tension_type TEXT NOT NULL,
    severity REAL NOT NULL DEFAULT 0.5,
    status TEXT NOT NULL DEFAULT 'active',
    detected_at TEXT NOT NULL,
    resolved_at TEXT,
    resolution TEXT,
    surfaced_count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (node_a_id) REFERENCES nodes(id),
    FOREIGN KEY (node_b_id) REFERENCES nodes(id)
  );

  CREATE TABLE IF NOT EXISTS inferences (
    id TEXT PRIMARY KEY,
    inference_type TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '{}',
    confidence REAL NOT NULL DEFAULT 0.5,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    reviewed_at TEXT
  );

  -- Indexes for common queries
  CREATE INDEX IF NOT EXISTS idx_nodes_entity_type ON nodes(entity_type);
  CREATE INDEX IF NOT EXISTS idx_nodes_layer ON nodes(layer);
  CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
  CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);
  CREATE INDEX IF NOT EXISTS idx_edges_type ON edges(type);
  CREATE INDEX IF NOT EXISTS idx_tensions_status ON tensions(status);
  CREATE INDEX IF NOT EXISTS idx_inferences_status ON inferences(status);
`;

export function getDatabase(): Database.Database {
  if (db !== null) return db;

  fs.mkdirSync(path.dirname(DATA_FILES.database), { recursive: true });

  db = new Database(DATA_FILES.database);

  // Enable WAL mode for better concurrent read performance
  db.pragma("journal_mode = WAL");
  // Enable foreign keys
  db.pragma("foreign_keys = ON");

  // Create all tables
  db.exec(SCHEMA_SQL);

  return db;
}

export function closeDatabase(): void {
  if (db !== null) {
    db.close();
    db = null;
  }
}
