import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PATHS } from "../config.js";
import { readAllMarkdownInDir } from "../utils/markdown.js";
import { queryLogger } from "../analytics/query-log.js";

export function registerContextTools(server: McpServer): void {
  server.registerTool(
    "get_market_context",
    {
      title: "Get Market Context",
      description:
        "Get Tanzania and Africa market insights, target audience profiles, and tech ecosystem context.",
      inputSchema: z.object({}),
    },
    async () => {
      const start = Date.now();
      const docs = await readAllMarkdownInDir(PATHS.context);
      const combined = docs
        .map((d) => `## ${d.title}\n\n${d.content}`)
        .join("\n\n---\n\n");
      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "get_market_context",
        params: {},
        resultCount: docs.length,
        durationMs: Date.now() - start,
      });
      return { content: [{ type: "text" as const, text: combined }] };
    },
  );
}
