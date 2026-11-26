import { Link } from 'react-router-dom';
import { MatchBadge } from '../components/ui';

const roleCards = [
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
      </svg>
    ),
    title: 'For Students',
    blurb: 'See exactly what a role needs, close your gaps and get matched to internships that fit.',
    points: ['Skill profile built from your resume', 'Readiness score per target role', 'Internship matching with live match %'],
    cta: 'Explore as a student',
    to: '/demo',
    accent: 'from-bluetint/70 to-white',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22 10l-6 6-4-4-8 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 10h6v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'For Colleges & TPOs',
    blurb: 'Replace guesswork with data — see real skill gaps by branch and year, plus recruiter feedback.',
    points: ['Anonymised skill-gap analytics', 'Auto-generated curriculum recommendations', 'Recruiter feedback loop to academia'],
    cta: 'See faculty analytics',
    to: '/demo',
    accent: 'from-gold/20 to-white',
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16M2 11h20" strokeLinecap="round" />
      </svg>
    ),
    title: 'For Recruiters',
    blurb: 'Find job-ready candidates faster. Rank applicants by skill match and verified credentials.',
    points: ['Applicants ranked by match %', 'Verified skill badges, not just claims', 'Readiness feedback that improves the pipeline'],
    cta: 'Post an internship',
    to: '/demo',
    accent: 'from-bluetint/70 to-white',
  },
];

const stats = [
  { k: '3', v: 'target roles with skill roadmaps' },
  { k: '20+', v: 'skills in the framework' },
  { k: '1:1', v: 'skill-to-role matching engine' },
  { k: '100%', v: 'self-contained, no paid APIs' },
];

export default function Landing() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative hero-card overflow-hidden bg-[linear-gradient(160deg,#0F1E45_0%,#05070F_100%)] text-offwhite">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 30%, #E8B84B 0, transparent 32%), radial-gradient(circle at 85% 70%, #E8B84B 0, transparent 28%)',
          }}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center relative">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-gold mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              Your Career, Mapped
            </span>
            <h1 className="font-serif text-4xl font-normal leading-[1.3] text-offwhite sm:text-5xl lg:text-[3rem]">
              Skills meet <span className="text-gold">opportunity.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-mist">
              Aptivelle maps student skills to industry roles, recommends internships and learning
              paths, and gives colleges and recruiters real analytics on the skill gap.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/signup" className="btn-gold !px-6 !py-3 !text-base">
                Get started free
              </Link>
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-serif text-base font-normal text-offwhite hover:bg-white/10 transition"
              >
                Try the live demo
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.2 14.8a1 1 0 000-1.4L10.6 10 7.2 6.6a1 1 0 011.4-1.4l4 4a1 1 0 010 1.4l-4 4a1 1 0 01-1.4 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
            <dl className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {stats.map((s) => (
                <div key={s.k}>
                  <dt className="sr-only">{s.v}</dt>
                  <dd className="font-serif text-3xl text-gold">{s.k}</dd>
                  <dd className="mt-1 text-xs leading-snug text-mist">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* decorative product card */}
          <div className="hidden lg:block relative">
            <div className="absolute -inset-6 bg-gold/10 rounded-3xl blur-2xl" aria-hidden="true" />
            <div className="relative rounded-2xl border border-white/10 bg-white/95 text-navy p-5 shadow-2xl rotate-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-slatemuted">Your readiness</p>
                <span className="rounded-full bg-success/10 text-success text-[11px] font-bold px-2 py-0.5">+2 roles</span>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-borderc p-3">
                <div>
                  <p className="text-sm font-bold">Frontend Developer L1</p>
                  <p className="text-xs text-slatemuted mt-0.5">6 required skills</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 h-2 rounded-full bg-borderc overflow-hidden">
                    <span className="block h-full w-[100%] bg-success rounded-full" />
                  </span>
                  <span className="text-sm font-extrabold text-success">100%</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-xl border border-borderc p-3">
                <div>
                  <p className="text-sm font-bold">Backend Developer L1</p>
                  <p className="text-xs text-slatemuted mt-0.5">3 skills to build</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-20 h-2 rounded-full bg-borderc overflow-hidden">
                    <span className="block h-full w-[33%] bg-gold rounded-full" />
                  </span>
                  <span className="text-sm font-extrabold text-navy">33%</span>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-borderc p-3 bg-pagebg">
                <p className="text-xs font-bold text-navy mb-2">Recommended internship</p>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Frontend Developer Intern</p>
                    <p className="text-xs text-slatemuted">Zephyr Technologies · Remote · ₹15,000/mo</p>
                  </div>
                  <MatchBadge value={100} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">One portal, three perspectives</p>
          <h2 className="mt-2 text-3xl sm:text-4xl">Built for the skill gap</h2>
          <p className="mt-3 text-slatemuted leading-relaxed">
            Students don&apos;t know what to build. Colleges don&apos;t get structured industry feedback.
            Recruiters can&apos;t find job-ready talent. Aptivelle closes all three loops.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {roleCards.map((c) => (
            <div key={c.title} className={`card p-6 flex flex-col bg-gradient-to-b ${c.accent}`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy text-gold">{c.icon}</div>
              <h3 className="mt-4 text-lg">{c.title}</h3>
              <p className="mt-2 text-sm text-slatebody leading-relaxed">{c.blurb}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-slatebody">
                    <svg className="w-4 h-4 text-success mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
              <Link to={c.to} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:text-navy-light transition group">
                {c.cta}
                <svg className="w-4 h-4 transition group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.2 14.8a1 1 0 000-1.4L10.6 10 7.2 6.6a1 1 0 011.4-1.4l4 4a1 1 0 010 1.4l-4 4a1 1 0 01-1.4 0z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-gold-soft border-y border-gold/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl">See it with real data — in 30 seconds.</h2>
            <p className="mt-2 text-slatebody max-w-xl">
              The demo ships pre-filled accounts for a student, a faculty member and a recruiter. No sign-up needed.
            </p>
          </div>
          <Link to="/demo" className="btn-primary !px-7 !py-3 shrink-0">
            Open the demo
          </Link>
        </div>
      </section>

    </div>
  );
}
