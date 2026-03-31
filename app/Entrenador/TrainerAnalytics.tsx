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
} from 'recharts';

// ─── Raw data types (cuidador_data.json) ─────────────────────────────────────

interface RawTopEntry {
  id_cuidador: number;
  cuidador: string;
  surname: string;
  rank: number;
  races_l6m: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawSummaryRecord = Record<string, any>;

interface RawTimePoint {
  date_str: string;
  ws_l200: number;
  ip_l200: number;
  ws_l200_mean_all: number;
  ws_l200_p90_all: number;
  hrr_l50: number;
  hrr_l200: number;
  races_l3m: number;
}

interface RawComboEntry {
  combo_name: string;
  races: number;
  ws_combo: number;
  gap_combo: number;
  ws_combo_vs_other: number;
  gap_combo_vs_other: number;
  hrr_combo: number;
  hrr_combo_vs_other: number;
}

interface RawCombos {
  jockeys: RawComboEntry[];
  sires: RawComboEntry[];
  stables: RawComboEntry[];
}

interface CuidadorData {
  topList: RawTopEntry[];
  summary: Record<string, RawSummaryRecord>;
  timeseries: Record<string, RawTimePoint[]>;
  combos: Record<string, RawCombos>;
}

// ─── Internal types ───────────────────────────────────────────────────────────

type ViewMode = 'l100' | 'l200' | 'l400' | 'l500' | 'hist' | 'l30d' | 'l90d' | 'l180d';

interface BreakdownEntry {
  wsL100: number; ipL100: number; racesL100: number;
  wsL200: number; ipL200: number; racesL200: number;
  wsL400: number; ipL400: number; racesL400: number;
  wsL500: number; ipL500: number; racesL500: number;
  wsHist: number; ipHist: number; racesHist: number;
  wsL30d: number; ipL30d: number; racesL30d: number;
  wsL90d: number; ipL90d: number; racesL90d: number;
  wsL180d: number; ipL180d: number; racesL180d: number;
}

interface ComboEntry {
  name: string;
  races: number;
  wsCombo: number;
  gapCombo: number;
  wsComboVsOther: number;
  gapComboVsOther: number;
}

interface TimePoint {
  date: string;
  wsL200: number;
  ipL200: number;
  wsL200Mean: number;
  wsL200P90: number;
  hrrL50: number;
  hrrL200: number;
  racesL3m: number;
}

interface Trainer {
  id: number;
  name: string;
  surname: string;
  rank: number;
  racesL6m: number;
  totalRaces: number;
  winShares: Record<string, number>;
  impliedProbs: Record<string, number>;
  tracks: Record<string, BreakdownEntry>;
  surfaces: Record<string, BreakdownEntry>;
  distances: Record<string, BreakdownEntry>;
  timeSeries: TimePoint[];
  combos: { jockeys: ComboEntry[]; sires: ComboEntry[]; stables: ComboEntry[] };
}

interface TrainerData {
  trainers: Trainer[];
}

// ─── Transform helpers ────────────────────────────────────────────────────────

const safeNum = (v: unknown): number =>
  typeof v === 'number' && isFinite(v) ? v : 0;

function buildBreakdown(s: RawSummaryRecord, prefix: string): BreakdownEntry {
  const n = (key: string) => safeNum(s[prefix + key]);
  return {
    wsL100: n('ws_l100'),   ipL100: n('ip_l100'),   racesL100: n('races_l100'),
    wsL200: n('ws_l200'),   ipL200: n('ip_l200'),   racesL200: n('races_l200'),
    wsL400: n('ws_l400'),   ipL400: n('ip_l400'),   racesL400: n('races_l400'),
    wsL500: n('ws_l500'),   ipL500: n('ip_l500'),   racesL500: n('races_l500'),
    wsHist: n('ws_hist'),   ipHist: n('ip_hist'),   racesHist: n('races_hist'),
    wsL30d: n('ws_l30d'),   ipL30d: n('ip_l30d'),   racesL30d: n('races_l30d'),
    wsL90d: n('ws_l90d'),   ipL90d: n('ip_l90d'),   racesL90d: n('races_l90d'),
    wsL180d: n('ws_l180d'), ipL180d: n('ip_l180d'), racesL180d: n('races_l180d'),
  };
}

function mapCombos(raw: RawComboEntry[]): ComboEntry[] {
  return (raw ?? []).map((c) => ({
    name: c.combo_name,
    races: c.races,
    wsCombo: safeNum(c.ws_combo),
    gapCombo: safeNum(c.gap_combo),
    wsComboVsOther: safeNum(c.ws_combo_vs_other),
    gapComboVsOther: safeNum(c.gap_combo_vs_other),
  }));
}

function transformCuidadorData(raw: CuidadorData): TrainerData {
  const trainers: Trainer[] = raw.topList.map((top, i) => {
    const key = String(top.id_cuidador);
    const s: RawSummaryRecord = raw.summary?.[key] ?? {};
    const ts: RawTimePoint[] = raw.timeseries?.[key] ?? [];
    const combosRaw: RawCombos = raw.combos?.[key] ?? { jockeys: [], sires: [], stables: [] };

    // Build tracks (only include if has historical races)
    const tracks: Record<string, BreakdownEntry> = {};
    for (const track of ['PAL', 'SI', 'LP']) {
      const prefix = `track_${track}_`;
      if (safeNum(s[`${prefix}races_hist`]) > 0) {
        tracks[track] = buildBreakdown(s, prefix);
      }
    }

    // Build surfaces
    const surfaces: Record<string, BreakdownEntry> = {};
    for (const [srcKey, label] of [['Arena', 'Arena'], ['Cesped', 'Césped']] as const) {
      if (safeNum(s[`${srcKey}_races_hist`]) > 0) {
        surfaces[label] = buildBreakdown(s, `${srcKey}_`);
      }
    }

    // Build distances
    const distances: Record<string, BreakdownEntry> = {};
    for (const [srcKey, label] of [
      ['dist_short', 'Corta'],
      ['dist_mid', 'Media'],
      ['dist_long', 'Larga'],
    ] as const) {
      if (safeNum(s[`${srcKey}_races_hist`]) > 0) {
        distances[label] = buildBreakdown(s, `${srcKey}_`);
      }
    }

    return {
      id: i,
      name: top.cuidador,
      surname: top.surname,
      rank: top.rank,
      racesL6m: top.races_l6m,
      totalRaces: safeNum(s.total_races_cuidador),
      winShares: {
        l100: safeNum(s.ws_l100), l200: safeNum(s.ws_l200),
        l400: safeNum(s.ws_l400), l500: safeNum(s.ws_l500),
        hist: safeNum(s.ws_hist), l30d: safeNum(s.ws_l30d),
        l90d: safeNum(s.ws_l90d), l180d: safeNum(s.ws_l180d),
      },
      impliedProbs: {
        l100: safeNum(s.ip_l100), l200: safeNum(s.ip_l200),
        l400: safeNum(s.ip_l400), l500: safeNum(s.ip_l500),
        hist: safeNum(s.ip_hist), l30d: safeNum(s.ip_l30d),
        l90d: safeNum(s.ip_l90d), l180d: safeNum(s.ip_l180d),
      },
      tracks,
      surfaces,
      distances,
      timeSeries: ts.map((p) => ({
        date: p.date_str,
        wsL200: safeNum(p.ws_l200),
        ipL200: safeNum(p.ip_l200),
        wsL200Mean: safeNum(p.ws_l200_mean_all),
        wsL200P90: safeNum(p.ws_l200_p90_all),
        hrrL50: safeNum(p.hrr_l50),
        hrrL200: safeNum(p.hrr_l200),
        racesL3m: safeNum(p.races_l3m),
      })),
      combos: {
        jockeys: mapCombos(combosRaw.jockeys),
        sires: mapCombos(combosRaw.sires),
        stables: mapCombos(combosRaw.stables),
      },
    };
  });

  return { trainers };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pct = (v: number) => (v * 100).toFixed(1) + '%';
const pp = (v: number) => (v >= 0 ? '+' : '') + (v * 100).toFixed(1) + 'pp';
const gapCls = (v: number) => (v >= 0 ? 'text-green-400' : 'text-red-400');

// ─── GapBadge ────────────────────────────────────────────────────────────────

function GapBadge({ value }: { value: number }) {
  return (
    <span className={`text-xs font-medium tabular-nums ${gapCls(value)}`}>
      {pp(value)}
    </span>
  );
}

// ─── StatCard ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, gap }: { label: string; value: string; sub?: string; gap?: number }) {
  const valColor = gap !== undefined ? gapCls(gap) : 'text-white';
  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-light tabular-nums ${valColor}`}>{value}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── ViewToggle ──────────────────────────────────────────────────────────────

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  const options: { key: ViewMode; label: string }[] = [
    { key: 'l30d', label: 'L30d' }, { key: 'l90d', label: 'L90d' },
    { key: 'l180d', label: 'L180d' }, { key: 'l100', label: 'L100' },
    { key: 'l200', label: 'L200' }, { key: 'l400', label: 'L400' },
    { key: 'l500', label: 'L500' }, { key: 'hist', label: 'Hist' },
  ];
  return (
    <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded">
      {options.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
            mode === key ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── BreakdownTable ──────────────────────────────────────────────────────────

function BreakdownTable({ title, data, viewMode }: { title: string; data: Record<string, BreakdownEntry>; viewMode: ViewMode }) {
  const wsKey:    Record<ViewMode, keyof BreakdownEntry> = { l100: 'wsL100', l200: 'wsL200', l400: 'wsL400', l500: 'wsL500', hist: 'wsHist', l30d: 'wsL30d', l90d: 'wsL90d', l180d: 'wsL180d' };
  const ipKey:    Record<ViewMode, keyof BreakdownEntry> = { l100: 'ipL100', l200: 'ipL200', l400: 'ipL400', l500: 'ipL500', hist: 'ipHist', l30d: 'ipL30d', l90d: 'ipL90d', l180d: 'ipL180d' };
  const racesKey: Record<ViewMode, keyof BreakdownEntry> = { l100: 'racesL100', l200: 'racesL200', l400: 'racesL400', l500: 'racesL500', hist: 'racesHist', l30d: 'racesL30d', l90d: 'racesL90d', l180d: 'racesL180d' };
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
        {title}
        <span className="ml-2 text-gray-600 normal-case font-normal">
          ({viewMode === 'hist' ? 'Historical' : viewMode.toUpperCase()})
        </span>
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-right">
            <th className="text-left text-gray-500 font-normal py-1.5 pr-2" />
            <th className="text-gray-500 font-normal py-1.5 px-2">WS</th>
            <th className="text-gray-500 font-normal py-1.5 px-2">Public</th>
            <th className="text-gray-500 font-normal py-1.5 px-2">Gap</th>
            <th className="text-gray-500 font-normal py-1.5 pl-2">Races</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, val]) => {
            const ws = val[wsKey[viewMode]] as number;
            const ip = val[ipKey[viewMode]] as number;
            const races = val[racesKey[viewMode]] as number;
            const gap = ws - ip;
            return (
              <tr key={key} className="border-b border-white/5 hover:bg-white/5 text-right transition-colors">
                <td className="text-gray-200 text-left py-2 pr-2 font-medium">{key}</td>
                <td className="text-gray-200 py-2 px-2 tabular-nums">{pct(ws)}</td>
                <td className="text-gray-500 py-2 px-2 tabular-nums">{pct(ip)}</td>
                <td className={`py-2 px-2 font-medium tabular-nums ${gapCls(gap)}`}>{pp(gap)}</td>
                <td className="text-gray-500 py-2 pl-2 tabular-nums">{(races ?? 0).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── ComboTable ──────────────────────────────────────────────────────────────

function ComboTable({ title, data }: { title: string; data: ComboEntry[] }) {
  if (!data?.length) return null;
  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">{title} Combos</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/10 text-right">
            <th className="text-left text-gray-500 font-normal py-1.5 pr-2">Name</th>
            <th className="text-gray-500 font-normal py-1.5 px-1">Races</th>
            <th className="text-gray-500 font-normal py-1.5 px-1">WS%</th>
            <th className="text-gray-500 font-normal py-1.5 px-1 leading-tight text-right">
              <span className="block">Gap to</span><span className="block">Public</span>
            </th>
            <th className="text-gray-500 font-normal py-1.5 pl-1 leading-tight text-right">
              <span className="block">Gap to</span><span className="block">Others</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 6).map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/5 text-right transition-colors">
              <td className="text-gray-200 text-left py-2 pr-2 max-w-[90px] truncate" title={row.name}>{row.name}</td>
              <td className="text-gray-500 py-2 px-1 tabular-nums">{row.races}</td>
              <td className="text-gray-200 py-2 px-1 tabular-nums">{row.wsCombo.toFixed(1)}%</td>
              <td className={`py-2 px-1 tabular-nums ${row.gapCombo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {row.gapCombo >= 0 ? '+' : ''}{row.gapCombo.toFixed(1)}
              </td>
              <td className={`py-2 pl-1 tabular-nums ${row.wsComboVsOther >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {row.wsComboVsOther >= 0 ? '+' : ''}{row.wsComboVsOther.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── TimeSeriesChart ─────────────────────────────────────────────────────────

const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#0d2137',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '4px',
  fontSize: '12px',
};

function TimeSeriesChart({ timeSeries, viewMode, wsHist, ipHist }: {
  timeSeries: TimePoint[]; viewMode: ViewMode; wsHist: number; ipHist: number;
}) {
  const chartData = useMemo(
    () => timeSeries.slice(-24).map((p) => ({
      date: p.date.slice(0, 7),
      ws: +(p.wsL200 * 100).toFixed(2),
      ip: +(p.ipL200 * 100).toFixed(2),
      mean: +(p.wsL200Mean * 100).toFixed(2),
      p90: +(p.wsL200P90 * 100).toFixed(2),
    })),
    [timeSeries]
  );

  if (viewMode === 'hist') {
    const histChartData = timeSeries.slice(-24).map((p) => ({
      date: p.date.slice(0, 7),
      ws: +(wsHist * 100).toFixed(2),
      ip: +(ipHist * 100).toFixed(2),
    }));
    if (!histChartData.length) return null;
    return (
      <div className="bg-white/5 border border-white/10 p-4">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
          Win Share vs Public Odds — Historical
        </h3>
        <p className="text-xs text-gray-600 mb-4">Overall historical averages (flat reference)</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={histChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => v + '%'} domain={['auto', 'auto']} width={42} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: '#e5e7eb', marginBottom: '4px' }} formatter={(v: unknown, name: unknown) => [typeof v === 'number' ? `${v.toFixed(1)}%` : '—', typeof name === 'string' ? name : '']} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af', paddingTop: '8px' }} />
            <Line type="monotone" dataKey="ip" name="Public Odds" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
            <Line type="monotone" dataKey="ws" name="Win Share" stroke="#60a5fa" strokeWidth={2} strokeDasharray="6 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (!chartData.length) return null;
  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
        Win Share vs Public Odds — L200 rolling
      </h3>
      <p className="text-xs text-gray-600 mb-4">Last {chartData.length} data points</p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => v + '%'} domain={['auto', 'auto']} width={42} />
          <Tooltip contentStyle={CHART_TOOLTIP_STYLE} labelStyle={{ color: '#e5e7eb', marginBottom: '4px' }} formatter={(v: unknown, name: unknown) => [typeof v === 'number' ? `${v.toFixed(1)}%` : '—', typeof name === 'string' ? name : '']} />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#9ca3af', paddingTop: '8px' }} />
          <Line type="monotone" dataKey="p90" name="P90" stroke="rgba(255,255,255,0.10)" strokeDasharray="4 4" dot={false} legendType="none" />
          <Line type="monotone" dataKey="mean" name="Field Mean" stroke="rgba(255,255,255,0.20)" strokeDasharray="4 4" dot={false} legendType="none" />
          <Line type="monotone" dataKey="ip" name="Public Odds" stroke="#6b7280" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="ws" name="Win Share" stroke="#60a5fa" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── TrainerSidebar ──────────────────────────────────────────────────────────

const WS_KEY: Record<ViewMode, keyof BreakdownEntry> = { l100: 'wsL100', l200: 'wsL200', l400: 'wsL400', l500: 'wsL500', hist: 'wsHist', l30d: 'wsL30d', l90d: 'wsL90d', l180d: 'wsL180d' };
const IP_KEY: Record<ViewMode, keyof BreakdownEntry> = { l100: 'ipL100', l200: 'ipL200', l400: 'ipL400', l500: 'ipL500', hist: 'ipHist', l30d: 'ipL30d', l90d: 'ipL90d', l180d: 'ipL180d' };

const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
  { key: 'l30d', label: 'L30d' }, { key: 'l90d', label: 'L90d' },
  { key: 'l180d', label: 'L180d' }, { key: 'l100', label: 'L100' },
  { key: 'l200', label: 'L200' }, { key: 'l400', label: 'L400' },
  { key: 'l500', label: 'L500' }, { key: 'hist', label: 'Hist' },
];

function TrainerSidebar({ trainers, selectedId, onSelect }: { trainers: Trainer[]; selectedId: number | null; onSelect: (id: number) => void }) {
  const [search, setSearch] = useState('');
  const [rankMode, setRankMode] = useState<ViewMode>('l200');
  const [distFilter, setDistFilter] = useState<string>('all');

  const allDistances = useMemo(() => {
    const dists = new Set<string>();
    trainers.forEach((t) => Object.keys(t.distances ?? {}).forEach((d) => dists.add(d)));
    return Array.from(dists);
  }, [trainers]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return trainers
      .filter((t) => t.name.toLowerCase().includes(term) || t.surname.toLowerCase().includes(term))
      .sort((a, b) => {
        let valA: number, valB: number;
        if (distFilter !== 'all') {
          const entA = a.distances?.[distFilter];
          const entB = b.distances?.[distFilter];
          valA = entA ? (entA[WS_KEY[rankMode]] as number) - (entA[IP_KEY[rankMode]] as number) : 0;
          valB = entB ? (entB[WS_KEY[rankMode]] as number) - (entB[IP_KEY[rankMode]] as number) : 0;
        } else {
          valA = (a.winShares?.[rankMode] ?? 0) - (a.impliedProbs?.[rankMode] ?? 0);
          valB = (b.winShares?.[rankMode] ?? 0) - (b.impliedProbs?.[rankMode] ?? 0);
        }
        return valB - valA;
      });
  }, [trainers, search, rankMode, distFilter]);

  return (
    <div className="w-72 flex-shrink-0 border-r border-white/10 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 220px)', position: 'sticky', top: 0 }}>
      <div className="p-3 border-b border-white/10 flex-shrink-0 space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Entrenadores</p>
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm bg-white/5 border border-white/10 text-gray-300 placeholder-gray-600 focus:outline-none focus:border-white/30 rounded"
        />
        <div className="flex gap-0.5 bg-white/5 border border-white/10 p-0.5 rounded">
          {VIEW_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRankMode(key)}
              className={`flex-1 py-1 text-xs font-medium rounded transition-colors duration-150 ${rankMode === key ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={distFilter}
          onChange={(e) => setDistFilter(e.target.value)}
          className="w-full px-2.5 py-1.5 text-xs bg-white/5 border border-white/10 text-gray-300 focus:outline-none focus:border-white/30 rounded"
        >
          <option value="all">All distances</option>
          {allDistances.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="overflow-y-auto flex-1">
        {filtered.map((t, i) => {
          let ws: number, ip: number;
          if (distFilter !== 'all' && t.distances?.[distFilter]) {
            const ent = t.distances[distFilter];
            ws = ent[WS_KEY[rankMode]] as number;
            ip = ent[IP_KEY[rankMode]] as number;
          } else {
            ws = t.winShares?.[rankMode] ?? 0;
            ip = t.impliedProbs?.[rankMode] ?? 0;
          }
          const gap = ws - ip;
          const isSelected = t.id === selectedId;
          return (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-white/5 transition-colors duration-100 ${isSelected ? 'bg-white/10 border-l-2 border-l-blue-500' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs w-5 text-right flex-shrink-0 tabular-nums">{i + 1}.</span>
                <span className="text-gray-100 text-sm font-medium truncate">{t.surname}</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 pl-7">
                <span className="text-xs text-gray-600">WS <span className="text-gray-400 tabular-nums">{pct(ws)}</span></span>
                <GapBadge value={gap} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── TrainerDetail ───────────────────────────────────────────────────────────

function TrainerDetail({ trainer, gapRank, viewMode, onViewModeChange }: {
  trainer: Trainer; gapRank: number; viewMode: ViewMode; onViewModeChange: (m: ViewMode) => void;
}) {
  const ws = trainer.winShares?.[viewMode] ?? 0;
  const ip = trainer.impliedProbs?.[viewMode] ?? 0;
  const gap = ws - ip;

  const hasBreakdowns =
    Object.keys(trainer.tracks).length > 0 ||
    Object.keys(trainer.surfaces).length > 0 ||
    Object.keys(trainer.distances).length > 0;

  const hasCombos =
    trainer.combos.jockeys.length > 0 ||
    trainer.combos.sires.length > 0 ||
    trainer.combos.stables.length > 0;

  return (
    <div className="p-6 space-y-5 overflow-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">Rank #{gapRank}</div>
          <h2 className="text-2xl font-light text-white">{trainer.name}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {trainer.totalRaces?.toLocaleString()} total races · {trainer.racesL6m} in last 6 months
          </p>
        </div>
        <ViewToggle mode={viewMode} onChange={onViewModeChange} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        <StatCard label="Win Share" value={pct(ws)} sub={`Window: ${viewMode.toUpperCase()}`} />
        <StatCard label="Public Odds" value={pct(ip)} />
        <StatCard label="Gap vs Public" value={pp(gap)} gap={gap} />
        <StatCard label="Races L6m" value={trainer.racesL6m?.toLocaleString() ?? '—'} sub={`Total: ${trainer.totalRaces?.toLocaleString() ?? '—'}`} />
      </div>

      {trainer.timeSeries.length > 0 && (
        <TimeSeriesChart
          timeSeries={trainer.timeSeries}
          viewMode={viewMode}
          wsHist={trainer.winShares?.hist ?? 0}
          ipHist={trainer.impliedProbs?.hist ?? 0}
        />
      )}

      {hasBreakdowns && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Object.keys(trainer.tracks).length > 0 && (
            <BreakdownTable title="Tracks" data={trainer.tracks} viewMode={viewMode} />
          )}
          {Object.keys(trainer.surfaces).length > 0 && (
            <BreakdownTable title="Surfaces" data={trainer.surfaces} viewMode={viewMode} />
          )}
          {Object.keys(trainer.distances).length > 0 && (
            <BreakdownTable title="Distances" data={trainer.distances} viewMode={viewMode} />
          )}
        </div>
      )}

      {hasCombos && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ComboTable title="Jockey" data={trainer.combos.jockeys} />
          <ComboTable title="Sire" data={trainer.combos.sires} />
          <ComboTable title="Stable" data={trainer.combos.stables} />
        </div>
      )}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function TrainerAnalytics() {
  const [data, setData] = useState<TrainerData | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('l200');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/cuidador_data.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then((text) => {
        // cuidador_data.json may contain bare NaN (Python artifact) — sanitize first
        const sanitized = text.replace(/:\s*NaN/g, ': null');
        const raw: CuidadorData = JSON.parse(sanitized);
        const transformed = transformCuidadorData(raw);
        setData(transformed);
        if (transformed.trainers.length > 0) setSelectedId(0);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const selectedTrainer = useMemo(
    () => data?.trainers.find((t) => t.id === selectedId) ?? null,
    [data, selectedId]
  );

  const gapRank = useMemo(() => {
    if (!data || selectedId === null) return 1;
    const sorted = [...data.trainers].sort((a, b) => {
      const gA = (a.winShares?.[viewMode] ?? 0) - (a.impliedProbs?.[viewMode] ?? 0);
      const gB = (b.winShares?.[viewMode] ?? 0) - (b.impliedProbs?.[viewMode] ?? 0);
      return gB - gA;
    });
    return sorted.findIndex((t) => t.id === selectedId) + 1;
  }, [data, selectedId, viewMode]);

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-500 text-sm">Loading trainer analytics…</div>;
  if (error) return <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">{error}</div>;
  if (!data?.trainers?.length) return <div className="p-4 text-gray-500 text-sm">No trainer data found.</div>;

  return (
    <div className="flex gap-0" style={{ minHeight: 'calc(100vh - 220px)' }}>
      <TrainerSidebar trainers={data.trainers} selectedId={selectedId} onSelect={setSelectedId} />
      <div className="flex-1 overflow-auto min-w-0">
        {selectedTrainer ? (
          <TrainerDetail trainer={selectedTrainer} gapRank={gapRank} viewMode={viewMode} onViewModeChange={setViewMode} />
        ) : (
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
            Select a trainer from the list
          </div>
        )}
      </div>
    </div>
  );
}
