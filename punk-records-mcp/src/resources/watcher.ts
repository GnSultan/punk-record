import chokidar, { type FSWatcher } from "chokidar";
import { RECORDS_ROOT } from "../config.js";
import {
  indexFile,
  removeFileFromIndex,
  persistIndex,
} from "../search/indexer.js";

let watcher: FSWatcher | null = null;
let persistTimeout: ReturnType<typeof setTimeout> | null = null;

export function startFileWatcher(): void {
  watcher = chokidar.watch(`${RECORDS_ROOT}/**/*.md`, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  });

  watcher.on("add", (filePath: string) => {
    console.error(`[watcher] File added: ${filePath}`);
    indexFile(filePath)
      .then(() => {
        debouncedPersist();
      })
      .catch((err: unknown) => {
        console.error(`[watcher] Failed to index added file: ${String(err)}`);
      });
  });

  watcher.on("change", (filePath: string) => {
    console.error(`[watcher] File changed: ${filePath}`);
    removeFileFromIndex(filePath)
      .then(() => indexFile(filePath))
      .then(() => {
        debouncedPersist();
      })
      .catch((err: unknown) => {
        console.error(
          `[watcher] Failed to re-index changed file: ${String(err)}`,
        );
      });
  });

  watcher.on("unlink", (filePath: string) => {
    console.error(`[watcher] File removed: ${filePath}`);
    removeFileFromIndex(filePath)
      .then(() => {
        debouncedPersist();
      })
      .catch((err: unknown) => {
        console.error(
          `[watcher] Failed to remove file from index: ${String(err)}`,
        );
      });
  });

  console.error(`[watcher] File watcher started on ${RECORDS_ROOT}`);
}

function debouncedPersist(): void {
  if (persistTimeout !== null) clearTimeout(persistTimeout);
  persistTimeout = setTimeout(() => {
    persistIndex()
      .then(() => {
        console.error("[watcher] Search index persisted to disk");
      })
      .catch((err: unknown) => {
        console.error("[watcher] Failed to persist index:", err);
      });
  }, 5000);
}

export function stopFileWatcher(): void {
  void watcher?.close();
}
