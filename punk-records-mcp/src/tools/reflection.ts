import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDatabase } from "../graph/database.js";
import { graphStore } from "../graph/store.js";
import { evolutionEngine } from "../engines/evolution.js";
import { tensionEngine } from "../engines/tension.js";
import { queryLogger } from "../analytics/query-log.js";
import type { NodeRow, TensionRow } from "../graph/types.js";
import { nodeFromRow, tensionFromRow } from "../graph/types.js";

export function registerReflectionTools(server: McpServer): void {
  server.registerTool(
    "trigger_reflection",
    {
      title: "Trigger Reflection",
      description:
        "Deep reflection on a node, domain, or the full knowledge system. " +
        "Gathers evolution history, tensions, connections, and confidence trends.",
      inputSchema: z.object({
        scope: z
          .enum(["node", "domain", "full"])
          .describe("node=single entity, domain=entity type, full=everything"),
        target: z
          .string()
          .optional()
          .describe("Node ID (for node scope) or entity type (for domain scope)"),
      }),
    },
    ({ scope, target }) => {
      const start = Date.now();
      const db = getDatabase();
      let output = "";

      switch (scope) {
        case "node": {
          if (target === undefined) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: "Node scope requires a target (node ID).",
                },
              ],
            };
          }

          const node = graphStore.getNode(target);
          if (node === undefined) {
            return {
              content: [
                { type: "text" as const, text: `Node not found: ${target}` },
              ],
            };
          }

          output = `## Reflection: ${node.name}\n\n`;
          output += `**Type:** ${node.entityType} | **Layer:** ${node.layer} | **Confidence:** ${node.confidence.toFixed(2)} | **Version:** ${node.version}\n`;
          output += `**Access count:** ${node.accessCount} | **Last accessed:** ${node.lastAccessed}\n\n`;

          // Evolution history
          const history = evolutionEngine.getEvolutionHistory(target);
          if (history.versions.length > 0) {
            output += `### Evolution (${history.totalVersions} versions)\n`;
            for (const v of history.versions) {
              output += `- v${v.version}: ${v.changeReason || "no reason"} (${v.changedAt})\n`;
            }
            output += "\n";
          }

          // Connected nodes
          const edges = db
            .prepare(
              "SELECT e.*, n.name as other_name, n.entity_type as other_type FROM edges e JOIN nodes n ON n.id = CASE WHEN e.source_id = ? THEN e.target_id ELSE e.source_id END WHERE e.source_id = ? OR e.target_id = ?",
            )
            .all(target, target, target) as (NodeRow & {
            other_name: string;
            other_type: string;
            type: string;
          })[];

          if (edges.length > 0) {
            output += `### Connections (${edges.length})\n`;
            for (const e of edges) {
              output += `- [${e.type}] ${e.other_name} (${e.other_type})\n`;
            }
            output += "\n";
          }

          // Related tensions
          const tensions = db
            .prepare(
              "SELECT * FROM tensions WHERE (node_a_id = ? OR node_b_id = ?) AND status = 'active'",
            )
            .all(target, target) as TensionRow[];

          if (tensions.length > 0) {
            output += `### Active Tensions (${tensions.length})\n`;
            for (const t of tensions.map(tensionFromRow)) {
              output += `- [${t.tensionType}] ${t.description}\n`;
            }
            output += "\n";
          }

          // Layer transition check
          const transition = evolutionEngine.checkLayerTransition(target);
          output += `### Layer Transition\n${transition.reason}\n`;
          break;
        }

        case "domain": {
          const entityType = target ?? "pattern";
          const nodes = graphStore.getNodesByType(entityType);

          output = `## Reflection: ${entityType} domain (${nodes.length} nodes)\n\n`;

          // Layer distribution
          const layers: Record<string, number> = {};
          let totalConfidence = 0;
          for (const node of nodes) {
            layers[node.layer] = (layers[node.layer] ?? 0) + 1;
            totalConfidence += node.confidence;
          }
          output += "### Layer Distribution\n";
          for (const [layer, count] of Object.entries(layers)) {
            output += `- ${layer}: ${count}\n`;
          }
          output += `\n**Average confidence:** ${nodes.length > 0 ? (totalConfidence / nodes.length).toFixed(2) : "N/A"}\n\n`;

          // Stale nodes
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const stale = nodes.filter(
            (n) => new Date(n.lastAccessed) < thirtyDaysAgo,
          );
          if (stale.length > 0) {
            output += `### Stale Nodes (30+ days, ${stale.length})\n`;
            for (const n of stale.slice(0, 10)) {
              output += `- ${n.name} (last: ${n.lastAccessed})\n`;
            }
            output += "\n";
          }

          // Active tensions in domain
          const domainTensions = db
            .prepare(
              `SELECT * FROM tensions
               WHERE status = 'active'
               AND (node_a_id IN (SELECT id FROM nodes WHERE entity_type = ?)
                    OR node_b_id IN (SELECT id FROM nodes WHERE entity_type = ?))`,
            )
            .all(entityType, entityType) as TensionRow[];

          if (domainTensions.length > 0) {
            output += `### Domain Tensions (${domainTensions.length})\n`;
            for (const t of domainTensions.map(tensionFromRow)) {
              output += `- [${t.tensionType}] ${t.description}\n`;
            }
          }
          break;
        }

        case "full": {
          output = "## Full System Reflection\n\n";

          // Overall stats
          const nodeCount = db
            .prepare("SELECT COUNT(*) as c FROM nodes")
            .get() as { c: number };
          const edgeCount = db
            .prepare("SELECT COUNT(*) as c FROM edges")
            .get() as { c: number };
          const versionCount = db
            .prepare("SELECT COUNT(*) as c FROM node_versions")
            .get() as { c: number };
          const tensionCount = db
            .prepare("SELECT COUNT(*) as c FROM tensions WHERE status = 'active'")
            .get() as { c: number };
          const inferenceCount = db
            .prepare("SELECT COUNT(*) as c FROM inferences WHERE status = 'pending'")
            .get() as { c: number };

          output += "### Graph Stats\n";
          output += `- **Nodes:** ${nodeCount.c}\n`;
          output += `- **Edges:** ${edgeCount.c}\n`;
          output += `- **Versions:** ${versionCount.c}\n`;
          output += `- **Active tensions:** ${tensionCount.c}\n`;
          output += `- **Pending inferences:** ${inferenceCount.c}\n\n`;

          // Layer distribution
          const layerDist = db
            .prepare(
              "SELECT layer, COUNT(*) as c FROM nodes GROUP BY layer ORDER BY c DESC",
            )
            .all() as { layer: string; c: number }[];
          output += "### Layer Distribution\n";
          for (const l of layerDist) {
            output += `- ${l.layer}: ${l.c}\n`;
          }
          output += "\n";

          // Entity type distribution
          const typeDist = db
            .prepare(
              "SELECT entity_type, COUNT(*) as c FROM nodes GROUP BY entity_type ORDER BY c DESC",
            )
            .all() as { entity_type: string; c: number }[];
          output += "### Entity Types\n";
          for (const t of typeDist) {
            output += `- ${t.entity_type}: ${t.c}\n`;
          }
          output += "\n";

          // Confidence overview
          const confStats = db
            .prepare(
              "SELECT AVG(confidence) as avg_c, MIN(confidence) as min_c, MAX(confidence) as max_c FROM nodes",
            )
            .get() as { avg_c: number; min_c: number; max_c: number };
          output += `### Confidence\n- Avg: ${confStats.avg_c.toFixed(2)} | Min: ${confStats.min_c.toFixed(2)} | Max: ${confStats.max_c.toFixed(2)}\n\n`;

          // Most evolved nodes
          const evolved = db
            .prepare(
              "SELECT * FROM nodes WHERE version > 1 ORDER BY version DESC LIMIT 5",
            )
            .all() as NodeRow[];
          if (evolved.length > 0) {
            output += "### Most Evolved Nodes\n";
            for (const n of evolved.map(nodeFromRow)) {
              output += `- ${n.name} (v${n.version}, ${n.layer})\n`;
            }
            output += "\n";
          }

          // Critical tensions
          const critical = tensionEngine.getCriticalTensions();
          if (critical.length > 0) {
            output += `### Critical Tensions (${critical.length})\n`;
            for (const t of critical.slice(0, 5)) {
              output += `- [${t.tensionType}] ${t.description}\n`;
            }
          }
          break;
        }
      }

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "trigger_reflection",
        params: { scope, target },
        resultCount: 1,
        durationMs: Date.now() - start,
      });

      return { content: [{ type: "text" as const, text: output }] };
    },
  );
}
