import { pool } from '../config/db.js';

export async function findFile(id) {
  const [[f]] = await pool.query(
    'SELECT storage_key, mime_type, original_name FROM files WHERE id = ? LIMIT 1', [id]);
  return f || null;
}