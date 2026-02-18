import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { PATHS } from "../config.js";
import {
  readMarkdownFile,
  readAllMarkdownInDir,
  readMarkdownFileIfExists,
  readAllMarkdownInDirIfExists,
} from "../utils/markdown.js";
import { listMarkdownFiles } from "../utils/files.js";
import type { PunkDocument } from "../types.js";

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "start_session",
    {
      title: "Start Session",
      description:
        'Load identity + current focus + project context + anti-patterns. The "catching up with a collaborator" moment. Call this at the beginning of every work session.',
      argsSchema: {
        project: z.string().optional().describe("Project to load context for"),
      },
    },
    async ({ project }) => {
      const parts: string[] = [];

      const coreDocs: PunkDocument[] = await readAllMarkdownInDir(PATHS.core);
      parts.push(
        "# Who You Are Working With\n\n" +
          coreDocs
            .map((d: PunkDocument) => `## ${d.title}\n\n${d.content}`)
            .join("\n\n"),
      );

      const focus = await readMarkdownFileIfExists(
        path.join(PATHS.active, "current-focus.md"),
      );
      if (focus !== null) parts.push(`# Current Focus\n\n${focus.content}`);

      const questions = await readMarkdownFileIfExists(
        path.join(PATHS.active, "open-questions.md"),
      );
      if (questions !== null)
        parts.push(`# Open Questions\n\n${questions.content}`);

      if (project !== undefined && project !== "") {
        const projectDocs: PunkDocument[] = await readAllMarkdownInDirIfExists(
          path.join(PATHS.projects, project),
        );
        if (projectDocs.length > 0) {
          parts.push(
            `# Project: ${project}\n\n` +
              projectDocs
                .map((d: PunkDocument) => `## ${d.title}\n\n${d.content}`)
                .join("\n\n"),
          );
        }
      }

      const fullContext = parts.join("\n\n---\n\n");

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Here is your context for this session. You are catching up with a collaborator — Aslam. Read this carefully, it represents who he is and what he is working on:\n\n${fullContext}\n\nNow you are ready. Acknowledge what you know and ask what we are working on today.`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "review_decisions",
    {
      title: "Review Decisions",
      description:
        "Review the timeline of decisions for a project. Useful for understanding the evolution of thinking.",
      argsSchema: {
        project: z.string().describe("Project slug"),
      },
    },
    async ({ project }) => {
      const decisionsFile = path.join(PATHS.projects, project, "decisions.md");
      const doc = await readMarkdownFileIfExists(decisionsFile);
      const content =
        doc !== null
          ? doc.content
          : `No decisions recorded for "${project}" yet.`;

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Review these decisions for the ${project} project. Identify patterns, potential contradictions, and evolution of thinking:\n\n${content}`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "challenge_approach",
    {
      title: "Challenge Approach",
      description:
        "Check a proposed approach against past lessons and anti-patterns. Play devil's advocate.",
      argsSchema: {
        approach: z.string().describe("The proposed approach to challenge"),
        project: z.string().optional().describe("Current project for context"),
      },
    },
    async ({ approach, project }) => {
      const antiPatterns = await readMarkdownFileIfExists(
        path.join(PATHS.core, "anti-patterns.md"),
      );

      let lessonsContent = "";
      if (project !== undefined && project !== "") {
        const lessonsDoc = await readMarkdownFileIfExists(
          path.join(PATHS.projects, project, "lessons.md"),
        );
        if (lessonsDoc !== null) lessonsContent = lessonsDoc.content;
      }

      const antiPatternsText =
        antiPatterns !== null ? antiPatterns.content : "None loaded.";
      const projectLabel =
        project !== undefined && project !== "" ? ` (${project})` : "";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `I want to challenge this approach against our known anti-patterns and past lessons.\n\n**Proposed Approach:**\n${approach}\n\n**Anti-Patterns to Check Against:**\n${antiPatternsText}\n\n**Past Lessons${projectLabel}:**\n${lessonsContent === "" ? "None recorded." : lessonsContent}\n\nBe honest. Play devil's advocate. If this approach risks repeating past mistakes, say so clearly. If it looks good, explain why.`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "weekly_reflection",
    {
      title: "Weekly Reflection",
      description:
        "Generate a weekly reflection from session notes, decisions, and lessons from the past 7 days.",
    },
    async () => {
      const sessionFiles = await listMarkdownFiles(PATHS.sessionNotes);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentSessions: string[] = [];
      for (const file of sessionFiles) {
        const doc = await readMarkdownFile(file);
        const dateValue = doc.frontmatter.date;
        if (
          typeof dateValue === "string" &&
          dateValue !== "" &&
          new Date(dateValue) >= sevenDaysAgo
        ) {
          recentSessions.push(`## ${doc.title}\n\n${doc.content}`);
        }
      }

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Here are the session notes, decisions, and lessons from the past week. Generate a weekly reflection that identifies:\n1. Key themes and patterns\n2. Progress on current goals\n3. Recurring challenges\n4. Insights that might inform next week\n5. Open questions that need attention\n\n${recentSessions.length > 0 ? recentSessions.join("\n\n---\n\n") : "No session notes from the past week."}`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "brand_voice_check",
    {
      title: "Brand Voice Check",
      description:
        "Evaluate content against Aslam's voice and brand guidelines.",
      argsSchema: {
        content: z.string().describe("Content to evaluate"),
        brand: z
          .string()
          .optional()
          .describe(
            'Specific brand context ("imaslam", "elimu-africa", "apple-empire")',
          ),
      },
    },
    async ({ content: evalContent, brand }) => {
      const voiceDoc = await readMarkdownFileIfExists(
        path.join(PATHS.core, "voice.md"),
      );
      const identityDoc = await readMarkdownFileIfExists(
        path.join(PATHS.core, "identity.md"),
      );

      let brandContext = "";
      if (brand !== undefined && brand !== "") {
        const brandDoc = await readMarkdownFileIfExists(
          path.join(PATHS.clients, brand, "brand.md"),
        );
        if (brandDoc !== null) brandContext = brandDoc.content;
      }

      const voiceText =
        voiceDoc !== null ? voiceDoc.content : "No voice guide loaded.";
      const identityText = identityDoc !== null ? identityDoc.content : "";
      const brandLabel = brand !== undefined && brand !== "" ? brand : "";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Evaluate this content against the voice and brand guidelines.\n\n**Voice Guidelines:**\n${voiceText}\n\n**Identity:**\n${identityText}\n\n${brandContext !== "" ? `**Brand Context (${brandLabel}):**\n${brandContext}\n\n` : ""}**Content to Evaluate:**\n${evalContent}\n\nScore it on:\n- Authenticity (does it sound like Aslam?)\n- Anti-pattern avoidance (no corporate speak, no generic templates)\n- Cultural relevance (Tanzania/Africa context where appropriate)\n- Clarity and impact`,
            },
          },
        ],
      };
    },
  );
}
