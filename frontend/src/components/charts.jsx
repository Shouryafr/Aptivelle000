import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const NAVY = '#0F1E3D';
const NAVY_LIGHT = '#1E3A5F';
const GOLD = '#E8B84B';
const BLUE_TINT = '#DBEAFE';
const GREEN = '#10B981';

const TOOLTIP_STYLE = {
  borderRadius: 10,
  border: '1px solid #E2E8F0',
  boxShadow: '0 8px 24px -8px rgba(15,30,61,0.15)',
  fontSize: 12,
};

export function ScoreRing({ value, size = 96, strokeWidth = 8, label, sub }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const color = pct >= 75 ? GREEN : pct >= 50 ? GOLD : '#EF4444';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-xl text-navy tabular-nums leading-none">{pct}%</span>
        {label && (
          <span className="mt-0.5 text-[10px] font-medium text-slatemuted uppercase tracking-wide">
            {label}
          </span>
        )}
        {sub && <span className="text-[10px] text-slatemuted">{sub}</span>}
      </div>
    </div>
  );
}

const PROF_SCORE = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };

/** Radar chart comparing required vs current proficiency across a role's skills. */
export function SkillRadar({ data, height = 300 }) {
  const rows = (data || []).map((d) => ({
    skill: d.name || d.skill,
    required: d.requiredProficiency || d.required,
    current: d.currentProficiency || d.current,
  })).map((d) => ({
    skill: d.skill,
    Required: PROF_SCORE[d.required] || Number(d.required) || 0,
    Current: PROF_SCORE[d.current] || Number(d.current) || 0,
  }));

  if (!rows.length) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={rows} outerRadius="72%">
        <PolarGrid stroke="#E2E8F0" />
        <PolarAngleAxis dataKey="skill" tick={{ fill: '#475569', fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 3]} tickCount={4} tick={false} axisLine={false} />
        <Radar
          name="Required"
          dataKey="Required"
          stroke={NAVY_LIGHT}
          fill={NAVY_LIGHT}
          fillOpacity={0.28}
          strokeWidth={2}
        />
        <Radar
          name="Your level"
          dataKey="Current"
          stroke={GOLD}
          fill={GOLD}
          fillOpacity={0.45}
          strokeWidth={2}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value, name) => [
            ['Beginner', 'Intermediate', 'Advanced'][value - 1] || value,
            name,
          ]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/** Horizontal bars used for distribution comparisons. */
export function HBarChart({ data, dataKey = 'value', colorBy, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={118}
          tick={{ fill: '#475569', fontSize: 11 }}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: 'rgba(219,234,254,0.35)' }}
        />
        <Bar dataKey={dataKey} radius={[0, 6, 6, 0]} barSize={16}>
          {(data || []).map((entry, idx) => (
            <Cell key={idx} fill={colorBy ? colorBy(entry) : NAVY} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VBars({ data, xKey = 'name', bars, height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: -18, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: '#475569', fontSize: 11 }} />
        <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: 'rgba(219,234,254,0.35)' }}
        />
        {bars.map((b) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.name}
            fill={b.color}
            radius={[6, 6, 0, 0]}
            maxBarSize={34}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function formatStipend(stipend) {
  if (stipend === null || stipend === undefined || stipend === 0) return 'Unpaid';
  return `₹${Number(stipend).toLocaleString('en-IN')}/mo`;
}

export { NAVY, NAVY_LIGHT, GOLD, BLUE_TINT, GREEN };
