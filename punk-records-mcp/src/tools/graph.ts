import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { graphStore } from "../graph/store.js";
import { queryByEntityType, findCrossProjectPatterns } from "../graph/query.js";
import { queryLogger } from "../analytics/query-log.js";

const entityTypeEnum = z.enum([
  "project",
  "concept",
  "decision",
  "pattern",
  "person",
  "client",
  "technology",
  "identity",
  "philosophy",
  "anti-pattern",
  "outcome",
  "lesson",
  "tension",
  "question",
  "experiment",
  "context",
  "influence",
]);

const relationTypeEnum = z.enum([
  "uses",
  "influenced-by",
  "shares-pattern-with",
  "was-decided-for",
  "contradicts",
  "supports",
  "depends-on",
  "evolved-from",
  "tensions-with",
  "led-to",
  "learned-from",
  "applies-to",
  "resulted-in",
  "guides",
  "violates",
  "reinforces",
  "challenges",
  "co-occurs-with",
]);

export function registerGraphTools(server: McpServer): void {
  server.registerTool(
    "add_relationship",
    {
      title: "Add Relationship",
      description:
        "Add a relationship between concepts, projects, decisions, or patterns in the knowledge graph. Entities are auto-created if they do not exist.",
      inputSchema: z.object({
        from_entity: z.object({
          id: z.string().describe('Unique identifier, e.g. "elimu-africa"'),
          name: z.string().describe("Display name"),
          entityType: entityTypeEnum,
        }),
        to_entity: z.object({
          id: z.string().describe("Unique identifier"),
          name: z.string().describe("Display name"),
          entityType: entityTypeEnum,
        }),
        relation_type: relationTypeEnum.describe("Type of relationship"),
      }),
    },
    async ({ from_entity, to_entity, relation_type }) => {
      const start = Date.now();
      await graphStore.addEntity({ ...from_entity, properties: {} });
      await graphStore.addEntity({ ...to_entity, properties: {} });
      await graphStore.addRelation({
        from: from_entity.id,
        to: to_entity.id,
        relationType: relation_type,
      });
      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "add_relationship",
        params: { from: from_entity.id, to: to_entity.id, relation_type },
        resultCount: 1,
        durationMs: Date.now() - start,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Relationship added: ${from_entity.name} --[${relation_type}]--> ${to_entity.name}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "query_relationships",
    {
      title: "Query Relationships",
      description:
        "Query the knowledge graph for connections. Find how concepts, projects, and patterns relate to each other.",
      inputSchema: z.object({
        entity_id: z
          .string()
          .optional()
          .describe("Find connections for a specific entity"),
        entity_type: z
          .string()
          .optional()
          .describe('Find all entities of a type (e.g. "project", "pattern")'),
        depth: z.number().optional().describe("Traversal depth (default 1)"),
      }),
    },
    async ({ entity_id, entity_type, depth }) => {
      const start = Date.now();
      let result;
      if (entity_id !== undefined && entity_id !== "") {
        result = await graphStore.getConnectedEntities(entity_id, depth ?? 1);
      } else if (entity_type !== undefined && entity_type !== "") {
        result = await queryByEntityType(entity_type);
      } else {
        const entities = await graphStore.getAllEntities();
        queryLogger.log({
          timestamp: new Date().toISOString(),
          tool: "query_relationships",
          params: { entity_id, entity_type },
          resultCount: entities.length,
          durationMs: Date.now() - start,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Knowledge graph: ${entities.length} entities. Provide entity_id or entity_type to query.`,
            },
          ],
        };
      }

      const entitiesStr = result.entities
        .map((e) => `- [${e.entityType}] ${e.name} (${e.id})`)
        .join("\n");
      const relationsStr = result.relations
        .map((r) => `- ${r.from} --[${r.relationType}]--> ${r.to}`)
        .join("\n");

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "query_relationships",
        params: { entity_id, entity_type, depth },
        resultCount: result.entities.length,
        durationMs: Date.now() - start,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `## Entities\n${entitiesStr === "" ? "None" : entitiesStr}\n\n## Relations\n${relationsStr === "" ? "None" : relationsStr}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "find_cross_project_patterns",
    {
      title: "Find Cross-Project Patterns",
      description:
        "Detect when patterns, technologies, or approaches from one project might apply to another. Discovers hidden connections.",
      inputSchema: z.object({}),
    },
    async () => {
      const start = Date.now();
      const result = await findCrossProjectPatterns();

      let output = "## Cross-Project Pattern Analysis\n\n";

      if (result.sharedPatterns.length > 0) {
        output += "### Shared Patterns\n";
        for (const sp of result.sharedPatterns) {
          output += `- **${sp.pattern}** used by: ${sp.projects.join(", ")}\n`;
        }
      } else {
        output +=
          "### Shared Patterns\nNo shared patterns found yet. Add more relationships to the knowledge graph.\n";
      }

      output += "\n### Potential Connections\n";
      if (result.potentialConnections.length > 0) {
        for (const pc of result.potentialConnections) {
          output += `- **${pc.project1}** <-> **${pc.project2}**: ${pc.reason}\n`;
        }
      } else {
        output += "No potential connections found yet.\n";
      }

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "find_cross_project_patterns",
        params: {},
        resultCount:
          result.sharedPatterns.length + result.potentialConnections.length,
        durationMs: Date.now() - start,
      });
      return { content: [{ type: "text" as const, text: output }] };
    },
  );
}
