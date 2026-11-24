export class ValidationError extends Error {}
export const bad = (message) => { throw new ValidationError(message); };

export const text = (v, max = 255) => String(v ?? '').trim().slice(0, max);
export const upper = (v, max = 255) => text(v, max).toUpperCase();

export const PHONE = /^(09|\+639)\d{9}$/;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const validDate = (d) => DATE.test(d) && !Number.isNaN(new Date(d).getTime());

// Today as YYYY-MM-DD in the server's local time.
export function localToday() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Decide the file type from its first bytes, not from what the browser claims.
export function sniff(buf) {
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buf.length > 4 && buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return { mime: 'image/png', ext: 'png' };
  if (buf.length > 4 && buf.subarray(0, 4).toString('latin1') === '%PDF') return { mime: 'application/pdf', ext: 'pdf' };
  return null;
}