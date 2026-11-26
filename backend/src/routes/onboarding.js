import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

const roleNamesSchema = z
  .array(z.string().trim().min(1))
  .max(3, 'Select up to 3 target roles')
  .default([]);

const studentSchema = z.object({
  institute: z.string().trim().min(2, 'Institute name is required').max(200),
  branch: z.string().trim().min(1, 'Branch is required').max(100),
  year: z.string().trim().min(1, 'Year is required').max(20),
  targetRoles: roleNamesSchema,
});

router.post('/student', authRequired, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const body = studentSchema.parse(req.body);
    const existing = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
    if (existing) {
      return res.status(409).json({ message: 'Student profile already exists.' });
    }
    await prisma.studentProfile.create({
      data: {
        userId: req.user.id,
        institute: body.institute,
        branch: body.branch,
        year: body.year,
        targetRoles: JSON.stringify(body.targetRoles),
      },
    });
    return res.status(201).json({ message: 'Profile created.', redirect: '/student/dashboard' });
  } catch (err) {
    next(err);
  }
});

const facultySchema = z.object({
  institute: z.string().trim().min(2, 'Institute name is required').max(200),
  department: z.string().trim().min(1, 'Department is required').max(100),
  designation: z.string().trim().min(1, 'Designation is required').max(100),
});

router.post('/faculty', authRequired, requireRole('FACULTY'), async (req, res, next) => {
  try {
    const body = facultySchema.parse(req.body);
    const existing = await prisma.facultyProfile.findUnique({ where: { userId: req.user.id } });
    if (existing) {
      return res.status(409).json({ message: 'Faculty profile already exists.' });
    }
    await prisma.facultyProfile.create({
      data: {
        userId: req.user.id,
        institute: body.institute,
        department: body.department,
        designation: body.designation,
      },
    });
    return res.status(201).json({ message: 'Profile created.', redirect: '/faculty/dashboard' });
  } catch (err) {
    next(err);
  }
});

const recruiterSchema = z.object({
  company: z.string().trim().min(2, 'Company name is required').max(200),
  designation: z.string().trim().min(1, 'Designation is required').max(100),
  companyWebsite: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
});

router.post('/recruiter', authRequired, requireRole('RECRUITER'), async (req, res, next) => {
  try {
    const body = recruiterSchema.parse(req.body);
    const existing = await prisma.recruiterProfile.findUnique({ where: { userId: req.user.id } });
    if (existing) {
      return res.status(409).json({ message: 'Recruiter profile already exists.' });
    }
    await prisma.recruiterProfile.create({
      data: {
        userId: req.user.id,
        company: body.company,
        designation: body.designation,
        companyWebsite: body.companyWebsite || null,
      },
    });
    return res.status(201).json({ message: 'Profile created.', redirect: '/recruiter/dashboard' });
  } catch (err) {
    next(err);
  }
});

export default router;
