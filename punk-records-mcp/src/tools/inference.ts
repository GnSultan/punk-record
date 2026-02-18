import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { inferenceEngine } from "../engines/inference.js";
import { queryLogger } from "../analytics/query-log.js";

export function registerInferenceTools(server: McpServer): void {
  server.registerTool(
    "run_inference",
    {
      title: "Run Inference",
      description:
        "Discover new knowledge from existing patterns. Finds missing edges " +
        "between co-occurring nodes, suggests layer transitions, and updates " +
        "confidence based on usage patterns.",
      inputSchema: z.object({
        auto_apply: z
          .boolean()
          .optional()
          .describe("Auto-apply high-confidence inferences (>0.85)"),
      }),
    },
    async ({ auto_apply }) => {
      const start = Date.now();
      const inferences = await inferenceEngine.runInference();

      let output = `## Inference Results\n\n`;
      output += `**New inferences:** ${inferences.length}\n\n`;

      if (inferences.length === 0) {
        output += "No new inferences discovered.\n";
      } else {
        for (const inf of inferences) {
          output += `### [${inf.inferenceType}] (confidence: ${inf.confidence.toFixed(2)})\n`;
          output += `${JSON.stringify(inf.content, null, 2)}\n`;
          output += `ID: ${inf.id}\n\n`;
        }
      }

      if (auto_apply === true) {
        const applied = inferenceEngine.autoApplyHighConfidence();
        if (applied.length > 0) {
          output += `\n### Auto-Applied (${applied.length})\n`;
          for (const result of applied) {
            output += `- ${result}\n`;
          }
        }
      }

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "run_inference",
        params: { auto_apply },
        resultCount: inferences.length,
        durationMs: Date.now() - start,
      });

      return { content: [{ type: "text" as const, text: output }] };
    },
  );

  server.registerTool(
    "review_inferences",
    {
      title: "Review Inferences",
      description:
        "View all pending inferences waiting for review. Each can be applied or rejected.",
      inputSchema: z.object({}),
    },
    () => {
      const start = Date.now();
      const pending = inferenceEngine.getPendingInferences();

      if (pending.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No pending inferences. Run `run_inference` to discover new ones.",
            },
          ],
        };
      }

      let output = `## Pending Inferences (${pending.length})\n\n`;
      for (const inf of pending) {
        output += `### ${inf.id}\n`;
        output += `**Type:** ${inf.inferenceType} | **Confidence:** ${inf.confidence.toFixed(2)}\n`;
        output += `${JSON.stringify(inf.content, null, 2)}\n\n`;
      }

      output += "Use `apply_inference` with the ID to apply, or reject.\n";

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "review_inferences",
        params: {},
        resultCount: pending.length,
        durationMs: Date.now() - start,
      });

      return { content: [{ type: "text" as const, text: output }] };
    },
  );

  server.registerTool(
    "apply_inference",
    {
      title: "Apply Inference",
      description:
        "Apply or reject a pending inference. Applying creates the suggested " +
        "edge, updates confidence, or transitions a node's layer.",
      inputSchema: z.object({
        inference_id: z.string().describe("ID of the inference"),
        action: z
          .enum(["apply", "reject"])
          .describe("Whether to apply or reject"),
      }),
    },
    ({ inference_id, action }) => {
      const start = Date.now();
      const result =
        action === "apply"
          ? inferenceEngine.applyInference(inference_id)
          : inferenceEngine.rejectInference(inference_id);

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "apply_inference",
        params: { inference_id, action },
        resultCount: 1,
        durationMs: Date.now() - start,
      });

      return { content: [{ type: "text" as const, text: result }] };
    },
  );
}
