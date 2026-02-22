import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { hybridSearch } from "../search/indexer.js";
import { queryLogger } from "../analytics/query-log.js";

export function registerSearchTools(server: McpServer): void {
  server.registerTool(
    "search_memory",
    {
      title: "Search Memory",
      description:
        "Hybrid semantic + keyword search across all Punk Records. Use this to find relevant context, past decisions, lessons, patterns, or any knowledge in the brain. Returns ranked results.",
      inputSchema: z.object({
        query: z.string().describe("Natural language search query"),
        domain: z
          .string()
          .optional()
          .describe(
            'Optional domain filter: "core", "memory", "patterns", "context", "active"',
          ),
        limit: z.number().optional().describe("Max results (default 10)"),
      }),
    },
    async ({ query, domain, limit }) => {
      const start = Date.now();
      const results = await hybridSearch(query, { domain, limit });

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "search_memory",
        params: { query, domain, limit },
        resultCount: results.length,
        durationMs: Date.now() - start,
      });

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No results found for: "${query}"`,
            },
          ],
        };
      }

      const formatted = results
        .map(
          (r, i) =>
            `### Result ${i + 1} (score: ${r.score.toFixed(3)})\n**Source:** ${r.relativePath}\n**Title:** ${r.title}\n\n${r.text}`,
        )
        .join("\n\n---\n\n");

      return {
        content: [
          {
            type: "text" as const,
            text: `## Search Results for: "${query}"\n\n${formatted}`,
          },
        ],
      };
    },
  );
}
