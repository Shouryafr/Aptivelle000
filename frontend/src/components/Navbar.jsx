import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cx } from './ui';

const LINKS = {
  STUDENT: [
    { to: '/student/dashboard', label: 'Dashboard' },
    { to: '/student/skill-gap', label: 'Skill Gap' },
    { to: '/student/internships', label: 'Internships' },
    { to: '/student/applications', label: 'My Applications' },
  ],
  FACULTY: [
    { to: '/faculty/dashboard', label: 'Dashboard' },
    { to: '/faculty/skills', label: 'Skill Insights' },
    { to: '/faculty/feedback', label: 'Feedback' },
    { to: '/faculty/verifications', label: 'Verifications' },
  ],
  RECRUITER: [
    { to: '/recruiter/dashboard', label: 'Dashboard' },
    { to: '/recruiter/post-internship', label: 'Post Internship' },
    { to: '/recruiter/internships', label: 'Manage Internships' },
  ],
};

export function Logo({ light = false, small = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <span
        className={cx(
          'flex items-center justify-center rounded-lg bg-gold text-ink font-semibold',
          small ? 'w-7 h-7 text-sm' : 'w-9 h-9 text-base'
        )}
      >
        A
      </span>
      <span className={cx('font-extrabold tracking-tight', light ? 'text-white' : 'text-navy', small ? 'text-base' : 'text-lg')}>
        Aptivelle
      </span>
    </Link>
  );
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

export function Navbar() {
  const { user, isAuthed, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = user ? LINKS[user.role] || [] : [];
  const roleLabel =
    user?.role === 'STUDENT' ? 'Student' : user?.role === 'FACULTY' ? 'Faculty / TPO' : user?.role === 'RECRUITER' ? 'Recruiter' : '';

  const onLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    cx(
      'relative px-1 py-1.5 text-sm font-medium transition border-b-2 -mb-[1px]',
      isActive
        ? 'border-gold text-navy'
        : 'border-transparent text-slatebody hover:text-navy'
    );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-borderc">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Logo small={false} />
            {isAuthed && (
              <nav className="hidden lg:flex items-center gap-6 h-16" aria-label="Primary">
                {links.map((l) => (
                  <NavLink key={l.to} to={l.to} className={linkClass} end={l.to.split('/').length === 3}>
                    {l.label}
                  </NavLink>
                ))}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isAuthed ? (
              <>
                <Link to="/demo" className="hidden sm:inline-flex text-sm font-semibold text-navy hover:text-navy-light transition">
                  View demo
                </Link>
                <Link to="/login" className="btn-ghost !py-2">
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary !py-2">
                  Get started
                </Link>
              </>
            ) : (
              <>
                <span className="hidden md:inline-flex text-xs font-medium text-slatemuted">{roleLabel}</span>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 border border-borderc bg-white hover:border-navy/30 transition"
                    aria-expanded={menuOpen}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                      {initials(user?.name)}
                    </span>
                    <svg className="w-3.5 h-3.5 text-slatemuted" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-56 rounded-xl border border-borderc bg-white p-1.5 shadow-cardhover z-20 animate-fade-in">
                        <div className="px-3 py-2 border-b border-borderc/70">
                          <p className="text-sm font-semibold text-navy truncate">{user?.name}</p>
                          <p className="text-xs text-slatemuted truncate">{user?.email}</p>
                        </div>
                        <div className="pt-1.5 space-y-0.5">
                          {user?.role === 'STUDENT' && (
                            <Link
                              to="/student/profile"
                              onClick={() => setMenuOpen(false)}
                              className="block px-3 py-2 text-sm text-slatebody rounded-lg hover:bg-pagebg hover:text-navy"
                            >
                              Profile &amp; skills
                            </Link>
                          )}
                          <Link
                            to="/settings"
                            onClick={() => setMenuOpen(false)}
                            className="block px-3 py-2 text-sm text-slatebody rounded-lg hover:bg-pagebg hover:text-navy"
                          >
                            Settings
                          </Link>
                          <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm text-danger rounded-lg hover:bg-danger/5">
                            Log out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* mobile links */}
        {isAuthed && (
          <nav className="lg:hidden -mx-1 flex gap-1 overflow-x-auto pb-2" aria-label="Primary mobile">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to.split('/').length === 3}
                className={({ isActive }) =>
                  cx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition',
                    isActive ? 'bg-bluetint text-navy' : 'text-slatebody hover:bg-pagebg'
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
