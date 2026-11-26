import { useMemo, useState } from 'react';
import api from '../../api/client';
import { useData } from '../../hooks/useData';
import { Button, Card, EmptyState, LoadingBlock, MatchBadge, PageTitle, SkillPill, StatusPill, cx } from '../../components/ui';
import { formatStipend } from '../../components/charts';
import { useToast } from '../../context/ToastContext';

const ROLES = ['Frontend Developer L1', 'Backend Developer L1', 'Data Analyst L1'];

export default function Internships() {
  const toast = useToast();
  const { data, loading, reload } = useData('/student/internships');
  const meta = useData('/meta/skills');
  const [filters, setFilters] = useState({ role: '', skill: '', location: '', minStipend: '' });
  const [applying, setApplying] = useState(null);

  const skillNames = useMemo(() => (meta.data?.skills || []).map((s) => s.name), [meta.data]);

  const apply = async (internshipId) => {
    setApplying(internshipId);
    try {
      await api.post('/student/applications', { internshipId });
      toast('Application submitted! The recruiter has been notified.');
      reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setApplying(null);
    }
  };

  const internships = (data?.internships || []).filter((i) => {
    if (filters.role && !i.targetRoles.includes(filters.role)) return false;
    if (filters.skill && !i.requiredSkills.some((s) => s.toLowerCase().includes(filters.skill.toLowerCase()))) return false;
    if (filters.location && !i.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (filters.minStipend && (i.stipend ?? 0) < Number(filters.minStipend)) return false;
    return true;
  });

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <PageTitle
        title="Internships & Projects"
        subtitle="Every listing shows a live match % — computed from the skills on your profile."
      />

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="label">Target role</label>
            <select className="input" value={filters.role} onChange={set('role')}>
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Required skill</label>
            <select className="input" value={filters.skill} onChange={set('skill')}>
              <option value="">Any skill</option>
              {skillNames.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="e.g. Remote, Pune" value={filters.location} onChange={set('location')} />
          </div>
          <div>
            <label className="label">Min stipend (₹/mo)</label>
            <select className="input" value={filters.minStipend} onChange={set('minStipend')}>
              <option value="">Any</option>
              <option value="5000">₹5,000+</option>
              <option value="10000">₹10,000+</option>
              <option value="15000">₹15,000+</option>
              <option value="20000">₹20,000+</option>
            </select>
          </div>
          <div className="flex items-end">
            {(filters.role || filters.skill || filters.location || filters.minStipend) && (
              <button onClick={() => setFilters({ role: '', skill: '', location: '', minStipend: '' })} className="btn-ghost !py-2 !px-3 w-full">
                Clear filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : internships.length === 0 ? (
        <EmptyState
          icon="🔎"
          title="No internships match these filters"
          message="Try widening the location, removing the skill filter, or level up a missing skill on your profile."
        />
      ) : (
        <div className="space-y-4">
          {internships.map((i) => (
            <Card key={i.id} className="p-5 hover:shadow-cardhover transition">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base">{i.title}</h2>
                    {i.appliedStatus ? (
                      <StatusPill status={i.appliedStatus} />
                    ) : (
                      <MatchBadge value={i.matchPct} />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slatemuted">{i.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slatebody">
                    <span className="inline-flex items-center gap-1.5 font-medium text-navy">
                      <svg className="w-4 h-4 text-slatemuted" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm5-1a1 1 0 00-1-1H9a1 1 0 00-1 1v1h3V5z" clipRule="evenodd" />
                      </svg>
                      {i.company}
                    </span>
                    <span>📍 {i.location}</span>
                    <span>⏱ {i.duration}</span>
                    <span className={cx('font-semibold', (i.stipend ?? 0) > 0 ? 'text-success' : 'text-slatemuted')}>
                      {formatStipend(i.stipend)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {i.appliedStatus ? (
                    <span className="text-xs font-semibold text-slatemuted">✓ Applied</span>
                  ) : (
                    <Button variant="gold" loading={applying === i.id} onClick={() => apply(i.id)}>
                      Apply now
                    </Button>
                  )}
                  {!i.appliedStatus && i.matchPct >= 75 && (
                    <span className="text-[11px] font-semibold text-success">★ Strong fit</span>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-borderc/70 flex flex-wrap gap-1.5 items-center">
                {i.requiredSkills.map((s) => (
                  <SkillPill key={s} skill={{ name: s }} />
                ))}
                {i.targetRoles.map((r) => (
                  <span key={r} className="rounded-full bg-navy text-gold text-[10px] font-bold px-2 py-0.5 ml-1">
                    {r}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
