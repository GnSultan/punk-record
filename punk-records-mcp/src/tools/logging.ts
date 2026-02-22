import fs from "node:fs/promises";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PATHS } from "../config.js";
import { appendToMarkdownFile } from "../utils/markdown.js";
import { ensureDir } from "../utils/files.js";
import { queryLogger } from "../analytics/query-log.js";

export function registerLoggingTools(server: McpServer): void {
  server.registerTool(
    "log_decision",
    {
      title: "Log Decision",
      description:
        "Record a decision made during this session with its reasoning. This builds the project's decision history.",
      inputSchema: z.object({
        project: z.string().describe("Project slug"),
        decision: z.string().describe("What was decided"),
        reasoning: z.string().describe("Why this was decided"),
        tags: z.array(z.string()).optional().describe("Relevant tags"),
      }),
    },
    async ({ project, decision, reasoning, tags }) => {
      const start = Date.now();
      const projectDir = path.join(PATHS.projects, project);
      await ensureDir(projectDir);
      const filePath = path.join(projectDir, "decisions.md");
      const date = new Date().toISOString().split("T")[0];
      const entry = [
        `### ${date} — ${decision}`,
        "",
        `**Decision:** ${decision}`,
        "",
        `**Reasoning:** ${reasoning}`,
        "",
        ...(tags !== undefined && tags.length > 0
          ? [`**Tags:** ${tags.join(", ")}`, ""]
          : []),
        "---",
      ].join("\n");
      await appendToMarkdownFile(filePath, entry);
      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "log_decision",
        params: { project, decision },
        resultCount: 1,
        durationMs: Date.now() - start,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Decision logged for ${project}: "${decision}"`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "log_lesson",
    {
      title: "Log Lesson",
      description:
        "Record something learned during this session. Builds the project's institutional knowledge.",
      inputSchema: z.object({
        project: z.string().describe("Project slug"),
        lesson: z.string().describe("What was learned"),
        context: z.string().describe("The context in which this was learned"),
        tags: z.array(z.string()).optional().describe("Relevant tags"),
      }),
    },
    async ({ project, lesson, context: ctx, tags }) => {
      const start = Date.now();
      const projectDir = path.join(PATHS.projects, project);
      await ensureDir(projectDir);
      const filePath = path.join(projectDir, "lessons.md");
      const date = new Date().toISOString().split("T")[0];
      const entry = [
        `### ${date} — ${lesson}`,
        "",
        `**Lesson:** ${lesson}`,
        "",
        `**Context:** ${ctx}`,
        "",
        ...(tags !== undefined && tags.length > 0
          ? [`**Tags:** ${tags.join(", ")}`, ""]
          : []),
        "---",
      ].join("\n");
      await appendToMarkdownFile(filePath, entry);
      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "log_lesson",
        params: { project, lesson },
        resultCount: 1,
        durationMs: Date.now() - start,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Lesson logged for ${project}: "${lesson}"`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "log_session",
    {
      title: "Log Session",
      description:
        "Capture session notes automatically. Call this at the end of a work session to preserve what happened.",
      inputSchema: z.object({
        project: z.string().describe("Project worked on"),
        summary: z.string().describe("Summary of what was accomplished"),
        decisions_made: z
          .array(z.string())
          .optional()
          .describe("Key decisions made"),
        lessons_learned: z
          .array(z.string())
          .optional()
          .describe("Lessons learned"),
        open_questions: z
          .array(z.string())
          .optional()
          .describe("Questions still open"),
      }),
    },
    async ({
      project,
      summary,
      decisions_made,
      lessons_learned,
      open_questions,
    }) => {
      const start = Date.now();
      await ensureDir(PATHS.sessionNotes);
      const date = new Date().toISOString().split("T")[0];
      const filename = `${date}-${project}.md`;
      const filePath = path.join(PATHS.sessionNotes, filename);

      const parts = [
        "---",
        `title: "Session: ${project}"`,
        `date: "${date}"`,
        `project: "${project}"`,
        "---",
        "",
        "## Summary",
        "",
        summary,
      ];

      if (decisions_made !== undefined && decisions_made.length > 0) {
        parts.push("", "## Decisions Made", "");
        for (const d of decisions_made) parts.push(`- ${d}`);
      }
      if (lessons_learned !== undefined && lessons_learned.length > 0) {
        parts.push("", "## Lessons Learned", "");
        for (const l of lessons_learned) parts.push(`- ${l}`);
      }
      if (open_questions !== undefined && open_questions.length > 0) {
        parts.push("", "## Open Questions", "");
        for (const q of open_questions) parts.push(`- ${q}`);
      }

      parts.push("");
      await fs.writeFile(filePath, parts.join("\n"), "utf-8");
      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "log_session",
        params: { project },
        resultCount: 1,
        durationMs: Date.now() - start,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Session notes saved: ${filename}`,
          },
        ],
      };
    },
  );
}
