import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { traversalEngine } from "../engines/traversal.js";
import { queryLogger } from "../analytics/query-log.js";

export function registerTraversalTools(server: McpServer): void {
  server.registerTool(
    "explore_connections",
    {
      title: "Explore Connections",
      description:
        "Find unexpected connections through creative graph traversal. " +
        "Performs scored random walks from seed nodes, prioritizing unexplored paths " +
        "and cross-domain connections.",
      inputSchema: z.object({
        seed_ids: z
          .array(z.string())
          .describe("Node IDs to start exploration from"),
        distance: z
          .number()
          .optional()
          .describe("Max traversal depth (default 3)"),
      }),
    },
    ({ seed_ids, distance }) => {
      const start = Date.now();
      const paths = traversalEngine.creativeTraverse(seed_ids, distance ?? 3);

      if (paths.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No interesting connections found from the given seeds. Try different starting nodes.",
            },
          ],
        };
      }

      let output = `## Creative Traversal (${paths.length} paths found)\n\n`;

      for (const path of paths) {
        output += `### ${path.insight}\n`;
        output += `**Unexpectedness:** ${path.unexpectedness.toFixed(2)}\n`;
        output += `**Path:** ${path.nodes.map((n) => n.name).join(" → ")}\n`;
        output += `**Edges:** ${path.edges.map((e) => e.type).join(" → ")}\n\n`;
      }

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "explore_connections",
        params: { seed_ids, distance },
        resultCount: paths.length,
        durationMs: Date.now() - start,
      });

      return { content: [{ type: "text" as const, text: output }] };
    },
  );

  server.registerTool(
    "challenge_assumption",
    {
      title: "Challenge Assumption",
      description:
        "Find counter-evidence for an assumption. Searches the knowledge graph " +
        "for alternative perspectives, contradictions, and tensions.",
      inputSchema: z.object({
        assumption: z.string().describe("The assumption to challenge"),
        context: z
          .string()
          .optional()
          .describe("Additional context for the challenge"),
      }),
    },
    async ({ assumption }) => {
      const start = Date.now();
      const result = await traversalEngine.challengeAssumption(assumption);

      let output = `## Assumption Challenge\n**Assumption:** ${assumption}\n\n`;
      output += `**Strength:** ${result.strengthOfChallenge}\n\n`;

      if (result.counterEvidence.length === 0) {
        output += "No counter-evidence found in the knowledge graph.\n";
      } else {
        output += "### Counter-Evidence\n";
        for (const ce of result.counterEvidence) {
          output += `- **${ce.node}** (relevance: ${ce.relevance.toFixed(2)})\n`;
          output += `  ${ce.challenge}\n`;
        }
      }

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "challenge_assumption",
        params: { assumption },
        resultCount: result.counterEvidence.length,
        durationMs: Date.now() - start,
      });

      return { content: [{ type: "text" as const, text: output }] };
    },
  );
}
