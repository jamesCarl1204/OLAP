import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PROOF_DIR } from '../config/uploads.js';

// Saves an uploaded file under uploads/<subdir>/ and returns the row data for the `files` table.
export async function storeFile(file, type, subdir) {
  await fs.mkdir(path.join(PROOF_DIR, subdir), { recursive: true });
  const storageKey = `${subdir}/${crypto.randomUUID()}.${type.ext}`;
  await fs.writeFile(path.join(PROOF_DIR, storageKey), file.buffer, { flag: 'wx' });
  return {
    storage_key: storageKey,
    original_name: path.basename(file.originalname || 'file').slice(0, 255),
    mime_type: type.mime,
    size_bytes: file.size,
    sha256: crypto.createHash('sha256').update(file.buffer).digest('hex'),
  };
}

// Used when the DB insert fails, so no orphan files are left behind.
export async function removeStored(records) {
  await Promise.all(records.map((r) => fs.unlink(path.join(PROOF_DIR, r.storage_key)).catch(() => {})));
}