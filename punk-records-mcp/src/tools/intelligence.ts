import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { hybridSearch, getIndexStats } from "../search/indexer.js";
import { graphStore } from "../graph/store.js";
import { getDatabase } from "../graph/database.js";
import { generateSuggestions } from "../analytics/suggestions.js";
import { RECORDS_ROOT, PATHS } from "../config.js";
import { listMarkdownFiles, listSubdirectories } from "../utils/files.js";
import { readMarkdownFile } from "../utils/markdown.js";
import { queryLogger } from "../analytics/query-log.js";

export function registerIntelligenceTools(server: McpServer): void {
  server.registerTool(
    "check_against_history",
    {
      title: "Check Against History",
      description:
        "Before making a decision, check past decisions, lessons, and anti-patterns for relevant warnings or prior art. Mistake prevention tool.",
      inputSchema: z.object({
        proposed_action: z
          .string()
          .describe("What you are about to do or decide"),
        project: z.string().optional().describe("Current project context"),
      }),
    },
    async ({ proposed_action, project }) => {
      const start = Date.now();
      const decisionsResults = await hybridSearch(proposed_action, {
        domain: "memory",
        limit: 5,
      });
      const antiPatternResults = await hybridSearch(proposed_action, {
        domain: "core",
        limit: 3,
      });

      let output = `## History Check: "${proposed_action}"\n\n`;

      if (antiPatternResults.length > 0) {
        output += "### Relevant Anti-Patterns / Warnings\n";
        for (const r of antiPatternResults) {
          output += `- [${r.score.toFixed(2)}] ${r.text.substring(0, 200)}\n\n`;
        }
      }

      if (decisionsResults.length > 0) {
        output += "### Related Past Decisions & Lessons\n";
        for (const r of decisionsResults) {
          output += `- [${r.score.toFixed(2)}] **${r.title}** (${r.relativePath})\n  ${r.text.substring(0, 200)}\n\n`;
        }
      }

      if (antiPatternResults.length === 0 && decisionsResults.length === 0) {
        output +=
          "No relevant history found. This appears to be new territory.\n";
      }

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "check_against_history",
        params: { proposed_action, project },
        resultCount: decisionsResults.length + antiPatternResults.length,
        durationMs: Date.now() - start,
      });
      return { content: [{ type: "text" as const, text: output }] };
    },
  );

  server.registerTool(
    "knowledge_health",
    {
      title: "Knowledge Health",
      description:
        "Analyze the coverage, freshness, and depth of the knowledge base. Returns a structured health report.",
      inputSchema: z.object({}),
    },
    async () => {
      const start = Date.now();
      const allFiles = await listMarkdownFiles(RECORDS_ROOT);
      const docs = await Promise.all(allFiles.map((f) => readMarkdownFile(f)));

      const byDomain: Record<string, number> = {};
      for (const doc of docs) {
        byDomain[doc.domain] = (byDomain[doc.domain] ?? 0) + 1;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const staleDocs = docs
        .filter((d) => d.updated !== "" && new Date(d.updated) < thirtyDaysAgo)
        .map((d) => ({ path: d.relativePath, lastUpdated: d.updated }));

      const emptyDocs = docs
        .filter((d) => d.content.trim().length < 50)
        .map((d) => d.relativePath);

      const projectDirs = await listSubdirectories(PATHS.projects);
      const orphanedProjects: string[] = [];
      for (const dir of projectDirs) {
        const projectDocs = docs.filter((d) =>
          d.relativePath.startsWith(`memory/projects/${dir}/`),
        );
        const hasDecisions = projectDocs.some(
          (d) =>
            d.relativePath.endsWith("decisions.md") &&
            d.content.trim().length > 100,
        );
        const hasLessons = projectDocs.some(
          (d) =>
            d.relativePath.endsWith("lessons.md") &&
            d.content.trim().length > 100,
        );
        if (!hasDecisions && !hasLessons) {
          orphanedProjects.push(dir);
        }
      }

      const expectedDomains = [
        "core",
        "memory",
        "patterns",
        "context",
        "active",
      ];
      const coverageGaps: string[] = [];
      for (const domain of expectedDomains) {
        const domainCount = byDomain[domain] ?? 0;
        if (domainCount < 2) {
          coverageGaps.push(`"${domain}" has only ${domainCount} documents`);
        }
      }

      const graphStats = await graphStore.getStats();
      const indexStats = getIndexStats();

      let output = "## Knowledge Health Report\n\n";
      output += `**Total Documents:** ${docs.length}\n\n`;

      output += "### By Domain\n";
      for (const [domain, domainCount] of Object.entries(byDomain).sort()) {
        output += `- ${domain}: ${domainCount} docs\n`;
      }

      output += "\n### Stale Documents (30+ days)\n";
      output +=
        staleDocs.length > 0
          ? staleDocs
              .map((d) => `- ${d.path} (last updated: ${d.lastUpdated})`)
              .join("\n")
          : "None — all docs are fresh.";

      output += "\n\n### Empty/Thin Documents\n";
      output +=
        emptyDocs.length > 0
          ? emptyDocs.map((p) => `- ${p}`).join("\n")
          : "None.";

      output += "\n\n### Orphaned Projects (no decisions or lessons)\n";
      output +=
        orphanedProjects.length > 0
          ? orphanedProjects.map((p) => `- ${p}`).join("\n")
          : "All projects have documented decisions or lessons.";

      output += "\n\n### Coverage Gaps\n";
      output +=
        coverageGaps.length > 0
          ? coverageGaps.map((g) => `- ${g}`).join("\n")
          : "Good coverage across all domains.";

      output += `\n\n### Knowledge Graph\n- ${graphStats.entities} entities, ${graphStats.relations} relations`;
      if (graphStats.disconnectedEntities.length > 0) {
        output += `\n- Disconnected entities: ${graphStats.disconnectedEntities.join(", ")}`;
      }

      // Enhanced stats from SQLite
      const db = getDatabase();

      // Layer distribution
      const layerDist = db
        .prepare(
          "SELECT layer, COUNT(*) as count FROM nodes GROUP BY layer ORDER BY count DESC",
        )
        .all() as Array<{ layer: string; count: number }>;
      if (layerDist.length > 0) {
        output += "\n\n### Layer Distribution\n";
        for (const row of layerDist) {
          output += `- ${row.layer}: ${row.count} nodes\n`;
        }
      }

      // Evolution stats
      const versionStats = db
        .prepare(
          "SELECT COUNT(DISTINCT node_id) as evolved_nodes, COUNT(*) as total_versions FROM node_versions",
        )
        .get() as { evolved_nodes: number; total_versions: number } | undefined;
      if (versionStats !== undefined && versionStats.total_versions > 0) {
        const mostEvolved = db
          .prepare(
            "SELECT n.name, n.version FROM nodes n WHERE n.version > 1 ORDER BY n.version DESC LIMIT 3",
          )
          .all() as Array<{ name: string; version: number }>;
        output += `\n### Evolution\n- ${versionStats.evolved_nodes} nodes with version history (${versionStats.total_versions} total versions)\n`;
        if (mostEvolved.length > 0) {
          output += `- Most evolved: ${mostEvolved.map((n) => `${n.name} (v${n.version})`).join(", ")}\n`;
        }
      }

      // Tension stats
      const tensionStats = db
        .prepare(
          "SELECT status, COUNT(*) as count FROM tensions GROUP BY status",
        )
        .all() as Array<{ status: string; count: number }>;
      if (tensionStats.length > 0) {
        output += "\n### Tensions\n";
        for (const row of tensionStats) {
          output += `- ${row.status}: ${row.count}\n`;
        }
        const criticalCount = db
          .prepare(
            "SELECT COUNT(*) as count FROM tensions WHERE severity >= 0.8 AND status = 'active'",
          )
          .get() as { count: number };
        if (criticalCount.count > 0) {
          output += `- **${criticalCount.count} critical tensions need attention**\n`;
        }
      }

      // Inference stats
      const inferenceStats = db
        .prepare(
          "SELECT status, COUNT(*) as count FROM inferences GROUP BY status",
        )
        .all() as Array<{ status: string; count: number }>;
      if (inferenceStats.length > 0) {
        output += "\n### Inferences\n";
        for (const row of inferenceStats) {
          output += `- ${row.status}: ${row.count}\n`;
        }
      }

      // Confidence overview
      const confStats = db
        .prepare(
          "SELECT AVG(confidence) as avg_conf, MIN(confidence) as min_conf, COUNT(CASE WHEN confidence < 0.3 THEN 1 END) as low_conf_count FROM nodes",
        )
        .get() as
        | {
            avg_conf: number | null;
            min_conf: number | null;
            low_conf_count: number;
          }
        | undefined;
      if (
        confStats !== undefined &&
        confStats.avg_conf !== null &&
        confStats.min_conf !== null
      ) {
        output += `\n### Confidence Overview\n- Average: ${confStats.avg_conf.toFixed(2)}, Minimum: ${confStats.min_conf.toFixed(2)}\n`;
        if (confStats.low_conf_count > 0) {
          output += `- ${confStats.low_conf_count} nodes with low confidence (< 0.3)\n`;
        }
      }

      output += `\n\n### Search Index\n- ${indexStats.totalChunks} chunks indexed\n- Last rebuilt: ${indexStats.lastRebuilt === "" ? "Not yet built" : indexStats.lastRebuilt}`;

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "knowledge_health",
        params: {},
        resultCount: docs.length,
        durationMs: Date.now() - start,
      });
      return { content: [{ type: "text" as const, text: output }] };
    },
  );

  server.registerTool(
    "get_suggestions",
    {
      title: "Get Suggestions",
      description:
        "Get proactive recommendations based on query patterns, knowledge gaps, and cross-project insights.",
      inputSchema: z.object({
        current_project: z
          .string()
          .optional()
          .describe("Current project for context-aware suggestions"),
      }),
    },
    async ({ current_project }) => {
      const start = Date.now();
      const suggestions = await generateSuggestions(current_project);

      queryLogger.log({
        timestamp: new Date().toISOString(),
        tool: "get_suggestions",
        params: { current_project },
        resultCount: suggestions.length,
        durationMs: Date.now() - start,
      });

      if (suggestions.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No suggestions at this time. Keep working and the system will learn your patterns.",
            },
          ],
        };
      }

      let output = "## Proactive Suggestions\n\n";
      const icons: Record<string, string> = {
        pattern: "PATTERN",
        warning: "WARNING",
        connection: "CONNECTION",
        gap: "GAP",
      };
      for (const s of suggestions) {
        output += `### [${icons[s.type] ?? s.type}] ${s.title}\n${s.description}\n\n`;
      }

      return { content: [{ type: "text" as const, text: output }] };
    },
  );
}
