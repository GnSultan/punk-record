/**
 * Punk Records Backup — Local + Cloud (Cloudflare R2)
 *
 * Backs up the entire .brain/ directory (knowledge graph, search index, query logs).
 *
 * Local: Keeps 7 most recent backups in .brain/backups/
 * Cloud: Uploads to R2 with tiered retention:
 *   - Last 24h: keep all
 *   - Last 7 days: 1 per day
 *   - Last 30 days: 1 per week
 *   - Older: delete
 *
 * Restore: Downloads from cloud if needed, validates, extracts to .brain/
 */

import { mkdirSync, readdirSync, unlinkSync, existsSync, statSync, createReadStream, createWriteStream } from 'fs';
import { join, basename } from 'path';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { DATA_ROOT } from '../config.js';

const backupsDir = join(DATA_ROOT, 'backups');

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BackupInfo {
  filename: string;
  timestamp: string;
  size: number;
  source: 'local' | 'cloud';
}

// ─── R2 Client (lazy-loaded) ────────────────────────────────────────────────

function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
  );
}

async function getR2Client() {
  const { S3Client } = await import('@aws-sdk/client-s3');
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

function getBucketName(): string {
  return process.env.R2_BUCKET_NAME || 'punk-records-backups';
}

// ─── Backup ─────────────────────────────────────────────────────────────────

/**
 * Create a timestamped backup of .brain/ directory.
 * Compresses to .tar.gz, stores locally, uploads to R2 if configured.
 */
export async function backupBrain(): Promise<string> {
  mkdirSync(backupsDir, { recursive: true });

  if (!existsSync(DATA_ROOT)) {
    console.error('[backup] .brain/ directory not found, skipping');
    return '';
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupFile = `punk-records-${timestamp}.tar.gz`;
  const backupPath = join(backupsDir, backupFile);

  // Create tar.gz of .brain/ (excluding backups/ subdirectory)
  const tar = await import('tar');
  await tar.create(
    {
      gzip: true,
      file: backupPath,
      cwd: DATA_ROOT,
      filter: (path) => !path.startsWith('backups/'),
    },
    ['.']
  );

  const stats = statSync(backupPath);
  console.error(`[backup] Created ${backupFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

  // Upload to R2 (non-blocking — local backup is the priority)
  if (isR2Configured()) {
    try {
      await uploadToR2(backupPath);
      await pruneR2Backups();
    } catch (err) {
      console.error(`[backup] R2 upload failed (local backup safe): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return backupPath;
}

/**
 * List local backups with metadata.
 */
export function listBackups(): BackupInfo[] {
  if (!existsSync(backupsDir)) return [];

  return readdirSync(backupsDir)
    .filter(f => f.startsWith('punk-records-') && f.endsWith('.tar.gz'))
    .sort()
    .reverse()
    .map(filename => {
      const filepath = join(backupsDir, filename);
      const stat = statSync(filepath);
      const ts = filename.replace('punk-records-', '').replace('.tar.gz', '').replace(/-/g, (m, i) => {
        if (i === 4 || i === 7) return '-';
        if (i === 10) return 'T';
        if (i === 13 || i === 16) return ':';
        return m;
      });
      return {
        filename,
        timestamp: ts,
        size: stat.size,
        source: 'local' as const,
      };
    });
}

/**
 * Delete old local backups, keeping the most recent N.
 */
export function pruneBackups(keep: number = 7): number {
  if (!existsSync(backupsDir)) return 0;

  const files = readdirSync(backupsDir)
    .filter(f => f.startsWith('punk-records-') && f.endsWith('.tar.gz'))
    .sort()
    .reverse();

  let deleted = 0;
  for (let i = keep; i < files.length; i++) {
    unlinkSync(join(backupsDir, files[i]));
    deleted++;
  }

  if (deleted > 0) {
    console.error(`[backup] Pruned ${deleted} old backup(s), kept ${keep}`);
  }

  return deleted;
}

// ─── R2 Cloud Operations ────────────────────────────────────────────────────

async function uploadToR2(backupPath: string): Promise<void> {
  if (!isR2Configured()) return;

  const { PutObjectCommand } = await import('@aws-sdk/client-s3');
  const client = await getR2Client();
  const filename = basename(backupPath);

  const fileStream = createReadStream(backupPath);
  const chunks: Buffer[] = [];
  for await (const chunk of fileStream) {
    chunks.push(chunk as Buffer);
  }
  const body = Buffer.concat(chunks);

  await client.send(new PutObjectCommand({
    Bucket: getBucketName(),
    Key: filename,
    Body: body,
    ContentType: 'application/gzip',
  }));

  console.error(`[backup] Uploaded ${filename} to R2`);
}

export async function listR2Backups(): Promise<BackupInfo[]> {
  if (!isR2Configured()) return [];

  try {
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    const client = await getR2Client();

    const response = await client.send(new ListObjectsV2Command({
      Bucket: getBucketName(),
      Prefix: 'punk-records-',
    }));

    if (!response.Contents) return [];

    return response.Contents
      .filter(obj => obj.Key?.endsWith('.tar.gz'))
      .map(obj => ({
        filename: obj.Key!,
        timestamp: obj.LastModified?.toISOString() || '',
        size: obj.Size || 0,
        source: 'cloud' as const,
      }))
      .sort((a, b) => b.filename.localeCompare(a.filename));
  } catch (err) {
    console.error(`[backup] Failed to list R2 backups: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
}

async function downloadFromR2(filename: string): Promise<string> {
  if (!isR2Configured()) throw new Error('R2 not configured');

  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const client = await getR2Client();

  const response = await client.send(new GetObjectCommand({
    Bucket: getBucketName(),
    Key: filename,
  }));

  if (!response.Body) throw new Error('Empty response from R2');

  mkdirSync(backupsDir, { recursive: true });
  const localPath = join(backupsDir, filename);

  const chunks: Uint8Array[] = [];
  const stream = response.Body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  const { writeFileSync } = await import('fs');
  writeFileSync(localPath, Buffer.concat(chunks));

  console.error(`[backup] Downloaded ${filename} from R2`);
  return localPath;
}

export async function pruneR2Backups(): Promise<number> {
  if (!isR2Configured()) return 0;

  const backups = await listR2Backups();
  if (backups.length === 0) return 0;

  const now = Date.now();
  const DAY = 86400000;
  const toKeep = new Set<string>();
  const dailyKept = new Map<string, string>();
  const weeklyKept = new Map<string, string>();

  for (const backup of backups) {
    const ts = new Date(backup.timestamp).getTime();
    const age = now - ts;

    if (age < DAY) {
      toKeep.add(backup.filename);
    } else if (age < 7 * DAY) {
      const dayKey = backup.timestamp.slice(0, 10);
      if (!dailyKept.has(dayKey)) {
        dailyKept.set(dayKey, backup.filename);
        toKeep.add(backup.filename);
      }
    } else if (age < 30 * DAY) {
      const date = new Date(backup.timestamp);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().slice(0, 10);
      if (!weeklyKept.has(weekKey)) {
        weeklyKept.set(weekKey, backup.filename);
        toKeep.add(backup.filename);
      }
    }
  }

  const toDelete = backups.filter(b => !toKeep.has(b.filename));
  if (toDelete.length === 0) return 0;

  const { DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
  const client = await getR2Client();

  for (let i = 0; i < toDelete.length; i += 1000) {
    const batch = toDelete.slice(i, i + 1000);
    await client.send(new DeleteObjectsCommand({
      Bucket: getBucketName(),
      Delete: {
        Objects: batch.map(b => ({ Key: b.filename })),
      },
    }));
  }

  console.error(`[backup] Pruned ${toDelete.length} old R2 backup(s), kept ${toKeep.size}`);
  return toDelete.length;
}

// ─── Restore ────────────────────────────────────────────────────────────────

export async function restoreBrain(
  filename: string,
  source: 'local' | 'cloud' = 'local'
): Promise<{ success: boolean; error?: string }> {
  if (!filename.match(/^punk-records-[\w-]+\.tar\.gz$/) || filename.includes('..')) {
    return { success: false, error: 'Invalid backup filename' };
  }

  try {
    let backupPath = join(backupsDir, filename);

    if (source === 'cloud') {
      backupPath = await downloadFromR2(filename);
    }

    if (!existsSync(backupPath)) {
      return { success: false, error: `Backup file not found: ${filename}` };
    }

    // Extract to .brain/ (overwrites existing files)
    const tar = await import('tar');
    await tar.extract({
      file: backupPath,
      cwd: DATA_ROOT,
    });

    console.error(`[backup] Restored from ${filename} (${source})`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[backup] Restore failed: ${msg}`);
    return { success: false, error: msg };
  }
}

// ─── CLI entry point ────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  backupBrain().then(path => {
    if (path) {
      console.log(`\n✓ Backup created: ${path}`);
    }
    const pruned = pruneBackups();
    if (pruned > 0) {
      console.log(`  Pruned ${pruned} old backup(s)\n`);
    }
  }).catch(err => {
    console.error('Backup failed:', err);
    process.exit(1);
  });
}
