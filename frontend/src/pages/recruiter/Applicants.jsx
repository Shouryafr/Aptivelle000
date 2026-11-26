import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client';
import { useData } from '../../hooks/useData';
import {
  Button,
  Card,
  EmptyState,
  Field,
  LoadingBlock,
  MatchBadge,
  PageTitle,
  Pill,
  ProficiencyPill,
  RatingDots,
  SkillPill,
  VerifiedTick,
  cx,
} from '../../components/ui';
import { formatStipend } from '../../components/charts';
import { useToast } from '../../context/ToastContext';

const STATUSES = [
  { key: 'APPLIED', label: 'Applied' },
  { key: 'SHORTLISTED', label: 'Shortlist' },
  { key: 'REJECTED', label: 'Reject' },
  { key: 'COMPLETED', label: 'Complete' },
];

export default function Applicants() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, reload } = useData(`/recruiter/internships/${id}/applicants`);
  const [sortBy, setSortBy] = useState('match');
  const [updating, setUpdating] = useState(null);

  // feedback state
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const applicants = useMemo(() => {
    const list = data?.applicants || [];
    const sorted = [...list];
    if (sortBy === 'verified') {
      sorted.sort((a, b) => b.verifiedCount - a.verifiedCount || b.matchPct - a.matchPct);
    } else {
      sorted.sort((a, b) => b.matchPct - a.matchPct || b.verifiedCount - a.verifiedCount);
    }
    return sorted;
  }, [data, sortBy]);

  if (loading) return <LoadingBlock rows={5} />;
  if (error || !data) return <EmptyState title="Couldn't load applicants" message={error} />;

  const internship = data.internship;

  const changeStatus = async (applicationId, status) => {
    setUpdating(`${applicationId}-${status}`);
    try {
      await api.patch(`/recruiter/applications/${applicationId}`, { status });
      toast(`Applicant moved to ${status.toLowerCase()}.`);
      reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setUpdating(null);
    }
  };

  const submitFeedback = async (e) => {
    e.preventDefault();
    if (!rating) {
      toast('Select a readiness rating (1–5).', 'error');
      return;
    }
    setSendingFeedback(true);
    try {
      await api.post('/recruiter/feedback', {
        internshipId: Number(id),
        readinessRating: rating,
        comments,
      });
      toast('Feedback sent to the institute — it feeds curriculum recommendations.');
      setRating(0);
      setComments('');
      setFeedbackOpen(false);
    } catch (e2) {
      toast(e2.message, 'error');
    } finally {
      setSendingFeedback(false);
    }
  };

  return (
    <div>
      <PageTitle
        title={internship.title}
        subtitle={`${internship.location} · ${formatStipend(internship.stipend)} · ${internship.duration} · ${applicants.length} applicant${applicants.length === 1 ? '' : 's'}`}
        actions={
          <Link to="/recruiter/internships" className="btn-outline !py-2">
            ← All internships
          </Link>
        }
      />

      <Card className="mb-6 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slatemuted mr-1">Required:</span>
          {internship.requiredSkills.map((s) => (
            <SkillPill key={s} skill={{ name: s }} />
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-xs font-semibold text-slatemuted">Sort by</span>
          <select className="input !w-auto !py-1.5" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="match">Match %</option>
            <option value="verified">Verified skill count</option>
          </select>
        </label>
      </Card>

      {applicants.length === 0 ? (
        <EmptyState icon="👥" title="No applicants yet" message="Applications will appear here and rank themselves by skill match." />
      ) : (
        <div className="space-y-5">
          {applicants.map((a) => (
            <Card key={a.applicationId} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-gold text-xs font-bold shrink-0">
                      {a.student.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                    </span>
                    <div>
                      <h3 className="text-sm">{a.student.name}</h3>
                      <p className="text-xs text-slatemuted">
                        {a.student.branch} · {a.student.year} · {a.student.institute}
                      </p>
                    </div>
                    <span className="ml-auto flex items-center gap-2">
                      <MatchBadge value={a.matchPct} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold text-navy uppercase tracking-wide">Skills</span>
                    {a.possessedCount > 0 && (
                      <span
                        className={cx(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold',
                          a.verifiedCount > 0 ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'
                        )}
                        title="Skills matching this internship that carry a verified badge"
                      >
                        <VerifiedTick /> {a.verifiedCount}/{a.possessedCount} of your required skills verified
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {a.student.skills.length === 0 && <span className="text-xs text-slatemuted">No skills tagged yet.</span>}
                    {a.student.skills.map((s) => (
                      <span
                        key={s.name}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-borderc bg-pagebg px-2.5 py-1 text-xs font-medium text-navy"
                      >
                        {s.name}
                        <ProficiencyPill proficiency={s.proficiency} />
                        {s.isVerified && <VerifiedTick />}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 md:w-72">
                  <div className="flex rounded-lg border border-borderc overflow-hidden">
                    {STATUSES.map((s) => (
                      <button
                        key={s.key}
                        data-on={a.status === s.key}
                        disabled={updating !== null}
                        onClick={() => changeStatus(a.applicationId, s.key)}
                        className={cx(
                          'flex-1 px-1.5 py-2 text-[10px] font-bold uppercase tracking-wide transition disabled:opacity-50',
                          a.status === s.key ? 'bg-navy text-white' : 'bg-white text-slatemuted hover:bg-pagebg hover:text-navy'
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  {a.status === 'SHORTLISTED' && (
                    <span className="text-center text-[11px] font-semibold text-success">★ Shortlisted — notify them</span>
                  )}
                </div>
              </div>

              {a.student.resumeText && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-navy-light hover:text-navy">
                    View resume text
                  </summary>
                  <p className="mt-2 text-xs text-slatebody leading-relaxed bg-pagebg rounded-xl p-3 whitespace-pre-wrap">{a.student.resumeText}</p>
                </details>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Feedback to academia */}
      <div className="mt-8">
        <Card className={cx('transition', feedbackOpen && 'ring-2 ring-gold/40')}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base flex items-center gap-2">
                <svg className="w-5 h-5 text-navy-light" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H9.3l-4.6 3.1a.75.75 0 01-1.15-.63V15H4a2 2 0 01-2-2V5z" />
                </svg>
                Readiness feedback to the institute
              </h3>
              <p className="text-xs text-slatemuted mt-0.5">
                Rated 1–5 and shared with faculty — it auto-generates their curriculum recommendations.
              </p>
            </div>
            <Button variant="outline" onClick={() => setFeedbackOpen((v) => !v)}>
              {feedbackOpen ? 'Close' : 'Write feedback'}
            </Button>
          </div>

          {feedbackOpen && (
            <form onSubmit={submitFeedback} className="mt-5 space-y-4 border-t border-borderc/70 pt-5">
              <Field label="How job-ready were the applicants you interviewed from this role?">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setRating(n)}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      className="p-1 transition hover:scale-110"
                    >
                      <svg className={cx('w-8 h-8', n <= rating ? 'text-gold' : 'text-slate-200 hover:text-slate-300')} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.3 4.01a1 1 0 00.95.69h4.2c.97 0 1.37 1.24.59 1.81l-3.4 2.47a1 1 0 00-.36 1.12l1.3 4.01c.3.92-.76 1.69-1.54 1.12l-3.4-2.47a1 1 0 00-1.18 0l-3.4 2.47c-.78.57-1.84-.2-1.54-1.12l1.3-4.01a1 1 0 00-.36-1.12L2.01 9.44c-.78-.57-.38-1.81.59-1.81h4.2a1 1 0 00.95-.69l1.3-4.01z" />
                      </svg>
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1.5">
                      <RatingDots rating={rating} />
                      <span className="text-xs font-bold text-navy">{rating}/5</span>
                    </span>
                  )}
                </div>
              </Field>
              <Field label="Comments for faculty" hint="Mention skills or behaviours that need strengthening — we surface themes automatically.">
                <textarea
                  className="input min-h-[90px]"
                  placeholder="e.g. Strong React, but students should practise Git branching and PR reviews…"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </Field>
              <div className="flex justify-end">
                <Button type="submit" variant="gold" loading={sendingFeedback}>
                  Submit feedback
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
