import type { Tensor } from "@huggingface/transformers";
import { SEARCH_CONFIG } from "../config.js";

type FeatureExtractionFn = (
  text: string,
  options: { pooling: string; normalize: boolean },
) => Promise<Tensor>;

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

    this.initPromise = (async () => {
      console.error(
        `Loading embedding model: ${SEARCH_CONFIG.embeddingModel}...`,
      );
      const { pipeline, env } = await import("@huggingface/transformers");
      env.cacheDir = "./.cache/models";
      const pipe = await pipeline(
        "feature-extraction",
        SEARCH_CONFIG.embeddingModel,
      );
      this.pipelineFn = pipe as unknown as FeatureExtractionFn;
      console.error("Embedding model loaded.");
    })().catch((err: unknown) => {
      this.initFailed = true;
      this.pipelineFn = null;
      console.error("Failed to load embedding model:", err);
      throw err;
    });

    return this.initPromise;
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
