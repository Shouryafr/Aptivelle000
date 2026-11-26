import { Link } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { Card, EmptyState, LoadingBlock, PageTitle, Pill, RatingDots, StatCard, cx } from '../../components/ui';
import { NAVY, NAVY_LIGHT, VBars } from '../../components/charts';

export default function FacultyDashboard() {
  const { data, loading, error } = useData('/faculty/dashboard');

  if (loading) return <LoadingBlock rows={4} />;
  if (error || !data) return <EmptyState title="Couldn't load analytics" message={error} />;

  const { institute, totals, avgGapsByBranchYear, topRoles, topMissingSkills, curriculumRecommendations } = data;

  const topRoleColors = { 'Frontend Developer L1': NAVY, 'Backend Developer L1': NAVY_LIGHT, 'Data Analyst L1': '#E8B84B' };

  return (
    <div>
      <PageTitle
        title="Institute Dashboard"
        subtitle={`${institute} · anonymised analytics across student skill data, applications and recruiter feedback.`}
        actions={
          <>
            <Link to="/faculty/skills" className="btn-outline !py-2">
              Skill insights
            </Link>
            <Link to="/faculty/verifications" className="btn-primary !py-2">
              Verification queue
              {totals.pendingVerifications > 0 && (
                <span className="ml-1.5 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-ink">
                  {totals.pendingVerifications}
                </span>
              )}
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students mapped" value={totals.students} sub="at your institute" />
        <StatCard label="Applications" value={totals.applications} sub={`${totals.shortlisted} shortlisted · ${totals.completed} completed`} />
        <StatCard label="Open internships" value={totals.internships} sub="across partner companies" />
        <StatCard
          label="Recruiter readiness"
          value={totals.avgRating ? `${totals.avgRating}/5` : '—'}
          sub={`${totals.feedbackCount} feedback submissions`}
          icon={totals.avgRating ? <RatingDots rating={totals.avgRating} /> : undefined}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base">Average skill gap by branch &amp; year</h3>
            <Link to="/faculty/skills" className="text-xs font-semibold text-navy-light hover:text-navy">
              Drill down →
            </Link>
          </div>
          <p className="text-xs text-slatemuted mb-4">Average missing skills per student relative to their target roles.</p>
          <VBars
            data={avgGapsByBranchYear.map((g) => ({ name: g.label, 'Missing skills': g.avgGaps }))}
            xKey="name"
            bars={[{ key: 'Missing skills', name: 'Avg missing skills', color: NAVY }]}
            height={240}
          />
          <div className="grid grid-cols-2 gap-2 mt-3">
            {avgGapsByBranchYear.map((g) => (
              <div key={g.label} className="rounded-lg border border-borderc bg-pagebg px-3 py-2 text-center">
                <p className="text-[10px] font-semibold text-slatemuted uppercase">{g.label}</p>
                <p className="mt-0.5 text-sm font-bold text-navy">
                  {g.avgReadiness !== null ? `${g.avgReadiness}% ready` : '—'}
                </p>
                <p className="text-[10px] text-slatemuted">{g.students} students</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <h3 className="text-base mb-1">Most targeted roles</h3>
            <p className="text-xs text-slatemuted mb-4">Where students aim — and where gaps concentrate.</p>
            <div className="space-y-2.5">
              {topRoles.length === 0 && <p className="text-sm text-slatemuted py-2">No students have set target roles yet.</p>}
              {topRoles.map((r) => {
                const pct = totals.students ? Math.round((r.count / totals.students) * 100) : 0;
                return (
                  <div key={r.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-semibold text-navy">{r.name}</span>
                      <span className="text-xs text-slatemuted tabular-nums">
                        {r.count} student{r.count > 1 ? 's' : ''} · {pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-borderc overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: topRoleColors[r.name] || NAVY }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <h3 className="text-base mb-1">Top missing skills (all branches)</h3>
            <p className="text-xs text-slatemuted mb-3">Most common gaps preventing students from being job-ready.</p>
            {topMissingSkills.length === 0 ? (
              <p className="text-sm text-slatemuted py-2">No gaps detected — impressive cohort!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topMissingSkills.map((m) => (
                  <Pill key={m.skill} className="bg-danger/10 text-danger">
                    {m.skill} · {m.count} student{m.count > 1 ? 's' : ''}
                  </Pill>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Curriculum recommendations */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-lg">Curriculum recommendations</h3>
          <span className="rounded-full bg-gold/20 text-navy text-[10px] font-bold uppercase tracking-wide px-2 py-0.5">
            Auto-generated
          </span>
        </div>
        <p className="text-xs text-slatemuted mb-4">
          Rule-based insights derived from the most common skill gaps and recruiter feedback text.
        </p>
        {curriculumRecommendations.length === 0 ? (
          <EmptyState icon="🧭" title="No recommendations yet" message="Once students map skills and recruiters leave feedback, insights appear here." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {curriculumRecommendations.map((rec) => (
              <Card key={rec.id} className="p-5 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={cx(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      rec.source === 'FEEDBACK' ? 'bg-amber-50 text-amber-700' : 'bg-bluetint text-navy-light'
                    )}
                  >
                    {rec.source === 'FEEDBACK' ? 'From recruiter feedback' : 'From skill-gap data'}
                  </span>
                  <span
                    className={cx(
                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                      rec.severity === 'high' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                    )}
                  >
                    {rec.severity} priority
                  </span>
                </div>
                <h4 className="text-sm leading-snug">{rec.title}</h4>
                <p className="mt-1.5 text-xs text-slatebody leading-relaxed">{rec.detail}</p>
                <p className="mt-auto pt-3 text-[11px] text-slatemuted border-t border-borderc/70">{rec.evidence}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
