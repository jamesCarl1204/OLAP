// Staff authentication service placeholder.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findByEmail, touchLastLogin } from '../models/staffModel.js';

const DUMMY_HASH = bcrypt.hashSync('dummy-password', 12);

export async function login(email, password, remember) {
  const user = await findByEmail(email.trim().toLowerCase());
  const ok = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
  if (!user || !ok || !user.is_active) return null;

  await touchLastLogin(user.id);
  const expiresIn = remember ? '7d' : '12h';
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn });

  return {
    token,
    remember: !!remember,
    user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
  };
}