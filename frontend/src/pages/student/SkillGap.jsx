import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import {
  Card,
  EmptyState,
  LoadingBlock,
  PageTitle,
  ProficiencyPill,
  cx,
} from '../../components/ui';
import { ScoreRing, SkillRadar } from '../../components/charts';
import { useToast } from '../../context/ToastContext';

const TYPE_STYLES = {
  COURSE: 'bg-bluetint text-navy-light',
  PROJECT: 'bg-violet-50 text-violet-700',
  CERTIFICATION: 'bg-amber-50 text-amber-700',
};

function StatusDot({ status }) {
  if (status === 'met') return <span className="h-2 w-2 rounded-full bg-success inline-block shrink-0" title="Met" />;
  if (status === 'weak') return <span className="h-2 w-2 rounded-full bg-warning inline-block shrink-0" title="Below required level" />;
  return <span className="h-2 w-2 rounded-full bg-danger inline-block shrink-0" title="Missing" />;
}

export default function SkillGap() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const roleId = params.get('roleId');
  const [roles, setRoles] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/meta/roles').then((r) => {
      const list = r.data.roles;
      setRoles(list);
      if (!roleId && list.length) setParams({ roleId: list[0].id }, { replace: true });
    });
  }, []);

  useEffect(() => {
    if (!roleId) return;
    let cancelled = false;
    setLoading(true);
    api
      .get(`/student/skill-gap?roleId=${roleId}`)
      .then((r) => {
        if (!cancelled) setData(r.data);
      })
      .catch((e) => {
        if (!cancelled) toast(e.message, 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleId]);

  if (!roles) return <LoadingBlock rows={3} />;

  const current = roles.find((r) => String(r.id) === String(roleId));

  return (
    <div>
      <PageTitle
        title="Skill Gap Analysis"
        subtitle="See exactly where you stand against each target role — and the fastest way to close the gap."
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => setParams({ roleId: r.id })}
            className={cx(
              'rounded-xl border px-4 py-2 text-sm font-semibold transition',
              String(r.id) === String(roleId)
                ? 'border-gold bg-gold-soft text-navy ring-2 ring-gold/30'
                : 'border-borderc bg-white text-slatebody hover:border-navy/30'
            )}
          >
            {r.name}
            <span className="ml-2 text-[10px] font-medium text-slatemuted">{r.requirements.length} skills</span>
          </button>
        ))}
      </div>

      {loading && <LoadingBlock rows={4} />}

      {!loading && !data && !loading && roles && roleId && (
        <EmptyState title="No analysis yet" message="Pick a role above to run your readiness analysis." />
      )}

      {!loading && data && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="flex items-center gap-5 md:col-span-1">
              <ScoreRing value={data.overallMatch} size={108} label="readiness" />
              <div>
                <p className="text-sm font-bold leading-snug">{data.role.name}</p>
                <p className="text-xs text-slatemuted mt-1">
                  {data.met}/{data.total} required skills met at the right level
                </p>
              </div>
            </Card>
            <Card className="md:col-span-2">
              <div className="grid grid-cols-3 gap-2 h-full items-center">
                {[
                  { label: 'Ready', count: data.met, cls: 'text-success bg-success/10' },
                  { label: 'Level up', count: data.weak.length, cls: 'text-warning bg-warning/10' },
                  { label: 'Missing', count: data.missing.length, cls: 'text-danger bg-danger/10' },
                ].map((x) => (
                  <div key={x.label} className={cx('rounded-xl px-4 py-3 text-center', x.cls)}>
                    <p className="font-serif text-2xl tabular-nums">{x.count}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wide mt-0.5">{x.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="text-base mb-1">Required vs. current level</h3>
              <p className="text-xs text-slatemuted mb-3">
                Radar shows the target proficiency per skill (1 = beginner → 3 = advanced). Yellow is your level now.
              </p>
              <SkillRadar data={data.requiredVsCurrent} height={310} />
            </Card>

            <Card>
              <h3 className="text-base mb-1">Skill-by-skill check</h3>
              <p className="text-xs text-slatemuted mb-3">Where you sit relative to what {data.role.name} needs.</p>
              <div className="space-y-2">
                {data.requiredVsCurrent.map((row) => (
                  <div
                    key={row.skill}
                    className={cx(
                      'flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5',
                      row.status === 'met' ? 'border-success/20 bg-success/5' : row.status === 'weak' ? 'border-warning/25 bg-warning/5' : 'border-danger/20 bg-danger/5'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusDot status={row.status} />
                      <span className="text-sm font-semibold text-navy">{row.skill}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slatemuted uppercase font-semibold">need</span>
                      <ProficiencyPill proficiency={row.required} />
                      <span className="text-slatemuted text-xs">→</span>
                      {row.current ? (
                        <ProficiencyPill proficiency={row.current} />
                      ) : (
                        <span className="rounded-full bg-danger/10 text-danger px-2.5 py-0.5 text-[11px] font-semibold">None</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg mb-1">How to close each gap</h3>
            <p className="text-xs text-slatemuted mb-4">Hand-picked courses, projects and certifications for what&apos;s missing or weak.</p>
            {data.recommendations.length === 0 ? (
              <Card className="py-8 text-center">
                <p className="text-sm text-slatemuted">
                  🎉 You&apos;re fully ready for <span className="font-semibold text-navy">{data.role.name}</span> — no gaps to close.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {data.recommendations.map((rec) => (
                  <Card key={rec.skillName} className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-gold" />
                        <p className="text-sm font-extrabold text-navy">{rec.skillName}</p>
                        {rec.status === 'missing' ? (
                          <span className="rounded-full bg-danger/10 text-danger text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">missing</span>
                        ) : (
                          <span className="rounded-full bg-warning/10 text-warning text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">level up</span>
                        )}
                      </div>
                      <p className="text-xs text-slatemuted">
                        Need {rec.requiredProficiency.toLowerCase()}
                        {rec.currentProficiency ? ` · currently ${rec.currentProficiency.toLowerCase()}` : ' · not present'}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {rec.recommendations.map((r, i) => (
                        <div key={i} className="rounded-xl border border-borderc bg-pagebg p-3.5 flex flex-col">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide', TYPE_STYLES[r.type] || TYPE_STYLES.COURSE)}>
                              {r.type.toLowerCase()}
                            </span>
                            <span className="text-[11px] text-slatemuted truncate ml-2">{r.provider}</span>
                          </div>
                          <p className="mt-2 text-sm font-bold text-navy leading-snug">{r.title}</p>
                          {r.description && <p className="mt-1 text-xs text-slatebody leading-relaxed flex-1">{r.description}</p>}
                          {r.link && (
                            <a href={r.link} target="_blank" rel="noreferrer" className="mt-2 text-xs font-semibold text-navy-light hover:underline">
                              Open resource ↗
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!roleId && <EmptyState icon="🎯" title="Select a role to begin" message="Choose one of the role chips above to run your skill-gap analysis." />}
    </div>
  );
}
