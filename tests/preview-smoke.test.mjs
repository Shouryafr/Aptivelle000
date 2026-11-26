/**
 * Preview smoke test — logs in as each demo account and checks that its dashboard
 * really receives seeded data, so preview health can be verified from a terminal
 * instead of clicking through the browser.
 *
 * Run with the dev servers up (see .freebuff/run.md):
 *   npm run test:smoke
 *
 * By default it talks to the Vite dev server origin, i.e. the exact path the
 * Preview tab uses (browser → Vite → /api proxy → Express). Point it straight at
 * the API instead with:
 *   SMOKE_BASE_URL=http://127.0.0.1:4000 npm run test:smoke
 *
 * Uses Node's built-in test runner and fetch, so it needs no extra dependencies.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:5174').replace(/\/+$/, '');

// Kept in sync with the demo accounts in frontend/src/pages/Demo.jsx (and the seed).
const DEMO_PASSWORD = 'demo1234';

async function request(path, { method = 'GET', token, body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (cause) {
    throw new Error(
      `Nothing answered at ${BASE_URL}${path}.\n` +
        `  Start the dev servers first (.freebuff/run.md), or set SMOKE_BASE_URL to a running origin.\n` +
        `  ${cause.message}`
    );
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // Leave data null: a non-JSON body usually means we reached the wrong server.
  }
  return { status: res.status, data, text };
}

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/** Assert a count that must come from seeded data, i.e. at least 1. */
function count(value, label) {
  assert.ok(isNum(value), `${label} should be a number, got ${JSON.stringify(value)}`);
  assert.ok(value >= 1, `${label} should be at least 1 — dashboard has no seeded data (got ${value})`);
  return value;
}

/** Assert a list that must come from seeded data, i.e. non-empty. */
function rows(value, label) {
  assert.ok(Array.isArray(value), `${label} should be an array, got ${typeof value}`);
  assert.ok(value.length >= 1, `${label} should not be empty — dashboard has no seeded data`);
  return value;
}

function percent(value, label) {
  assert.ok(isNum(value), `${label} should be a number, got ${JSON.stringify(value)}`);
  assert.ok(value >= 0 && value <= 100, `${label} should be 0–100, got ${value}`);
  return value;
}

const DEMO_ACCOUNTS = [
  {
    role: 'STUDENT',
    name: 'Aarav Sharma',
    email: 'student@aptivelle.in',
    dashboardPath: '/api/student/dashboard',
    check(d) {
      assert.ok(d.profile?.name, 'profile.name is missing');
      assert.ok(d.profile.institute, 'profile.institute is missing');
      assert.ok(d.profile.branch, 'profile.branch is missing');

      const summary = d.skillSummary ?? {};
      count(summary.total, 'skillSummary.total');
      assert.ok(isNum(summary.verifiedCount) && summary.verifiedCount <= summary.total, 'skillSummary.verifiedCount out of range');
      assert.ok(isNum(summary.projectsCount), 'skillSummary.projectsCount should be a number');
      assert.ok(isNum(summary.coursesCount), 'skillSummary.coursesCount should be a number');
      rows(summary.topSkills, 'skillSummary.topSkills').forEach((s) => assert.ok(s.name, 'top skill without a name'));

      const apps = d.applicationCounts ?? {};
      count(apps.total, 'applicationCounts.total');

      const readiness = rows(d.readiness, 'readiness');
      readiness.forEach((r) => {
        assert.ok(r.roleName, 'readiness entry without a roleName');
        percent(r.overallMatch, `readiness.overallMatch for ${r.roleName}`);
      });

      const recs = rows(d.recommendedInternships, 'recommendedInternships');
      recs.forEach((i) => {
        assert.ok(i.title && i.company, 'recommended internship missing title/company');
        percent(i.matchPct, `matchPct for ${i.title}`);
      });

      return `${summary.total} skills (${summary.verifiedCount} verified), ${apps.total} applications, ${readiness.length} target roles, ${recs.length} internship matches`;
    },
  },
  {
    role: 'FACULTY',
    name: 'Dr. Meera Nair',
    email: 'faculty@aptivelle.in',
    dashboardPath: '/api/faculty/dashboard',
    check(d) {
      assert.ok(d.institute, 'institute is missing');

      const totals = d.totals ?? {};
      const students = count(totals.students, 'totals.students');
      count(totals.applications, 'totals.applications');
      count(totals.internships, 'totals.internships');

      const groups = rows(d.avgGapsByBranchYear, 'avgGapsByBranchYear');
      groups.forEach((g) => {
        assert.ok(g.label, 'branch/year group without a label');
        assert.ok(isNum(g.avgGaps), `avgGaps for ${g.label} should be a number`);
        count(g.students, `students in ${g.label}`);
      });

      rows(d.topRoles, 'topRoles').forEach((r) => {
        assert.ok(r.name, 'top role without a name');
        count(r.count, `count for ${r.name}`);
      });
      rows(d.topMissingSkills, 'topMissingSkills').forEach((m) => {
        assert.ok(m.skill, 'missing skill without a name');
        count(m.count, `count for ${m.skill}`);
      });

      const recs = rows(d.curriculumRecommendations, 'curriculumRecommendations');
      recs.forEach((r) => {
        assert.ok(r.title && r.detail && r.evidence, 'curriculum recommendation missing title/detail/evidence');
      });

      return `${students} students, ${groups.length} branch/year groups, ${recs.length} curriculum recommendations`;
    },
  },
  {
    role: 'RECRUITER',
    name: 'Neha Kapoor',
    email: 'recruiter@aptivelle.in',
    dashboardPath: '/api/recruiter/dashboard',
    check(d) {
      assert.ok(d.company, 'company is missing');

      const totals = d.totals ?? {};
      const postings = count(totals.internships, 'totals.internships');
      count(totals.applications, 'totals.applications');

      rows(d.internships, 'internships').forEach((i) => {
        assert.ok(i.id && i.title, 'posting missing id/title');
        assert.ok(i.statusCounts && typeof i.statusCounts === 'object', `posting ${i.title} missing statusCounts`);
        ['APPLIED', 'SHORTLISTED', 'REJECTED', 'COMPLETED'].forEach((status) =>
          assert.ok(isNum(i.statusCounts[status]), `statusCounts.${status} for ${i.title} should be a number`)
        );
      });

      const pool = rows(d.applicantSkillDistribution, 'applicantSkillDistribution');
      pool.forEach((p) => {
        assert.ok(p.skill, 'skill distribution entry without a skill');
        count(p.count, `applicant count for ${p.skill}`);
      });

      return `${postings} postings, ${totals.applications} applications, ${pool.length} skills in the applicant pool`;
    },
  },
];

test('preview origin is serving the Aptivelle API', async () => {
  // /api/health is not a mounted root route, so our API answers 404 with its own
  // body — which is exactly what identifies it. A different app on the port, or a
  // frontend that does not proxy /api, produces a different status/body.
  const res = await request('/api/health');
  assert.equal(res.status, 404, `expected our API's 404 at ${BASE_URL}/api/health, got ${res.status}: ${res.text.slice(0, 200)}`);
  assert.deepEqual(res.data, { message: 'Endpoint not found.' }, `unexpected body from ${BASE_URL}/api/health`);
});

for (const account of DEMO_ACCOUNTS) {
  test(`${account.role} demo account: login + seeded dashboard data`, async () => {
    const login = await request('/api/auth/login', {
      method: 'POST',
      body: { email: account.email, password: DEMO_PASSWORD },
    });
    assert.equal(login.status, 200, `login failed for ${account.email}: ${login.status} ${login.text.slice(0, 200)}`);

    const { token, user } = login.data ?? {};
    assert.equal(typeof token, 'string', 'login response has no token');
    assert.ok(token.length > 20, 'login token looks too short to be a JWT');
    assert.equal(user?.role, account.role, 'logged-in role does not match the demo account');
    assert.equal(user?.email, account.email, 'logged-in email does not match the demo account');
    assert.equal(user?.name, account.name, 'logged-in name does not match the demo account');
    assert.equal(user?.hasProfile, true, `${account.email} has no profile — it would land on /onboarding, not a dashboard`);

    const me = await request('/api/auth/me', { token });
    assert.equal(me.status, 200, `GET /api/auth/me failed: ${me.text.slice(0, 200)}`);
    assert.equal(me.data?.user?.email, account.email, '/api/auth/me returned a different user');

    const dash = await request(account.dashboardPath, { token });
    assert.equal(dash.status, 200, `GET ${account.dashboardPath} failed: ${dash.status} ${dash.text.slice(0, 200)}`);
    assert.ok(dash.data, `GET ${account.dashboardPath} returned no JSON — wrong server behind ${BASE_URL}?`);

    const summary = account.check(dash.data);
    console.log(`  ✓ ${account.role.padEnd(9)} ${account.email} → ${summary}`);
  });
}
