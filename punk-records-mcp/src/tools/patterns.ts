import fs from "node:fs/promises";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PATHS } from "../config.js";
import { readAllMarkdownInDir } from "../utils/markdown.js";
import { queryLogger } from "../analytics/query-log.js";

const DOMAIN_PATHS = {
  code: PATHS.codePatterns,
  design: PATHS.designPatterns,
  strategy: PATHS.strategyPatterns,
} as const;

export function registerPatternTools(server: McpServer): void {
  server.registerTool(
    "get_patterns",
    {
      title: "Get Patterns",
      description:
        'Get reusable code, design, or strategy patterns. Specify domain ("code", "design", "strategy") and optionally a topic to filter.',
      inputSchema: z.object({
        domain: z
          .enum(["code", "design", "strategy"])
          .describe("Pattern domain"),
        topic: z
          .string()
          .optional()
          .describe(
            'Optional topic filter, e.g. "react", "offline-first", "animation"',
          ),
      }),
    },
    async ({ domain, topic }) => {
      const start = Date.now();
      const docs = await readAllMarkdownInDir(DOMAIN_PATHS[domain]);

      let filtered = docs;
      if (topic !== undefined && topic !== "") {
        const topicLower = topic.toLowerCase();
        filtered = docs.filter(
          (d) =>
            d.title.toLowerCase().includes(topicLower) ||
            d.tags.some((t) => t.toLowerCase().includes(topicLower)) ||
            d.content.toLowerCase().includes(topicLower),
        );
      }

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "get_patterns",
        params: { domain, topic },
        resultCount: filtered.length,
        durationMs: Date.now() - start,
      });

      if (filtered.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No patterns found for domain "${domain}"${topic !== undefined && topic !== "" ? ` with topic "${topic}"` : ""}`,
            },
          ],
        };
      }

      const combined = filtered
        .map((d) => `## ${d.title}\n\n${d.content}`)
        .join("\n\n---\n\n");
      return { content: [{ type: "text" as const, text: combined }] };
    },
  );

  server.registerTool(
    "update_pattern",
    {
      title: "Update Pattern",
      description:
        "Update or create a reusable pattern in the knowledge base. Use this when you discover a new pattern worth preserving.",
      inputSchema: z.object({
        domain: z
          .enum(["code", "design", "strategy"])
          .describe("Pattern domain"),
        filename: z
          .string()
          .describe('Filename without .md extension, e.g. "react-patterns"'),
        content: z
          .string()
          .describe("Full markdown content for the pattern file"),
        tags: z
          .array(z.string())
          .optional()
          .describe("Tags for categorization"),
      }),
    },
    async ({ domain, filename, content, tags }) => {
      const start = Date.now();
      const filePath = path.join(DOMAIN_PATHS[domain], `${filename}.md`);
      const today = new Date().toISOString().split("T")[0];
      const frontmatter = [
        "---",
        `title: "${filename}"`,
        `domain: "patterns/${domain}"`,
        `tags: ${JSON.stringify(tags ?? [])}`,
        `created: "${today}"`,
        `updated: "${today}"`,
        "---",
        "",
        "",
      ].join("\n");
      await fs.writeFile(filePath, frontmatter + content, "utf-8");
      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "update_pattern",
        params: { domain, filename },
        resultCount: 1,
        durationMs: Date.now() - start,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Pattern "${filename}" updated in patterns/${domain}/`,
          },
        ],
      };
    },
  );
}
