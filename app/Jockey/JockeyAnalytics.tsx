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

type ViewMode = 'l100' | 'l200' | 'l400' | 'l500' | 'hist';

interface BreakdownEntry {
  wsL200: number;
  ipL200: number;
  racesL200: number;
  wsHist: number;
  ipHist: number;
  racesHist: number;
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
  const options: { key: ViewMode; label: string }[] = [
    { key: 'l100', label: 'L100' },
    { key: 'l200', label: 'L200' },
    { key: 'l400', label: 'L400' },
    { key: 'l500', label: 'L500' },
    { key: 'hist', label: 'Hist' },
  ];
  return (
    <div className="flex gap-1 bg-white/5 border border-white/10 p-1 rounded">
      {options.map(({ key, label }) => (
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
  const useHist = viewMode === 'hist';
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
        {title}
        <span className="ml-2 text-gray-600 normal-case font-normal">
          ({useHist ? 'Historical' : 'L200'})
        </span>
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-right">
            <th className="text-left text-gray-500 font-normal py-1.5 pr-2" />
            <th className="text-gray-500 font-normal py-1.5 px-2">WS</th>
            <th className="text-gray-500 font-normal py-1.5 px-2">IP</th>
            <th className="text-gray-500 font-normal py-1.5 px-2">Gap</th>
            <th className="text-gray-500 font-normal py-1.5 pl-2">Races</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([key, val]) => {
            const ws = useHist ? val.wsHist : val.wsL200;
            const ip = useHist ? val.ipHist : val.ipL200;
            const races = useHist ? val.racesHist : val.racesL200;
            const gap = ws - ip;
            return (
              <tr
                key={key}
                className="border-b border-white/5 hover:bg-white/5 text-right transition-colors"
              >
                <td className="text-gray-200 text-left py-2 pr-2 font-medium">
                  {key}
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
                  {races.toLocaleString()}
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
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
        {title} Combos
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-right">
              <th className="text-left text-gray-500 font-normal py-1.5 pr-2">
                Name
              </th>
              <th className="text-gray-500 font-normal py-1.5 px-2">Races</th>
              <th className="text-gray-500 font-normal py-1.5 px-2">WS%</th>
              <th className="text-gray-500 font-normal py-1.5 px-2">Gap</th>
              <th className="text-gray-500 font-normal py-1.5 px-2">
                vs Others
              </th>
              <th className="text-gray-500 font-normal py-1.5 pl-2">HRR</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 6).map((row, i) => (
              <tr
                key={i}
                className="border-b border-white/5 hover:bg-white/5 text-right transition-colors"
              >
                <td className="text-gray-200 text-left py-2 pr-2 truncate max-w-[110px]">
                  {row.name}
                </td>
                <td className="text-gray-500 py-2 px-2 tabular-nums">
                  {row.races}
                </td>
                <td className="text-gray-200 py-2 px-2 tabular-nums">
                  {row.wsCombo.toFixed(1)}%
                </td>
                <td
                  className={`py-2 px-2 tabular-nums ${
                    row.gapCombo >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {row.gapCombo >= 0 ? '+' : ''}
                  {row.gapCombo.toFixed(1)}
                </td>
                <td
                  className={`py-2 px-2 tabular-nums ${
                    row.wsComboVsOther >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {row.wsComboVsOther >= 0 ? '+' : ''}
                  {row.wsComboVsOther.toFixed(1)}
                </td>
                <td
                  className={`py-2 pl-2 tabular-nums font-medium ${
                    row.hrrCombo >= 1 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {row.hrrCombo.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── RankingsTable ───────────────────────────────────────────────────────────

function RankingsTable({
  rankings,
}: {
  rankings: Record<string, RankEntry>;
}) {
  const entries = Object.entries(rankings);
  if (!entries.length) return null;
  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
        Rankings by Distance
      </h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-right">
            <th className="text-left text-gray-500 font-normal py-1.5 pr-2">
              Distance
            </th>
            <th className="text-gray-500 font-normal py-1.5 px-2">Rank</th>
            <th className="text-gray-500 font-normal py-1.5 px-2">WS%</th>
            <th className="text-gray-500 font-normal py-1.5 px-2">vs Overall</th>
            <th className="text-gray-500 font-normal py-1.5 pl-2">
              Gap to Model
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([dist, r]) => (
            <tr
              key={dist}
              className="border-b border-white/5 hover:bg-white/5 text-right transition-colors"
            >
              <td className="text-gray-200 text-left py-2 pr-2">{dist}</td>
              <td
                className={`py-2 px-2 font-medium tabular-nums ${
                  r.rank <= 3
                    ? 'text-yellow-300'
                    : r.rank <= 10
                    ? 'text-gray-200'
                    : 'text-gray-500'
                }`}
              >
                #{r.rank}
              </td>
              <td className="text-gray-200 py-2 px-2 tabular-nums">
                {r.wsInDist.toFixed(1)}%
              </td>
              <td
                className={`py-2 px-2 tabular-nums ${gapCls(r.wsDiffVsOverall)}`}
              >
                {r.wsDiffVsOverall >= 0 ? '+' : ''}
                {r.wsDiffVsOverall.toFixed(1)}
              </td>
              <td
                className={`py-2 pl-2 font-medium tabular-nums ${gapCls(
                  r.gapToImplied
                )}`}
              >
                {r.gapToImplied >= 0 ? '+' : ''}
                {r.gapToImplied.toFixed(1)}
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

function TimeSeriesChart({ timeSeries }: { timeSeries: TimePoint[] }) {
  const chartData = useMemo(
    () =>
      timeSeries.slice(-24).map((p) => ({
        date: p.date.slice(0, 7),
        ws: +(p.wsL200 * 100).toFixed(2),
        ip: +(p.ipL200 * 100).toFixed(2),
        mean: +(p.wsL200Mean * 100).toFixed(2),
        p90: +(p.wsL200P90 * 100).toFixed(2),
      })),
    [timeSeries]
  );

  if (!chartData.length) return null;

  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
        Win Share vs Model — L200 rolling
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
            formatter={(v: number, name: string) => [
              `${v.toFixed(1)}%`,
              name,
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
            name="Model (IP)"
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

function JockeySidebar({
  jockeys,
  selectedId,
  onSelect,
}: {
  jockeys: Jockey[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      jockeys.filter((j) =>
        j.name.toLowerCase().includes(search.toLowerCase())
      ),
    [jockeys, search]
  );

  return (
    <div
      className="w-56 flex-shrink-0 border-r border-white/10 flex flex-col overflow-hidden"
      style={{ height: 'calc(100vh - 220px)', position: 'sticky', top: 0 }}
    >
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex-shrink-0">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
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
        {filtered.map((j) => {
          const ws = j.winShares?.l200 ?? 0;
          const ip = j.impliedProbs?.l200 ?? 0;
          const gap = ws - ip;
          const isSelected = j.id === selectedId;

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
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-xs w-4 text-right flex-shrink-0 tabular-nums">
                  {j.rank}.
                </span>
                <span className="text-gray-100 text-sm font-medium truncate">
                  {j.surname}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 pl-6">
                <span className="text-xs text-gray-600">
                  WS{' '}
                  <span className="text-gray-400 tabular-nums">{pct(ws)}</span>
                </span>
                <GapBadge value={gap} />
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
  viewMode,
  onViewModeChange,
}: {
  jockey: Jockey;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
}) {
  const ws = jockey.winShares?.[viewMode] ?? jockey.winShares?.l200 ?? 0;
  const ip = jockey.impliedProbs?.[viewMode] ?? jockey.impliedProbs?.l200 ?? 0;
  const gap = ws - ip;

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
            Rank #{jockey.rank}
          </div>
          <h2 className="text-2xl font-light text-white">{jockey.name}</h2>
          <p className="text-xs text-gray-500 mt-1">
            {jockey.totalRaces?.toLocaleString()} total races ·{' '}
            {jockey.racesL6m} in last 6 months
          </p>
        </div>
        <ViewToggle mode={viewMode} onChange={onViewModeChange} />
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          label="Win Share"
          value={pct(ws)}
          sub={`Window: ${viewMode.toUpperCase()}`}
        />
        <StatCard label="Implied Prob" value={pct(ip)} />
        <StatCard label="Gap vs Model" value={pp(gap)} gap={gap} />
        <StatCard
          label="HRR"
          value={(jockey.hrr?.l200 ?? 0).toFixed(2)}
          sub={`L50: ${(jockey.hrr?.l50 ?? 0).toFixed(2)}`}
        />
        <StatCard
          label="Races L6m"
          value={jockey.racesL6m?.toLocaleString() ?? '—'}
          sub={`Total: ${jockey.totalRaces?.toLocaleString() ?? '—'}`}
        />
      </div>

      {/* ── Time Series ── */}
      {jockey.timeSeries?.length > 0 && (
        <TimeSeriesChart timeSeries={jockey.timeSeries} />
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

      {/* ── Rankings by Distance ── */}
      {jockey.rankings && Object.keys(jockey.rankings).length > 0 && (
        <RankingsTable rankings={jockey.rankings} />
      )}

      {/* ── Combo Tables ── */}
      {hasCombos ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ComboTable title="Trainer" data={jockey.combos?.trainers ?? []} />
          <ComboTable title="Sire" data={jockey.combos?.sires ?? []} />
          <ComboTable title="Stable" data={jockey.combos?.stables ?? []} />
        </div>
      ) : null}

      {/* ── Horse Quality + Improvement ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {jockey.horseQuality && (
          <div className="bg-white/5 border border-white/10 p-4">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Horse Quality
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Avg Quality"
                value={(jockey.horseQuality.avgQuality ?? 0).toFixed(0)}
                sub={`P${jockey.horseQuality.qualityPctile ?? '?'}`}
              />
              <StatCard
                label="Avg Age"
                value={(jockey.horseQuality.avgAge ?? 0).toFixed(1)}
                sub={`P${jockey.horseQuality.agePctile ?? '?'}`}
              />
              <StatCard
                label="Avg Dist"
                value={
                  (jockey.horseQuality.avgDistance ?? 0).toFixed(0) + 'm'
                }
                sub={`P${jockey.horseQuality.distancePctile ?? '?'}`}
              />
            </div>
          </div>
        )}

        {jockey.improvement && (
          <div className="bg-white/5 border border-white/10 p-4">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              New Horses &amp; Improvement
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Imp. Ratio"
                value={(jockey.improvement.ratio ?? 1).toFixed(2)}
              />
              <StatCard
                label="New Horses"
                value={(
                  jockey.improvement.newHorsesReceived ?? 0
                ).toLocaleString()}
              />
              <StatCard
                label="Share New"
                value={pct(jockey.improvement.shareNewHorses ?? 0)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Track Condition (Estado) ── */}
      {jockey.estado && (
        <div className="bg-white/5 border border-white/10 p-4">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Track Condition (Estado)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Normal — Hist"
              value={pct(jockey.estado.normalWsHist ?? 0)}
            />
            <StatCard
              label="Normal — L200"
              value={pct(jockey.estado.normalWsL200 ?? 0)}
            />
            <StatCard
              label="Not Normal — Hist"
              value={pct(jockey.estado.notNormalWsHist ?? 0)}
            />
            <StatCard
              label="Not Normal — L200"
              value={pct(jockey.estado.notNormalWsL200 ?? 0)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function JockeyAnalytics() {
  const [data, setData] = useState<JockeyData | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('l200');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/jockeys.json')
      .then((r) => {
        if (!r.ok)
          throw new Error(
            `HTTP ${r.status} — place your JSON at /public/data/jockeys.json`
          );
        return r.json();
      })
      .then((d: JockeyData) => {
        setData(d);
        if (d.jockeys?.[0]) setSelectedId(d.jockeys[0].id);
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
      />
      <div className="flex-1 overflow-auto min-w-0">
        {selectedJockey ? (
          <JockeyDetail
            jockey={selectedJockey}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
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
