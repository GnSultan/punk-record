import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";
import { initializeSearchIndex } from "./search/indexer.js";
import { startFileWatcher } from "./resources/watcher.js";

async function main(): Promise<void> {
  const server = createServer();

  await initializeSearchIndex();

  startFileWatcher();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("Punk Records MCP Server running on stdio");
}

main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
