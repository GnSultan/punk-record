import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import path from "node:path";
import { PATHS, RECORDS_ROOT } from "../config.js";
import {
  readMarkdownFile,
  readAllMarkdownInDir,
  readMarkdownFileIfExists,
  readAllMarkdownInDirIfExists,
} from "../utils/markdown.js";
import { listSubdirectories } from "../utils/files.js";

export function registerResources(server: McpServer): void {
  server.registerResource(
    "core-identity",
    "punk://core/identity",
    {
      title: "Core Identity",
      description: "Aslam's core identity, mission, and values",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const doc = await readMarkdownFile(path.join(PATHS.core, "identity.md"));
      return {
        contents: [
          { uri: uri.href, text: doc.content, mimeType: "text/markdown" },
        ],
      };
    },
  );

  server.registerResource(
    "core-philosophy",
    "punk://core/philosophy",
    {
      title: "Philosophy",
      description: "Design and build principles",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const doc = await readMarkdownFile(
        path.join(PATHS.core, "philosophy.md"),
      );
      return {
        contents: [
          { uri: uri.href, text: doc.content, mimeType: "text/markdown" },
        ],
      };
    },
  );

  server.registerResource(
    "core-anti-patterns",
    "punk://core/anti-patterns",
    {
      title: "Anti-Patterns",
      description: "Things to avoid — design, code, strategy anti-patterns",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const doc = await readMarkdownFile(
        path.join(PATHS.core, "anti-patterns.md"),
      );
      return {
        contents: [
          { uri: uri.href, text: doc.content, mimeType: "text/markdown" },
        ],
      };
    },
  );

  server.registerResource(
    "active-current-focus",
    "punk://active/current-focus",
    {
      title: "Current Focus",
      description: "What is being worked on right now",
      mimeType: "text/markdown",
    },
    async (uri) => {
      const doc = await readMarkdownFileIfExists(
        path.join(PATHS.active, "current-focus.md"),
      );
      const text = doc !== null ? doc.content : "No current focus set.";
      return {
        contents: [{ uri: uri.href, text, mimeType: "text/markdown" }],
      };
    },
  );

  server.registerResource(
    "project-context",
    new ResourceTemplate("punk://projects/{name}/context", {
      list: async () => {
        const projects = await listSubdirectories(PATHS.projects);
        return {
          resources: projects.map((p) => ({
            uri: `punk://projects/${p}/context`,
            name: `${p} project context`,
          })),
        };
      },
    }),
    {
      title: "Project Context",
      description: "Full context for a specific project",
      mimeType: "text/markdown",
    },
    async (uri, { name }) => {
      const nameStr = String(name);
      const projectDir = path.join(PATHS.projects, nameStr);
      const docs = await readAllMarkdownInDir(projectDir);
      const combined = docs
        .map((d) => `## ${d.title}\n\n${d.content}`)
        .join("\n\n---\n\n");
      return {
        contents: [
          {
            uri: uri.href,
            text:
              combined === "" ? `Project "${nameStr}" not found.` : combined,
            mimeType: "text/markdown",
          },
        ],
      };
    },
  );

  server.registerResource(
    "patterns",
    new ResourceTemplate("punk://patterns/{domain}/{topic}", {
      list: async () => {
        const resources: Array<{ uri: string; name: string }> = [];
        for (const domain of ["code", "design", "strategy"]) {
          const domainPath = path.join(RECORDS_ROOT, "patterns", domain);
          const docs = await readAllMarkdownInDirIfExists(domainPath);
          for (const doc of docs) {
            const topic = path.basename(doc.filePath, ".md");
            resources.push({
              uri: `punk://patterns/${domain}/${topic}`,
              name: `${domain}/${topic}`,
            });
          }
        }
        return { resources };
      },
    }),
    {
      title: "Pattern",
      description: "Reusable code, design, or strategy pattern",
      mimeType: "text/markdown",
    },
    async (uri, { domain, topic }) => {
      const domainStr = String(domain);
      const topicStr = String(topic);
      const filePath = path.join(
        RECORDS_ROOT,
        "patterns",
        domainStr,
        `${topicStr}.md`,
      );
      const doc = await readMarkdownFileIfExists(filePath);
      const text =
        doc !== null
          ? doc.content
          : `Pattern "${domainStr}/${topicStr}" not found.`;
      return {
        contents: [{ uri: uri.href, text, mimeType: "text/markdown" }],
      };
    },
  );
}
