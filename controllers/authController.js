import * as auth from '../services/authService.js';
import { findById } from '../models/staffModel.js';

const COOKIE = 'olap_token';
const cookieOpts = (remember) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  ...(remember ? { maxAge: 7 * 24 * 60 * 60 * 1000 } : {}), 
});

export async function login(req, res) {
  const { email, password, remember } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Enter your email and password.' });

  const result = await auth.login(String(email), String(password), remember);
  if (!result) return res.status(401).json({ message: 'Invalid email or password.' });

  res.cookie(COOKIE, result.token, cookieOpts(result.remember));
  res.json({ user: result.user });
}

export function logout(_req, res) {
  res.clearCookie(COOKIE, { ...cookieOpts(false) });
  res.json({ ok: true });
}

export async function me(req, res) {
  const user = await findById(req.auth.sub);
  if (!user || !user.is_active) return res.status(401).json({ message: 'Session expired.' });
  res.json({ user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role } });
}