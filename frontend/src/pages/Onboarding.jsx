import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import api from '../api/client';
import { Button, Field, LoadingBlock, cx } from '../components/ui';
import { Logo } from '../components/Navbar';
import { useToast } from '../context/ToastContext';

const ROLE_META = {
  STUDENT: {
    title: 'Set up your student profile',
    sub: 'Tell us where you study and where you want to go. We map the rest.',
    fields: ['institute', 'branch', 'year', 'targetRoles'],
    endpoint: '/onboarding/student',
  },
  FACULTY: {
    title: 'Set up your faculty profile',
    sub: 'Connect your institute so you can see its analytics and verify student certifications.',
    fields: ['institute', 'department', 'designation'],
    endpoint: '/onboarding/faculty',
  },
  RECRUITER: {
    title: 'Set up your recruiter profile',
    sub: 'Tell us where you hire from — companies show on every posting you create.',
    fields: ['company', 'designation', 'companyWebsite'],
    endpoint: '/onboarding/recruiter',
  },
};

const PLACEHOLDERS = {
  institute: 'e.g. Indus Institute of Technology',
  branch: 'e.g. CSE',
  year: 'e.g. 3rd',
  department: 'e.g. Computer Science',
  designation: 'e.g. Training & Placement Officer',
  company: 'e.g. Zephyr Technologies',
  companyWebsite: 'https://your-company.com',
};

const INSTITUTES = ['Indus Institute of Technology', 'Pacific Institute of Engineering'];

const YEARS = ['1st', '2nd', '3rd', '4th', '5th'];

export default function Onboarding() {
  const { user, refreshMe, homePath } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [roles, setRoles] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/meta/roles').then((r) => setRoles(r.data.roles)).catch(() => setRoles([]));
  }, []);

  if (!user) return <Navigate to="/login" replace />;
  if (user.hasProfile) return <Navigate to={homePath} replace />;

  const meta = ROLE_META[user.role];
  if (!meta) return <Navigate to="/" replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleRole = (name) => {
    setForm((f) => {
      const cur = Array.isArray(f.targetRoles) ? f.targetRoles : [];
      return {
        ...f,
        targetRoles: cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name],
      };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!String(form.institute || '').trim()) next.institute = 'Institute is required';
    if (user.role === 'STUDENT') {
      if (!String(form.branch || '').trim()) next.branch = 'Branch is required';
      if (!String(form.year || '').trim()) next.year = 'Select your current year';
      if (!Array.isArray(form.targetRoles) || form.targetRoles.length === 0) {
        next.targetRoles = 'Pick at least one target role';
      }
    }
    if (user.role === 'FACULTY') {
      if (!String(form.department || '').trim()) next.department = 'Department is required';
      if (!String(form.designation || '').trim()) next.designation = 'Designation is required';
    }
    if (user.role === 'RECRUITER') {
      if (!String(form.company || '').trim()) next.company = 'Company is required';
      if (!String(form.designation || '').trim()) next.designation = 'Designation is required';
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await api.post(meta.endpoint, form);
      await refreshMe();
      toast('Profile complete — welcome to your dashboard!');
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const isStudent = user.role === 'STUDENT';

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10">
      <div className="w-full max-w-xl">
        <div className="flex justify-center mb-5">
          <Logo />
        </div>
        <div className="card p-7 sm:p-9">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-bluetint text-navy-light text-[11px] font-bold uppercase tracking-wide px-3 py-1">
            Step 2 · Onboarding
          </span>
          <h1 className="mt-3 text-xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-slatemuted">{meta.sub}</p>

          <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
            <Field label={isStudent ? 'Institute / college' : 'Institute'} required error={errors.institute}>
              <input
                className="input"
                list="institutes"
                placeholder={PLACEHOLDERS.institute}
                value={form.institute || ''}
                onChange={set('institute')}
              />
              <datalist id="institutes">
                {INSTITUTES.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </Field>

            {isStudent && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Branch" required error={errors.branch}>
                  <input className="input" placeholder={PLACEHOLDERS.branch} value={form.branch || ''} onChange={set('branch')} />
                </Field>
                <Field label="Year" required error={errors.year}>
                  <select className="input" value={form.year || ''} onChange={set('year')}>
                    <option value="" disabled>
                      Select year
                    </option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y} year
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

            {isStudent && (
              <Field label="Target roles (1–3)" required error={errors.targetRoles} hint="Pick the roles you want to be job-ready for.">
                {roles === null ? (
                  <LoadingBlock rows={1} />
                ) : (
                  <div className="grid gap-2 sm:grid-cols-3">
                    {roles.map((r) => (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => toggleRole(r.name)}
                        className={cx(
                          'rounded-xl border px-3 py-3 text-left transition',
                          (form.targetRoles || []).includes(r.name)
                            ? 'border-gold bg-gold-soft ring-2 ring-gold/40'
                            : 'border-borderc bg-white hover:border-navy/30'
                        )}
                      >
                        <p className="text-xs font-bold text-navy">{r.name}</p>
                        <p className="text-[10px] text-slatemuted mt-1 leading-snug line-clamp-2">
                          {r.requirements.length} required skills
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </Field>
            )}

            {user.role === 'FACULTY' && (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Department" required error={errors.department}>
                  <input className="input" placeholder={PLACEHOLDERS.department} value={form.department || ''} onChange={set('department')} />
                </Field>
                <Field label="Designation" required error={errors.designation}>
                  <input className="input" placeholder={PLACEHOLDERS.designation} value={form.designation || ''} onChange={set('designation')} />
                </Field>
              </div>
            )}

            {user.role === 'RECRUITER' && (
              <>
                <Field label="Company" required error={errors.company}>
                  <input className="input" placeholder={PLACEHOLDERS.company} value={form.company || ''} onChange={set('company')} />
                </Field>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your designation" required error={errors.designation}>
                    <input className="input" placeholder={PLACEHOLDERS.designation} value={form.designation || ''} onChange={set('designation')} />
                  </Field>
                  <Field label="Company website" error={errors.companyWebsite}>
                    <input className="input" type="url" placeholder={PLACEHOLDERS.companyWebsite} value={form.companyWebsite || ''} onChange={set('companyWebsite')} />
                  </Field>
                </div>
              </>
            )}

            <Button type="submit" className="w-full !py-3" loading={busy}>
              {busy ? 'Saving…' : 'Complete setup'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
