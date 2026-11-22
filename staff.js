import bcrypt from 'bcryptjs';
import { pool } from './config/db.js';

const [name, email, password, role = 'staff'] = process.argv.slice(2);
if (!name || !email || !password) { console.log('Usage: node scripts/createUser.js "Full Name" email password [role]'); process.exit(1); }

const hash = await bcrypt.hash(password, 12);
await pool.query('INSERT INTO users (full_name, email, password_hash, role) VALUES (?,?,?,?)', [name, email.toLowerCase(), hash, role]);
console.log('Created', email);
process.exit(0);