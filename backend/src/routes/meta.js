import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/skills', async (_req, res, next) => {
  try {
    const skills = await prisma.skill.findMany({ orderBy: { name: 'asc' } });
    return res.json({ skills });
  } catch (err) {
    next(err);
  }
});

router.get('/roles', async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        requirements: {
          include: { skill: { select: { id: true, name: true } } },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { id: 'asc' },
    });
    return res.json({ roles });
  } catch (err) {
    next(err);
  }
});

export default router;
