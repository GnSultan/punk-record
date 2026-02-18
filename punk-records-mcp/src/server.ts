import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SERVER_INFO } from "./config.js";
import { registerIdentityTools } from "./tools/identity.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerPatternTools } from "./tools/patterns.js";
import { registerContextTools } from "./tools/context.js";
import { registerFocusTools } from "./tools/focus.js";
import { registerLoggingTools } from "./tools/logging.js";
import { registerSearchTools } from "./tools/search.js";
import { registerIntelligenceTools } from "./tools/intelligence.js";
import { registerGraphTools } from "./tools/graph.js";
import { registerEvolutionTools } from "./tools/evolution.js";
import { registerTensionTools } from "./tools/tensions.js";
import { registerSessionTools } from "./tools/sessions.js";
import { registerInferenceTools as registerInferenceEngineTools } from "./tools/inference.js";
import { registerTraversalTools } from "./tools/traversal.js";
import { registerReflectionTools } from "./tools/reflection.js";
import { registerResources } from "./resources/registry.js";
import { registerPrompts } from "./prompts/templates.js";

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
    },
    {
      capabilities: {
        resources: {
          subscribe: true,
          listChanged: true,
        },
      },
    },
  );

  // Phase 1: Core read tools
  registerIdentityTools(server);
  registerProjectTools(server);
  registerPatternTools(server);
  registerContextTools(server);
  registerFocusTools(server);
  registerLoggingTools(server);

  // Phase 2: Search
  registerSearchTools(server);

  // Phase 3: Knowledge graph
  registerGraphTools(server);

  // Phase 4: Intelligence
  registerIntelligenceTools(server);

  // Phase 5: Evolution
  registerEvolutionTools(server);

  // Phase 6: Tensions
  registerTensionTools(server);

  // Phase 7: Sessions
  registerSessionTools(server);

  // Phase 8: Inference
  registerInferenceEngineTools(server);

  // Phase 9: Creative Traversal
  registerTraversalTools(server);

  // Phase 10: Reflection
  registerReflectionTools(server);

  // Resources and prompts
  registerResources(server);
  registerPrompts(server);

  return server;
}
