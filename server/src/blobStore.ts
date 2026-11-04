import fs from 'node:fs';
import path from 'node:path';

const BLOB_PATH = 'mcwhorezone/app.db';

export type BlobRestore = 'restored' | 'missing' | 'disabled';

function blobToken(): string | undefined {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return token || undefined;
}

function isMissingBlob(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = (error as { name?: string }).name ?? '';
  const message = (error as { message?: string }).message ?? '';
  return name === 'BlobNotFoundError' || /not found/i.test(message);
}

/** Pull the SQLite file from a private Vercel Blob when a store is connected. */
export async function downloadDatabase(dbPath: string): Promise<BlobRestore> {
  const token = blobToken();
  if (!token) return 'disabled';
  try {
    const { get } = await import('@vercel/blob');
    const result = await get(BLOB_PATH, { access: 'private', token, useCache: false });
    if (!result) return 'missing';
    if (!result.stream) {
      throw new Error('Blog database download returned no data');
    }
    const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, bytes);
    return 'restored';
  } catch (error) {
    if (isMissingBlob(error)) return 'missing';
    throw error;
  }
}

/** Save the SQLite file to the private Vercel Blob. No-ops without a token. */
export async function uploadDatabase(dbPath: string): Promise<void> {
  const token = blobToken();
  if (!token || !fs.existsSync(dbPath)) return;
  const { put } = await import('@vercel/blob');
  await put(BLOB_PATH, fs.readFileSync(dbPath), {
    access: 'private',
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/vnd.sqlite3',
  });
}
