import { Link } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { Card, EmptyState, LoadingBlock, MatchBadge, PageTitle, SkillPill, StatusPill } from '../../components/ui';
import { formatStipend } from '../../components/charts';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function Applications() {
  const { data, loading, error } = useData('/student/applications');

  if (loading) return <LoadingBlock rows={4} />;
  if (error) return <EmptyState title="Couldn't load applications" message={error} />;

  const apps = data?.applications || [];

  return (
    <div>
      <PageTitle
        title="My Applications"
        subtitle="Track where you are in the pipeline. The match % is what recruiters see when ranking applicants."
      />
      {apps.length === 0 ? (
        <EmptyState
          icon="📮"
          title="No applications yet"
          message="Browse internships and apply — your status will show up here."
          action={
            <Link to="/student/internships" className="btn-primary inline-flex">
              Browse internships
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {apps.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base">{a.internship.title}</h2>
                    <StatusPill status={a.status} />
                  </div>
                  <p className="mt-1 text-sm text-slatemuted">
                    {a.internship.company} · {a.internship.location} · {formatStipend(a.internship.stipend)} · {a.internship.duration}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {a.internship.requiredSkills.map((s) => (
                      <SkillPill key={s} skill={{ name: s }} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <MatchBadge value={a.matchPct} />
                  <span className="text-xs text-slatemuted">Applied {timeAgo(a.appliedAt)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
