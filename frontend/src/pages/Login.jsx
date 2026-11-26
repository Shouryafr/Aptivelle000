import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import { Button, Field } from '../components/ui';
import { Logo } from '../components/Navbar';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) {
    return <Navigate to={user.hasProfile ? ROLE_HOME[user.role] : '/onboarding'} replace />;
  }

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    if (!form.password) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      toast(`Welcome back, ${u.name.split(' ')[0]}!`);
      if (!u.hasProfile) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate(location.state?.from || ROLE_HOME[u.role], { replace: true });
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <div className="card p-7">
          <h1 className="text-xl text-center">Log in to Aptivelle</h1>
          <p className="text-center text-sm text-slatemuted mt-1 mb-6">Continue to your dashboard</p>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Email" error={errors.email}>
              <input className="input" type="email" autoComplete="email" placeholder="you@college.edu" value={form.email} onChange={onChange('email')} />
            </Field>
            <Field label="Password" error={errors.password}>
              <input className="input" type="password" autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={onChange('password')} />
            </Field>
            <Button type="submit" variant="primary" className="w-full !py-2.5" loading={busy}>
              {busy ? 'Logging in…' : 'Log in'}
            </Button>
          </form>
          <div className="mt-5 flex items-center justify-between text-sm">
            <Link to="/signup" className="font-semibold text-navy-light hover:text-navy transition">
              Create an account
            </Link>
            <Link to="/demo" className="text-slatemuted hover:text-navy transition">
              View demo credentials
            </Link>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-slatemuted">
          Demo accounts: student@aptivelle.in · faculty@aptivelle.in · recruiter@aptivelle.in (password demo1234)
        </p>
      </div>
    </div>
  );
}
