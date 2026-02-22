import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PATHS } from "../config.js";
import { readMarkdownFile, readAllMarkdownInDir } from "../utils/markdown.js";
import { queryLogger } from "../analytics/query-log.js";

export function registerIdentityTools(server: McpServer): void {
  server.registerTool(
    "get_identity",
    {
      title: "Get Identity",
      description:
        "Get Aslam's core identity, philosophy, voice, and values. Returns all core/*.md files combined. Call this at the start of any session or when you need to understand who you're working with.",
      inputSchema: z.object({}),
    },
    async () => {
      const start = Date.now();
      const docs = await readAllMarkdownInDir(PATHS.core);
      const combined = docs
        .map((d) => `## ${d.title}\n\n${d.content}`)
        .join("\n\n---\n\n");
      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "get_identity",
        params: {},
        resultCount: docs.length,
        durationMs: Date.now() - start,
      });
      return { content: [{ type: "text" as const, text: combined }] };
    },
  );

  server.registerTool(
    "get_anti_patterns",
    {
      title: "Get Anti-Patterns",
      description:
        "Get the list of things to avoid — design anti-patterns, code anti-patterns, strategy anti-patterns. Check this before making significant decisions.",
      inputSchema: z.object({}),
    },
    async () => {
      const start = Date.now();
      const doc = await readMarkdownFile(
        path.join(PATHS.core, "anti-patterns.md"),
      );
      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "get_anti_patterns",
        params: {},
        resultCount: 1,
        durationMs: Date.now() - start,
      });
      return { content: [{ type: "text" as const, text: doc.content }] };
    },
  );
}
