import { SEARCH_CONFIG } from "../config.js";
import type { PunkDocument } from "../types.js";

export interface Chunk {
  id: string;
  filePath: string;
  relativePath: string;
  title: string;
  domain: string;
  tags: string[];
  text: string;
  chunkIndex: number;
}

export function chunkDocument(doc: PunkDocument): Chunk[] {
  const text = doc.content;
  if (text.trim() === "") return [];

  const sections = splitByHeaders(text);
  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    if (estimateTokens(section) <= SEARCH_CONFIG.chunkSize) {
      chunks.push(makeChunk(doc, section.trim(), chunkIndex));
      chunkIndex++;
    } else {
      const subChunks = splitWithOverlap(
        section,
        SEARCH_CONFIG.chunkSize,
        SEARCH_CONFIG.chunkOverlap,
      );
      for (const sub of subChunks) {
        chunks.push(makeChunk(doc, sub.trim(), chunkIndex));
        chunkIndex++;
      }
    }
  }

  return chunks;
}

function makeChunk(doc: PunkDocument, text: string, chunkIndex: number): Chunk {
  return {
    id: `${doc.filePath}#${chunkIndex}`,
    filePath: doc.filePath,
    relativePath: doc.relativePath,
    title: doc.title,
    domain: doc.domain,
    tags: doc.tags,
    text,
    chunkIndex,
  };
}

function splitByHeaders(text: string): string[] {
  return text.split(/(?=^#{1,3}\s)/m).filter((s) => s.trim() !== "");
}

function splitWithOverlap(
  text: string,
  chunkSize: number,
  overlap: number,
): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para);
    if (currentTokens + paraTokens > chunkSize && current.length > 0) {
      chunks.push(current.join("\n\n"));
      const overlapParas: string[] = [];
      let overlapTokens = 0;
      for (let i = current.length - 1; i >= 0 && overlapTokens < overlap; i--) {
        overlapParas.unshift(current[i]);
        overlapTokens += estimateTokens(current[i]);
      }
      current = overlapParas;
      currentTokens = overlapTokens;
    }
    current.push(para);
    currentTokens += paraTokens;
  }
  if (current.length > 0) chunks.push(current.join("\n\n"));

  return chunks;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
