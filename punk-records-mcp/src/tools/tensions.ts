import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { tensionEngine } from "../engines/tension.js";
import { queryLogger } from "../analytics/query-log.js";

export function registerTensionTools(server: McpServer): void {
  server.registerTool(
    "check_decision_tensions",
    {
      title: "Check Decision Tensions",
      description:
        "Before making a decision, check it against recorded philosophies and patterns " +
        "for potential conflicts. Returns alignment analysis with specific concerns.",
      inputSchema: z.object({
        proposed_action: z
          .string()
          .describe("The decision or action you are considering"),
        project: z
          .string()
          .optional()
          .describe("Current project for contextual analysis"),
      }),
    },
    async ({ proposed_action, project }) => {
      const start = Date.now();
      const result = await tensionEngine.checkDecisionTensions(proposed_action);

      let output = `## Decision Tension Check\n**Action:** ${proposed_action}\n\n`;

      if (result.tensions.length === 0) {
        output += "No conflicts detected.\n";
      } else {
        output += "### Potential Conflicts\n";
        for (const t of result.tensions) {
          output += `- **${t.philosophy}** — ${t.concern} (similarity: ${t.similarity.toFixed(2)})\n`;
        }
      }

      output += `\n**Recommendation:** ${result.recommendation}\n`;

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "check_decision_tensions",
        params: { proposed_action, project },
        resultCount: result.tensions.length,
        durationMs: Date.now() - start,
      });

      return { content: [{ type: "text" as const, text: output }] };
    },
  );

  server.registerTool(
    "get_active_tensions",
    {
      title: "Get Active Tensions",
      description:
        "View all active tensions in the knowledge graph — contradictions, " +
        "philosophy mismatches, stale knowledge. Optionally filter by project context.",
      inputSchema: z.object({
        project: z
          .string()
          .optional()
          .describe("Filter tensions related to this project"),
        detect_new: z
          .boolean()
          .optional()
          .describe("Run detection before returning (slower, uses embeddings)"),
      }),
    },
    async ({ project, detect_new }) => {
      const start = Date.now();

      if (detect_new === true) {
        await tensionEngine.detectTensions();
      }

      const tensions =
        project !== undefined
          ? tensionEngine.getContextualTensions(project)
          : tensionEngine.getActiveTensions();

      if (tensions.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No active tensions detected.",
            },
          ],
        };
      }

      let output = `## Active Tensions (${tensions.length})\n\n`;

      for (const t of tensions) {
        const priority = tensionEngine.getSurfacingPriority(t, project);
        output += `### [${priority.toUpperCase()}] ${t.tensionType}\n`;
        output += `${t.description}\n`;
        output += `Severity: ${t.severity.toFixed(2)} | Surfaced: ${t.surfacedCount}x | Detected: ${t.detectedAt}\n\n`;
      }

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "get_active_tensions",
        params: { project, detect_new },
        resultCount: tensions.length,
        durationMs: Date.now() - start,
      });

      return { content: [{ type: "text" as const, text: output }] };
    },
  );

  server.registerTool(
    "resolve_tension",
    {
      title: "Resolve Tension",
      description:
        "Resolve or defer an active tension with an explanation. " +
        "Records the resolution for future reference.",
      inputSchema: z.object({
        tension_id: z.string().describe("ID of the tension to resolve"),
        resolution: z.string().describe("How the tension was resolved"),
        status: z
          .enum(["resolved", "deferred", "dismissed"])
          .optional()
          .describe("New status (default: resolved)"),
      }),
    },
    ({ tension_id, resolution, status }) => {
      const start = Date.now();
      const resolved = tensionEngine.resolveTension(
        tension_id,
        resolution,
        status ?? "resolved",
      );

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "resolve_tension",
        params: { tension_id, status },
        resultCount: resolved !== undefined ? 1 : 0,
        durationMs: Date.now() - start,
      });

      if (resolved === undefined) {
        return {
          content: [
            { type: "text" as const, text: `Tension not found: ${tension_id}` },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Tension resolved: ${resolved.description}\n**Status:** ${resolved.status}\n**Resolution:** ${resolution}`,
          },
        ],
      };
    },
  );
}
