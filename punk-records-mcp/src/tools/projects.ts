import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PATHS } from "../config.js";
import { readAllMarkdownInDir } from "../utils/markdown.js";
import { listSubdirectories } from "../utils/files.js";
import { queryLogger } from "../analytics/query-log.js";

export function registerProjectTools(server: McpServer): void {
  server.registerTool(
    "get_project_context",
    {
      title: "Get Project Context",
      description:
        'Get the full context for a specific project including its vision, decisions, patterns, and lessons. Pass the project slug (e.g., "elimu-africa", "apple-empire").',
      inputSchema: z.object({
        project_name: z.string().describe('Project slug, e.g. "elimu-africa"'),
      }),
    },
    async ({ project_name }) => {
      const start = Date.now();
      const projectDir = path.join(PATHS.projects, project_name);
      const docs = await readAllMarkdownInDir(projectDir);
      if (docs.length === 0) {
        const available = await listSubdirectories(PATHS.projects);
        queryLogger.log({
          timestamp: new Date().toISOString(),
          tool: "get_project_context",
          params: { project_name },
          resultCount: 0,
          durationMs: Date.now() - start,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Project "${project_name}" not found. Available projects: ${available.join(", ")}`,
            },
          ],
        };
      }
      const combined = docs
        .map((d) => `## ${d.title}\n\n${d.content}`)
        .join("\n\n---\n\n");
      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "get_project_context",
        params: { project_name },
        resultCount: docs.length,
        durationMs: Date.now() - start,
      });
      return { content: [{ type: "text" as const, text: combined }] };
    },
  );
}
