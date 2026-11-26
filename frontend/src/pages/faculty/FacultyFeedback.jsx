import { Link } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { Card, EmptyState, LoadingBlock, PageTitle, Pill, RatingDots, StatCard, cx } from '../../components/ui';

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function FacultyFeedback() {
  const { data, loading, error } = useData('/faculty/feedback');

  if (loading) return <LoadingBlock rows={4} />;
  if (error || !data) return <EmptyState title="Couldn't load feedback" message={error} />;

  return (
    <div>
      <PageTitle
        title="Recruiter Feedback"
        subtitle="Readiness ratings and comments recruiters leave per internship — your direct line to industry expectations."
        actions={
          <Link to="/faculty/dashboard" className="btn-outline !py-2">
            Back to dashboard
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <StatCard label="Feedback submissions" value={data.count} />
        <StatCard
          label="Average readiness"
          value={data.avgRating ? `${data.avgRating}/5` : '—'}
          sub="across all internships"
          icon={data.avgRating ? <RatingDots rating={data.avgRating} /> : undefined}
        />
        <StatCard label="Internships reviewed" value={data.internships.length} sub="with at least one submission" />
      </div>

      {data.count === 0 ? (
        <EmptyState icon="💬" title="No feedback yet" message="Recruiter feedback appears here once companies rate their interns." />
      ) : (
        <div className="space-y-6">
          {data.internships.map((it) => (
            <Card key={it.internshipId}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base">{it.title}</h3>
                  <p className="text-xs text-slatemuted mt-0.5">{it.company}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Pill className="bg-bluetint text-navy-light">{it.count} submission{it.count > 1 ? 's' : ''}</Pill>
                  <div className="flex items-center gap-2">
                    <RatingDots rating={it.avgRating} />
                    <span className="font-serif text-sm text-navy tabular-nums">{it.avgRating}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {it.comments.map((c, i) => (
                  <div key={i} className="rounded-xl bg-pagebg border border-borderc p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-navy text-gold text-[10px] font-bold flex items-center justify-center">
                          {c.recruiter?.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-navy">{c.recruiter}</p>
                          <p className="text-[10px] text-slatemuted">{c.designation}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RatingDots rating={c.rating} />
                        <span className="text-[10px] text-slatemuted">{timeAgo(c.createdAt)}</span>
                      </div>
                    </div>
                    {c.comments && <p className={cx('mt-2.5 text-sm text-slatebody leading-relaxed', c.comments || 'italic text-slatemuted')}>{c.comments || 'No written comments.'}</p>}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
