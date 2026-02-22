import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { RECORDS_ROOT } from "../config.js";
import type { PunkDocument } from "../types.js";
import { listMarkdownFiles } from "./files.js";

export async function readMarkdownFile(
  filePath: string,
): Promise<PunkDocument> {
  const rawContent = await fs.readFile(filePath, "utf-8");
  const { data, content } = matter(rawContent);

  const title =
    typeof data.title === "string"
      ? data.title
      : path.basename(filePath, ".md");
  const domain =
    typeof data.domain === "string" ? data.domain : inferDomain(filePath);
  const tags = Array.isArray(data.tags) ? (data.tags as string[]) : [];
  const created = typeof data.created === "string" ? data.created : "";
  const updated = typeof data.updated === "string" ? data.updated : "";

  return {
    filePath,
    relativePath: path.relative(RECORDS_ROOT, filePath),
    title,
    domain,
    tags,
    content: content.trim(),
    rawContent,
    frontmatter: data as Record<string, unknown>,
    created,
    updated,
  };
}

export async function readAllMarkdownInDir(
  dirPath: string,
): Promise<PunkDocument[]> {
  const files = await listMarkdownFiles(dirPath);
  return Promise.all(files.map((f) => readMarkdownFile(f)));
}

export async function appendToMarkdownFile(
  filePath: string,
  section: string,
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  let existing: string;
  try {
    existing = await fs.readFile(filePath, "utf-8");
  } catch {
    const basename = path.basename(filePath, ".md");
    existing = `---\ntitle: "${basename}"\ncreated: "${new Date().toISOString().split("T")[0]}"\nupdated: "${new Date().toISOString().split("T")[0]}"\n---\n\n# ${basename}\n`;
  }

  const today = new Date().toISOString().split("T")[0];
  const updated = existing.replace(/updated: ".*?"/, `updated: "${today}"`);
  const final = updated.trimEnd() + "\n\n" + section + "\n";
  await fs.writeFile(filePath, final, "utf-8");
}

export async function readAllMarkdownInDirIfExists(
  dirPath: string,
): Promise<PunkDocument[]> {
  try {
    return await readAllMarkdownInDir(dirPath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function readMarkdownFileIfExists(
  filePath: string,
): Promise<PunkDocument | null> {
  try {
    return await readMarkdownFile(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

function inferDomain(filePath: string): string {
  const rel = path.relative(RECORDS_ROOT, filePath);
  const firstSegment = rel.split(path.sep)[0];
  return firstSegment;
}
