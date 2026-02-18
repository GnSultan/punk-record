import fs from "node:fs/promises";
import path from "node:path";
import { DATA_FILES } from "../config.js";
import { ensureDir } from "../utils/files.js";
import type { GraphEntity, GraphRelation } from "../types.js";

interface JsonlItem {
  type: string;
  id?: string;
  name?: string;
  entityType?: string;
  properties?: Record<string, string>;
  from?: string;
  to?: string;
  relationType?: string;
}

interface GraphData {
  entities: Map<string, GraphEntity>;
  relations: GraphRelation[];
}

class GraphStore {
  private data: GraphData = { entities: new Map(), relations: [] };
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    await ensureDir(path.dirname(DATA_FILES.graph));
    try {
      const raw = await fs.readFile(DATA_FILES.graph, "utf-8");
      const lines = raw.split("\n").filter((l) => l.trim() !== "");
      for (const line of lines) {
        const item = JSON.parse(line) as JsonlItem;
        if (item.type === "entity") {
          const entity: GraphEntity = {
            id: item.id ?? "",
            name: item.name ?? "",
            entityType: (item.entityType ??
              "concept") as GraphEntity["entityType"],
            properties: item.properties ?? {},
          };
          this.data.entities.set(entity.id, entity);
        } else if (item.type === "relation") {
          const relation: GraphRelation = {
            from: item.from ?? "",
            to: item.to ?? "",
            relationType: (item.relationType ??
              "supports") as GraphRelation["relationType"],
          };
          this.data.relations.push(relation);
        }
      }
    } catch {
      // File doesn't exist yet
    }
    this.loaded = true;
  }

  async save(): Promise<void> {
    await ensureDir(path.dirname(DATA_FILES.graph));
    const lines: string[] = [];
    for (const entity of this.data.entities.values()) {
      lines.push(JSON.stringify({ type: "entity", ...entity }));
    }
    for (const relation of this.data.relations) {
      lines.push(JSON.stringify({ type: "relation", ...relation }));
    }
    await fs.writeFile(DATA_FILES.graph, lines.join("\n") + "\n", "utf-8");
  }

  async addEntity(entity: GraphEntity): Promise<GraphEntity> {
    await this.load();
    this.data.entities.set(entity.id, entity);
    await this.save();
    return entity;
  }

  async addRelation(relation: GraphRelation): Promise<GraphRelation> {
    await this.load();
    const exists = this.data.relations.some(
      (r) =>
        r.from === relation.from &&
        r.to === relation.to &&
        r.relationType === relation.relationType,
    );
    if (!exists) {
      this.data.relations.push(relation);
      await this.save();
    }
    return relation;
  }

  async getEntity(id: string): Promise<GraphEntity | undefined> {
    await this.load();
    return this.data.entities.get(id);
  }

  async getAllEntities(): Promise<GraphEntity[]> {
    await this.load();
    return Array.from(this.data.entities.values());
  }

  async getRelationsFor(entityId: string): Promise<GraphRelation[]> {
    await this.load();
    return this.data.relations.filter(
      (r) => r.from === entityId || r.to === entityId,
    );
  }

  async getRelationsByType(relationType: string): Promise<GraphRelation[]> {
    await this.load();
    return this.data.relations.filter((r) => r.relationType === relationType);
  }

  async getConnectedEntities(
    entityId: string,
    depth: number = 1,
  ): Promise<{ entities: GraphEntity[]; relations: GraphRelation[] }> {
    await this.load();
    const visited = new Set<string>();
    const resultEntities: GraphEntity[] = [];
    const resultRelations: GraphRelation[] = [];
    const queue: { id: string; currentDepth: number }[] = [
      { id: entityId, currentDepth: 0 },
    ];

    while (queue.length > 0) {
      const item = queue.shift();
      if (item === undefined) break;
      const { id, currentDepth } = item;
      if (visited.has(id) || currentDepth > depth) continue;
      visited.add(id);

      const entity = this.data.entities.get(id);
      if (entity !== undefined) resultEntities.push(entity);

      if (currentDepth < depth) {
        const relations = this.data.relations.filter(
          (r) => r.from === id || r.to === id,
        );
        for (const rel of relations) {
          resultRelations.push(rel);
          const nextId = rel.from === id ? rel.to : rel.from;
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
    await this.load();
    const connected = new Set<string>();
    for (const rel of this.data.relations) {
      connected.add(rel.from);
      connected.add(rel.to);
    }
    const disconnected = Array.from(this.data.entities.keys()).filter(
      (id) => !connected.has(id),
    );
    return {
      entities: this.data.entities.size,
      relations: this.data.relations.length,
      disconnectedEntities: disconnected,
    };
  }
}

export const graphStore = new GraphStore();
