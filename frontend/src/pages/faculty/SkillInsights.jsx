import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useData } from '../../hooks/useData';
import { Card, EmptyState, LoadingBlock, PageTitle, Pill, cx } from '../../components/ui';
import { GOLD, HBarChart, NAVY } from '../../components/charts';

export default function SkillInsights() {
  const [params, setParams] = useSearchParams();
  const branch = params.get('branch') || '';
  const year = params.get('year') || '';
  const { data, loading } = useData(`/faculty/skills?branch=${encodeURIComponent(branch)}&year=${encodeURIComponent(year)}`);

  if (loading) return <LoadingBlock rows={4} />;

  const filters = data?.filters || { branches: [], years: [] };

  const pick = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const distData = (data?.distribution || []).slice(0, 12).map((d) => ({
    name: d.skill,
    Students: d.count,
    verified: d.verified,
  }));

  return (
    <div>
      <PageTitle
        title="Skill Insights"
        subtitle="Aggregated skill distribution and the top gaps in your cohort — filter by branch or year."
      />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wide text-slatemuted">Branch</span>
          <button
            onClick={() => pick('branch', '')}
            className={cx('rounded-full border px-3 py-1 text-xs font-semibold transition', !branch ? 'bg-navy text-white border-navy' : 'bg-white text-slatebody border-borderc hover:border-navy/40')}
          >
            All
          </button>
          {filters.branches.map((b) => (
            <button
              key={b}
              onClick={() => pick('branch', branch === b ? '' : b)}
              className={cx('rounded-full border px-3 py-1 text-xs font-semibold transition', branch === b ? 'bg-navy text-white border-navy' : 'bg-white text-slatebody border-borderc hover:border-navy/40')}
            >
              {b}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wide text-slatemuted">Year</span>
          <button
            onClick={() => pick('year', '')}
            className={cx('rounded-full border px-3 py-1 text-xs font-semibold transition', !year ? 'bg-navy text-white border-navy' : 'bg-white text-slatebody border-borderc hover:border-navy/40')}
          >
            All
          </button>
          {filters.years.map((y) => (
            <button
              key={y}
              onClick={() => pick('year', year === y ? '' : y)}
              className={cx('rounded-full border px-3 py-1 text-xs font-semibold transition', year === y ? 'bg-navy text-white border-navy' : 'bg-white text-slatebody border-borderc hover:border-navy/40')}
            >
              {y} year
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slatemuted">
          {data?.studentsCount ?? 0} student{(data?.studentsCount ?? 0) === 1 ? '' : 's'} in view
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-base mb-1">Skill distribution</h3>
          <p className="text-xs text-slatemuted mb-4">How many students hold each skill (top 12).</p>
          {distData.length === 0 ? (
            <EmptyState icon="📊" title="No students match these filters" message="Try another branch or year." />
          ) : (
            <HBarChart
              data={distData}
              dataKey="Students"
              height={300}
              colorBy={(entry) => (entry.verified > 0 ? '#E8B84B' : NAVY)}
            />
          )}
          <p className="text-[11px] text-slatemuted mt-2">Gold bars include at least one student with a verified credential in that skill.</p>
        </Card>

        <Card>
          <h3 className="text-base mb-1">Top missing skills</h3>
          <p className="text-xs text-slatemuted mb-4">Most frequent gaps against students&apos; own target roles.</p>
          {!data?.topMissing?.length ? (
            <EmptyState icon="🎉" title="No gaps in this cohort" message="Students in this view meet their target-role requirements." />
          ) : (
            <div className="space-y-2.5">
              {data.topMissing.map((m, idx) => {
                const max = data.topMissing[0].count || 1;
                const pct = Math.max(8, Math.round((m.count / max) * 100));
                return (
                  <div key={m.skill} className="flex items-center gap-3">
                    <span className="w-40 text-xs font-semibold text-navy truncate">{m.skill}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-borderc overflow-hidden">
                      <div className="h-full rounded-full bg-danger/70" style={{ width: `${pct}%` }} />
                    </div>
                    <Pill className="bg-danger/10 text-danger w-16 justify-center">{m.count}</Pill>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6 overflow-x-auto">
        <h3 className="text-base mb-1">Full distribution table</h3>
        <p className="text-xs text-slatemuted mb-4">Average proficiency is scored 1 (beginner) to 3 (advanced).</p>
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slatemuted border-b border-borderc">
              <th className="py-2.5 pr-4 font-semibold">Skill</th>
              <th className="py-2.5 pr-4 font-semibold">Category</th>
              <th className="py-2.5 pr-4 font-semibold text-right">Students</th>
              <th className="py-2.5 pr-4 font-semibold text-right">Avg proficiency</th>
              <th className="py-2.5 font-semibold text-right">Verified</th>
            </tr>
          </thead>
          <tbody>
            {(data?.distribution || []).map((d) => (
              <tr key={d.skill} className="border-b border-borderc/60 last:border-0 hover:bg-bluetint/25 transition">
                <td className="py-2.5 pr-4 font-semibold text-navy">{d.skill}</td>
                <td className="py-2.5 pr-4 text-xs text-slatemuted">{d.category}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">{d.count}</td>
                <td className="py-2.5 pr-4 text-right tabular-nums">{d.avgProficiency.toFixed(1)}</td>
                <td className="py-2.5 text-right">
                  <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-bold', d.verified ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-400')}>
                    {d.verified}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
