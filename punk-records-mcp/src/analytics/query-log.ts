import fs from "node:fs/promises";
import path from "node:path";
import { DATA_FILES } from "../config.js";
import { ensureDir } from "../utils/files.js";
import type { QueryLogEntry } from "../types.js";

class QueryLogger {
  private buffer: string[] = [];
  private flushTimeout: ReturnType<typeof setTimeout> | null = null;

  log(entry: QueryLogEntry): void {
    this.buffer.push(JSON.stringify(entry));
    this.scheduleFlush();
  }

  private scheduleFlush(): void {
    if (this.flushTimeout !== null) return;
    this.flushTimeout = setTimeout(() => {
      this.flush()
        .catch((err: unknown) => {
          console.error("[query-log] Flush failed:", err);
        })
        .finally(() => {
          this.flushTimeout = null;
        });
    }, 2000);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    await ensureDir(path.dirname(DATA_FILES.queryLog));
    const data = this.buffer.join("\n") + "\n";
    this.buffer = [];
    await fs.appendFile(DATA_FILES.queryLog, data, "utf-8");
  }

  async getRecentEntries(limit: number = 100): Promise<QueryLogEntry[]> {
    try {
      const raw = await fs.readFile(DATA_FILES.queryLog, "utf-8");
      const lines = raw.split("\n").filter((l) => l.trim() !== "");
      return lines.slice(-limit).map((l) => JSON.parse(l) as QueryLogEntry);
    } catch {
      return [];
    }
  }

  async getTopTools(
    limit: number = 10,
  ): Promise<Array<{ tool: string; count: number }>> {
    const entries = await this.getRecentEntries(10000);
    const counts = new Map<string, number>();
    for (const entry of entries) {
      counts.set(entry.tool, (counts.get(entry.tool) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([tool, count]) => ({ tool, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async getTopQueries(
    limit: number = 10,
  ): Promise<Array<{ query: string; count: number }>> {
    const entries = await this.getRecentEntries(10000);
    const searchEntries = entries.filter((e) => e.tool === "search_memory");
    const counts = new Map<string, number>();
    for (const entry of searchEntries) {
      const query =
        typeof entry.params.query === "string" ? entry.params.query : "";
      counts.set(query, (counts.get(query) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

export const queryLogger = new QueryLogger();
