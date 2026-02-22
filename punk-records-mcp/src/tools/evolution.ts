import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { evolutionEngine } from "../engines/evolution.js";
import { queryLogger } from "../analytics/query-log.js";

export function registerEvolutionTools(server: McpServer): void {
  server.registerTool(
    "evolve_knowledge",
    {
      title: "Evolve Knowledge",
      description:
        "Evolve a knowledge node — update its content, confidence, or layer with full version history. " +
        "The previous state is archived, creating an auditable evolution trail.",
      inputSchema: z.object({
        node_id: z.string().describe("ID of the node to evolve"),
        changes: z.object({
          name: z.string().optional().describe("New name"),
          content: z.record(z.unknown()).optional().describe("New content"),
          properties: z
            .record(z.string())
            .optional()
            .describe("New properties"),
          confidence: z
            .number()
            .min(0)
            .max(1)
            .optional()
            .describe("New confidence (0-1)"),
          layer: z
            .enum(["instinct", "pattern", "reflection", "meta"])
            .optional()
            .describe("New consciousness layer"),
        }),
        reason: z.string().describe("Why this evolution is happening"),
      }),
    },
    ({ node_id, changes, reason }) => {
      const start = Date.now();
      const updated = evolutionEngine.evolveNode(node_id, changes, reason);

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "evolve_knowledge",
        params: { node_id, reason },
        resultCount: 1,
        durationMs: Date.now() - start,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: [
              `## Node Evolved: ${updated.name}`,
              `**Version:** ${updated.version} | **Layer:** ${updated.layer} | **Confidence:** ${updated.confidence.toFixed(2)}`,
              `**Reason:** ${reason}`,
              "",
              `Properties: ${JSON.stringify(updated.properties)}`,
            ].join("\n"),
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_evolution",
    {
      title: "Get Evolution History",
      description:
        "View the full evolution history of a knowledge node — every version, " +
        "layer transitions, confidence changes, and optional semantic drift analysis.",
      inputSchema: z.object({
        node_id: z.string().describe("ID of the node"),
        include_drift: z
          .boolean()
          .optional()
          .describe(
            "Include semantic drift analysis (slower, uses embeddings)",
          ),
      }),
    },
    async ({ node_id, include_drift }) => {
      const start = Date.now();
      const history = evolutionEngine.getEvolutionHistory(node_id);

      if (history.current === undefined) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Node not found: ${node_id}`,
            },
          ],
        };
      }

      let output = `## Evolution: ${history.current.name}\n`;
      output += `**Current:** v${history.current.version} | ${history.current.layer} | confidence ${history.current.confidence.toFixed(2)}\n\n`;

      if (history.versions.length === 0) {
        output +=
          "No evolution history — node has not been modified since creation.\n";
      } else {
        output += "### Version History\n";
        for (const v of history.versions) {
          output += `- **v${v.version}** (${v.changedAt}) — ${v.changeReason || "no reason recorded"}\n`;
          output += `  Layer: ${v.layer} | Confidence: ${v.confidence.toFixed(2)}\n`;
          if (v.diff !== "") {
            output += `  Changes: ${v.diff}\n`;
          }
        }
      }

      // Layer transition check
      const transition = evolutionEngine.checkLayerTransition(node_id);
      output += `\n### Layer Transition\n${transition.reason}\n`;
      if (transition.eligible && transition.suggestedLayer !== null) {
        output += `**Suggested:** ${transition.currentLayer} → ${transition.suggestedLayer}\n`;
      }

      // Optional drift analysis
      if (include_drift === true && history.versions.length > 0) {
        const drift = await evolutionEngine.analyzeDrift(node_id);
        output += `\n### Semantic Drift\n`;
        output += `Similarity to v1: ${drift.similarity.toFixed(3)}\n`;
        output += `${drift.driftDescription}\n`;
      }

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "get_evolution",
        params: { node_id, include_drift },
        resultCount: history.totalVersions,
        durationMs: Date.now() - start,
      });

      return {
        content: [{ type: "text" as const, text: output }],
      };
    },
  );
}
