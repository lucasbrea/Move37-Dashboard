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

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = 'l100' | 'l200' | 'l400' | 'l500' | 'hist' | 'l30d' | 'l90d' | 'l180d' | 'Stkl50' | 'Stkl100' | 'Stkl200' | 'Stkhist';

interface BreakdownEntry {
  wsL100: number;
  ipL100: number;
  wsL200: number;
  ipL200: number;
  wsL400: number;
  ipL400: number;
  wsL500: number;
  ipL500: number;
  wsHist: number;
  ipHist: number;
  racesL100: number;
  racesL200: number;
  racesL400: number;
  racesL500: number;
  racesHist: number;
  wsL30d: number;
  ipL30d: number;
  racesL30d: number;
  wsL90d: number;
  ipL90d: number;
  racesL90d: number;
  wsL180d: number;
  ipL180d: number;
  racesL180d: number;
  // Strike-rate windows
  StkwsL50: number;
  StkipL50: number;
  StkracesL50: number;
  StkwsL100: number;
  StkipL100: number;
  StkracesL100: number;
  StkwsL200: number;
  StkipL200: number;
  StkracesL200: number;
  Stkwshist: number;
  Stkiphist: number;
  StkracesLhist: number;
}

interface ComboEntry {
  name: string;
  races: number;
  wsCombo: number;
  gapCombo: number;
  wsComboVsOther: number;
  gapComboVsOther: number;
  hrrCombo: number;
  hrrComboVsOther: number;
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

interface RankEntry {
  rank: number;
  wsInDist: number;
  races: number;
  wsDiffVsOverall: number;
  gapToImplied: number;
}

interface Jockey {
  id: number;
  name: string;
  surname: string;
  rank: number;
  racesL6m: number;
  totalRaces: number;
  winShares: Record<string, number>;
  impliedProbs: Record<string, number>;
  hrr: { l50: number; l200: number };
  tracks: Record<string, BreakdownEntry>;
  surfaces: Record<string, BreakdownEntry>;
  distances: Record<string, BreakdownEntry>;
  timeSeries: TimePoint[];
  combos: {
    trainers: ComboEntry[];
    sires: ComboEntry[];
    stables: ComboEntry[];
  };
  rankings: Record<string, RankEntry>;
  improvement: {
    ratio: number;
    newHorsesReceived: number;
    shareNewHorses: number;
  };
  horseQuality: {
    avgQuality: number;
    qualityPctile: number;
    avgAge: number;
    agePctile: number;
    avgDistance: number;
    distancePctile: number;
  };
  estado: {
    normalWsHist: number;
    normalWsL200: number;
    notNormalWsHist: number;
    notNormalWsL200: number;
  };
}

interface JockeyData {
  metadata: { exportDate: string; numJockeys: number };
  jockeys: Jockey[];
  global: Record<string, unknown>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Read a value from a breakdown entry, falling back to lowercase-L variants
 * used by the surfaces breakdown (e.g. Stkwsl50 instead of StkwsL50) and
 * the no-L hist races key (Stkraceshist vs StkracesLhist).
 */
function getEntryVal(entry: BreakdownEntry, key: string): number {
  const map = entry as unknown as Record<string, number>;
  const raw = map[key];
  if (raw != null) return raw;
  // surfaces lowercase-l variant: StkwsL50 → Stkwsl50
  const altKey = key.replace(/L(\d)/, 'l$1').replace('StkracesLhist', 'Stkraceshist');
  return map[altKey] ?? 0;
}

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

function StatCard({
  label,
  value,
  sub,
  gap,
}: {
  label: string;
  value: string;
  sub?: string;
  gap?: number;
}) {
  const valColor =
    gap !== undefined ? gapCls(gap) : 'text-white';
  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className={`text-xl font-light tabular-nums ${valColor}`}>
        {value}
      </div>
      {sub && (
        <div className="text-xs text-gray-600 mt-0.5">{sub}</div>
      )}
    </div>
  );
}

// ─── ViewToggle ──────────────────────────────────────────────────────────────

function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  const wsOptions: { key: ViewMode; label: string }[] = [
    { key: 'l30d',  label: 'L30d'  },
    { key: 'l90d',  label: 'L90d'  },
    { key: 'l180d', label: 'L180d' },
    { key: 'l100',  label: 'L100'  },
    { key: 'l200',  label: 'L200'  },
    { key: 'l400',  label: 'L400'  },
    { key: 'l500',  label: 'L500'  },
    { key: 'hist',  label: 'Hist'  },
  ];
  const stkOptions: { key: ViewMode; label: string }[] = [
    { key: 'Stkl50',  label: 'Stk50'  },
    { key: 'Stkl100', label: 'Stk100' },
    { key: 'Stkl200', label: 'Stk200' },
    { key: 'Stkhist', label: 'StkHist'},
  ];
  return (
    <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded">
      {wsOptions.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
            mode === key
              ? 'bg-white/20 text-white'
              : 'text-gray-500 hover:text-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
      <div className="w-px bg-white/10 mx-1" />
      {stkOptions.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors duration-150 ${
            mode === key
              ? 'bg-amber-500/30 text-amber-300'
              : 'text-gray-500 hover:text-gray-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── BreakdownTable ──────────────────────────────────────────────────────────

function BreakdownTable({
  title,
  data,
  viewMode,
}: {
  title: string;
  data: Record<string, BreakdownEntry>;
  viewMode: ViewMode;
}) {
  const wsKey:    Record<ViewMode, keyof BreakdownEntry> = { l100: 'wsL100',    l200: 'wsL200',    l400: 'wsL400',    l500: 'wsL500',    hist: 'wsHist',    l30d: 'wsL30d',    l90d: 'wsL90d',    l180d: 'wsL180d',    Stkl50: 'StkwsL50',  Stkl100: 'StkwsL100',  Stkl200: 'StkwsL200',  Stkhist: 'Stkwshist'    };
  const ipKey:    Record<ViewMode, keyof BreakdownEntry> = { l100: 'ipL100',    l200: 'ipL200',    l400: 'ipL400',    l500: 'ipL500',    hist: 'ipHist',    l30d: 'ipL30d',    l90d: 'ipL90d',    l180d: 'ipL180d',    Stkl50: 'StkipL50',  Stkl100: 'StkipL100',  Stkl200: 'StkipL200',  Stkhist: 'Stkiphist'    };
  const racesKey: Record<ViewMode, keyof BreakdownEntry> = { l100: 'racesL100', l200: 'racesL200', l400: 'racesL400', l500: 'racesL500', hist: 'racesHist', l30d: 'racesL30d', l90d: 'racesL90d', l180d: 'racesL180d', Stkl50: 'StkracesL50', Stkl100: 'StkracesL100', Stkl200: 'StkracesL200', Stkhist: 'StkracesLhist' };
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
            const ws    = getEntryVal(val, wsKey[viewMode]    as string);
            const ip    = getEntryVal(val, ipKey[viewMode]    as string);
            const races = getEntryVal(val, racesKey[viewMode] as string);
            const gap = ws - ip;
            return (
              <tr
                key={key}
                className="border-b border-white/5 hover:bg-white/5 text-right transition-colors"
              >
                <td className="text-gray-200 text-left py-2 pr-2 font-medium max-w-[140px] truncate">
                  {title === 'Distances' ? distLabel(key) : key}
                </td>
                <td className="text-gray-200 py-2 px-2 tabular-nums">
                  {pct(ws)}
                </td>
                <td className="text-gray-500 py-2 px-2 tabular-nums">
                  {pct(ip)}
                </td>
                <td
                  className={`py-2 px-2 font-medium tabular-nums ${gapCls(gap)}`}
                >
                  {pp(gap)}
                </td>
                <td className="text-gray-500 py-2 pl-2 tabular-nums">
                  {(races ?? 0).toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── ComboTable ──────────────────────────────────────────────────────────────

function ComboTable({
  title,
  data,
}: {
  title: string;
  data: ComboEntry[];
}) {
  if (!data?.length) return null;
  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
        {title} Combos
        <span className="ml-2 text-gray-600 normal-case font-normal">(Hist)</span>
      </h3>
      <p className="text-xs text-gray-600 mb-3">
        "Gap to Others" = jockey's WS in this combo vs. all other jockeys in the same combination
      </p>
      <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10 text-right">
              <th className="text-left text-gray-500 font-normal py-1.5 pr-2">Name</th>
              <th className="text-gray-500 font-normal py-1.5 px-1">Races</th>
              <th className="text-gray-500 font-normal py-1.5 px-1">WS%</th>
              <th className="text-gray-500 font-normal py-1.5 px-1 leading-tight text-right">
                <span className="block">Gap to</span>
                <span className="block">Public</span>
              </th>
              <th className="text-gray-500 font-normal py-1.5 pl-1 leading-tight text-right">
                <span className="block">Gap to</span>
                <span className="block">Others</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 6).map((row, i) => (
              <tr
                key={i}
                className="border-b border-white/5 hover:bg-white/5 text-right transition-colors"
              >
                <td className="text-gray-200 text-left py-2 pr-2 max-w-[90px] truncate" title={row.name}>
                  {row.name}
                </td>
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

function TimeSeriesChart({
  timeSeries,
  viewMode,
  wsHist,
  ipHist,
}: {
  timeSeries: TimePoint[];
  viewMode: ViewMode;
  wsHist: number;
  ipHist: number;
}) {
  const sortedSeries = useMemo(
    () => [...timeSeries].sort((a, b) => a.date.localeCompare(b.date)),
    [timeSeries]
  );

  const chartData = useMemo(
    () =>
      sortedSeries.slice(-50).map((p) => ({
        date: p.date.slice(0, 7),
        ws: +(p.wsL200 * 100).toFixed(2),
        ip: +(p.ipL200 * 100).toFixed(2),
        mean: +(p.wsL200Mean * 100).toFixed(2),
        p90: +(p.wsL200P90 * 100).toFixed(2),
      })),
    [sortedSeries]
  );

  // Historical mode: the timeSeries only carries L200 rolling points.
  // Show the overall hist values as flat reference lines instead.
  if (viewMode === 'hist') {
    const histChartData = sortedSeries.slice(-50).map((p) => ({
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
        <p className="text-xs text-gray-600 mb-4">
          Overall historical averages (flat reference — per-date hist series not available)
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart
            data={histChartData}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v + '%'}
              domain={['auto', 'auto']}
              width={42}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              labelStyle={{ color: '#e5e7eb', marginBottom: '4px' }}
              formatter={(v: unknown, name: unknown) => [
                typeof v === 'number' ? `${v.toFixed(1)}%` : '—',
                typeof name === 'string' ? name : '',
              ]}
            />
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
      <p className="text-xs text-gray-600 mb-4">
        Last {chartData.length} data points
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
          />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v + '%'}
            domain={['auto', 'auto']}
            width={42}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            labelStyle={{ color: '#e5e7eb', marginBottom: '4px' }}
            formatter={(v: unknown, name: unknown) => [
              typeof v === 'number' ? `${v.toFixed(1)}%` : '—',
              typeof name === 'string' ? name : '',
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', color: '#9ca3af', paddingTop: '8px' }}
          />
          {/* Background context lines */}
          <Line
            type="monotone"
            dataKey="p90"
            name="P90"
            stroke="rgba(255,255,255,0.10)"
            strokeDasharray="4 4"
            dot={false}
            legendType="none"
          />
          <Line
            type="monotone"
            dataKey="mean"
            name="Field Mean"
            stroke="rgba(255,255,255,0.20)"
            strokeDasharray="4 4"
            dot={false}
            legendType="none"
          />
          {/* Main lines */}
          <Line
            type="monotone"
            dataKey="ip"
            name="Public Odds"
            stroke="#6b7280"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="ws"
            name="Win Share"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── JockeySidebar ───────────────────────────────────────────────────────────

// Maps each regular window to its closest Stk equivalent
const STK_EQUIV: Partial<Record<ViewMode, ViewMode>> = {
  l30d: 'Stkl50', l90d: 'Stkl100', l180d: 'Stkl200',
  l100: 'Stkl100', l200: 'Stkl200', l400: 'Stkl200', l500: 'Stkl200',
  hist: 'Stkhist',
};

const VIEW_LABELS: Record<ViewMode, string> = {
  l30d: 'L30d', l90d: 'L90d', l180d: 'L180d',
  l100: 'L100', l200: 'L200', l400: 'L400', l500: 'L500', hist: 'Hist',
  Stkl50: 'Stk50', Stkl100: 'Stk100', Stkl200: 'Stk200', Stkhist: 'StkHist',
};

const DIST_LABELS: Record<string, string> = {
  '1000':     'Corta',
  '1100-1500': 'Media',
  '1600+':    'Larga',
};
const distLabel = (d: string) => DIST_LABELS[d] ?? d;

const WS_KEY:    Record<ViewMode, keyof BreakdownEntry> = { l100: 'wsL100',    l200: 'wsL200',    l400: 'wsL400',    l500: 'wsL500',    hist: 'wsHist',    l30d: 'wsL30d',    l90d: 'wsL90d',    l180d: 'wsL180d',    Stkl50: 'StkwsL50',  Stkl100: 'StkwsL100',  Stkl200: 'StkwsL200',  Stkhist: 'Stkwshist'    };
const IP_KEY:    Record<ViewMode, keyof BreakdownEntry> = { l100: 'ipL100',    l200: 'ipL200',    l400: 'ipL400',    l500: 'ipL500',    hist: 'ipHist',    l30d: 'ipL30d',    l90d: 'ipL90d',    l180d: 'ipL180d',    Stkl50: 'StkipL50',  Stkl100: 'StkipL100',  Stkl200: 'StkipL200',  Stkhist: 'Stkiphist'    };
const RACES_KEY: Record<ViewMode, keyof BreakdownEntry> = { l100: 'racesL100', l200: 'racesL200', l400: 'racesL400', l500: 'racesL500', hist: 'racesHist', l30d: 'racesL30d', l90d: 'racesL90d', l180d: 'racesL180d', Stkl50: 'StkracesL50', Stkl100: 'StkracesL100', Stkl200: 'StkracesL200', Stkhist: 'StkracesLhist' };


function JockeySidebar({
  jockeys,
  selectedId,
  onSelect,
  viewMode,
  distFilter,
}: {
  jockeys: Jockey[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  viewMode: ViewMode;
  distFilter: string;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return jockeys
      .filter(
        (j) =>
          j.name.toLowerCase().includes(term) ||
          j.surname.toLowerCase().includes(term)
      )
      .sort((a, b) => {
        let valA: number, valB: number;
        if (distFilter !== 'all') {
          const entA = a.distances?.[distFilter];
          const entB = b.distances?.[distFilter];
          const wsA = entA ? (entA[WS_KEY[viewMode]] as number) : 0;
          const wsB = entB ? (entB[WS_KEY[viewMode]] as number) : 0;
          const ipA = entA ? (entA[IP_KEY[viewMode]] as number) : 0;
          const ipB = entB ? (entB[IP_KEY[viewMode]] as number) : 0;
          valA = wsA - ipA;
          valB = wsB - ipB;
        } else {
          valA = (a.winShares?.[viewMode] ?? 0) - (a.impliedProbs?.[viewMode] ?? 0);
          valB = (b.winShares?.[viewMode] ?? 0) - (b.impliedProbs?.[viewMode] ?? 0);
        }
        return valB - valA;
      });
  }, [jockeys, search, viewMode, distFilter]);

  return (
    <div
      className="w-72 flex-shrink-0 border-r border-white/10 flex flex-col overflow-hidden"
      style={{ height: 'calc(100vh - 220px)', position: 'sticky', top: 0 }}
    >
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex-shrink-0 space-y-2">
        <p className="text-xs text-gray-500 uppercase tracking-wider">
          Jockeys
        </p>
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm bg-white/5 border border-white/10 text-gray-300
                     placeholder-gray-600 focus:outline-none focus:border-white/30 rounded"
        />
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {filtered.map((j, i) => {
          const isStk = viewMode.startsWith('Stk');
          let ws: number, ip: number;
          if (distFilter !== 'all' && j.distances?.[distFilter]) {
            const ent = j.distances[distFilter];
            ws = ent[WS_KEY[viewMode]] as number;
            ip = ent[IP_KEY[viewMode]] as number;
          } else {
            ws = j.winShares?.[viewMode] ?? 0;
            ip = j.impliedProbs?.[viewMode] ?? 0;
          }
          const gap = ws - ip;
          const isSelected = j.id === selectedId;

          // Races in selected window (sum across tracks)
          const races = Object.values(j.tracks ?? {}).reduce(
            (sum, entry) => sum + getEntryVal(entry, RACES_KEY[viewMode] as string),
            0
          );

          // Stk WS for equivalent window (only shown when not already in Stk mode)
          const stkMode = STK_EQUIV[viewMode];
          const stkWs = !isStk && stkMode ? (j.winShares?.[stkMode] ?? null) : null;

          return (
            <button
              key={j.id}
              onClick={() => onSelect(j.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-white/5 transition-colors duration-100 ${
                isSelected
                  ? 'bg-white/10 border-l-2 border-l-blue-500'
                  : 'hover:bg-white/5 border-l-2 border-l-transparent'
              }`}
            >
              {/* Name row + gap (most prominent) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-600 text-xs w-5 text-right flex-shrink-0 tabular-nums">
                    {i + 1}.
                  </span>
                  <span className="text-gray-100 text-sm font-medium truncate">
                    {j.surname}
                  </span>
                </div>
                <GapBadge value={gap} />
              </div>
              {/* Secondary stats row */}
              <div className="flex items-center gap-2 mt-0.5 pl-7 text-xs text-gray-600">
                <span>
                  {isStk ? 'Stk Wshr' : 'WS'}{' '}
                  <span className="text-gray-400 tabular-nums">{pct(ws)}</span>
                </span>
                {stkWs !== null && (
                  <span>
                    · Stk{' '}
                    <span className="text-amber-400/80 tabular-nums">{pct(stkWs)}</span>
                  </span>
                )}
                <span>
                  · <span className="text-gray-500 tabular-nums">{races}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── JockeyDetail ────────────────────────────────────────────────────────────

function JockeyDetail({
  jockey,
  gapRank,
  viewMode,
  onViewModeChange,
  distFilter,
  allDistances,
  onDistFilterChange,
}: {
  jockey: Jockey;
  gapRank: number;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  distFilter: string;
  allDistances: string[];
  onDistFilterChange: (d: string) => void;
}) {
  const isStk = viewMode.startsWith('Stk');
  const ws = jockey.winShares?.[viewMode] ?? jockey.winShares?.l200 ?? 0;
  const ip = jockey.impliedProbs?.[viewMode] ?? jockey.impliedProbs?.l200 ?? 0;
  const gap = ws - ip;

  const racesInWindow = useMemo(() => {
    const tracks = jockey.tracks ?? {};
    return Object.values(tracks).reduce(
      (sum, entry) => sum + getEntryVal(entry, RACES_KEY[viewMode] as string),
      0
    );
  }, [jockey.tracks, viewMode]);

  const hasBreakdowns =
    (jockey.tracks && Object.keys(jockey.tracks).length > 0) ||
    (jockey.surfaces && Object.keys(jockey.surfaces).length > 0) ||
    (jockey.distances && Object.keys(jockey.distances).length > 0);

  const hasCombos =
    jockey.combos?.trainers?.length ||
    jockey.combos?.sires?.length ||
    jockey.combos?.stables?.length;

  return (
    <div className="p-6 space-y-5 overflow-auto">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">
            Rank #{gapRank}
          </div>
          <h2 className="text-2xl font-light text-white">{jockey.name}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {jockey.totalRaces?.toLocaleString()} total races
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={distFilter}
            onChange={(e) => onDistFilterChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-white/5 border border-white/10 text-gray-300 focus:outline-none focus:border-white/30 rounded"
          >
            <option value="all">All distances</option>
            {allDistances.map((d) => (
              <option key={d} value={d}>{distLabel(d)}</option>
            ))}
          </select>
          <ViewToggle mode={viewMode} onChange={onViewModeChange} />
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          label={isStk ? 'Stk Win Share' : 'Win Share'}
          value={pct(ws)}
          sub={`Window: ${VIEW_LABELS[viewMode]}`}
        />
        <StatCard label={isStk ? 'Stk Public Odds' : 'Public Odds'} value={pct(ip)} />
        <StatCard label="Gap vs Public" value={pp(gap)} gap={gap} />
        <StatCard
          label={`Races ${VIEW_LABELS[viewMode]}`}
          value={racesInWindow.toLocaleString()}
          sub={`Total: ${jockey.totalRaces?.toLocaleString() ?? '—'}`}
        />
      </div>

      {/* ── Time Series ── */}
      {jockey.timeSeries?.length > 0 && (
        <TimeSeriesChart
          timeSeries={jockey.timeSeries}
          viewMode={viewMode}
          wsHist={jockey.winShares?.hist ?? 0}
          ipHist={jockey.impliedProbs?.hist ?? 0}
        />
      )}

      {/* ── Breakdowns ── */}
      {hasBreakdowns && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {jockey.tracks && Object.keys(jockey.tracks).length > 0 && (
            <BreakdownTable
              title="Tracks"
              data={jockey.tracks}
              viewMode={viewMode}
            />
          )}
          {jockey.surfaces && Object.keys(jockey.surfaces).length > 0 && (
            <BreakdownTable
              title="Surfaces"
              data={jockey.surfaces}
              viewMode={viewMode}
            />
          )}
          {jockey.distances && Object.keys(jockey.distances).length > 0 && (
            <BreakdownTable
              title="Distances"
              data={jockey.distances}
              viewMode={viewMode}
            />
          )}
        </div>
      )}

      {/* ── Combo Tables ── */}
      {hasCombos ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ComboTable title="Trainer" data={jockey.combos?.trainers ?? []} />
          <ComboTable title="Sire" data={jockey.combos?.sires ?? []} />
          <ComboTable title="Stable" data={jockey.combos?.stables ?? []} />
        </div>
      ) : null}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function JockeyAnalytics() {
  const [data, setData] = useState<JockeyData | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('l200');
  const [distFilter, setDistFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/jockey_data.json')
      .then((r) => {
        if (!r.ok)
          throw new Error(
            `HTTP ${r.status} — place your JSON at /public/data/jockey_data.json`
          );
        return r.json();
      })
      .then((d: JockeyData) => {
        // Normalize IDs — the export sets every jockey id to 0, so we assign
        // a stable index-based ID to make selection work correctly.
        const normalized: JockeyData = {
          ...d,
          jockeys: d.jockeys.map((j, i) => ({ ...j, id: i })),
        };
        setData(normalized);
        if (normalized.jockeys.length > 0) setSelectedId(0);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const selectedJockey = useMemo(
    () => data?.jockeys.find((j) => j.id === selectedId) ?? null,
    [data, selectedId]
  );

  const allDistances = useMemo(() => {
    const dists = new Set<string>();
    data?.jockeys.forEach((j) => Object.keys(j.distances ?? {}).forEach((d) => dists.add(d)));
    return Array.from(dists).sort((a, b) => parseInt(a) - parseInt(b));
  }, [data]);

  const gapRank = useMemo(() => {
    if (!data || selectedId === null) return 1;
    const sorted = [...data.jockeys].sort((a, b) => {
      let gapA: number, gapB: number;
      if (distFilter !== 'all') {
        const entA = a.distances?.[distFilter];
        const entB = b.distances?.[distFilter];
        gapA = entA ? (entA[WS_KEY[viewMode]] as number) - (entA[IP_KEY[viewMode]] as number) : 0;
        gapB = entB ? (entB[WS_KEY[viewMode]] as number) - (entB[IP_KEY[viewMode]] as number) : 0;
      } else {
        gapA = (a.winShares?.[viewMode] ?? 0) - (a.impliedProbs?.[viewMode] ?? 0);
        gapB = (b.winShares?.[viewMode] ?? 0) - (b.impliedProbs?.[viewMode] ?? 0);
      }
      return gapB - gapA;
    });
    return sorted.findIndex((j) => j.id === selectedId) + 1;
  }, [data, selectedId, viewMode, distFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
        Loading jockey analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">
        {error}
      </div>
    );
  }

  if (!data?.jockeys?.length) {
    return (
      <div className="p-4 text-gray-500 text-sm">No jockey data found.</div>
    );
  }

  return (
    <div className="flex gap-0" style={{ minHeight: 'calc(100vh - 220px)' }}>
      <JockeySidebar
        jockeys={data.jockeys}
        selectedId={selectedId}
        onSelect={setSelectedId}
        viewMode={viewMode}
        distFilter={distFilter}
      />
      <div className="flex-1 overflow-auto min-w-0">
        {selectedJockey ? (
          <JockeyDetail
            jockey={selectedJockey}
            gapRank={gapRank}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            distFilter={distFilter}
            allDistances={allDistances}
            onDistFilterChange={setDistFilter}
          />
        ) : (
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm">
            Select a jockey from the list
          </div>
        )}
      </div>
    </div>
  );
}
