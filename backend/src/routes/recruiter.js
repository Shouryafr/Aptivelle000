import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authRequired, requireRole, loadProfile } from '../middleware/auth.js';
import { internshipMatch, verifiedStats, parseJsonList } from '../lib/match.js';

const router = Router();
router.use(authRequired, requireRole('RECRUITER'));

async function internshipOwner(internshipId, recruiterProfileId) {
  const internship = await prisma.internship.findUnique({
    where: { id: internshipId },
    include: { recruiterProfile: true },
  });
  if (!internship) {
    const err = new Error('Internship not found.');
    err.status = 404;
    throw err;
  }
  if (internship.recruiterProfileId !== recruiterProfileId) {
    const err = new Error('You do not have access to this internship.');
    err.status = 403;
    throw err;
  }
  return internship;
}

async function studentSkillRows(studentProfileId) {
  const rows = await prisma.studentSkill.findMany({
    where: { studentProfileId },
    include: { skill: true },
  });
  return rows.map((r) => ({
    name: r.skill.name,
    proficiency: r.proficiency,
    isVerified: r.isVerified,
  }));
}

// ---------- dashboard ----------

router.get('/dashboard', async (req, res, next) => {
  try {
    const recruiter = await loadProfile(req, 'recruiterProfile');
    const internships = await prisma.internship.findMany({
      where: { recruiterProfileId: recruiter.id },
      include: {
        applications: {
          include: {
            studentProfile: {
              include: { skills: { include: { skill: true } } },
            },
          },
        },
        feedback: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = internships.map((i) => {
      const required = parseJsonList(i.requiredSkills);
      const applicants = i.applications.map((a) => {
        const skills = a.studentProfile.skills.map((r) => ({
          name: r.skill.name,
          proficiency: r.proficiency,
          isVerified: r.isVerified,
        }));
        return { applicationId: a.id, status: a.status, matchPct: internshipMatch(skills, required) };
      });
      const statusCount = (st) => applicants.filter((x) => x.status === st).length;
      const matchSum = applicants.reduce((n, x) => n + x.matchPct, 0);
      const ratingSum = i.feedback.reduce((n, f) => n + f.readinessRating, 0);
      return {
        id: i.id,
        title: i.title,
        location: i.location,
        stipend: i.stipend,
        duration: i.duration,
        createdAt: i.createdAt,
        applicationsCount: applicants.length,
        statusCounts: {
          APPLIED: statusCount('APPLIED'),
          SHORTLISTED: statusCount('SHORTLISTED'),
          REJECTED: statusCount('REJECTED'),
          COMPLETED: statusCount('COMPLETED'),
        },
        avgMatchPct: applicants.length ? Math.round(matchSum / applicants.length) : null,
        feedbackCount: i.feedback.length,
        avgRating: i.feedback.length ? +(ratingSum / i.feedback.length).toFixed(1) : null,
      };
    });

    const allApplicants = internships.flatMap((i) =>
      i.applications.map((a) => {
        const required = parseJsonList(i.requiredSkills);
        const skills = a.studentProfile.skills.map((r) => ({
          name: r.skill.name,
          proficiency: r.proficiency,
          isVerified: r.isVerified,
        }));
        return { matchPct: internshipMatch(skills, required), status: a.status };
      })
    );

    // Applicant skill distribution (top skills across all applicants).
    const skillDist = new Map();
    internships.forEach((i) => {
      i.applications.forEach((a) => {
        a.studentProfile.skills.forEach((r) => {
          skillDist.set(r.skill.name, (skillDist.get(r.skill.name) || 0) + 1);
        });
      });
    });
    const applicantSkillDistribution = [...skillDist.entries()]
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const totalApplications = allApplicants.length;
    return res.json({
      company: recruiter.company,
      totals: {
        internships: internships.length,
        applications: totalApplications,
        avgMatchPct: totalApplications
          ? Math.round(allApplicants.reduce((n, x) => n + x.matchPct, 0) / totalApplications)
          : null,
        shortlisted: allApplicants.filter((x) => x.status === 'SHORTLISTED').length,
        completed: allApplicants.filter((x) => x.status === 'COMPLETED').length,
      },
      internships: rows,
      applicantSkillDistribution,
    });
  } catch (err) {
    next(err);
  }
});

// ---------- internships ----------

const internshipSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().trim().min(10, 'Add a short description of the internship').max(5000),
  location: z.string().trim().min(1, 'Location is required').max(100),
  stipend: z.coerce.number().int().min(0).optional().nullable(),
  duration: z.string().trim().min(1, 'Duration is required').max(50),
  requiredSkills: z.array(z.string().trim().min(1)).min(1, 'Select at least one required skill'),
  targetRoles: z.array(z.string().trim().min(1)).min(1, 'Select at least one target role'),
});

router.post('/internships', async (req, res, next) => {
  try {
    const body = internshipSchema.parse(req.body);
    const recruiter = await loadProfile(req, 'recruiterProfile');
    const internship = await prisma.internship.create({
      data: {
        recruiterProfileId: recruiter.id,
        title: body.title,
        description: body.description,
        location: body.location,
        stipend: body.stipend ?? null,
        duration: body.duration,
        requiredSkills: JSON.stringify(body.requiredSkills),
        targetRoles: JSON.stringify(body.targetRoles),
      },
    });
    return res.status(201).json({ message: 'Internship posted successfully.', internship });
  } catch (err) {
    next(err);
  }
});

router.get('/internships', async (req, res, next) => {
  try {
    const recruiter = await loadProfile(req, 'recruiterProfile');
    const internships = await prisma.internship.findMany({
      where: { recruiterProfileId: recruiter.id },
      include: { applications: { select: { status: true } }, feedback: { select: { readinessRating: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({
      internships: internships.map((i) => {
        const count = (st) => i.applications.filter((a) => a.status === st).length;
        return {
          id: i.id,
          title: i.title,
          description: i.description,
          location: i.location,
          stipend: i.stipend,
          duration: i.duration,
          requiredSkills: parseJsonList(i.requiredSkills),
          targetRoles: parseJsonList(i.targetRoles),
          createdAt: i.createdAt,
          applicationsCount: i.applications.length,
          statusCounts: {
            APPLIED: count('APPLIED'),
            SHORTLISTED: count('SHORTLISTED'),
            REJECTED: count('REJECTED'),
            COMPLETED: count('COMPLETED'),
          },
          feedbackCount: i.feedback.length,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

// ---------- applicants ----------

router.get('/internships/:id/applicants', async (req, res, next) => {
  try {
    const recruiter = await loadProfile(req, 'recruiterProfile');
    const internship = await internshipOwner(Number(req.params.id), recruiter.id);
    const required = parseJsonList(internship.requiredSkills);

    const applications = await prisma.application.findMany({
      where: { internshipId: internship.id },
      include: {
        studentProfile: {
          include: {
            user: { select: { name: true, email: true } },
            skills: { include: { skill: true } },
          },
        },
      },
      orderBy: { appliedAt: 'asc' },
    });

    const applicants = applications.map((a) => {
      const skills = a.studentProfile.skills.map((r) => ({
        name: r.skill.name,
        proficiency: r.proficiency,
        isVerified: r.isVerified,
      }));
      const vs = verifiedStats(skills, required);
      return {
        applicationId: a.id,
        status: a.status,
        appliedAt: a.appliedAt,
        matchPct: internshipMatch(skills, required),
        verifiedCount: vs.verified,
        possessedCount: vs.present,
        student: {
          name: a.studentProfile.user.name,
          email: a.studentProfile.user.email,
          branch: a.studentProfile.branch,
          year: a.studentProfile.year,
          institute: a.studentProfile.institute,
          targetRoles: parseJsonList(a.studentProfile.targetRoles),
          skills: skills.slice(0, 8),
          resumeText: a.studentProfile.resumeText,
        },
      };
    });

    return res.json({
      internship: {
        id: internship.id,
        title: internship.title,
        description: internship.description,
        location: internship.location,
        stipend: internship.stipend,
        duration: internship.duration,
        requiredSkills: required,
        targetRoles: parseJsonList(internship.targetRoles),
      },
      applicants,
    });
  } catch (err) {
    next(err);
  }
});

const statusSchema = z.object({
  status: z.enum(['APPLIED', 'SHORTLISTED', 'REJECTED', 'COMPLETED']),
});

router.patch('/applications/:id', async (req, res, next) => {
  try {
    const body = statusSchema.parse(req.body);
    const recruiter = await loadProfile(req, 'recruiterProfile');
    const application = await prisma.application.findUnique({
      where: { id: Number(req.params.id) },
      include: { internship: true },
    });
    if (!application) return res.status(404).json({ message: 'Application not found.' });
    if (application.internship.recruiterProfileId !== recruiter.id) {
      return res.status(403).json({ message: 'You do not have access to this application.' });
    }
    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { status: body.status },
    });
    return res.json({ message: `Application marked as ${body.status}.`, status: updated.status });
  } catch (err) {
    next(err);
  }
});

// ---------- feedback ----------

const feedbackSchema = z.object({
  internshipId: z.coerce.number().int().positive(),
  readinessRating: z.coerce.number().int().min(1).max(5),
  comments: z.string().trim().max(2000).default(''),
});

router.post('/feedback', async (req, res, next) => {
  try {
    const body = feedbackSchema.parse(req.body);
    const recruiter = await loadProfile(req, 'recruiterProfile');
    const internship = await internshipOwner(body.internshipId, recruiter.id);
    const feedback = await prisma.recruiterFeedback.create({
      data: {
        internshipId: internship.id,
        recruiterProfileId: recruiter.id,
        readinessRating: body.readinessRating,
        comments: body.comments,
      },
    });
    return res.status(201).json({ message: 'Feedback submitted to the institute.', feedback });
  } catch (err) {
    next(err);
  }
});

export default router;
