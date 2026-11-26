import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authRequired, requireRole, loadProfile } from '../middleware/auth.js';
import {
  gapForRole,
  internshipMatch,
  parseJsonList,
} from '../lib/match.js';

const router = Router();
router.use(authRequired, requireRole('STUDENT'));

// ---------- helpers ----------

async function skillRows(studentProfileId) {
  const rows = await prisma.studentSkill.findMany({
    where: { studentProfileId },
    include: { skill: true },
    orderBy: { id: 'asc' },
  });
  return rows.map((r) => ({
    id: r.id,
    skillId: r.skillId,
    name: r.skill.name,
    category: r.skill.category,
    proficiency: r.proficiency,
    source: r.source,
    isVerified: r.isVerified,
  }));
}

async function ensureSkillTagged(studentProfileId, skillName, source, isVerified = false) {
  const skill = await prisma.skill.findUnique({ where: { name: skillName } });
  if (!skill) return null;
  const existing = await prisma.studentSkill.findUnique({
    where: {
      studentProfileId_skillId: { studentProfileId, skillId: skill.id },
    },
  });
  if (!existing) {
    await prisma.studentSkill.create({
      data: { studentProfileId, skillId: skill.id, proficiency: 'BEGINNER', source, isVerified },
    });
  }
  return skill;
}

// ---------- profile ----------

router.get('/profile', async (req, res, next) => {
  try {
    const profile = await loadProfile(req, 'studentProfile');
    const [skills, projects, courses, skillOptions] = await Promise.all([
      skillRows(profile.id),
      prisma.project.findMany({ where: { studentProfileId: profile.id }, orderBy: { id: 'desc' } }),
      prisma.course.findMany({ where: { studentProfileId: profile.id }, orderBy: { id: 'desc' } }),
      prisma.skill.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, category: true } }),
    ]);
    return res.json({
      profile: {
        id: profile.id,
        name: req.user.name,
        email: req.user.email,
        institute: profile.institute,
        branch: profile.branch,
        year: profile.year,
        targetRoles: parseJsonList(profile.targetRoles),
        resumeText: profile.resumeText,
        skillOptions,
      },
      skills,
      projects: projects.map((p) => ({ ...p, skillsUsed: parseJsonList(p.skillsUsed) })),
      courses: courses.map((c) => ({
        ...c,
        skillNames: parseJsonList(c.skillNames),
        verifiedAt: c.verifiedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  institute: z.string().trim().min(2).max(200).optional(),
  branch: z.string().trim().min(1).max(100).optional(),
  year: z.string().trim().min(1).max(20).optional(),
  resumeText: z.string().max(20000).optional(),
  targetRoles: z.array(z.string().trim().min(1)).max(3).optional(),
});

router.put('/profile', async (req, res, next) => {
  try {
    const body = profileUpdateSchema.parse(req.body);
    const profile = await loadProfile(req, 'studentProfile');
    const data = {};
    if (body.institute !== undefined) data.institute = body.institute;
    if (body.branch !== undefined) data.branch = body.branch;
    if (body.year !== undefined) data.year = body.year;
    if (body.resumeText !== undefined) data.resumeText = body.resumeText;
    if (body.targetRoles !== undefined) data.targetRoles = JSON.stringify(body.targetRoles);
    await prisma.studentProfile.update({ where: { id: profile.id }, data });
    if (body.name) {
      await prisma.user.update({ where: { id: req.user.id }, data: { name: body.name } });
    }
    return res.json({ message: 'Profile saved.' });
  } catch (err) {
    next(err);
  }
});

// ---------- skills ----------

router.post('/skills/extract', async (req, res, next) => {
  try {
    const body = z.object({ text: z.string().max(20000) }).parse(req.body);
    const text = body.text || '';
    const skills = await prisma.skill.findMany();
    const profile = await loadProfile(req, 'studentProfile');
    const owned = new Set((await skillRows(profile.id)).map((s) => s.name.toLowerCase()));

    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = skills
      .map((skill) => {
        const re = new RegExp(`\\b${esc(skill.name)}\\b`, 'gi');
        const count = (text.match(re) || []).length;
        if (!count) return null;
        const suggestedProficiency =
          count >= 3 ? 'ADVANCED' : count === 2 ? 'INTERMEDIATE' : 'BEGINNER';
        return {
          skillId: skill.id,
          name: skill.name,
          category: skill.category,
          count,
          suggestedProficiency,
          owned: owned.has(skill.name.toLowerCase()),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.count - a.count);
    return res.json({ matches });
  } catch (err) {
    next(err);
  }
});

const addSkillSchema = z.object({
  skillId: z.coerce.number().int().positive(),
  proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  source: z.enum(['RESUME', 'PROJECT', 'COURSE', 'MANUAL']).default('MANUAL'),
});

router.post('/skills', async (req, res, next) => {
  try {
    const body = addSkillSchema.parse(req.body);
    const profile = await loadProfile(req, 'studentProfile');
    const existing = await prisma.studentSkill.findUnique({
      where: { studentProfileId_skillId: { studentProfileId: profile.id, skillId: body.skillId } },
    });
    if (existing) {
      await prisma.studentSkill.update({
        where: { id: existing.id },
        data: { proficiency: body.proficiency },
      });
      return res.json({ message: 'Skill updated.', skill: existing });
    }
    const skill = await prisma.studentSkill.create({
      data: {
        studentProfileId: profile.id,
        skillId: body.skillId,
        proficiency: body.proficiency,
        source: body.source,
      },
      include: { skill: true },
    });
    return res.status(201).json({
      message: 'Skill added.',
      skill: { id: skill.id, name: skill.skill.name, category: skill.skill.category, proficiency: skill.proficiency, source: skill.source, isVerified: skill.isVerified },
    });
  } catch (err) {
    next(err);
  }
});

const patchSkillSchema = z.object({
  proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
});

router.patch('/skills/:id', async (req, res, next) => {
  try {
    const body = patchSkillSchema.parse(req.body);
    const profile = await loadProfile(req, 'studentProfile');
    const skillRow = await prisma.studentSkill.findFirst({
      where: { id: Number(req.params.id), studentProfileId: profile.id },
    });
    if (!skillRow) return res.status(404).json({ message: 'Skill not found.' });
    const updated = await prisma.studentSkill.update({
      where: { id: skillRow.id },
      data: { proficiency: body.proficiency },
    });
    return res.json({ message: 'Skill updated.', proficiency: updated.proficiency });
  } catch (err) {
    next(err);
  }
});

router.delete('/skills/:id', async (req, res, next) => {
  try {
    const profile = await loadProfile(req, 'studentProfile');
    const skillRow = await prisma.studentSkill.findFirst({
      where: { id: Number(req.params.id), studentProfileId: profile.id },
    });
    if (!skillRow) return res.status(404).json({ message: 'Skill not found.' });
    await prisma.studentSkill.delete({ where: { id: skillRow.id } });
    return res.json({ message: 'Skill removed.' });
  } catch (err) {
    next(err);
  }
});

// ---------- projects ----------

const projectSchema = z.object({
  title: z.string().trim().min(2, 'Project title is required').max(200),
  description: z.string().max(5000).default(''),
  link: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
  skillsUsed: z.array(z.string().trim().min(1)).default([]),
});

router.post('/projects', async (req, res, next) => {
  try {
    const body = projectSchema.parse(req.body);
    const profile = await loadProfile(req, 'studentProfile');
    const project = await prisma.project.create({
      data: {
        studentProfileId: profile.id,
        title: body.title,
        description: body.description,
        link: body.link || null,
        skillsUsed: JSON.stringify(body.skillsUsed),
      },
    });
    for (const skillName of body.skillsUsed) {
      await ensureSkillTagged(profile.id, skillName, 'PROJECT');
    }
    return res.status(201).json({ message: 'Project added.', project });
  } catch (err) {
    next(err);
  }
});

router.put('/projects/:id', async (req, res, next) => {
  try {
    const body = projectSchema.parse(req.body);
    const profile = await loadProfile(req, 'studentProfile');
    const project = await prisma.project.findFirst({
      where: { id: Number(req.params.id), studentProfileId: profile.id },
    });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        title: body.title,
        description: body.description,
        link: body.link || null,
        skillsUsed: JSON.stringify(body.skillsUsed),
      },
    });
    for (const skillName of body.skillsUsed) {
      await ensureSkillTagged(profile.id, skillName, 'PROJECT');
    }
    return res.json({ message: 'Project updated.', project: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/projects/:id', async (req, res, next) => {
  try {
    const profile = await loadProfile(req, 'studentProfile');
    const project = await prisma.project.findFirst({
      where: { id: Number(req.params.id), studentProfileId: profile.id },
    });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    await prisma.project.delete({ where: { id: project.id } });
    return res.json({ message: 'Project removed.' });
  } catch (err) {
    next(err);
  }
});

// ---------- courses / certifications ----------

const courseSchema = z.object({
  title: z.string().trim().min(2, 'Course title is required').max(200),
  provider: z.string().trim().max(200).default(''),
  link: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
  certificateLink: z.string().trim().url('Enter a valid URL').optional().or(z.literal('')),
  skillNames: z.array(z.string().trim().min(1)).default([]),
});

router.post('/courses', async (req, res, next) => {
  try {
    const body = courseSchema.parse(req.body);
    const profile = await loadProfile(req, 'studentProfile');
    const course = await prisma.course.create({
      data: {
        studentProfileId: profile.id,
        title: body.title,
        provider: body.provider,
        link: body.link || null,
        certificateLink: body.certificateLink || null,
        skillNames: JSON.stringify(body.skillNames),
      },
    });
    for (const skillName of body.skillNames) {
      await ensureSkillTagged(profile.id, skillName, 'COURSE');
    }
    return res.status(201).json({ message: 'Course added. It is now pending faculty verification.', course });
  } catch (err) {
    next(err);
  }
});

router.put('/courses/:id', async (req, res, next) => {
  try {
    const body = courseSchema.parse(req.body);
    const profile = await loadProfile(req, 'studentProfile');
    const course = await prisma.course.findFirst({
      where: { id: Number(req.params.id), studentProfileId: profile.id },
    });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (course.verificationStatus === 'VERIFIED') {
      return res.status(400).json({ message: 'A verified course can no longer be edited.' });
    }
    const updated = await prisma.course.update({
      where: { id: course.id },
      data: {
        title: body.title,
        provider: body.provider,
        link: body.link || null,
        certificateLink: body.certificateLink || null,
        skillNames: JSON.stringify(body.skillNames),
      },
    });
    for (const skillName of body.skillNames) {
      await ensureSkillTagged(profile.id, skillName, 'COURSE');
    }
    return res.json({ message: 'Course updated.', course: updated });
  } catch (err) {
    next(err);
  }
});

router.delete('/courses/:id', async (req, res, next) => {
  try {
    const profile = await loadProfile(req, 'studentProfile');
    const course = await prisma.course.findFirst({
      where: { id: Number(req.params.id), studentProfileId: profile.id },
    });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    await prisma.course.delete({ where: { id: course.id } });
    return res.json({ message: 'Course removed.' });
  } catch (err) {
    next(err);
  }
});

// ---------- skill gap ----------

router.get('/skill-gap', async (req, res, next) => {
  try {
    const roleId = Number(req.query.roleId);
    if (!roleId) {
      return res.status(400).json({ message: 'Select a target role to analyse.' });
    }
    const profile = await loadProfile(req, 'studentProfile');
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { requirements: { include: { skill: true } } },
    });
    if (!role) return res.status(404).json({ message: 'Role not found.' });

    const skills = await skillRows(profile.id);
    const gap = gapForRole(skills, role.requirements);

    // Recommendations for the gaps (missing + weak), enriched from DB rows.
    const gapSkills = [...gap.missing, ...gap.weak];
    const rows = await prisma.recommendation.findMany({
      where: { skill: { name: { in: gapSkills.map((g) => g.name) } } },
      include: { skill: true },
    });
    const genericBySkill = (name) => ({
      type: 'COURSE',
      title: `Build depth in ${name}`,
      provider: 'Coursera',
      description: `Structured course and practice to reach the required level of ${name}.`,
      link: 'https://www.coursera.org',
      generic: true,
    });

    const recommendations = gapSkills.map((g) => {
      const list = rows.filter((r) => r.skill.name.toLowerCase() === g.name.toLowerCase());
      const recs = list.length
        ? list.map((r) => ({ type: r.type, title: r.title, provider: r.provider, link: r.link, description: r.description }))
        : [genericBySkill(g.name)];
      return { skillName: g.name, status: g.status, requiredProficiency: g.requiredProficiency, currentProficiency: g.currentProficiency, recommendations: recs };
    });

    return res.json({
      role: { id: role.id, name: role.name, description: role.description },
      overallMatch: gap.overallMatch,
      met: gap.met,
      total: gap.total,
      requiredVsCurrent: gap.rows.map((r) => ({
        skill: r.name,
        required: r.requiredProficiency,
        current: r.currentProficiency,
        status: r.status,
      })),
      missing: gap.missing,
      weak: gap.weak,
      recommendations,
    });
  } catch (err) {
    next(err);
  }
});

// ---------- internships (student view) ----------

router.get('/internships', async (req, res, next) => {
  try {
    const profile = await loadProfile(req, 'studentProfile');
    const role = (req.query.role || '').toString().trim();
    const skill = (req.query.skill || '').toString().trim();
    const location = (req.query.location || '').toString().trim().toLowerCase();
    const minStipend = req.query.minStipend ? Number(req.query.minStipend) : null;
    const skills = await skillRows(profile.id);

    const internships = await prisma.internship.findMany({
      include: {
        recruiterProfile: { include: { user: { select: { name: true } } } },
        applications: {
          where: { studentProfileId: profile.id },
          select: { status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const filtered = internships
      .map((i) => {
        const required = parseJsonList(i.requiredSkills);
        const targets = parseJsonList(i.targetRoles);
        const matchPct = internshipMatch(skills, required);
        return {
          id: i.id,
          title: i.title,
          description: i.description,
          location: i.location,
          stipend: i.stipend,
          duration: i.duration,
          requiredSkills: required,
          targetRoles: targets,
          company: i.recruiterProfile.company,
          postedBy: i.recruiterProfile.user.name,
          createdAt: i.createdAt,
          matchPct,
          appliedStatus: i.applications.length ? i.applications[0].status : null,
        };
      })
      .filter((i) => {
        if (role && !i.targetRoles.includes(role)) return false;
        if (skill) {
          const s = skill.toLowerCase();
          if (!i.requiredSkills.some((r) => r.toLowerCase().includes(s))) return false;
        }
        if (location && !i.location.toLowerCase().includes(location)) return false;
        if (minStipend !== null && !isNaN(minStipend) && (i.stipend ?? 0) < minStipend) return false;
        return true;
      })
      .sort(
        (a, b) =>
          b.matchPct - a.matchPct ||
          (b.stipend ?? 0) - (a.stipend ?? 0) ||
          new Date(b.createdAt) - new Date(a.createdAt)
      );

    return res.json({ internships: filtered });
  } catch (err) {
    next(err);
  }
});

const applySchema = z.object({ internshipId: z.coerce.number().int().positive() });

router.post('/applications', async (req, res, next) => {
  try {
    const body = applySchema.parse(req.body);
    const profile = await loadProfile(req, 'studentProfile');
    const internship = await prisma.internship.findUnique({ where: { id: body.internshipId } });
    if (!internship) return res.status(404).json({ message: 'Internship not found.' });
    const existing = await prisma.application.findUnique({
      where: {
        internshipId_studentProfileId: { internshipId: internship.id, studentProfileId: profile.id },
      },
    });
    if (existing) {
      return res.status(409).json({ message: 'You have already applied to this internship.' });
    }
    await prisma.application.create({
      data: { internshipId: internship.id, studentProfileId: profile.id },
    });
    return res.status(201).json({ message: 'Application submitted successfully.' });
  } catch (err) {
    next(err);
  }
});

router.get('/applications', async (req, res, next) => {
  try {
    const profile = await loadProfile(req, 'studentProfile');
    const skills = await skillRows(profile.id);
    const apps = await prisma.application.findMany({
      where: { studentProfileId: profile.id },
      include: { internship: { include: { recruiterProfile: true } } },
      orderBy: { appliedAt: 'desc' },
    });
    return res.json({
      applications: apps.map((a) => ({
        id: a.id,
        status: a.status,
        appliedAt: a.appliedAt,
        matchPct: internshipMatch(skills, parseJsonList(a.internship.requiredSkills)),
        internship: {
          id: a.internship.id,
          title: a.internship.title,
          location: a.internship.location,
          stipend: a.internship.stipend,
          duration: a.internship.duration,
          company: a.internship.recruiterProfile.company,
          requiredSkills: parseJsonList(a.internship.requiredSkills),
          targetRoles: parseJsonList(a.internship.targetRoles),
        },
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ---------- dashboard ----------

router.get('/dashboard', async (req, res, next) => {
  try {
    const profile = await loadProfile(req, 'studentProfile');
    const skills = await skillRows(profile.id);
    const [projects, courses, applications, allRoles] = await Promise.all([
      prisma.project.count({ where: { studentProfileId: profile.id } }),
      prisma.course.findMany({ where: { studentProfileId: profile.id }, select: { verificationStatus: true } }),
      prisma.application.findMany({
        where: { studentProfileId: profile.id },
        select: { status: true },
      }),
      prisma.role.findMany({ include: { requirements: { include: { skill: true } } } }),
    ]);

    const targetRoles = parseJsonList(profile.targetRoles);
    const readiness = targetRoles
      .map((roleName) => {
        const role = allRoles.find((r) => r.name === roleName);
        if (!role) return null;
        const gap = gapForRole(skills, role.requirements);
        return {
          roleId: role.id,
          roleName: role.name,
          overallMatch: gap.overallMatch,
          missingCount: gap.missing.length,
          weakCount: gap.weak.length,
        };
      })
      .filter(Boolean);

    // Top recommended internships (best match, not applied yet preferred).
    const internships = await prisma.internship.findMany({
      include: {
        recruiterProfile: true,
        applications: { where: { studentProfileId: profile.id }, select: { status: true } },
      },
    });
    const ranked = internships
      .map((i) => {
        const required = parseJsonList(i.requiredSkills);
        const targets = parseJsonList(i.targetRoles);
        return {
          id: i.id,
          title: i.title,
          description: i.description,
          location: i.location,
          stipend: i.stipend,
          duration: i.duration,
          requiredSkills: required,
          targetRoles: targets,
          company: i.recruiterProfile.company,
          matchPct: internshipMatch(skills, required),
          appliedStatus: i.applications.length ? i.applications[0].status : null,
        };
      })
      .filter((i) => !i.appliedStatus)
      .sort((a, b) => b.matchPct - a.matchPct || (b.stipend ?? 0) - (a.stipend ?? 0))
      .slice(0, 5);

    const countBy = (s) => applications.filter((a) => a.status === s).length;
    const verifiedCount = skills.filter((s) => s.isVerified).length;

    return res.json({
      profile: {
        name: req.user.name,
        institute: profile.institute,
        branch: profile.branch,
        year: profile.year,
      },
      readiness,
      recommendedInternships: ranked,
      applicationCounts: {
        APPLIED: countBy('APPLIED'),
        SHORTLISTED: countBy('SHORTLISTED'),
        REJECTED: countBy('REJECTED'),
        COMPLETED: countBy('COMPLETED'),
        total: applications.length,
      },
      skillSummary: {
        total: skills.length,
        verifiedCount,
        projectsCount: projects,
        coursesCount: courses.length,
        pendingVerifications: courses.filter((c) => c.verificationStatus === 'PENDING').length,
        topSkills: skills
          .slice()
          .sort((a, b) => (a.isVerified === b.isVerified ? 0 : a.isVerified ? -1 : 1))
          .slice(0, 8)
          .map((s) => ({ name: s.name, proficiency: s.proficiency, isVerified: s.isVerified })),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
