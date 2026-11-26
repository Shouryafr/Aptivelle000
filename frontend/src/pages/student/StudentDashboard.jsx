import { Link } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import {
  Card,
  EmptyState,
  LoadingBlock,
  MatchBadge,
  PageTitle,
  SkillPill,
  StatCard,
  StatusPill,
  VerifiedTick,
} from '../../components/ui';
import { ScoreRing, formatStipend } from '../../components/charts';

export default function StudentDashboard() {
  const { data, loading, error } = useData('/student/dashboard');

  if (loading) return <LoadingBlock rows={4} />;
  if (error || !data) {
    return <EmptyState title="Couldn't load your dashboard" message={error} />;
  }

  const { profile, readiness, recommendedInternships, applicationCounts, skillSummary } = data;
  const first = profile?.name?.split(' ')[0] || 'there';
  const appRows = [
    { status: 'APPLIED', label: 'Applied', count: applicationCounts.APPLIED },
    { status: 'SHORTLISTED', label: 'Shortlisted', count: applicationCounts.SHORTLISTED },
    { status: 'COMPLETED', label: 'Completed', count: applicationCounts.COMPLETED },
    { status: 'REJECTED', label: 'Rejected', count: applicationCounts.REJECTED },
  ];

  return (
    <div>
      <PageTitle
        title={`Good to see you, ${first} 👋`}
        subtitle={`${profile.institute} · ${profile.branch} ${profile.year}`}
        actions={
          <>
            <Link to="/student/profile" className="btn-outline !py-2">
              Edit profile
            </Link>
            <Link to="/student/skill-gap" className="btn-primary !py-2">
              View skill gap
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Skills mapped"
          value={skillSummary.total}
          sub={`${skillSummary.verifiedCount} verified`}
          icon={
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[11px] font-bold text-success">
              <VerifiedTick /> {skillSummary.verifiedCount}
            </span>
          }
        />
        <StatCard label="Applications" value={applicationCounts.total} sub={`${applicationCounts.SHORTLISTED} shortlisted so far`} />
        <StatCard
          label="Certifications"
          value={skillSummary.coursesCount}
          sub={
            skillSummary.pendingVerifications
              ? `${skillSummary.pendingVerifications} awaiting verification`
              : 'all reviewed'
          }
        />
        <StatCard label="Projects" value={skillSummary.projectsCount} sub="tagged with skills" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: readiness + internships */}
        <div className="space-y-6 min-w-0">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg">Readiness for your target roles</h2>
              <Link to="/student/skill-gap" className="text-sm font-semibold text-navy-light hover:text-navy">
                Analyse gaps →
              </Link>
            </div>
            {readiness.length === 0 && (
              <Card className="py-6 text-center">
                <p className="text-sm text-slatemuted">No target roles selected yet.</p>
                <Link to="/student/profile" className="btn-outline mt-4 !py-2">
                  Pick target roles
                </Link>
              </Card>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {readiness.map((r) => (
                <Card key={r.roleId} className="flex items-center gap-5">
                  <ScoreRing value={r.overallMatch} size={92} sub="ready" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-snug">{r.roleName}</p>
                    <p className="mt-1 text-xs text-slatemuted">
                      {r.missingCount} missing · {r.weakCount} to level up
                    </p>
                    <Link
                      to={`/student/skill-gap?roleId=${r.roleId}`}
                      className="mt-2 inline-flex text-xs font-semibold text-navy-light hover:text-navy"
                    >
                      {r.missingCount + r.weakCount > 0 ? 'Close the gap →' : 'All clear → view chart'}
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg">Top internships for you</h2>
              <Link to="/student/internships" className="text-sm font-semibold text-navy-light hover:text-navy">
                Browse all →
              </Link>
            </div>
            {recommendedInternships.length === 0 ? (
              <EmptyState icon="💼" title="No internships match yet" message="Add more skills or adjust your target roles to unlock recommendations." />
            ) : (
              <div className="space-y-3">
                {recommendedInternships.map((i) => (
                  <Card key={i.id} className="flex flex-wrap items-center gap-4 p-4 hover:shadow-cardhover hover:-translate-y-0.5 transition">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm text-navy">{i.title}</h3>
                        <MatchBadge value={i.matchPct} />
                      </div>
                      <p className="mt-1 text-xs text-slatemuted">
                        {i.company} · {i.location} · {i.duration} · {formatStipend(i.stipend)}
                      </p>
                    </div>
                    <Link to="/student/internships" className="btn-primary !py-2 !px-3 !text-xs">
                      View &amp; apply
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right rail */}
        <div className="space-y-6 min-w-0">
          <Card>
            <h3 className="text-sm mb-3">Application status</h3>
            {applicationCounts.total === 0 ? (
              <p className="text-sm text-slatemuted py-2">
                You haven&apos;t applied anywhere yet.{' '}
                <Link to="/student/internships" className="font-semibold text-navy-light">
                  Find internships
                </Link>
                .
              </p>
            ) : (
              <div className="space-y-2.5">
                {appRows.map((a) => (
                  <div key={a.status} className="flex items-center justify-between">
                    <StatusPill status={a.status} />
                    <span className="text-sm font-bold text-navy tabular-nums">{a.count}</span>
                  </div>
                ))}
                <Link to="/student/applications" className="mt-2 block text-center text-xs font-semibold text-navy-light hover:text-navy pt-1">
                  View all applications
                </Link>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-sm mb-3 flex items-center gap-2">
              Your top skills
              <span className="text-[10px] font-medium text-slatemuted uppercase">green = verified</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {skillSummary.topSkills.map((s) => (
                <SkillPill key={s.name} skill={s} />
              ))}
            </div>
            <Link to="/student/profile" className="mt-4 block text-center text-xs font-semibold text-navy-light hover:text-navy">
              Manage skills →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
