import { pool } from '../config/db.js';

export async function searchRecords(type, like) {
  const [rows] = await pool.query(
    'SELECT * FROM registry_records WHERE record_type = ? AND full_name LIKE ? ORDER BY full_name LIMIT 20',
    [type, like]);
  return rows;
}