import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'aptivelle-dev-secret';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ message: 'Account no longer exists. Please log in again.' });
    }
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this resource.' });
    }
    next();
  };
}

/** Resolves the authenticated user's profile row for the matching role model. */
export async function loadProfile(req, model) {
  const where = { userId: req.user.id };
  const profile = await prisma[model].findUnique({ where });
  if (!profile) {
    const err = new Error('Please complete onboarding to continue.');
    err.status = 409;
    err.code = 'PROFILE_REQUIRED';
    throw err;
  }
  return profile;
}
