import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authRequired, signToken } from '../middleware/auth.js';

const router = Router();

const publicUser = (user, hasProfile) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  hasProfile,
});

async function hasProfileFor(user) {
  if (user.role === 'STUDENT') {
    return Boolean(await prisma.studentProfile.findUnique({ where: { userId: user.id } }));
  }
  if (user.role === 'FACULTY') {
    return Boolean(await prisma.facultyProfile.findUnique({ where: { userId: user.id } }));
  }
  if (user.role === 'RECRUITER') {
    return Boolean(await prisma.recruiterProfile.findUnique({ where: { userId: user.id } }));
  }
  return false;
}

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: z.enum(['STUDENT', 'FACULTY', 'RECRUITER']),
});

router.post('/signup', async (req, res, next) => {
  try {
    const body = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email.toLowerCase(),
        passwordHash,
        role: body.role,
      },
    });
    return res.status(201).json({ token: signToken(user), user: publicUser(user, false) });
  } catch (err) {
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/login', async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    const hasProfile = await hasProfileFor(user);
    return res.json({ token: signToken(user), user: publicUser(user, hasProfile) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const hasProfile = await hasProfileFor(user);
    return res.json({ user: publicUser(user, hasProfile) });
  } catch (err) {
    next(err);
  }
});

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
});

router.patch('/me', authRequired, async (req, res, next) => {
  try {
    const body = profileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: body.name },
    });
    const hasProfile = await hasProfileFor(user);
    return res.json({ user: publicUser(user, hasProfile) });
  } catch (err) {
    next(err);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

router.post('/change-password', authRequired, async (req, res, next) => {
  try {
    const body = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!(await bcrypt.compare(body.currentPassword, user.passwordHash))) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    const passwordHash = await bcrypt.hash(body.newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
