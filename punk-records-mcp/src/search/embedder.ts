import fs from "node:fs";
import path from "node:path";
import type { Tensor } from "@huggingface/transformers";
import { SEARCH_CONFIG } from "../config.js";

type FeatureExtractionFn = (
  text: string,
  options: { pooling: string; normalize: boolean },
) => Promise<Tensor>;

const MODEL_CACHE_DIR = "./.cache/models";
const MAX_LOAD_ATTEMPTS = 2;

/**
 * Validate that a cached ONNX model file is complete by checking that the
 * file size is consistent with its protobuf-encoded length fields.
 * A truncated download will have a declared graph length larger than the file.
 */
function validateOnnxFile(filePath: string): boolean {
  try {
    const stat = fs.statSync(filePath);
    const fd = fs.openSync(filePath, "r");
    const header = Buffer.alloc(32);
    fs.readSync(fd, header, 0, 32, 0);
    fs.closeSync(fd);

    // Walk top-level protobuf fields to find the graph (field 7, wire type 2).
    // If the declared length of any length-delimited field exceeds the file
    // size, the file is truncated.
    let pos = 0;
    while (pos < header.length - 1) {
      const byte = header[pos];
      const wireType = byte & 0x07;
      if (wireType === 0) {
        // varint — skip value bytes
        pos++;
        while (pos < header.length && (header[pos] & 0x80) !== 0) pos++;
        pos++;
      } else if (wireType === 2) {
        // length-delimited — decode the length varint
        pos++;
        let len = 0;
        let shift = 0;
        while (pos < header.length) {
          len |= (header[pos] & 0x7f) << shift;
          shift += 7;
          if ((header[pos] & 0x80) === 0) {
            pos++;
            break;
          }
          pos++;
        }
        if (pos + len > stat.size) {
          return false; // file is truncated
        }
        pos += len;
        // For very large fields (like the graph), pos will exceed the header
        // buffer — that's fine, we've already validated the length fits.
        if (pos > header.length) break;
      } else {
        break; // unknown wire type — stop parsing
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove truncated ONNX model files from all known cache locations.
 */
function cleanCorruptedCache(modelName: string): void {
  const slug = modelName.replace("/", path.sep);
  const locations = [
    path.join(MODEL_CACHE_DIR, slug, "onnx"),
    path.join(
      "node_modules",
      "@huggingface",
      "transformers",
      ".cache",
      slug,
      "onnx",
    ),
  ];

  for (const dir of locations) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.endsWith(".onnx")) {
          const filePath = path.join(dir, file);
          if (!validateOnnxFile(filePath)) {
            console.error(`Removing truncated model file: ${filePath}`);
            fs.unlinkSync(filePath);
          }
        }
      }
    } catch {
      // directory doesn't exist — nothing to clean
    }
  }
}

class EmbeddingService {
  private static instance: EmbeddingService | null = null;
  private pipelineFn: FeatureExtractionFn | null = null;
  private initPromise: Promise<void> | null = null;
  private initFailed = false;

  static getInstance(): EmbeddingService {
    EmbeddingService.instance ??= new EmbeddingService();
    return EmbeddingService.instance;
  }

  async initialize(): Promise<void> {
    if (this.pipelineFn !== null) return;

    if (this.initFailed) {
      this.initPromise = null;
      this.initFailed = false;
    }

    if (this.initPromise !== null) return this.initPromise;

    this.initPromise = this.loadWithRetry();
    return this.initPromise;
  }

  private async loadWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= MAX_LOAD_ATTEMPTS; attempt++) {
      try {
        console.error(
          `Loading embedding model: ${SEARCH_CONFIG.embeddingModel}...`,
        );
        const { pipeline, env } = await import("@huggingface/transformers");
        env.cacheDir = MODEL_CACHE_DIR;
        const pipe = await pipeline(
          "feature-extraction",
          SEARCH_CONFIG.embeddingModel,
          { dtype: "q8" },
        );
        this.pipelineFn = pipe as unknown as FeatureExtractionFn;
        console.error("Embedding model loaded.");
        return;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const isTruncated = message.includes("Protobuf parsing failed");

        if (isTruncated && attempt < MAX_LOAD_ATTEMPTS) {
          console.error(
            `Model file appears truncated (attempt ${attempt}/${MAX_LOAD_ATTEMPTS}). Cleaning cache and retrying...`,
          );
          cleanCorruptedCache(SEARCH_CONFIG.embeddingModel);
          continue;
        }

        this.initFailed = true;
        this.pipelineFn = null;
        console.error("Failed to load embedding model:", err);
        throw err;
      }
    }
  }

  async embed(text: string): Promise<number[]> {
    await this.initialize();
    if (this.pipelineFn === null) {
      throw new Error("Embedding model failed to initialize");
    }
    const output = await this.pipelineFn(text, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(output.data as Float32Array);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}

export const embedder = EmbeddingService.getInstance();
