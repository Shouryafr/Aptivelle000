import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import { Button, Field, cx } from '../components/ui';
import { Logo } from '../components/Navbar';
import { useToast } from '../context/ToastContext';

const ROLES = [
  {
    key: 'STUDENT',
    title: 'Student',
    desc: 'Build your skill profile, find internships.',
    icon: '🎓',
  },
  {
    key: 'FACULTY',
    title: 'Faculty / TPO',
    desc: 'Analytics to guide curriculum & placements.',
    icon: '🏫',
  },
  {
    key: 'RECRUITER',
    title: 'Recruiter',
    desc: 'Post internships, find job-ready talent.',
    icon: '💼',
  },
];

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={user.hasProfile ? ROLE_HOME[user.role] : '/onboarding'} replace />;
  }

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (form.name.trim().length < 2) nextErrors.name = 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Enter a valid email address';
    if (form.password.length < 6) nextErrors.password = 'Use at least 6 characters';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      const u = await signup(form);
      toast(`Account created — welcome, ${u.name.split(' ')[0]}!`);
      navigate('/onboarding', { replace: true });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <div className="card p-7">
          <h1 className="text-xl text-center">Create your account</h1>
          <p className="text-center text-sm text-slatemuted mt-1 mb-6">Choose who you are — we tailor everything after this</p>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.key}
                  onClick={() => setForm((f) => ({ ...f, role: r.key }))}
                  className={cx(
                    'rounded-xl border p-3 text-left transition',
                    form.role === r.key
                      ? 'border-gold bg-gold-soft ring-2 ring-gold/40'
                      : 'border-borderc bg-white hover:border-navy/30'
                  )}
                >
                  <span className="text-lg">{r.icon}</span>
                  <p className="mt-1 text-xs font-bold text-navy">{r.title}</p>
                  <p className="text-[10px] text-slatemuted mt-0.5 leading-snug">{r.desc}</p>
                </button>
              ))}
            </div>
            <Field label="Full name" error={errors.name}>
              <input className="input" placeholder="Priya Sharma" value={form.name} onChange={onChange('name')} />
            </Field>
            <Field label="Email" error={errors.email}>
              <input className="input" type="email" placeholder="you@college.edu" value={form.email} onChange={onChange('email')} />
            </Field>
            <Field label="Password" error={errors.password} hint="Minimum 6 characters">
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={onChange('password')} />
            </Field>
            <Button type="submit" className="w-full !py-2.5" loading={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-slatemuted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-navy-light hover:text-navy transition">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
