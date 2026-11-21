import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const token = req.cookies?.olap_token;
  if (!token) return res.status(401).json({ message: 'Not signed in.' });
  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Session expired.' });
  }
}

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.auth?.role) ? next() : res.status(403).json({ message: 'Forbidden.' });