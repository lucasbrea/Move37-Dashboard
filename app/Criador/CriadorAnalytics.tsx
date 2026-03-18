'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

type WindowKey = 'y1' | 'y2' | 'y5' | 'y7' | 'hist';

interface WindowStats {
  foalsBorn: number;
  runShare: number;
  adjRS: number;
  winShare: number;
  stkWnrsRnrs: number;
  stkWnrsBorn: number;
  g1WnrsBorn: number;
  cei: number;
  avgAvailableDams: number;
  avgServicedDamAge: number;
  avgVaciosDams: number;
  avgRestDams: number;
  deadBfr2yo: number;
  deadAtBirth: number;
  avgDaysBtwServices: number;
}

interface TimePoint {
  year: number;
  foalsBorn: number;
  runShare: number;
  winShare: number;
  stkWnrsBorn: number;
  g1WnrsBorn: number;
  cei: number;
}

interface WindowMeta {
  label: string;
  startYear: number | null;
  endYear: number;
}

interface Criador {
  id: number;
  name: string;
  rank: number;
  windows: Record<WindowKey, WindowMeta>;
  stats: Record<WindowKey, WindowStats>;
  timeSeries: TimePoint[];
}

interface CriadorData {
  metadata: { exportDate: string; numCriadors: number; timeSeriesRange: { start: number; end: number } };
  criadors: Criador[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pct  = (v: number, d = 1) => (v * 100).toFixed(d) + '%';
const fmt1 = (v: number) => v.toFixed(1);

const WINDOW_LABELS: Record<WindowKey, string> = {
  y1:   '2022',
  y2:   '2021–22',
  y5:   '2018–22',
  y7:   '2016–22',
  hist: 'All',
};

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0d2137',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '4px',
  fontSize: '12px',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, highlight }: {
  label: string;
  value: string;
  sub?: string;
  highlight?: 'green' | 'red' | 'neutral';
}) {
  const valColor = highlight === 'green' ? 'text-green-400' : highlight === 'red' ? 'text-red-400' : 'text-white';
  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-light tabular-nums ${valColor}`}>{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function WindowToggle({ mode, onChange }: { mode: WindowKey; onChange: (m: WindowKey) => void }) {
  return (
    <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded">
      {(Object.keys(WINDOW_LABELS) as WindowKey[]).map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
            mode === key ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-200'
          }`}
        >
          {WINDOW_LABELS[key]}
        </button>
      ))}
    </div>
  );
}

function TrendChart({ timeSeries }: { timeSeries: TimePoint[] }) {
  const data = timeSeries.map(p => ({
    year: p.year,
    'Win Share': +(p.winShare * 100).toFixed(2),
    'Run Share': +(p.runShare * 100).toFixed(2),
    'STK / Born': +(p.stkWnrsBorn * 100).toFixed(2),
  }));

  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
        Performance by Birth Year
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => v + '%'} domain={['auto', 'auto']} width={42} />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            labelStyle={{ color: '#e5e7eb', marginBottom: '4px' }}
            formatter={(v: unknown, name: unknown) => [
              typeof v === 'number' ? `${v.toFixed(1)}%` : '—',
              typeof name === 'string' ? name : '',
            ]}
          />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af', paddingTop: '8px' }} />
          <Line type="monotone" dataKey="Run Share" stroke="#6b7280" strokeWidth={1.5} dot={{ fill: '#6b7280', r: 3 }} />
          <Line type="monotone" dataKey="Win Share" stroke="#60a5fa" strokeWidth={2} dot={{ fill: '#60a5fa', r: 3 }} />
          <Line type="monotone" dataKey="STK / Born" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="4 3" dot={{ fill: '#fbbf24', r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function FoalsBarChart({ timeSeries }: { timeSeries: TimePoint[] }) {
  const data = timeSeries.map(p => ({ year: p.year, 'Foals Born': p.foalsBorn }));
  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
        Foals Born by Year
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: '#e5e7eb', marginBottom: '4px' }} />
          <Bar dataKey="Foals Born" fill="rgba(96,165,250,0.3)" stroke="#60a5fa" strokeWidth={1} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DamsTable({ stats }: { stats: WindowStats }) {
  const rows = [
    { label: 'Avg Available Dams',    value: stats.avgAvailableDams.toFixed(0) },
    { label: 'Avg Dam Age',           value: fmt1(stats.avgServicedDamAge) + ' yrs' },
    { label: 'Vacios / Dams',         value: pct(stats.avgVaciosDams) },
    { label: 'Rest / Dams',           value: pct(stats.avgRestDams) },
    { label: 'Dead Bfr 2yo / Born',   value: pct(stats.deadBfr2yo), flag: stats.deadBfr2yo > 0.05 },
    { label: 'Dead at Birth / Born',  value: pct(stats.deadAtBirth), flag: stats.deadAtBirth > 0.04 },
    { label: 'Avg Days Btw Services', value: fmt1(stats.avgDaysBtwServices) },
  ];
  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
        Dams Management
      </h3>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(row => (
            <tr key={row.label} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="text-gray-400 py-2 pr-4">{row.label}</td>
              <td className={`text-right py-2 tabular-nums font-medium ${row.flag ? 'text-red-400' : 'text-gray-100'}`}>
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function CriadorSidebar({ criadors, selectedId, onSelect, window: win }: {
  criadors: Criador[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  window: WindowKey;
}) {
  const [search, setSearch] = useState('');

  const sorted = useMemo(() =>
    [...criadors]
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.stats[win]?.winShare ?? 0) - (a.stats[win]?.winShare ?? 0)),
    [criadors, search, win]
  );

  return (
    <div className="w-56 flex-shrink-0 border-r border-white/10 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 220px)', position: 'sticky', top: 0 }}>
      <div className="p-3 border-b border-white/10 flex-shrink-0">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Criadores</p>
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm bg-white/5 border border-white/10 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-white/30 rounded"
        />
      </div>
      <div className="overflow-y-auto flex-1">
        {sorted.map((c, i) => {
          const s = c.stats[win] ?? null;
          const isSelected = c.id === selectedId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-white/5 transition-colors duration-100 ${
                isSelected ? 'bg-white/10 border-l-2 border-l-yellow-400' : 'hover:bg-white/5 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs w-4 text-right flex-shrink-0 tabular-nums">{i + 1}.</span>
                <span className="text-gray-100 text-sm font-medium truncate">{c.name}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 pl-6">
                <span className="text-xs text-gray-600">WS <span className="text-gray-400 tabular-nums">{s ? pct(s.winShare) : '—'}</span></span>
                <span className="text-xs text-gray-600">CEI <span className="text-gray-400 tabular-nums">{s ? fmt1(s.cei) : '—'}</span></span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function CriadorDetail({ criador, rank, window: win, onWindowChange }: {
  criador: Criador;
  rank: number;
  window: WindowKey;
  onWindowChange: (w: WindowKey) => void;
}) {
  const s = criador.stats[win];
  const winLabel = criador.windows[win]?.label ?? WINDOW_LABELS[win];

  if (!s) {
    return (
      <div className="p-6 flex items-center justify-center py-20 text-gray-500 text-sm">
        No data available for cohort {winLabel}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 overflow-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">Rank #{rank} by Win Share</div>
          <h2 className="text-2xl font-light text-white">{criador.name}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {s.foalsBorn} foals born · cohort {winLabel}
          </p>
        </div>
        <WindowToggle mode={win} onChange={onWindowChange} />
      </div>

      {/* Racing stats */}
      <div>
        <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Racing Performance</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          <StatCard label="Foals Born"     value={s.foalsBorn.toString()} />
          <StatCard label="Run Share"      value={pct(s.runShare)} />
          <StatCard
            label="Adj RS (pp)"
            value={(s.adjRS >= 0 ? '+' : '') + fmt1(s.adjRS)}
            highlight={s.adjRS > 0 ? 'green' : s.adjRS < -5 ? 'red' : 'neutral'}
          />
          <StatCard label="Win Share"      value={pct(s.winShare)} />
          <StatCard label="STK Wnrs/Rnrs" value={pct(s.stkWnrsRnrs)} />
          <StatCard label="STK Wnrs/Born" value={pct(s.stkWnrsBorn)} />
          <StatCard
            label="G1 Wnrs/Born"
            value={pct(s.g1WnrsBorn, 2)}
            highlight={s.g1WnrsBorn > 0.02 ? 'green' : 'neutral'}
          />
          <StatCard
            label="CEI"
            value={fmt1(s.cei)}
            highlight={s.cei >= 1.5 ? 'green' : s.cei < 0.8 ? 'red' : 'neutral'}
          />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TrendChart timeSeries={criador.timeSeries} />
        </div>
        <FoalsBarChart timeSeries={criador.timeSeries} />
      </div>

      {/* Dams management */}
      <DamsTable stats={s} />
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function CriadorAnalytics() {
  const [data, setData] = useState<CriadorData | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [win, setWin] = useState<WindowKey>('y5');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/criador_dashboard_data.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: CriadorData) => {
        setData(d);
        if (d.criadors.length > 0) setSelectedId(d.criadors[0].id);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const selected = useMemo(
    () => data?.criadors.find(c => c.id === selectedId) ?? null,
    [data, selectedId]
  );

  const rank = useMemo(() => {
    if (!data || selectedId === null) return 1;
    const sorted = [...data.criadors].sort((a, b) => (b.stats[win]?.winShare ?? 0) - (a.stats[win]?.winShare ?? 0));
    return sorted.findIndex(c => c.id === selectedId) + 1;
  }, [data, selectedId, win]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-500 text-sm">Loading criador analytics…</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">{error}</div>;
  }

  if (!data?.criadors?.length) {
    return <div className="p-4 text-gray-500 text-sm">No criador data found.</div>;
  }

  return (
    <div className="flex gap-0" style={{ minHeight: 'calc(100vh - 220px)' }}>
      <CriadorSidebar
        criadors={data.criadors}
        selectedId={selectedId}
        onSelect={setSelectedId}
        window={win}
      />
      <div className="flex-1 overflow-auto min-w-0">
        {selected ? (
          <CriadorDetail
            criador={selected}
            rank={rank}
            window={win}
            onWindowChange={setWin}
          />
        ) : (
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
            Select a criador from the list
          </div>
        )}
      </div>
    </div>
  );
}
