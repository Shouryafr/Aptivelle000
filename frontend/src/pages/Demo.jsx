import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import { Button } from '../components/ui';
import { useToast } from '../context/ToastContext';

const ACCOUNTS = [
  {
    role: 'STUDENT',
    name: 'Aarav Sharma',
    email: 'student@aptivelle.in',
    tag: 'Final-year CSE · Frontend focus',
    icon: '🎓',
    accent: 'from-bluetint to-white',
    bullets: ['Readiness radar vs. target roles', 'Skill gap + learning recommendations', 'Internship matching & applications'],
  },
  {
    role: 'FACULTY',
    name: 'Dr. Meera Nair',
    email: 'faculty@aptivelle.in',
    tag: 'Professor & TPO · Indus Institute of Technology',
    icon: '🏫',
    accent: 'from-gold/25 to-white',
    bullets: ['Skill gaps by branch & year', 'Auto-generated curriculum recommendations', 'Certification verification queue'],
  },
  {
    role: 'RECRUITER',
    name: 'Neha Kapoor',
    email: 'recruiter@aptivelle.in',
    tag: 'Zephyr Technologies · Talent Acquisition',
    icon: '💼',
    accent: 'from-bluetint to-white',
    bullets: ['Applicants ranked by match %', 'Verified-skill badges on candidates', 'Readiness feedback to institutes'],
  },
];

export default function Demo() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [busyRole, setBusyRole] = useState(null);

  const enter = async (acc) => {
    setBusyRole(acc.role);
    if (user && user.email !== acc.email) {
      logout(); // switch identity
    }
    try {
      const u = await login(acc.email, 'demo1234');
      toast(`Logged in as ${u.name} (${u.role.toLowerCase()})`);
      navigate(u.hasProfile ? ROLE_HOME[u.role] : '/onboarding', { replace: true });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyRole(null);
    }
  };

  return (
    <div>
      <div className="hero-card rounded-2xl relative overflow-hidden bg-[linear-gradient(160deg,#0F1E45_0%,#05070F_100%)] text-offwhite px-6 py-8 sm:px-10 sm:py-10 mb-8">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 90% 20%, #E8B84B 0, transparent 30%), radial-gradient(circle at 10% 90%, #E8B84B 0, transparent 25%)',
          }}
        />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            Live demo · seeded with realistic data
          </span>
          <h1 className="mt-4 text-2xl sm:text-3xl font-serif font-normal leading-[1.3] text-offwhite">
            Explore all three roles — no sign-up needed
          </h1>
          <p className="mt-2 text-mist max-w-2xl text-sm sm:text-base leading-relaxed">
            Every dashboard below is fully populated: 8 students, 3 industry roles, 10 internships, 23 applications and
            real recruiter feedback. Click a card to jump straight into that perspective.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {ACCOUNTS.map((acc) => (
          <div key={acc.role} className={`card flex flex-col overflow-hidden bg-gradient-to-b ${acc.accent}`}>
            <div className="px-6 pt-6">
              <div className="flex items-start justify-between">
                <span className="text-2xl">{acc.icon}</span>
                <span className="rounded-full bg-navy text-gold text-[10px] font-bold uppercase tracking-wide px-2.5 py-1">
                  {acc.role.toLowerCase()}
                </span>
              </div>
              <h2 className="mt-3 text-lg">{acc.name}</h2>
              <p className="text-xs text-slatemuted">{acc.tag}</p>
            </div>
            <ul className="px-6 py-4 space-y-2 flex-1">
              {acc.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[13px] text-slatebody">
                  <svg className="w-4 h-4 text-success mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
            <div className="px-6 pb-6">
              <Button variant="primary" className="w-full" loading={busyRole === acc.role} onClick={() => enter(acc)}>
                {busyRole === acc.role ? 'Signing in…' : user ? 'Switch to this role' : 'One-click login'}
              </Button>
              <p className="mt-3 text-center text-[11px] text-slatemuted font-mono">
                {acc.email} · demo1234
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 card px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-sm text-slatebody">
        <svg className="w-5 h-5 text-navy-light shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <p>
          Want the full journey instead?{' '}
          <Link to="/signup" className="font-semibold text-navy-light hover:text-navy">
            Create an account
          </Link>{' '}
          and go through onboarding as any role — sign-up, profile setup and dashboard in under a minute.
        </p>
      </div>
    </div>
  );
}
