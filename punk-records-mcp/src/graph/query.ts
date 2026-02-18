import { graphStore } from './store.js';
import type { GraphEntity, GraphRelation } from '../types.js';

export interface GraphQueryResult {
  entities: GraphEntity[];
  relations: GraphRelation[];
}

export async function queryByEntityType(
  entityType: string,
): Promise<GraphQueryResult> {
  const allEntities = await graphStore.getAllEntities();
  const entities = allEntities.filter((e) => e.entityType === entityType);

  const allRelations: GraphRelation[] = [];
  for (const entity of entities) {
    const rels = await graphStore.getRelationsFor(entity.id);
    allRelations.push(...rels);
  }

  // Deduplicate
  const uniqueRelations = Array.from(
    new Map(
      allRelations.map((r) => [`${r.from}-${r.relationType}-${r.to}`, r]),
    ).values(),
  );

  return { entities, relations: uniqueRelations };
}

export async function findCrossProjectPatterns(): Promise<{
  sharedPatterns: Array<{ pattern: string; projects: string[] }>;
  potentialConnections: Array<{
    project1: string;
    project2: string;
    reason: string;
  }>;
}> {
  const allEntities = await graphStore.getAllEntities();
  const projects = allEntities.filter((e) => e.entityType === 'project');
  const patterns = allEntities.filter((e) => e.entityType === 'pattern');

  const sharedPatterns: Array<{ pattern: string; projects: string[] }> = [];

  for (const pattern of patterns) {
    const relations = await graphStore.getRelationsFor(pattern.id);
    const relatedProjects = relations
      .filter((r) => r.relationType === 'uses')
      .map((r) => (r.from === pattern.id ? r.to : r.from))
      .filter((id) => projects.some((p) => p.id === id));

    if (relatedProjects.length > 1) {
      const projectNames = relatedProjects.map((id) => {
        const p = projects.find((proj) => proj.id === id);
        return p?.name ?? id;
      });
      sharedPatterns.push({
        pattern: pattern.name,
        projects: projectNames,
      });
    }
  }

  // Find potential connections
  const potentialConnections: Array<{
    project1: string;
    project2: string;
    reason: string;
  }> = [];

  for (let i = 0; i < projects.length; i++) {
    for (let j = i + 1; j < projects.length; j++) {
      const rels1 = await graphStore.getRelationsFor(projects[i].id);
      const rels2 = await graphStore.getRelationsFor(projects[j].id);
      const targets1 = new Set(
        rels1.map((r) => (r.from === projects[i].id ? r.to : r.from)),
      );
      const targets2 = new Set(
        rels2.map((r) => (r.from === projects[j].id ? r.to : r.from)),
      );
      const shared = [...targets1].filter((t) => targets2.has(t));

      if (shared.length > 0) {
        const sharedNames = shared.map((id) => {
          const entity = allEntities.find((e) => e.id === id);
          return entity?.name ?? id;
        });
        potentialConnections.push({
          project1: projects[i].name,
          project2: projects[j].name,
          reason: `Shared connections: ${sharedNames.join(', ')}`,
        });
      }
    }
  }

  return { sharedPatterns, potentialConnections };
}
