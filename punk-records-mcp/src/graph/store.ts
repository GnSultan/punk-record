/* eslint-disable @typescript-eslint/require-await */
// Methods are async for backward compatibility — all callers await them.
// SQLite via better-sqlite3 is synchronous, so no actual awaits needed.

import { getDatabase } from "./database.js";
import { migrateJsonlToSqlite } from "./migrate.js";
import type { GraphEntity, GraphRelation } from "../types.js";
import type { NodeRow, EdgeRow, GraphNode } from "./types.js";
import { nodeFromRow } from "./types.js";

/** Convert a full GraphNode back to the legacy GraphEntity shape */
function nodeToEntity(node: GraphNode): GraphEntity {
  return {
    id: node.id,
    name: node.name,
    entityType: node.entityType as GraphEntity["entityType"],
    properties: node.properties,
  };
}

class GraphStore {
  private initialized = false;

  private init(): void {
    if (this.initialized) return;
    // getDatabase() creates tables; migrateJsonlToSqlite() seeds from JSONL if empty
    getDatabase();
    migrateJsonlToSqlite();
    this.initialized = true;
  }

  async addEntity(entity: GraphEntity): Promise<GraphEntity> {
    this.init();
    const db = getDatabase();
    const now = new Date().toISOString();

    const existing = db
      .prepare("SELECT id FROM nodes WHERE id = ?")
      .get(entity.id) as { id: string } | undefined;

    if (existing !== undefined) {
      // Update existing node
      db.prepare(
        `UPDATE nodes SET name = ?, entity_type = ?, properties = ?, updated_at = ? WHERE id = ?`,
      ).run(
        entity.name,
        entity.entityType,
        JSON.stringify(entity.properties),
        now,
        entity.id,
      );
    } else {
      // Insert new node
      db.prepare(
        `INSERT INTO nodes (id, name, entity_type, layer, content, properties, confidence, version, created_at, updated_at, last_accessed, access_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        entity.id,
        entity.name,
        entity.entityType,
        "pattern",
        JSON.stringify({}),
        JSON.stringify(entity.properties),
        0.5,
        1,
        now,
        now,
        now,
        0,
      );
    }

    return entity;
  }

  async addRelation(relation: GraphRelation): Promise<GraphRelation> {
    this.init();
    const db = getDatabase();
    const now = new Date().toISOString();
    const edgeId = `${relation.from}-${relation.relationType}-${relation.to}`;

    db.prepare(
      `INSERT OR IGNORE INTO edges (id, type, source_id, target_id, weight, confidence, created_at, created_by, evidence)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      edgeId,
      relation.relationType,
      relation.from,
      relation.to,
      1.0,
      0.5,
      now,
      "user",
      JSON.stringify({}),
    );

    return relation;
  }

  async getEntity(id: string): Promise<GraphEntity | undefined> {
    this.init();
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM nodes WHERE id = ?").get(id) as
      | NodeRow
      | undefined;
    if (row === undefined) return undefined;

    // Update access tracking
    db.prepare(
      "UPDATE nodes SET last_accessed = ?, access_count = access_count + 1 WHERE id = ?",
    ).run(new Date().toISOString(), id);

    return nodeToEntity(nodeFromRow(row));
  }

  async getAllEntities(): Promise<GraphEntity[]> {
    this.init();
    const db = getDatabase();
    const rows = db
      .prepare("SELECT * FROM nodes ORDER BY name")
      .all() as NodeRow[];
    return rows.map((row) => nodeToEntity(nodeFromRow(row)));
  }

  async getRelationsFor(entityId: string): Promise<GraphRelation[]> {
    this.init();
    const db = getDatabase();
    const rows = db
      .prepare("SELECT * FROM edges WHERE source_id = ? OR target_id = ?")
      .all(entityId, entityId) as EdgeRow[];

    return rows.map((row) => ({
      from: row.source_id,
      to: row.target_id,
      relationType: row.type as GraphRelation["relationType"],
    }));
  }

  async getRelationsByType(relationType: string): Promise<GraphRelation[]> {
    this.init();
    const db = getDatabase();
    const rows = db
      .prepare("SELECT * FROM edges WHERE type = ?")
      .all(relationType) as EdgeRow[];

    return rows.map((row) => ({
      from: row.source_id,
      to: row.target_id,
      relationType: row.type as GraphRelation["relationType"],
    }));
  }

  async getConnectedEntities(
    entityId: string,
    depth: number = 1,
  ): Promise<{ entities: GraphEntity[]; relations: GraphRelation[] }> {
    this.init();
    const db = getDatabase();
    const visited = new Set<string>();
    const resultEntities: GraphEntity[] = [];
    const resultRelations: GraphRelation[] = [];
    const queue: { id: string; currentDepth: number }[] = [
      { id: entityId, currentDepth: 0 },
    ];

    const getNode = db.prepare("SELECT * FROM nodes WHERE id = ?");
    const getEdges = db.prepare(
      "SELECT * FROM edges WHERE source_id = ? OR target_id = ?",
    );

    while (queue.length > 0) {
      const item = queue.shift();
      if (item === undefined) break;
      const { id, currentDepth } = item;
      if (visited.has(id) || currentDepth > depth) continue;
      visited.add(id);

      const row = getNode.get(id) as NodeRow | undefined;
      if (row !== undefined) {
        resultEntities.push(nodeToEntity(nodeFromRow(row)));
      }

      if (currentDepth < depth) {
        const edges = getEdges.all(id, id) as EdgeRow[];
        for (const edge of edges) {
          resultRelations.push({
            from: edge.source_id,
            to: edge.target_id,
            relationType: edge.type as GraphRelation["relationType"],
          });
          const nextId =
            edge.source_id === id ? edge.target_id : edge.source_id;
          if (!visited.has(nextId)) {
            queue.push({ id: nextId, currentDepth: currentDepth + 1 });
          }
        }
      }
    }

    return { entities: resultEntities, relations: resultRelations };
  }

  async getStats(): Promise<{
    entities: number;
    relations: number;
    disconnectedEntities: string[];
  }> {
    this.init();
    const db = getDatabase();

    const entityCount = db
      .prepare("SELECT COUNT(*) as count FROM nodes")
      .get() as { count: number };
    const relationCount = db
      .prepare("SELECT COUNT(*) as count FROM edges")
      .get() as { count: number };

    // Find nodes that don't appear in any edge
    const disconnected = db
      .prepare(
        `SELECT id FROM nodes
         WHERE id NOT IN (SELECT source_id FROM edges)
         AND id NOT IN (SELECT target_id FROM edges)`,
      )
      .all() as { id: string }[];

    return {
      entities: entityCount.count,
      relations: relationCount.count,
      disconnectedEntities: disconnected.map((d) => d.id),
    };
  }

  // --- Extended methods for engines (used by later phases) ---

  /** Get a raw GraphNode with all SQLite fields */
  getNode(id: string): GraphNode | undefined {
    this.init();
    const db = getDatabase();
    const row = db.prepare("SELECT * FROM nodes WHERE id = ?").get(id) as
      | NodeRow
      | undefined;
    if (row === undefined) return undefined;
    return nodeFromRow(row);
  }

  /** Get all raw GraphNodes */
  getAllNodes(): GraphNode[] {
    this.init();
    const db = getDatabase();
    const rows = db
      .prepare("SELECT * FROM nodes ORDER BY name")
      .all() as NodeRow[];
    return rows.map(nodeFromRow);
  }

  /** Get nodes by entity type */
  getNodesByType(entityType: string): GraphNode[] {
    this.init();
    const db = getDatabase();
    const rows = db
      .prepare("SELECT * FROM nodes WHERE entity_type = ? ORDER BY name")
      .all(entityType) as NodeRow[];
    return rows.map(nodeFromRow);
  }
}

export const graphStore = new GraphStore();
