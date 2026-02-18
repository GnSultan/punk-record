import fs from "node:fs";
import { DATA_FILES } from "../config.js";
import { getDatabase } from "./database.js";

interface JsonlEntity {
  type: "entity";
  id: string;
  name: string;
  entityType: string;
  properties: Partial<Record<string, string>>;
}

interface JsonlRelation {
  type: "relation";
  from: string;
  to: string;
  relationType: string;
  properties?: Record<string, string>;
}

type JsonlItem = JsonlEntity | JsonlRelation;

/**
 * Migrate existing JSONL graph data to SQLite.
 * Auto-runs on first database access if the DB has no nodes but graph.jsonl exists.
 * Safe to call multiple times — skips if nodes already exist.
 */
export function migrateJsonlToSqlite(): void {
  const db = getDatabase();

  // Check if migration is needed
  const countRow = db.prepare("SELECT COUNT(*) as count FROM nodes").get() as {
    count: number;
  };
  if (countRow.count > 0) return; // Already has data

  // Check if JSONL file exists
  if (!fs.existsSync(DATA_FILES.graph)) return; // Nothing to migrate

  const raw = fs.readFileSync(DATA_FILES.graph, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim() !== "");

  const entities: JsonlEntity[] = [];
  const relations: JsonlRelation[] = [];

  for (const line of lines) {
    const item = JSON.parse(line) as JsonlItem;
    if (item.type === "entity") {
      entities.push(item);
    } else {
      relations.push(item);
    }
  }

  const now = new Date().toISOString();

  const insertNode = db.prepare(`
    INSERT OR IGNORE INTO nodes (id, name, entity_type, layer, content, properties, confidence, version, created_at, updated_at, last_accessed, access_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEdge = db.prepare(`
    INSERT OR IGNORE INTO edges (id, type, source_id, target_id, weight, confidence, created_at, created_by, evidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const migrate = db.transaction(() => {
    for (const entity of entities) {
      const layer = entity.properties.layer ?? "pattern";
      const confidence =
        entity.properties.confidence !== undefined
          ? parseFloat(entity.properties.confidence)
          : 0.5;

      // Remove layer/confidence from properties since they're now columns
      const props = { ...entity.properties };
      delete props.layer;
      delete props.confidence;

      insertNode.run(
        entity.id,
        entity.name,
        entity.entityType,
        layer,
        JSON.stringify({}),
        JSON.stringify(props),
        confidence,
        1,
        now,
        now,
        now,
        0,
      );
    }

    for (const relation of relations) {
      const edgeId = `${relation.from}-${relation.relationType}-${relation.to}`;
      insertEdge.run(
        edgeId,
        relation.relationType,
        relation.from,
        relation.to,
        1.0,
        0.5,
        now,
        "migration",
        JSON.stringify({}),
      );
    }
  });

  migrate();

  console.error(
    `[migrate] Migrated ${entities.length} entities and ${relations.length} relations from JSONL to SQLite`,
  );
}
