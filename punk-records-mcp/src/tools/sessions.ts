import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { sessionManager } from "../engines/session-manager.js";
import { queryLogger } from "../analytics/query-log.js";

export function registerSessionTools(server: McpServer): void {
  server.registerTool(
    "begin_project_session",
    {
      title: "Begin Project Session",
      description:
        "Start a work session on a project. Returns full project context including " +
        "what happened last session, pending work, open problems, recent decisions. " +
        "Call this at the START of any project work.",
      inputSchema: z.object({
        project: z.string().describe("Project slug (e.g. 'elimuafrica')"),
        goal: z
          .string()
          .optional()
          .describe("What you plan to accomplish this session"),
      }),
    },
    async ({ project, goal }) => {
      const start = Date.now();
      const context = await sessionManager.beginSession(project, goal);

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "begin_project_session",
        params: { project, goal },
        resultCount: 1,
        durationMs: Date.now() - start,
      });

      return { content: [{ type: "text" as const, text: context }] };
    },
  );

  server.registerTool(
    "record_event",
    {
      title: "Record Event",
      description:
        "Record a significant event during the session: decision, problem, lesson, " +
        "question, blocker, task completion, breakthrough. Builds the project's memory.",
      inputSchema: z.object({
        event_type: z
          .enum([
            "decision",
            "decision_reversed",
            "problem_identified",
            "problem_resolved",
            "problem_parked",
            "question_raised",
            "question_answered",
            "blocker_hit",
            "blocker_cleared",
            "task_started",
            "task_completed",
            "task_abandoned",
            "lesson_learned",
            "pattern_applied",
            "pattern_failed",
            "context_shift",
            "frustration_detected",
            "breakthrough",
            "file_created",
            "file_major_change",
            "architecture_change",
          ])
          .describe("Type of event"),
        description: z.string().describe("What happened"),
        details: z
          .record(z.string())
          .optional()
          .describe("Additional context (e.g. why, alternatives, severity)"),
      }),
    },
    async ({ event_type, description, details }) => {
      const start = Date.now();
      const event = await sessionManager.recordEvent(event_type, {
        description,
        ...details,
      });

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "record_event",
        params: { event_type, description },
        resultCount: 1,
        durationMs: Date.now() - start,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Recorded: [${event_type}] ${description} (${event.id})`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "end_project_session",
    {
      title: "End Project Session",
      description:
        "End the current work session. Automatically extracts decisions, lessons, " +
        "and pending work. Updates project state for next session continuity.",
      inputSchema: z.object({
        summary: z
          .string()
          .optional()
          .describe("Brief summary of what was accomplished"),
        pending_work: z
          .array(z.string())
          .optional()
          .describe("Explicit items for next session"),
      }),
    },
    async ({ summary, pending_work }) => {
      const start = Date.now();
      const output = await sessionManager.endSession(summary, pending_work);

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "end_project_session",
        params: { summary },
        resultCount: 1,
        durationMs: Date.now() - start,
      });

      return { content: [{ type: "text" as const, text: output }] };
    },
  );

  server.registerTool(
    "recall_project",
    {
      title: "Recall Project",
      description:
        "Get project memory without starting a formal session. " +
        "Returns recent history, state, and key context.",
      inputSchema: z.object({
        project: z.string().describe("Project slug"),
        depth: z
          .enum(["quick", "full", "deep"])
          .optional()
          .describe(
            "quick=state only, full=state+recent context, deep=full timeline",
          ),
      }),
    },
    async ({ project, depth }) => {
      const start = Date.now();
      const output = await sessionManager.recallProject(
        project,
        depth ?? "full",
      );

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "recall_project",
        params: { project, depth },
        resultCount: 1,
        durationMs: Date.now() - start,
      });

      return { content: [{ type: "text" as const, text: output }] };
    },
  );

  server.registerTool(
    "project_evolution",
    {
      title: "Project Evolution",
      description:
        "See how a project has evolved over time. Shows trajectory of decisions, " +
        "recurring problems, lessons learned, and productivity metrics.",
      inputSchema: z.object({
        project: z.string().describe("Project slug"),
        timeframe: z
          .enum(["week", "month", "all"])
          .optional()
          .describe("Time window to analyze"),
      }),
    },
    async ({ project, timeframe }) => {
      const start = Date.now();
      const output = await sessionManager.analyzeEvolution(
        project,
        timeframe ?? "month",
      );

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "project_evolution",
        params: { project, timeframe },
        resultCount: 1,
        durationMs: Date.now() - start,
      });

      return { content: [{ type: "text" as const, text: output }] };
    },
  );
}
