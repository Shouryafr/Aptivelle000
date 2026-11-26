import { Link } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { Card, EmptyState, LoadingBlock, PageTitle, StatCard, StatusPill, cx } from '../../components/ui';
import { HBarChart, NAVY } from '../../components/charts';

export default function RecruiterDashboard() {
  const { data, loading, error } = useData('/recruiter/dashboard');

  if (loading) return <LoadingBlock rows={4} />;
  if (error || !data) return <EmptyState title="Couldn't load your dashboard" message={error} />;

  const { company, totals, internships, applicantSkillDistribution } = data;

  return (
    <div>
      <PageTitle
        title={`Hiring at ${company}`}
        subtitle="Your internship postings, applicant funnel and what your candidate pool looks like."
        actions={
          <>
            <Link to="/recruiter/internships" className="btn-outline !py-2">
              Manage internships
            </Link>
            <Link to="/recruiter/post-internship" className="btn-gold !py-2">
              + Post internship
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Internships posted" value={totals.internships} sub="live right now" />
        <StatCard label="Applications received" value={totals.applications} sub={`${totals.shortlisted} shortlisted`} />
        <StatCard label="Average applicant match" value={totals.avgMatchPct !== null ? `${totals.avgMatchPct}%` : '—'} sub="vs. your required skills" />
        <StatCard label="Completed internships" value={totals.completed} sub="feedback expected" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h3 className="text-lg mb-3">Your postings</h3>
          {internships.length === 0 ? (
            <EmptyState
              icon="📌"
              title="No internships posted yet"
              message="Post your first internship — it takes under a minute."
              action={
                <Link to="/recruiter/post-internship" className="btn-primary inline-flex">
                  Post an internship
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {internships.map((i) => (
                <Card key={i.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm">{i.title}</h4>
                        {i.statusCounts.APPLIED + i.statusCounts.SHORTLISTED + i.statusCounts.REJECTED + i.statusCounts.COMPLETED === 0 && (
                          <span className="rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5">No applicants yet</span>
                        )}
                      </div>
                      <p className="text-xs text-slatemuted mt-0.5">
                        {i.location} · {i.duration}
                        {i.avgMatchPct !== null && <> · avg applicant match {i.avgMatchPct}%</>}
                      </p>
                    </div>
                    <Link to={`/recruiter/internship/${i.id}/applicants`} className="btn-outline !py-2 !text-xs">
                      View applicants
                      {i.applicationsCount > 0 && (
                        <span className="ml-1.5 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-ink">{i.applicationsCount}</span>
                      )}
                    </Link>
                  </div>
                  {i.applicationsCount > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[
                        ['APPLIED', 'Applied'],
                        ['SHORTLISTED', 'Shortlisted'],
                        ['COMPLETED', 'Completed'],
                        ['REJECTED', 'Rejected'],
                      ].map(([st, label]) =>
                        i.statusCounts[st] > 0 ? (
                          <span key={st} className="inline-flex items-center gap-1.5 rounded-full border border-borderc bg-pagebg px-2.5 py-1">
                            <StatusPill status={st} />
                            <span className="text-xs font-bold text-navy tabular-nums">{i.statusCounts[st]}</span>
                          </span>
                        ) : null
                      )}
                      {i.feedbackCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-1">
                          {i.feedbackCount} feedback · {i.avgRating}/5
                        </span>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="self-start">
          <h3 className="text-base mb-1">Applicant skill distribution</h3>
          <p className="text-xs text-slatemuted mb-4">What your candidate pool actually knows.</p>
          {applicantSkillDistribution.length === 0 ? (
            <p className="text-sm text-slatemuted py-4 text-center">Skills appear here once you receive applications.</p>
          ) : (
            <HBarChart
              data={applicantSkillDistribution.slice(0, 9).map((d) => ({ name: d.skill, Applicants: d.count }))}
              dataKey="Applicants"
              colorBy={() => NAVY}
              height={280}
            />
          )}
          <p className="text-[11px] text-slatemuted mt-1">Top skills across all applicants on your postings.</p>
        </Card>
      </div>
    </div>
  );
}
