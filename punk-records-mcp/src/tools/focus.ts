import fs from "node:fs/promises";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PATHS } from "../config.js";
import { readMarkdownFileIfExists } from "../utils/markdown.js";
import { queryLogger } from "../analytics/query-log.js";

export function registerFocusTools(server: McpServer): void {
  server.registerTool(
    "get_current_focus",
    {
      title: "Get Current Focus",
      description:
        "What is Aslam working on right now? Returns current focus and open questions.",
      inputSchema: z.object({}),
    },
    async () => {
      const start = Date.now();
      const focusDoc = await readMarkdownFileIfExists(
        path.join(PATHS.active, "current-focus.md"),
      );
      const questionsDoc = await readMarkdownFileIfExists(
        path.join(PATHS.active, "open-questions.md"),
      );

      const parts: string[] = [];
      if (focusDoc !== null)
        parts.push(`## Current Focus\n\n${focusDoc.content}`);
      if (questionsDoc !== null)
        parts.push(`## Open Questions\n\n${questionsDoc.content}`);

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "get_current_focus",
        params: {},
        resultCount: parts.length,
        durationMs: Date.now() - start,
      });
      return {
        content: [
          {
            type: "text" as const,
            text:
              parts.length > 0
                ? parts.join("\n\n---\n\n")
                : "No current focus set.",
          },
        ],
      };
    },
  );

  server.registerTool(
    "update_current_focus",
    {
      title: "Update Current Focus",
      description: "Update what Aslam is currently working on.",
      inputSchema: z.object({
        focus: z.string().describe("Description of current focus"),
        project: z.string().optional().describe("Associated project name"),
      }),
    },
    async ({ focus, project }) => {
      const start = Date.now();
      const filePath = path.join(PATHS.active, "current-focus.md");
      const today = new Date().toISOString().split("T")[0];
      const content = [
        "---",
        'title: "Current Focus"',
        'domain: "active"',
        `updated: "${today}"`,
        `project: "${project ?? ""}"`,
        "---",
        "",
        focus,
        "",
      ].join("\n");
      await fs.writeFile(filePath, content, "utf-8");
      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "update_current_focus",
        params: { project },
        resultCount: 1,
        durationMs: Date.now() - start,
      });
      return {
        content: [{ type: "text" as const, text: "Current focus updated." }],
      };
    },
  );
}
