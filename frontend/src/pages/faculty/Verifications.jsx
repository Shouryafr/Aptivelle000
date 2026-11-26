import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useData } from '../../hooks/useData';
import { Button, Card, EmptyState, LoadingBlock, PageTitle, SkillPill, VerifPill, cx } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
];

function CertCard({ c, tab, onDecide, busy }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const decide = (status) => onDecide(c.id, status, reason, () => setRejecting(false));

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm">{c.title}</h3>
            <VerifPill status={c.verificationStatus} rejectedReason={c.rejectionReason} />
          </div>
          <p className="mt-1 text-xs text-slatemuted">
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
          <p className="mt-2 text-xs font-semibold text-navy bg-pagebg inline-flex items-center gap-1.5 rounded-full px-2.5 py-1">
            <span className="h-5 w-5 rounded-full bg-navy text-gold text-[9px] font-bold inline-flex items-center justify-center">
              {c.student.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
            </span>
            {c.student.name} · {c.student.branch} {c.student.year}
          </p>
          {c.rejectionReason && c.verificationStatus === 'REJECTED' && (
            <p className="mt-2 text-xs text-danger bg-danger/5 rounded-lg px-2.5 py-1.5 inline-block">
              Reason: {c.rejectionReason}
            </p>
          )}
          {c.skillNames.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.skillNames.map((s) => (
                <SkillPill key={s} skill={{ name: s }} />
              ))}
            </div>
          )}
        </div>

        {tab === 'pending' && (
          <div className="flex flex-col items-stretch gap-2 shrink-0 w-full sm:w-56">
            {rejecting ? (
              <>
                <input
                  className="input !py-1.5 text-xs"
                  placeholder="Reason for rejection…"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button variant="danger" className="flex-1 !py-1.5 !text-xs" loading={busy === c.id} onClick={() => decide('REJECTED')}>
                    Reject
                  </Button>
                  <Button variant="ghost" className="!py-1.5 !text-xs" onClick={() => setRejecting(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="success" className="flex-1 !py-1.5 !text-xs" loading={busy === c.id} onClick={() => decide('VERIFIED')}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
                  </svg>
                  Approve
                </Button>
                <Button variant="ghost" className="!py-1.5 !text-xs text-danger hover:bg-danger/5" onClick={() => setRejecting(true)} disabled={busy === c.id}>
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function Verifications() {
  const toast = useToast();
  const { data, loading, error, reload } = useData('/faculty/verifications');
  const [tab, setTab] = useState('pending');
  const [busy, setBusy] = useState(null);

  if (loading) return <LoadingBlock rows={4} />;
  if (error || !data) return <EmptyState title="Couldn't load the queue" message={error} />;

  const decide = async (courseId, status, reason, closeReject) => {
    setBusy(courseId);
    try {
      await api.patch(`/faculty/verifications/${courseId}`, { status, reason });
      toast(status === 'VERIFIED' ? 'Course verified — tagged skills are now verified.' : 'Submission rejected.');
      closeReject?.();
      reload();
    } catch (e2) {
      toast(e2.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const list = data[tab] || [];
  const counts = { pending: data.pending.length, verified: data.verified.length, rejected: data.rejected.length };

  return (
    <div>
      <PageTitle
        title="Certification Verifications"
        subtitle={`Students at ${data.institute} submit certificate links when adding courses — approve genuine ones so skills earn verified badges.`}
      />

      <div className="flex gap-1.5 rounded-xl border border-borderc bg-pagebg p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cx(
              'rounded-lg px-4 py-2 text-sm font-semibold transition flex items-center gap-2',
              tab === t.key ? 'bg-navy text-white shadow-sm' : 'text-slatebody hover:text-navy'
            )}
          >
            {t.label}
            <span
              className={cx(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                tab === t.key ? 'bg-gold text-ink' : 'bg-slate-200 text-slate-500'
              )}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={tab === 'pending' ? '✅' : '🗂'}
          title={tab === 'pending' ? 'Queue is clear' : `No ${tab} submissions yet`}
          message={
            tab === 'pending'
              ? 'New certificate submissions from students will land here for review.'
              : 'Reviewed submissions will be listed here.'
          }
          action={
            <Link to="/faculty/dashboard" className="btn-outline inline-flex">
              Back to dashboard
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {list.map((c) => (
            <CertCard key={c.id} c={c} tab={tab} onDecide={decide} busy={busy} />
          ))}
        </div>
      )}
    </div>
  );
}
