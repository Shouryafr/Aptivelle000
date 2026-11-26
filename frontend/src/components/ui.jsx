export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function Spinner({ className = 'w-4 h-4' }) {
  return (
    <svg className={cx('animate-spin text-current', className)} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function LoadingBlock({ label = 'Loading…', rows = 3 }) {
  return (
    <div className="space-y-3 animate-pulse" role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card p-5">
          <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
          <div className="h-3 w-3/4 bg-slate-100 rounded" />
          <div className="h-3 w-1/2 bg-slate-100 rounded mt-2" />
        </div>
      ))}
    </div>
  );
}

export function Button({ variant = 'primary', loading = false, className = '', children, disabled, ...rest }) {
  const variants = {
    primary: 'btn-primary',
    gold: 'btn-gold',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
  };
  return (
    <button className={cx(variants[variant], className)} disabled={disabled || loading} {...rest}>
      {loading && <Spinner className="w-4 h-4" />}
      {children}
    </button>
  );
}

export function Field({ label, error, hint, required, children, className = '' }) {
  return (
    <div className={className}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slatemuted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={cx('card p-5 sm:p-6', className)} {...rest}>
      {children}
    </div>
  );
}

export function StatCard({ label, value, sub, accent = false, icon, className = '' }) {
  return (
    <Card className={cx('relative p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slatemuted uppercase tracking-wide">{label}</p>
          <p className={cx('mt-1 font-serif text-2xl tabular-nums', accent ? 'text-navy' : 'text-navy')}>
            {value}
          </p>
          {accent && (
            <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-gold" aria-hidden="true" />
          )}
          {sub && <p className="mt-1 text-xs text-slatemuted truncate">{sub}</p>}
        </div>
        {icon && <div className="text-slatemuted shrink-0">{icon}</div>}
      </div>
    </Card>
  );
}

export function PageTitle({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slatemuted max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-base">{title}</h3>
      {message && <p className="mt-1 text-sm text-slatemuted max-w-md">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Pill({ children, className = '' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        className
      )}
    >
      {children}
    </span>
  );
}

const PROF_STYLES = {
  BEGINNER: 'bg-slate-100 text-slate-600',
  INTERMEDIATE: 'bg-bluetint text-navy-light',
  ADVANCED: 'bg-navy text-white',
};

const PROF_LABEL = { BEGINNER: 'Beginner', INTERMEDIATE: 'Intermediate', ADVANCED: 'Advanced' };

export function ProficiencyPill({ proficiency }) {
  return <Pill className={PROF_STYLES[proficiency] || PROF_STYLES.BEGINNER}>{PROF_LABEL[proficiency] || proficiency}</Pill>;
}

export function SourcePill({ source }) {
  const styles = {
    RESUME: 'bg-slate-100 text-slate-600',
    PROJECT: 'bg-violet-50 text-violet-700',
    COURSE: 'bg-cyan-50 text-cyan-700',
    MANUAL: 'bg-amber-50 text-amber-700',
  };
  return (
    <Pill className={styles[source] || styles.RESUME}>
      {source === 'RESUME' ? 'Resume' : source === 'PROJECT' ? 'Project' : source === 'COURSE' ? 'Course' : 'Manual'}
    </Pill>
  );
}

export function VerifiedTick() {
  return (
    <span title="Verified" className="inline-flex items-center justify-center rounded-full bg-success/10 text-success w-4 h-4">
      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 111.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" />
      </svg>
    </span>
  );
}

export function MatchBadge({ value, showLabel = true }) {
  const pct = Number(value) || 0;
  const cls = pct >= 75 ? 'bg-success/10 text-success' : pct >= 50 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger';
  const label = pct >= 75 ? 'High match' : pct >= 50 ? 'Medium match' : 'Low match';
  return (
    <Pill className={cx(cls, 'text-xs px-2 py-0.5')}>
      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 6a3 3 0 00-3 3v2a3 3 0 006 0V9a3 3 0 00-3-3z" opacity="0.35" />
        <path d="M9 2a1 1 0 00-1 1v1.2A5 5 0 004.2 8H3a1 1 0 000 2h1.2A5 5 0 008 13.8V15a1 1 0 102 0v-1.2A5 5 0 0013.8 10H15a1 1 0 100-2h-1.2A5 5 0 0010 4.2V3a1 1 0 00-1-1z" />
      </svg>
      {pct}%{showLabel && <span className="font-medium hidden sm:inline"> {label}</span>}
    </Pill>
  );
}

export function StatusPill({ status }) {
  const map = {
    APPLIED: { label: 'Applied', cls: 'bg-bluetint text-navy-light' },
    SHORTLISTED: { label: 'Shortlisted', cls: 'bg-success/10 text-success' },
    REJECTED: { label: 'Rejected', cls: 'bg-danger/10 text-danger' },
    COMPLETED: { label: 'Completed', cls: 'bg-navy text-white' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <Pill className={s.cls}>{s.label}</Pill>;
}

export function VerifPill({ status, rejectedReason }) {
  if (status === 'VERIFIED') {
    return (
      <Pill className="bg-success/10 text-success">
        <VerifiedTick /> Verified
      </Pill>
    );
  }
  if (status === 'REJECTED') {
    return (
      <Pill className="bg-danger/10 text-danger" title={rejectedReason || ''}>
        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.7 7.3a1 1 0 00-1.4 1.4L8.6 10l-1.3 1.3a1 1 0 101.4 1.4L10 11.4l1.3 1.3a1 1 0 001.4-1.4L11.4 10l1.3-1.3a1 1 0 00-1.4-1.4L10 8.6 8.7 7.3z" clipRule="evenodd" />
        </svg>
        Rejected
      </Pill>
    );
  }
  return (
    <Pill className="bg-slate-100 text-slate-600" title={status}>
      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.3.7l2.5 2.5a1 1 0 001.4-1.4L11 9.6V6z" clipRule="evenodd" />
      </svg>
      Pending
    </Pill>
  );
}

export function RatingDots({ rating }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={cx('w-4 h-4', i <= rating ? 'text-gold' : 'text-slate-200')} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.3 4.01a1 1 0 00.95.69h4.2c.97 0 1.37 1.24.59 1.81l-3.4 2.47a1 1 0 00-.36 1.12l1.3 4.01c.3.92-.76 1.69-1.54 1.12l-3.4-2.47a1 1 0 00-1.18 0l-3.4 2.47c-.78.57-1.84-.2-1.54-1.12l1.3-4.01a1 1 0 00-.36-1.12L2.01 9.44c-.78-.57-.38-1.81.59-1.81h4.2a1 1 0 00.95-.69l1.3-4.01z" />
        </svg>
      ))}
    </span>
  );
}

export function SkillPill({ skill, removable, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-borderc bg-pagebg px-2.5 py-1.5 text-xs font-medium text-navy">
      <span>{skill.name}</span>
      {skill.proficiency && (
        <span className="text-[10px] text-slatemuted font-semibold uppercase">
          {skill.proficiency === 'BEGINNER' ? 'B' : skill.proficiency === 'INTERMEDIATE' ? 'I' : 'A'}
        </span>
      )}
      {skill.isVerified && <VerifiedTick />}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="text-slatemuted hover:text-danger transition"
          aria-label={`Remove ${skill.name}`}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6.3 5.2a1 1 0 00-1.4 1.4L8.6 10l-3.7 3.4a1 1 0 101.4 1.4L10 11.4l3.4 3.4a1 1 0 001.4-1.4L11.4 10l3.4-3.4a1 1 0 00-1.4-1.4L10 8.6 6.6 5.2z" />
          </svg>
        </button>
      )}
    </span>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        className={cx(
          'relative w-full bg-white rounded-t-2xl sm:rounded-2xl shadow-cardhover animate-slide-up max-h-[92vh] overflow-y-auto',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
        )}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-2 sticky top-0 bg-white">
          <h3 className="text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-slatemuted hover:bg-slate-100 hover:text-navy transition" aria-label="Close">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.3 5.2a1 1 0 00-1.4 1.4L8.6 10l-3.7 3.4a1 1 0 101.4 1.4L10 11.4l3.4 3.4a1 1 0 001.4-1.4L11.4 10l3.4-3.4a1 1 0 00-1.4-1.4L10 8.6 6.6 5.2z" />
            </svg>
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
