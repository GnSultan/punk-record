import { queryLogger } from "./query-log.js";
import { hybridSearch, getIndexStats } from "../search/indexer.js";

export interface Suggestion {
  type: "pattern" | "warning" | "connection" | "gap";
  title: string;
  description: string;
  relevance: number;
}

export async function generateSuggestions(
  currentProject?: string,
): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];

  const topQueries = await queryLogger.getTopQueries(5);
  for (const { query, count } of topQueries) {
    if (count >= 3) {
      suggestions.push({
        type: "pattern",
        title: `Frequently searched: "${query}"`,
        description: `This query has been searched ${count} times. Consider creating a dedicated document or pattern for this topic.`,
        relevance: Math.min(count / 10, 1),
      });
    }
  }

  if (currentProject !== undefined && currentProject !== "") {
    try {
      const relatedResults = await hybridSearch(currentProject, { limit: 5 });
      const otherProjectResults = relatedResults.filter(
        (r) =>
          r.domain === "memory" && !r.relativePath.includes(currentProject),
      );
      for (const result of otherProjectResults) {
        suggestions.push({
          type: "connection",
          title: `Related from: ${result.title}`,
          description: `Content from ${result.relativePath} may be relevant to ${currentProject}: "${result.text.substring(0, 100)}..."`,
          relevance: result.score,
        });
      }
    } catch {
      // Search not ready yet
    }
  }

  const indexStats = getIndexStats();
  if (indexStats.totalChunks < 20) {
    suggestions.push({
      type: "gap",
      title: "Knowledge base is thin",
      description: `Only ${indexStats.totalChunks} chunks indexed. Consider documenting more decisions, lessons, and patterns.`,
      relevance: 0.9,
    });
  }

  suggestions.sort((a, b) => b.relevance - a.relevance);
  return suggestions;
}
