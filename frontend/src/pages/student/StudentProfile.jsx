import { useMemo, useState } from 'react';
import { useData } from '../../hooks/useData';
import api from '../../api/client';
import {
  Button,
  Card,
  EmptyState,
  Field,
  LoadingBlock,
  PageTitle,
  Pill,
  ProficiencyPill,
  SkillPill,
  SourcePill,
  Spinner,
  VerifPill,
  VerifiedTick,
  cx,
} from '../../components/ui';
import { useToast } from '../../context/ToastContext';

const PROF_ORDER = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2 };

function SkillTagPicker({ selected, onChange, allSkills }) {
  const [q, setQ] = useState('');
  const list = allSkills.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input className="input mb-2" placeholder="Filter skills…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
        {list.map((s) => {
          const on = selected.includes(s.name);
          return (
            <button
              type="button"
              key={s.name}
              onClick={() => onChange(on ? selected.filter((x) => x !== s.name) : [...selected, s.name])}
              className={cx(
                'rounded-lg border px-2.5 py-1 text-xs font-medium transition',
                on ? 'border-gold bg-gold-soft text-navy' : 'border-borderc bg-white text-slatebody hover:border-navy/30'
              )}
            >
              {s.name}
            </button>
          );
        })}
        {!list.length && <p className="text-xs text-slatemuted px-1">No matching skills.</p>}
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const toast = useToast();
  const { data, loading, error, reload } = useData('/student/profile');
  const meta = useData('/meta/roles');
  const allSkills = useMemo(() => data?.profile?.skillOptions || [], [data]);

  // editable copies
  const [editing, setEditing] = useState(null);

  if (loading) return <LoadingBlock rows={5} />;
  if (error || !data) return <EmptyState title="Couldn't load profile" message={error} />;

  const { profile, skills, projects, courses } = data;
  const roleOptions = meta.data?.roles || [];

  // ---- actions ----
  const act = async (fn, successMsg) => {
    try {
      await fn();
      toast(successMsg);
      await reload();
      await meta.reload();
    } catch (e2) {
      toast(e2.message, 'error');
    }
  };

  return (
    <div className="max-w-5xl">
      <PageTitle
        title="Profile & Skills"
        subtitle="Your skills are the source of truth — every match, gap and recommendation flows from this page."
      />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6 min-w-0">
          {/* Personal info */}
          <PersonalCard profile={profile} roleOptions={roleOptions} onSaved={() => { toast('Profile saved.'); reload(); }} />

          {/* Resume */}
          <Card>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base">Resume text</h3>
                <p className="text-xs text-slatemuted mt-0.5">Paste your resume — we&apos;ll pull out any skills we recognise.</p>
              </div>
              {data?.resumeNotice && <Pill className="bg-bluetint text-navy-light">{data.resumeNotice}</Pill>}
            </div>
            <ResumeSection
              resumeText={profile.resumeText}
              skills={skills}
              onExtracted={(count) => {
                if (count) toast(`${count} new skill${count > 1 ? 's' : ''} added from your resume.`);
                else toast('No new skills found — try pasting more detail.', 'info');
                reload();
              }}
            />
          </Card>

          {/* Projects */}
          <Card>
            <SectionHead
              title="Projects"
              subtitle="Tag the skills each project proves — they count toward your profile."
              addLabel="Add project"
              onAdd={() => setEditing({ kind: 'project', item: null })}
            />
            {projects.length === 0 && (
              <p className="text-sm text-slatemuted py-3">No projects yet — add one to evidence your skills.</p>
            )}
            <div className="space-y-3">
              {projects.map((p) => (
                <EntryRow
                  key={p.id}
                  title={p.title}
                  meta={`${p.description ? p.description.slice(0, 90) + (p.description.length > 90 ? '…' : '') : 'No description'}`}
                  badges={p.skillsUsed}
                  onEdit={() => setEditing({ kind: 'project', item: p })}
                  onDelete={() => act(() => api.delete(`/student/projects/${p.id}`), 'Project removed.')}
                />
              ))}
            </div>
          </Card>

          {/* Courses & certifications */}
          <Card>
            <SectionHead
              title="Courses & certifications"
              subtitle="Add a certificate link so faculty can verify it — verified skills get a green badge for recruiters."
              addLabel="Add course"
              onAdd={() => setEditing({ kind: 'course', item: null })}
            />
            {courses.length === 0 && (
              <p className="text-sm text-slatemuted py-3">No courses yet. Certifications with links can be verified by faculty.</p>
            )}
            <div className="space-y-3">
              {courses.map((c) => (
                <div key={c.id} className="rounded-xl border border-borderc p-4 hover:border-navy/20 transition">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-navy">{c.title}</p>
                        <VerifPill status={c.verificationStatus} rejectedReason={c.rejectionReason} />
                      </div>
                      <p className="text-xs text-slatemuted mt-1">
                        {c.provider || 'Self-study'}
                        {c.certificateLink && (
                          <a href={c.certificateLink} target="_blank" rel="noreferrer" className="ml-2 text-navy-light font-semibold hover:underline">
                            View certificate ↗
                          </a>
                        )}
                        {c.link && c.link !== c.certificateLink && (
                          <a href={c.link} target="_blank" rel="noreferrer" className="ml-2 text-slatemuted hover:text-navy">
                            Course page
                          </a>
                        )}
                      </p>
                      {c.rejectionReason && c.verificationStatus === 'REJECTED' && (
                        <p className="mt-1.5 text-xs text-danger bg-danger/5 rounded-lg px-2 py-1.5 inline-block">
                          Reason: {c.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.verificationStatus !== 'VERIFIED' && (
                        <Button variant="ghost" className="!px-3 !py-1.5 !text-xs" onClick={() => setEditing({ kind: 'course', item: c })}>
                          Edit
                        </Button>
                      )}
                      <Button variant="ghost" className="!px-3 !py-1.5 !text-xs text-danger hover:bg-danger/5" onClick={() => act(() => api.delete(`/student/courses/${c.id}`), 'Course removed.')}>
                        Remove
                      </Button>
                    </div>
                  </div>
                  {c.skillNames.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {c.skillNames.map((s) => (
                        <SkillPill key={s} skill={{ name: s }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right rail: skill inventory */}
        <div className="min-w-0">
          <Card className="lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base">Skill inventory</h3>
              <Pill className="bg-bluetint text-navy-light">{skills.length} skills</Pill>
            </div>
            <p className="text-xs text-slatemuted mb-4">
              Set proficiency yourself, or earn <VerifiedTick /> verified badges through faculty-approved certificates.
            </p>
            <div className="space-y-2.5 max-h-[46rem] overflow-y-auto pr-1">
              {skills.length === 0 && (
                <EmptyState icon="🧩" title="No skills yet" message="Paste a resume above or add skills manually." />
              )}
              {skills
                .slice()
                .sort((a, b) => (a.isVerified === b.isVerified ? 0 : a.isVerified ? -1 : 1) || PROF_ORDER[b.proficiency] - PROF_ORDER[a.proficiency])
                .map((s) => (
                  <SkillRow
                    key={s.id}
                    skill={s}
                    onChange={(proficiency) => act(() => api.patch(`/student/skills/${s.id}`, { proficiency }), `Updated ${s.name}.`)}
                    onRemove={() => act(() => api.delete(`/student/skills/${s.id}`), `${s.name} removed.`)}
                  />
                ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit / add modals */}
      <EntryModal
        editing={editing}
        onClose={() => setEditing(null)}
        allSkills={allSkills}
        onSaved={(msg) => {
          toast(msg);
          setEditing(null);
          reload();
        }}
        onError={(m) => toast(m, 'error')}
      />
    </div>
  );
}

function SectionHead({ title, subtitle, addLabel, onAdd }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="text-base">{title}</h3>
        <p className="text-xs text-slatemuted mt-0.5 max-w-md">{subtitle}</p>
      </div>
      <Button variant="outline" className="!px-3 !py-1.5 !text-xs shrink-0" onClick={onAdd}>
        <span className="text-base leading-none mr-1">+</span> {addLabel}
      </Button>
    </div>
  );
}

function EntryRow({ title, meta, badges = [], onEdit, onDelete }) {
  return (
    <div className="rounded-xl border border-borderc p-4 hover:border-navy/20 transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-navy">{title}</p>
          {meta && <p className="text-xs text-slatemuted mt-1">{meta}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg text-slatemuted hover:bg-pagebg hover:text-navy" title="Edit">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.6 2.4a2 2 0 012.8 2.8L7 14.6l-3.5 1 1-3.5 9.1-9.7z" />
            </svg>
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-slatemuted hover:bg-danger/5 hover:text-danger" title="Delete">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 3a1 1 0 00-1 1v1H4.5a1 1 0 000 2h.3l.8 9.1A2 2 0 007.6 18h4.8a2 2 0 001.99-1.9l.81-9.1h.3a1 1 0 100-2H13V4a1 1 0 00-1-1H8zm2 5a1 1 0 011 1v5a1 1 0 11-2 0V9a1 1 0 011-1zm4 0a1 1 0 011 1v5a1 1 0 11-2 0V9a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      {badges.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <SkillPill key={b} skill={{ name: b }} />
          ))}
        </div>
      )}
    </div>
  );
}

function SkillRow({ skill, onChange, onRemove }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-borderc bg-pagebg px-3 py-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm font-medium text-navy truncate">{skill.name}</span>
        {skill.isVerified && <VerifiedTick />}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <select
          className="rounded-lg border border-borderc bg-white px-1.5 py-1 text-[11px] font-semibold text-navy focus:outline-none"
          value={skill.proficiency}
          onChange={(e) => onChange(e.target.value)}
          title={`${skill.name} proficiency`}
        >
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
        </select>
        <button onClick={onRemove} className="p-1 rounded-md text-slatemuted hover:text-danger" title="Remove skill">
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.3 5.2a1 1 0 00-1.4 1.4L8.6 10l-3.7 3.4a1 1 0 101.4 1.4L10 11.4l3.4 3.4a1 1 0 001.4-1.4L11.4 10l3.4-3.4a1 1 0 00-1.4-1.4L10 8.6 6.6 5.2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ---- Resume & extraction ----
function ResumeSection({ resumeText, skills, onExtracted }) {
  const toast = useToast();
  const [text, setText] = useState(resumeText);
  const [busy, setBusy] = useState(false);
  const [matches, setMatches] = useState(null);
  const [saving, setSaving] = useState(false);

  const saveText = async () => {
    setSaving(true);
    try {
      await api.put('/student/profile', { resumeText: text });
      toast('Resume saved.');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const extract = async () => {
    setBusy(true);
    try {
      const res = await api.post('/student/skills/extract', { text });
      const fresh = res.data.matches || [];
      const freshNew = fresh.filter((m) => !m.owned);
      // Auto-add new matches (single-click wow for demos).
      for (const m of freshNew) {
        await api.post('/student/skills', {
          skillId: m.skillId,
          proficiency: m.suggestedProficiency,
          source: 'RESUME',
        });
      }
      setMatches(fresh);
      onExtracted(freshNew.length);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <textarea
        className="input min-h-[150px] resize-y text-[13px] leading-relaxed"
        placeholder="Paste your resume text here — projects, coursework, internships…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="gold" onClick={saveText} loading={saving}>
          Save resume
        </Button>
        <Button variant="outline" onClick={extract} loading={busy}>
          {busy ? (
            'Scanning…'
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.9 3.5l4.8 4.8a1 1 0 01-1.4 1.4l-4.8-4.8A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              Extract skills
            </>
          )}
        </Button>
        {skills.length > 0 && (
          <span className="text-xs text-slatemuted ml-auto">
            {skills.filter((s) => s.source === 'RESUME').length} from resume · {skills.length} total
          </span>
        )}
      </div>
      {matches && (
        <div className="mt-4 rounded-xl bg-pagebg border border-borderc p-3.5">
          <p className="text-xs font-bold text-navy mb-2">
            Skills recognised in your text ({matches.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {matches.length === 0 && <span className="text-xs text-slatemuted">None of the framework skills matched yet.</span>}
            {matches.map((m) => (
              <Pill
                key={m.skillId}
                className={m.owned ? 'bg-slate-100 text-slate-500' : 'bg-success/10 text-success'}
              >
                {m.name} ×{m.count}
                {m.owned ? ' (already have)' : ' +added'}
              </Pill>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Personal info card ----
function PersonalCard({ profile, roleOptions, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: profile.name,
    institute: profile.institute,
    branch: profile.branch,
    year: profile.year,
    targetRoles: profile.targetRoles || [],
  });
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleRole = (name) =>
    setForm((f) => ({
      ...f,
      targetRoles: f.targetRoles.includes(name) ? f.targetRoles.filter((x) => x !== name) : [...f.targetRoles, name].slice(-3),
    }));

  const save = async () => {
    setBusy(true);
    try {
      await api.put('/student/profile', { ...form });
      onSaved();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h3 className="text-base mb-4">Personal information</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input className="input" value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Institute / college">
          <input className="input" value={form.institute} onChange={set('institute')} />
        </Field>
        <Field label="Branch">
          <input className="input" value={form.branch} onChange={set('branch')} />
        </Field>
        <Field label="Year">
          <select className="input" value={form.year} onChange={set('year')}>
            {['1st', '2nd', '3rd', '4th', '5th'].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-4">
        <p className="label">Target roles (1–3)</p>
        <div className="flex flex-wrap gap-2">
          {roleOptions.map((r) => {
            const on = form.targetRoles.includes(r.name);
            return (
              <button
                type="button"
                key={r.id}
                onClick={() => toggleRole(r.name)}
                className={cx(
                  'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                  on ? 'border-gold bg-gold-soft text-navy' : 'border-borderc text-slatebody hover:border-navy/30'
                )}
              >
                {r.name}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-5">
        <Button onClick={save} loading={busy}>
          Save changes
        </Button>
      </div>
    </Card>
  );
}

// ---- Add/Edit project or course ----
function EntryModal({ editing, onClose, allSkills, onSaved, onError }) {
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset when opening a different entry.
  const key = editing ? `${editing.kind}-${editing.item?.id || 'new'}` : 'none';
  const [lastKey, setLastKey] = useState(null);
  if (key !== lastKey) {
    setLastKey(key);
    if (editing) {
      const it = editing.item || {};
      setForm(
        editing.kind === 'project'
          ? { title: it.title || '', description: it.description || '', link: it.link || '', skillsUsed: it.skillsUsed || [] }
          : {
              title: it.title || '',
              provider: it.provider || '',
              link: it.link || '',
              certificateLink: it.certificateLink || '',
              skillNames: it.skillNames || [],
            }
      );
    }
  }

  if (!editing) return null;
  const isCourse = editing.kind === 'course';
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      onError('Title is required.');
      return;
    }
    if (isCourse && !form.certificateLink?.trim()) {
      onError('Add a certificate link so faculty can verify this course.');
      return;
    }
    setSaving(true);
    try {
      if (editing.item) {
        await api.put(`/student/${isCourse ? 'courses' : 'projects'}/${editing.item.id}`, form);
        onSaved(isCourse ? 'Course updated.' : 'Project updated.');
      } else {
        await api.post(`/student/${isCourse ? 'courses' : 'projects'}`, form);
        onSaved(isCourse ? 'Course added — it is now pending faculty verification.' : 'Project added.');
      }
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tagKey = isCourse ? 'skillNames' : 'skillsUsed';

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-2xl sm:rounded-2xl shadow-cardhover animate-slide-up max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-2 sticky top-0 bg-white border-b border-borderc/60">
          <h3 className="text-lg">
            {editing.item ? `Edit ${isCourse ? 'course' : 'project'}` : `Add ${isCourse ? 'course / certification' : 'project'}`}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slatemuted hover:bg-slate-100 hover:text-navy transition" aria-label="Close">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.3 5.2a1 1 0 00-1.4 1.4L8.6 10l-3.7 3.4a1 1 0 101.4 1.4L10 11.4l3.4 3.4a1 1 0 001.4-1.4L11.4 10l3.4-3.4a1 1 0 00-1.4-1.4L10 8.6 6.6 5.2z" />
            </svg>
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4" noValidate>
          <Field label={isCourse ? 'Course / certification title' : 'Project title'} required>
            <input className="input" value={form.title || ''} onChange={set('title')} placeholder={isCourse ? 'e.g. Google Data Analytics Certificate' : 'e.g. College events ticketing API'} />
          </Field>
          {isCourse ? (
            <Field label="Provider / platform">
              <input className="input" value={form.provider || ''} onChange={set('provider')} placeholder="e.g. Coursera, Udemy, NPTEL" />
            </Field>
          ) : (
            <Field label="Short description">
              <textarea className="input min-h-[90px]" value={form.description || ''} onChange={set('description')} placeholder="What did you build, and what did it prove?" />
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={isCourse ? 'Course link' : 'Project link'}>
              <input className="input" value={form.link || ''} onChange={set('link')} placeholder="https://…" />
            </Field>
            {isCourse && (
              <Field label="Certificate link" required hint="Faculty verify from this URL — auto-submitted for review.">
                <input className="input" value={form.certificateLink || ''} onChange={set('certificateLink')} placeholder="https://certificate-url" />
              </Field>
            )}
          </div>
          <Field label={`Skills ${isCourse ? 'covered by this course' : 'used in this project'}`} hint="Tagged skills count toward your profile.">
            {allSkills.length === 0 ? (
              <LoadingBlock rows={1} />
            ) : (
              <SkillTagPicker selected={form[tagKey] || []} onChange={(list) => setForm((f) => ({ ...f, [tagKey]: list }))} allSkills={allSkills} />
            )}
          </Field>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="gold" loading={saving}>
              {editing.item ? 'Save changes' : isCourse ? 'Add & submit for verification' : 'Add project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
