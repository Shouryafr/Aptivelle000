import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authRequired, requireRole, loadProfile } from '../middleware/auth.js';
import { gapForRole, parseJsonList } from '../lib/match.js';
import { FEEDBACK_THEMES } from '../data/catalog.js';

const router = Router();
router.use(authRequired, requireRole('FACULTY'));

// ---------- shared analytics helpers ----------

async function loadRolesWithSkills() {
  return prisma.role.findMany({
    include: { requirements: { include: { skill: true } } },
    orderBy: { id: 'asc' },
  });
}

function studentSkillList(sp) {
  return (sp.skills || []).map((r) => ({
    name: r.skill.name,
    proficiency: r.proficiency,
    isVerified: r.isVerified,
  }));
}

/**
 * Missing/weak skills a student has relative to their target roles,
 * plus their average readiness % across those roles.
 */
function studentGap(sp, roles) {
  const skills = studentSkillList(sp);
  const targetNames = parseJsonList(sp.targetRoles);
  const targetRoles = roles.filter((r) => targetNames.includes(r.name));
  const missing = new Set();
  const weak = new Set();
  let readinessSum = 0;
  targetRoles.forEach((role) => {
    const gap = gapForRole(skills, role.requirements);
    readinessSum += gap.overallMatch;
    gap.missing.forEach((m) => missing.add(m.name));
    gap.weak.forEach((w) => weak.add(w.name));
  });
  return {
    missing,
    weak,
    avgReadiness: targetRoles.length ? Math.round(readinessSum / targetRoles.length) : null,
    roleCount: targetRoles.length,
  };
}

function groupKey(sp) {
  return `${sp.branch}·${sp.year}`;
}

// ---------- dashboard ----------

router.get('/dashboard', async (req, res, next) => {
  try {
    const faculty = await loadProfile(req, 'facultyProfile');
    const [students, allRoles, portalInternships, feedback] = await Promise.all([
      prisma.studentProfile.findMany({
        where: { institute: faculty.institute },
        include: {
          skills: { include: { skill: true } },
          applications: true,
          courses: { select: { verificationStatus: true } },
        },
      }),
      loadRolesWithSkills(),
      prisma.internship.findMany({ include: { applications: true } }),
      prisma.recruiterFeedback.findMany({ include: { internship: true, recruiterProfile: true } }),
    ]);

    const totalApplications = students.reduce((n, s) => n + s.applications.length, 0);
    const countStatus = (st) =>
      students.reduce((n, s) => n + s.applications.filter((a) => a.status === st).length, 0);

    // Branch/year aggregation.
    const groups = new Map();
    const topMissing = new Map();
    const topRoles = new Map();
    students.forEach((sp) => {
      const gap = studentGap(sp, allRoles);
      gap.missing.forEach((name) => topMissing.set(name, (topMissing.get(name) || 0) + 1));
      parseJsonList(sp.targetRoles).forEach((name) =>
        topRoles.set(name, (topRoles.get(name) || 0) + 1)
      );
      const key = groupKey(sp);
      if (!groups.has(key)) {
        groups.set(key, { branch: sp.branch, year: sp.year, students: 0, gapSum: 0, readinessSum: 0, scored: 0 });
      }
      const g = groups.get(key);
      g.students += 1;
      if (gap.avgReadiness !== null) {
        g.gapSum += gap.missing.size;
        g.readinessSum += gap.avgReadiness;
        g.scored += 1;
      }
    });

    const avgGapsByBranchYear = [...groups.values()].map((g) => ({
      branch: g.branch,
      year: g.year,
      label: `${g.branch} · ${g.year}`,
      students: g.students,
      avgGaps: g.scored ? +(g.gapSum / g.scored).toFixed(1) : 0,
      avgReadiness: g.scored ? Math.round(g.readinessSum / g.scored) : null,
    }));

    const topMissingSkills = [...topMissing.entries()]
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const topTargetRoles = [...topRoles.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Rule-based curriculum recommendations.
    const curriculumRecommendations = [];
    topMissingSkills.slice(0, 4).forEach(({ skill, count }, i) => {
      curriculumRecommendations.push({
        id: `gap-${i}`,
        title: `Strengthen “${skill}” in the curriculum`,
        detail: `Introduce a graded ${skill} module (theory + hands-on lab) across relevant branches and years.`,
        evidence: `${count} of ${students.length} students at your institute fall short of the required ${skill} level for their target roles.`,
        source: 'SKILL_GAP',
        severity: count >= 4 ? 'high' : 'medium',
      });
    });

    const allComments = feedback.map((f) => (f.comments || '').toLowerCase());
    FEEDBACK_THEMES.forEach((theme, i) => {
      const hits = allComments.filter((c) => c.includes(theme.keyword)).length;
      if (hits > 0) {
        curriculumRecommendations.push({
          id: `fb-${i}`,
          title: theme.label,
          detail: `Recruiters mention this in feedback — plan a workshop or embedded module for the next semester.`,
          evidence: `${theme.note} (${hits} comment${hits > 1 ? 's' : ''}).`,
          source: 'FEEDBACK',
          severity: hits >= 2 ? 'high' : 'medium',
        });
      }
    });

    const lowRated = feedback.reduce((acc, f) => {
      const key = f.internship.title;
      if (!acc[key]) acc[key] = { sum: 0, n: 0, company: f.recruiterProfile.company };
      acc[key].sum += f.readinessRating;
      acc[key].n += 1;
      return acc;
    }, {});
    Object.entries(lowRated).forEach(([title, v]) => {
      const avg = v.sum / v.n;
      if (avg < 3.2) {
        curriculumRecommendations.push({
          id: `low-${title}`,
          title: `Clarify expectations with ${v.company} (“${title}”)`,
          detail: `Low average readiness ratings suggest a mismatch between syllabus outcomes and on-the-job expectations.`,
          evidence: `Average readiness ${avg.toFixed(1)}/5 across ${v.n} feedback submission(s).`,
          source: 'FEEDBACK',
          severity: 'high',
        });
      }
    });

    const feedbackRatings = feedback.map((f) => f.readinessRating);
    const avgRating = feedbackRatings.length
      ? +(feedbackRatings.reduce((a, b) => a + b, 0) / feedbackRatings.length).toFixed(1)
      : null;

    return res.json({
      institute: faculty.institute,
      totals: {
        students: students.length,
        applications: totalApplications,
        shortlisted: countStatus('SHORTLISTED'),
        completed: countStatus('COMPLETED'),
        internships: portalInternships.length,
        avgRating,
        feedbackCount: feedback.length,
        pendingVerifications: students.reduce(
          (n, s) => n + s.courses.filter((c) => c.verificationStatus === 'PENDING').length,
          0
        ),
      },
      avgGapsByBranchYear,
      topRoles: topTargetRoles,
      topMissingSkills,
      curriculumRecommendations,
    });
  } catch (err) {
    next(err);
  }
});

// ---------- skill insights ----------

router.get('/skills', async (req, res, next) => {
  try {
    const faculty = await loadProfile(req, 'facultyProfile');
    const branch = (req.query.branch || '').toString();
    const year = (req.query.year || '').toString();

    const all = await prisma.studentProfile.findMany({
      where: { institute: faculty.institute },
      include: { skills: { include: { skill: true } } },
    });

    const branches = [...new Set(all.map((s) => s.branch))].sort();
    const years = [...new Set(all.map((s) => s.year))].sort();

    const filtered = all.filter(
      (s) => (!branch || s.branch === branch) && (!year || s.year === year)
    );

    // Skill distribution
    const dist = new Map();
    filtered.forEach((sp) => {
      const seen = new Set();
      sp.skills.forEach((r) => {
        const name = r.skill.name;
        if (seen.has(name)) return;
        seen.add(name);
        const cur = dist.get(name) || { skill: name, category: r.skill.category, count: 0, profSum: 0, verified: 0 };
        cur.count += 1;
        cur.profSum += { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 }[r.proficiency] || 1;
        if (r.isVerified) cur.verified += 1;
        dist.set(name, cur);
      });
    });

    const distribution = [...dist.values()]
      .map((d) => ({
        skill: d.skill,
        category: d.category,
        count: d.count,
        avgProficiency: d.count ? +(d.profSum / d.count).toFixed(1) : 0,
        verified: d.verified,
      }))
      .sort((a, b) => b.count - a.count);

    // Top missing skills relative to target roles.
    const roles = await loadRolesWithSkills();
    const missing = new Map();
    filtered.forEach((sp) => {
      const skills = studentSkillList(sp);
      const targetNames = parseJsonList(sp.targetRoles);
      roles
        .filter((r) => targetNames.includes(r.name))
        .forEach((role) => {
          gapForRole(skills, role.requirements).missing.forEach((m) =>
            missing.set(m.name, (missing.get(m.name) || 0) + 1)
          );
        });
    });
    const topMissing = [...missing.entries()]
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return res.json({
      filters: { branches, years },
      activeFilters: { branch, year },
      studentsCount: filtered.length,
      distribution,
      topMissing,
    });
  } catch (err) {
    next(err);
  }
});

// ---------- feedback ----------

router.get('/feedback', async (req, res, next) => {
  try {
    const faculty = await loadProfile(req, 'facultyProfile');
    const feedback = await prisma.recruiterFeedback.findMany({
      include: {
        internship: true,
        recruiterProfile: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byInternship = new Map();
    feedback.forEach((f) => {
      const key = f.internshipId;
      if (!byInternship.has(key)) {
        byInternship.set(key, {
          internshipId: f.internshipId,
          title: f.internship.title,
          company: f.recruiterProfile.company,
          sum: 0,
          count: 0,
          comments: [],
        });
      }
      const row = byInternship.get(key);
      row.sum += f.readinessRating;
      row.count += 1;
      row.comments.push({
        rating: f.readinessRating,
        comments: f.comments,
        recruiter: f.recruiterProfile.user.name,
        designation: f.recruiterProfile.designation,
        createdAt: f.createdAt,
      });
    });

    const ratings = feedback.map((f) => f.readinessRating);
    return res.json({
      avgRating: ratings.length ? +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null,
      count: feedback.length,
      internships: [...byInternship.values()]
        .map((row) => ({ ...row, avgRating: row.count ? +(row.sum / row.count).toFixed(1) : null }))
        .sort((a, b) => b.count - a.count),
    });
  } catch (err) {
    next(err);
  }
});

// ---------- verification queue ----------

router.get('/verifications', async (req, res, next) => {
  try {
    const faculty = await loadProfile(req, 'facultyProfile');
    const courses = await prisma.course.findMany({
      where: {
        studentProfile: { institute: faculty.institute },
      },
      include: {
        studentProfile: { include: { user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const shape = (c) => ({
      id: c.id,
      title: c.title,
      provider: c.provider,
      link: c.link,
      certificateLink: c.certificateLink,
      skillNames: parseJsonList(c.skillNames),
      verificationStatus: c.verificationStatus,
      rejectionReason: c.rejectionReason,
      verifiedAt: c.verifiedAt,
      createdAt: c.createdAt,
      student: {
        id: c.studentProfileId,
        name: c.studentProfile.user.name,
        email: c.studentProfile.user.email,
        branch: c.studentProfile.branch,
        year: c.studentProfile.year,
      },
    });

    const all = courses.map(shape);
    return res.json({
      institute: faculty.institute,
      pending: all.filter((c) => c.verificationStatus === 'PENDING'),
      verified: all.filter((c) => c.verificationStatus === 'VERIFIED'),
      rejected: all.filter((c) => c.verificationStatus === 'REJECTED'),
    });
  } catch (err) {
    next(err);
  }
});

const verifySchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  reason: z.string().trim().max(500).optional().or(z.literal('')),
});

router.patch('/verifications/:courseId', async (req, res, next) => {
  try {
    const body = verifySchema.parse(req.body);
    const faculty = await loadProfile(req, 'facultyProfile');
    const course = await prisma.course.findUnique({
      where: { id: Number(req.params.courseId) },
      include: { studentProfile: true },
    });
    if (!course) return res.status(404).json({ message: 'Submission not found.' });
    if (course.studentProfile.institute !== faculty.institute) {
      return res.status(403).json({ message: 'You can only verify students at your own institute.' });
    }
    if (course.verificationStatus === 'VERIFIED' || course.verificationStatus === 'REJECTED') {
      return res.status(400).json({ message: 'This submission has already been reviewed.' });
    }

    if (body.status === 'VERIFIED') {
      await prisma.course.update({
        where: { id: course.id },
        data: {
          verificationStatus: 'VERIFIED',
          verifiedByFacultyId: faculty.id,
          verifiedAt: new Date(),
          rejectionReason: null,
        },
      });
      // Flip isVerified on every student skill tagged by this verified course.
      const skillNames = parseJsonList(course.skillNames);
      if (skillNames.length) {
        const skills = await prisma.skill.findMany({ where: { name: { in: skillNames } } });
        const skillIds = skills.map((s) => s.id);
        await prisma.studentSkill.updateMany({
          where: { studentProfileId: course.studentProfileId, skillId: { in: skillIds } },
          data: { isVerified: true },
        });
      }
      return res.json({ message: 'Course verified. Tagged skills are now marked as verified.' });
    }

    await prisma.course.update({
      where: { id: course.id },
      data: {
        verificationStatus: 'REJECTED',
        rejectionReason: body.reason || 'No reason provided.',
        verifiedByFacultyId: faculty.id,
        verifiedAt: new Date(),
      },
    });
    return res.json({ message: 'Submission rejected.' });
  } catch (err) {
    next(err);
  }
});

export default router;
