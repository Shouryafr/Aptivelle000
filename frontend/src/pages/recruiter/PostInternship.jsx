import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useData } from '../../hooks/useData';
import { Button, Card, EmptyState, Field, LoadingBlock, PageTitle, cx } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

export default function PostInternship() {
  const navigate = useNavigate();
  const toast = useToast();
  const skills = useData('/meta/skills');
  const roles = useData('/meta/roles');

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    stipend: '',
    duration: '6 months',
    requiredSkills: [],
    targetRoles: [],
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggle = (k, value) =>
    setForm((f) => ({
      ...f,
      [k]: f[k].includes(value) ? f[k].filter((x) => x !== value) : [...f[k], value],
    }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.title.trim().length < 3) errs.title = 'Give the role a clear title';
    if (form.description.trim().length < 10) errs.description = 'Describe the role (min 10 characters)';
    if (!form.location.trim()) errs.location = 'Location is required (Remote works too)';
    if (!form.duration.trim()) errs.duration = 'Duration is required';
    if (form.requiredSkills.length === 0) errs.requiredSkills = 'Pick at least one required skill';
    if (form.targetRoles.length === 0) errs.targetRoles = 'Pick at least one target role';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      const payload = {
        ...form,
        stipend: form.stipend === '' ? null : Number(form.stipend),
      };
      await api.post('/recruiter/internships', payload);
      toast('Internship posted! Applicants will be ranked by match % automatically.');
      navigate('/recruiter/internships');
    } catch (err2) {
      toast(err2.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (skills.loading || roles.loading) return <LoadingBlock rows={3} />;

  return (
    <div className="max-w-3xl">
      <PageTitle
        title="Post an Internship"
        subtitle="Candidates are matched against your required skills the moment they apply."
      />

      <form onSubmit={submit} className="space-y-5" noValidate>
        <Card>
          <h3 className="text-base mb-4">Role details</h3>
          <div className="space-y-4">
            <Field label="Internship title" required error={errors.title}>
              <input className="input" placeholder="e.g. Frontend Developer Intern (React.js)" value={form.title} onChange={set('title')} />
            </Field>
            <Field label="Description" required error={errors.description}>
              <textarea
                className="input min-h-[120px]"
                placeholder="What will the intern do? What do they learn? What does success look like?"
                value={form.description}
                onChange={set('description')}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Location" required error={errors.location}>
                <input className="input" placeholder="Remote / Bengaluru" value={form.location} onChange={set('location')} />
              </Field>
              <Field label="Stipend (₹/month)" error={errors.stipend} hint="Leave blank for unpaid">
                <input className="input" type="number" min="0" placeholder="15000" value={form.stipend} onChange={set('stipend')} />
              </Field>
              <Field label="Duration" required error={errors.duration}>
                <select className="input" value={form.duration} onChange={set('duration')}>
                  {['1 month', '2 months', '3 months', '6 months', 'Flexible'].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-base mb-1">Required skills</h3>
          <p className="text-xs text-slatemuted mb-4">Applicant match % is computed against these. Pick 3–8.</p>
          {errors.requiredSkills && <p className="text-xs text-danger mb-2">{errors.requiredSkills}</p>}
          <div className="flex flex-wrap gap-2">
            {(skills.data?.skills || []).map((s) => {
              const on = form.requiredSkills.includes(s.name);
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggle('requiredSkills', s.name)}
                  className={cx(
                    'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                    on ? 'border-gold bg-gold-soft text-navy' : 'border-borderc text-slatebody hover:border-navy/30'
                  )}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-base mb-1">Target roles</h3>
          <p className="text-xs text-slatemuted mb-4">Which career frameworks does this role fit? Students see it in browsing filters.</p>
          {errors.targetRoles && <p className="text-xs text-danger mb-2">{errors.targetRoles}</p>}
          <div className="flex flex-wrap gap-2">
            {(roles.data?.roles || []).map((r) => {
              const on = form.targetRoles.includes(r.name);
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => toggle('targetRoles', r.name)}
                  className={cx(
                    'rounded-xl border px-4 py-2 text-sm font-semibold transition flex items-center gap-2',
                    on ? 'border-navy bg-navy text-white' : 'border-borderc text-slatebody hover:border-navy/40'
                  )}
                >
                  {on && (
                    <svg className="w-4 h-4 text-gold" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {r.name}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <Button type="submit" variant="gold" loading={busy} className="!px-8">
            {busy ? 'Posting…' : 'Post internship'}
          </Button>
        </div>
      </form>
    </div>
  );
}
