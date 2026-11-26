// Skill matching & gap-analysis helpers shared across role APIs.

export const PROF_RANK = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };
export const RANK_PROF = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

export function profRank(proficiency) {
  return PROF_RANK[proficiency] ?? 0;
}

// Normalise skill lookup so comparisons are case-insensitive.
export function findSkill(studentSkills, name) {
  const lower = String(name).toLowerCase();
  return studentSkills.find(
    (s) => String(s.name || '').toLowerCase() === lower
  );
}

/**
 * Compare a student's skill set to a role's requirements.
 * requirements: [{ skillId, skill: { name }, requiredProficiency }]
 * studentSkills: [{ name, proficiency, isVerified }]
 */
export function gapForRole(studentSkills, requirements) {
  const rows = requirements.map((r) => {
    const name = r.skill?.name ?? r.skillName;
    const have = findSkill(studentSkills, name);
    const currentProficiency = have?.proficiency ?? null;
    const currentRank = have ? profRank(have.proficiency) : 0;
    const requiredRank = profRank(r.requiredProficiency);
    const status = !have ? 'missing' : currentRank >= requiredRank ? 'met' : 'weak';
    return {
      skillId: r.skillId ?? r.skill?.id ?? null,
      name,
      requiredProficiency: r.requiredProficiency,
      currentProficiency,
      status,
      met: status === 'met',
    };
  });
  const met = rows.filter((r) => r.met).length;
  return {
    rows,
    met,
    total: rows.length,
    overallMatch: rows.length ? Math.round((met / rows.length) * 100) : 100,
    missing: rows.filter((r) => r.status === 'missing'),
    weak: rows.filter((r) => r.status === 'weak'),
  };
}

/** Match % of a student against an internship's required skill names. */
export function internshipMatch(studentSkills, requiredNames) {
  const names = (requiredNames || []).map((n) => String(n).toLowerCase());
  if (!names.length) return 100;
  const met = names.filter((n) =>
    studentSkills.some((s) => String(s.name || '').toLowerCase() === n)
  ).length;
  return Math.round((met / names.length) * 100);
}

/** Verified skill stats of a student against required skill names. */
export function verifiedStats(studentSkills, requiredNames) {
  const names = (requiredNames || []).map((n) => String(n).toLowerCase());
  const present = names.filter((n) =>
    studentSkills.some((s) => String(s.name || '').toLowerCase() === n)
  );
  const verified = present.filter((n) => {
    const s = studentSkills.find((sk) => String(sk.name || '').toLowerCase() === n);
    return Boolean(s?.isVerified);
  });
  return { verified: verified.length, present: present.length };
}

export function parseJsonList(raw, fallback = []) {
  try {
    const v = JSON.parse(raw || '[]');
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

export function fmtStipend(stipend) {
  if (stipend === null || stipend === undefined) return 'Unpaid';
  if (stipend === 0) return 'Unpaid';
  return `₹${stipend.toLocaleString('en-IN')}/mo`;
}
