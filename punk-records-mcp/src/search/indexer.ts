import {
  create,
  insert,
  search as oramaSearch,
  removeMultiple,
  count,
} from "@orama/orama";
import type { AnyOrama } from "@orama/orama";
import { persist, restore } from "@orama/plugin-data-persistence";
import fs from "node:fs/promises";
import path from "node:path";
import { RECORDS_ROOT, DATA_FILES, SEARCH_CONFIG } from "../config.js";
import { listMarkdownFiles, ensureDir } from "../utils/files.js";
import { readMarkdownFile } from "../utils/markdown.js";
import { chunkDocument } from "./chunker.js";
import { embedder } from "./embedder.js";
import type { IndexedChunk } from "../types.js";

let db: AnyOrama | null = null;
let lastBuilt = "";
let indexBuilt = false;

const fileChunkIds = new Map<string, string[]>();

const SCHEMA = {
  id: "string",
  filePath: "string",
  relativePath: "string",
  title: "string",
  domain: "string",
  tags: "string",
  text: "string",
  embedding: `vector[${SEARCH_CONFIG.embeddingDimensions}]`,
} as const;

export async function initializeSearchIndex(): Promise<void> {
  await ensureDir(path.dirname(DATA_FILES.searchIndex));

  try {
    const serialized = await fs.readFile(DATA_FILES.searchIndex, "utf-8");
    const data = JSON.parse(serialized) as string;
    db = await restore("json", data);
    const totalChunks = count(db);
    console.error(`Search index restored from disk (${totalChunks} chunks)`);
    lastBuilt = new Date().toISOString();
    indexBuilt = totalChunks > 0;
    await rebuildChunkMap();
    return;
  } catch {
    console.error(
      "No existing search index found, will build on first search.",
    );
  }

  db = create({ schema: SCHEMA });
}

async function rebuildChunkMap(): Promise<void> {
  if (db === null) return;
  const files = await listMarkdownFiles(RECORDS_ROOT);
  for (const filePath of files) {
    const doc = await readMarkdownFile(filePath);
    const chunks = chunkDocument(doc);
    fileChunkIds.set(
      filePath,
      chunks.map((c) => c.id),
    );
  }
}

export async function buildFullIndex(): Promise<void> {
  console.error("Building search index...");
  const startTime = Date.now();

  db = create({ schema: SCHEMA });
  fileChunkIds.clear();

  const files = await listMarkdownFiles(RECORDS_ROOT);
  let totalChunks = 0;

  for (const filePath of files) {
    const doc = await readMarkdownFile(filePath);
    const chunks = chunkDocument(doc);
    const chunkIds: string[] = [];

    for (const chunk of chunks) {
      const embedding = await embedder.embed(chunk.text);
      const docId = insert(db, {
        id: chunk.id,
        filePath: chunk.filePath,
        relativePath: chunk.relativePath,
        title: chunk.title,
        domain: chunk.domain,
        tags: chunk.tags.join(", "),
        text: chunk.text,
        embedding,
      });
      chunkIds.push(docId as string);
      totalChunks++;
    }

    fileChunkIds.set(filePath, chunkIds);
  }

  lastBuilt = new Date().toISOString();
  console.error(
    `Search index built: ${totalChunks} chunks from ${files.length} files in ${Date.now() - startTime}ms`,
  );

  await persistIndex();
}

export async function persistIndex(): Promise<void> {
  if (db === null) return;
  try {
    const serialized = persist(db, "json");
    await fs.writeFile(
      DATA_FILES.searchIndex,
      JSON.stringify(serialized),
      "utf-8",
    );
  } catch (err) {
    console.error("Failed to persist search index:", err);
  }
}

export async function indexFile(filePath: string): Promise<void> {
  if (db === null) {
    console.error(
      `[indexer] Skipping indexFile for ${filePath} — index not initialized`,
    );
    return;
  }

  await removeFileFromIndex(filePath);

  const doc = await readMarkdownFile(filePath);
  const chunks = chunkDocument(doc);
  const chunkIds: string[] = [];

  for (const chunk of chunks) {
    const embedding = await embedder.embed(chunk.text);
    const docId = insert(db, {
      id: chunk.id,
      filePath: chunk.filePath,
      relativePath: chunk.relativePath,
      title: chunk.title,
      domain: chunk.domain,
      tags: chunk.tags.join(", "),
      text: chunk.text,
      embedding,
    });
    chunkIds.push(docId as string);
  }

  fileChunkIds.set(filePath, chunkIds);
}

export async function removeFileFromIndex(filePath: string): Promise<void> {
  if (db === null) return;
  const ids = fileChunkIds.get(filePath);
  if (ids !== undefined && ids.length > 0) {
    try {
      await removeMultiple(db, ids);
    } catch (err) {
      console.error(`[indexer] Failed to remove chunks for ${filePath}:`, err);
    }
    fileChunkIds.delete(filePath);
  }
}

export interface SearchHit {
  id: string;
  text: string;
  filePath: string;
  relativePath: string;
  title: string;
  domain: string;
  score: number;
}

export async function hybridSearch(
  query: string,
  options?: { domain?: string; limit?: number },
): Promise<SearchHit[]> {
  if (db === null) throw new Error("Search index not initialized");

  if (!indexBuilt) {
    const totalChunks = count(db);
    if (totalChunks === 0) {
      await buildFullIndex();
    }
    indexBuilt = true;
  }

  const queryEmbedding = await embedder.embed(query);
  const limit = options?.limit ?? SEARCH_CONFIG.maxResults;

  const results = await oramaSearch(db, {
    mode: "hybrid",
    term: query,
    vector: {
      value: queryEmbedding,
      property: "embedding",
    },
    similarity: SEARCH_CONFIG.minSimilarity,
    limit,
    ...(options?.domain !== undefined && options.domain !== ""
      ? { where: { domain: options.domain } }
      : {}),
  });

  return results.hits.map((hit) => {
    const doc = hit.document as unknown as IndexedChunk;
    return {
      id: doc.id,
      text: doc.text,
      filePath: doc.filePath,
      relativePath: doc.relativePath,
      title: doc.title,
      domain: doc.domain,
      score: hit.score,
    };
  });
}

export function getIndexStats(): { totalChunks: number; lastRebuilt: string } {
  return {
    totalChunks: db !== null ? count(db) : 0,
    lastRebuilt: lastBuilt,
  };
}
