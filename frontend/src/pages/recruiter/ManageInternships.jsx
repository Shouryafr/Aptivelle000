import { Link } from 'react-router-dom';
import { useData } from '../../hooks/useData';
import { Card, EmptyState, LoadingBlock, PageTitle, SkillPill, StatusPill } from '../../components/ui';
import { formatStipend } from '../../components/charts';

export default function ManageInternships() {
  const { data, loading, error } = useData('/recruiter/internships');

  if (loading) return <LoadingBlock rows={4} />;
  if (error || !data) return <EmptyState title="Couldn't load internships" message={error} />;

  const internships = data.internships || [];

  return (
    <div>
      <PageTitle
        title="Manage Internships"
        subtitle="Every posting with its applicant pipeline. Open one to rank candidates and send feedback."
        actions={
          <Link to="/recruiter/post-internship" className="btn-gold !py-2">
            + Post internship
          </Link>
        }
      />

      {internships.length === 0 ? (
        <EmptyState
          icon="📌"
          title="Nothing posted yet"
          message="Create your first internship listing to start receiving ranked applicants."
          action={
            <Link to="/recruiter/post-internship" className="btn-primary inline-flex">
              Post an internship
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {internships.map((i) => {
            const total = i.applicationsCount;
            return (
              <Card key={i.id} className="flex flex-col p-5 hover:shadow-cardhover transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm leading-snug">{i.title}</h3>
                    <p className="mt-1 text-xs text-slatemuted">
                      {i.location} · {i.duration} · {formatStipend(i.stipend)}
                    </p>
                  </div>
                  <span className="rounded-full bg-navy text-gold text-[10px] font-bold px-2.5 py-1 shrink-0">{total} apps</span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  {[
                    ['APPLIED', 'Applied'],
                    ['SHORTLISTED', 'Shortlisted'],
                    ['REJECTED', 'Rejected'],
                    ['COMPLETED', 'Completed'],
                  ].map(([st, label]) => (
                    <span key={st} className="inline-flex items-center gap-1.5">
                      <StatusPill status={st} />
                      <span className="text-xs font-bold text-navy tabular-nums">{i.statusCounts[st]}</span>
                    </span>
                  ))}
                  {i.feedbackCount > 0 && (
                    <span className="text-xs text-slatemuted ml-auto">{i.feedbackCount} feedback entries</span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {i.requiredSkills.slice(0, 6).map((s) => (
                    <SkillPill key={s} skill={{ name: s }} />
                  ))}
                  {i.requiredSkills.length > 6 && (
                    <span className="text-xs text-slatemuted self-center">+{i.requiredSkills.length - 6} more</span>
                  )}
                </div>

                <Link to={`/recruiter/internship/${i.id}/applicants`} className="mt-5 pt-4 border-t border-borderc/70 flex items-center justify-between group">
                  <span className="text-sm font-bold text-navy-light group-hover:text-navy">View applicants</span>
                  <span className="text-navy-light group-hover:translate-x-0.5 transition inline-flex">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.2 14.8a1 1 0 000-1.4L10.6 10 7.2 6.6a1 1 0 011.4-1.4l4 4a1 1 0 010 1.4l-4 4a1 1 0 01-1.4 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
