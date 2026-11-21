// Staff model placeholder.
import { pool } from '../config/db.js';

export async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

export async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, role, is_active FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

export async function touchLastLogin(id) {
  await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [id]);
}