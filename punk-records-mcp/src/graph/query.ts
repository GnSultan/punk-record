import { getDatabase } from "./database.js";
import { graphStore } from "./store.js";
import type { GraphEntity, GraphRelation } from "../types.js";
import type { NodeRow, EdgeRow } from "./types.js";
import { nodeFromRow } from "./types.js";

export interface GraphQueryResult {
  entities: GraphEntity[];
  relations: GraphRelation[];
}

function rowToEntity(row: NodeRow): GraphEntity {
  const node = nodeFromRow(row);
  return {
    id: node.id,
    name: node.name,
    entityType: node.entityType as GraphEntity["entityType"],
    properties: node.properties,
  };
}

function rowToRelation(row: EdgeRow): GraphRelation {
  return {
    from: row.source_id,
    to: row.target_id,
    relationType: row.type as GraphRelation["relationType"],
  };
}

export async function queryByEntityType(
  entityType: string,
): Promise<GraphQueryResult> {
  // Ensure store is initialized (triggers migration if needed)
  await graphStore.getAllEntities();

  const db = getDatabase();

  const entityRows = db
    .prepare("SELECT * FROM nodes WHERE entity_type = ? ORDER BY name")
    .all(entityType) as NodeRow[];

  const entities = entityRows.map(rowToEntity);
  const entityIds = entities.map((e) => e.id);

  if (entityIds.length === 0) {
    return { entities: [], relations: [] };
  }

  // Get all edges connected to these entities
  const placeholders = entityIds.map(() => "?").join(",");
  const edgeRows = db
    .prepare(
      `SELECT DISTINCT * FROM edges
       WHERE source_id IN (${placeholders}) OR target_id IN (${placeholders})`,
    )
    .all(...entityIds, ...entityIds) as EdgeRow[];

  const relations = edgeRows.map(rowToRelation);

  return { entities, relations };
}

export async function findCrossProjectPatterns(): Promise<{
  sharedPatterns: Array<{ pattern: string; projects: string[] }>;
  potentialConnections: Array<{
    project1: string;
    project2: string;
    reason: string;
  }>;
}> {
  // Ensure store is initialized
  await graphStore.getAllEntities();

  const db = getDatabase();

  // Find patterns used by multiple projects
  const sharedRows = db
    .prepare(
      `SELECT n.name as pattern_name, GROUP_CONCAT(p.name) as project_names
       FROM nodes n
       JOIN edges e ON (e.source_id = n.id OR e.target_id = n.id)
       JOIN nodes p ON (
         (p.id = e.source_id OR p.id = e.target_id)
         AND p.id != n.id
         AND p.entity_type = 'project'
       )
       WHERE n.entity_type = 'pattern'
       AND e.type = 'uses'
       GROUP BY n.id
       HAVING COUNT(DISTINCT p.id) > 1`,
    )
    .all() as { pattern_name: string; project_names: string }[];

  const sharedPatterns = sharedRows.map((row) => ({
    pattern: row.pattern_name,
    projects: row.project_names.split(","),
  }));

  // Find potential connections between projects via shared targets
  const connectionRows = db
    .prepare(
      `SELECT p1.name as project1, p2.name as project2, GROUP_CONCAT(DISTINCT shared.name) as shared_names
       FROM nodes p1
       JOIN edges e1 ON (e1.source_id = p1.id OR e1.target_id = p1.id)
       JOIN nodes shared ON (
         (shared.id = e1.source_id OR shared.id = e1.target_id)
         AND shared.id != p1.id
       )
       JOIN edges e2 ON (e2.source_id = shared.id OR e2.target_id = shared.id)
       JOIN nodes p2 ON (
         (p2.id = e2.source_id OR p2.id = e2.target_id)
         AND p2.id != shared.id
         AND p2.entity_type = 'project'
         AND p2.id > p1.id
       )
       WHERE p1.entity_type = 'project'
       GROUP BY p1.id, p2.id`,
    )
    .all() as { project1: string; project2: string; shared_names: string }[];

  const potentialConnections = connectionRows.map((row) => ({
    project1: row.project1,
    project2: row.project2,
    reason: `Shared connections: ${row.shared_names}`,
  }));

  return { sharedPatterns, potentialConnections };
}
