'use client';

import { useState, Fragment, useMemo } from 'react';
import rawData from '../../../public/data/ExLibris_Dams.json';
import offspringRaw from '../../../public/data/dams_offspring.json';

// ── Types ────────────────────────────────────────────────────────────────────

interface DamRace {
  fecha: string;
  nombre: string;
  track: string;
  categoria: string;
  surface: string;
  distance: number;
  estado: string;
  cond: string | null;
  posicion: number | null;
  ecpos: number | null;
  bsn: number | null;
  pwin_bsn: number | null;
  ema: number | null;
  glicko: number | null;
  date_link: string | null;
}

interface Dam {
  id: string;
  nombre: string;
  pb: number | null;
  prs: number | null;
  pbrs: number | null;
  M_age_at_service: number;
  last_birth: string | null;
  expected_birth: string | null;
  birthRate: number | null;
  birthRateLast3: number | null;
  hadRestYear: number | null;
  ran_won_stk: string | null;
  races: DamRace[];
}

interface OffspringRace {
  race_date: string;
  track: string;
  categoria: string;
  surface: string;
  distance: number;
  estado: string;
  cond: string | null;
  p: number | null;
  ecpos: number | null;
  bsn: number | null;
  pwin_bsn: number | null;
  ema_past_bsn: number | null;
  glicko: number | null;
  date_link: string | null;
}

interface Offspring {
  studbook_id: string | number;
  name: string;
  padrillo: string;
  PRS: number | null;
  PR: number | null;
  PS: number | null;
  year: string;
  total_win: number | null;
  clasicos_ran: number | null;
  clasicos_won: number | null;
  races: OffspringRace[];
}

interface OffspringEntry {
  dam_name: string;
  ran_won_stk: string | null;
  offspring: Offspring[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: number | null, decimals = 3) {
  return val == null ? '—' : val.toFixed(decimals);
}

function pct(val: number | null, decimals = 2) {
  return val == null ? '—' : (val * 100).toFixed(decimals) + '%';
}

function studBookUrl(id: string, name: string) {
  return `https://www.studbook.org.ar/ejemplares/perfil/${id}/${name.toLowerCase().replace(/\s+/g, '-')}`;
}

function ToggleBtn({ count, expanded, onClick }: { count: number; expanded: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium
                 border border-white/20 hover:border-yellow-400/50 hover:text-yellow-300
                 text-gray-400 transition-colors duration-150"
    >
      {count}
      <span style={{ display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
    </button>
  );
}

function stripHip(track: string) {
  return track.replace(/^Hip[oó]dromo de\s*/i, '');
}

const MONTHS: Record<string, string> = {
  jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
  jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
};

// Convert '17nov2019' → '2019-11-17' (ISO, sortable & readable)
function normRaceDate(d: string): string {
  const m = d.match(/^(\d{2})([a-z]{3})(\d{4})$/i);
  if (!m) return d;
  const [, day, mon, year] = m;
  const mm = MONTHS[mon.toLowerCase()] ?? '??';
  return `${year}-${mm}-${day}`;
}

function getTopBsns(races: OffspringRace[]): [{ bsn: number; dist: number } | null, { bsn: number; dist: number } | null] {
  const sorted = races
    .filter(r => r.bsn != null)
    .sort((a, b) => (b.bsn as number) - (a.bsn as number));
  const first = sorted[0] ? { bsn: sorted[0].bsn as number, dist: sorted[0].distance } : null;
  const second = sorted[1] ? { bsn: sorted[1].bsn as number, dist: sorted[1].distance } : null;
  return [first, second];
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExistingDams2026Page() {
  const dams = useMemo<Dam[]>(
    () => Object.entries(rawData as Record<string, Omit<Dam, 'id'>>)
      .map(([id, d]) => ({ id, ...d }))
      .sort((a, b) => (b.prs ?? -Infinity) - (a.prs ?? -Infinity)),
    []
  );
  const offspringMap = useMemo(
    () => offspringRaw as unknown as Record<string, OffspringEntry>,
    []
  );

  // Per-dam derived stats
  const damStats = useMemo(() => {
    const result: Record<string, {
      bestBsn: number | null;
      bestBsnDist: number | null;
      bestOffspringName: string | null;
      bestOffspringBsn: number | null;
    }> = {};

    for (const dam of Object.values(dams)) {
      // Highest BSN race for the dam itself
      let bestBsn: number | null = null;
      let bestBsnDist: number | null = null;
      for (const r of dam.races) {
        if (r.bsn != null && (bestBsn === null || r.bsn > bestBsn)) {
          bestBsn = r.bsn;
          bestBsnDist = r.distance;
        }
      }

      // Offspring with highest single-race BSN
      const offspring = offspringMap[dam.id]?.offspring ?? [];
      let bestOffspringName: string | null = null;
      let bestOffspringBsn: number | null = null;
      for (const child of offspring) {
        for (const r of child.races) {
          if (r.bsn != null && (bestOffspringBsn === null || r.bsn > bestOffspringBsn)) {
            bestOffspringBsn = r.bsn;
            bestOffspringName = child.name;
          }
        }
      }

      result[dam.id] = { bestBsn, bestBsnDist, bestOffspringName, bestOffspringBsn };
    }
    return result;
  }, [dams, offspringMap]);

  // dam campaign expansion
  const [expandedCampaign, setExpandedCampaign] = useState<Set<string>>(new Set());
  // dam offspring table expansion
  const [expandedOffspring, setExpandedOffspring] = useState<Set<string>>(new Set());
  // individual offspring campaign expansion (keyed by studbook_id)
  const [expandedOffspringCampaign, setExpandedOffspringCampaign] = useState<Set<string>>(new Set());

  function toggle(set: Set<string>, setFn: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setFn(next);
  }

  return (
    <div className="min-h-screen bg-[#0a192f] text-white">
      <div className="w-full px-4 py-12">
        <nav className="mb-12 flex items-center gap-3 text-sm text-gray-400">
          <a href="/" className="hover:text-white transition-colors duration-150">Dashboard</a>
          <span>/</span>
          <a href="/Ex_Libris" className="hover:text-white transition-colors duration-150">Ex Libris</a>
          <span>/</span>
          <span className="text-white">Existing Dams 2026</span>
        </nav>

        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-light tracking-tight">Existing Dams 2026</h1>
          <a
            href="https://docs.google.com/spreadsheets/d/1r5gx3WCuu67I5qzInezpZ3DMF-AnNDrX/edit?usp=sharing&ouid=114898536092612537397&rtpof=true&sd=true"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-400 border border-green-400/30 hover:bg-green-400/10 transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            PBRS Sheet
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-tight">
                <th className="text-right py-2 px-1.5 font-medium whitespace-nowrap">Age</th>
                <th className="text-left py-2 pr-2 font-medium whitespace-nowrap">Nombre</th>
                <th className="text-right py-2 px-1.5 font-medium whitespace-nowrap">PB</th>
                <th className="text-right py-2 px-1.5 font-medium whitespace-nowrap">PRS</th>
                <th className="text-right py-2 px-1.5 font-medium whitespace-nowrap">PBRS</th>
                <th className="text-right py-2 px-1.5 font-medium whitespace-nowrap">Last Birth</th>
                <th className="text-right py-2 px-1.5 font-medium whitespace-nowrap">Exp. Birth</th>
                <th className="text-right py-2 px-1.5 font-medium whitespace-nowrap">Birth Rate</th>
                <th className="text-right py-2 px-1.5 font-medium whitespace-nowrap">BR Last 3</th>
                <th className="text-right py-2 px-1.5 font-medium whitespace-nowrap">Rest Year</th>
                <th className="text-right py-2 px-1.5 font-medium whitespace-nowrap">Ran/Won STK</th>
                <th className="text-right py-2 px-1.5 font-medium whitespace-nowrap">Best BSN (Dist)</th>
                <th className="text-right py-2 px-1.5 font-medium whitespace-nowrap">Off. Ran/Won STK</th>
                <th className="text-right py-2 px-1.5 font-medium whitespace-nowrap">Best Offspring BSN</th>
                <th className="text-center py-2 px-1.5 font-medium whitespace-nowrap">Campaña</th>
                <th className="text-center py-2 px-1.5 font-medium whitespace-nowrap">Offspring</th>
                <th className="text-center py-2 pl-1.5 font-medium whitespace-nowrap">Studbook</th>
              </tr>
            </thead>
            <tbody>
              {dams.map((dam) => {
                const campaignOpen = expandedCampaign.has(dam.id);
                const offspringOpen = expandedOffspring.has(dam.id);
                const offspringEntry = offspringMap[dam.id];
                const offspringData = [...(offspringEntry?.offspring ?? [])].sort((a, b) => (b.PRS ?? -Infinity) - (a.PRS ?? -Infinity));
                const stats = damStats[dam.id];

                return (
                  <Fragment key={dam.id}>
                    {/* Dam row */}
                    <tr className={`border-b border-white/5 transition-colors duration-100 ${campaignOpen || offspringOpen ? 'bg-yellow-400/[0.14] hover:bg-yellow-400/[0.18]' : 'hover:bg-white/[0.03]'}`}>
                      <td className="py-1.5 px-1.5 text-right text-gray-300 whitespace-nowrap">{dam.M_age_at_service}</td>
                      <td className="py-1.5 pr-2 font-medium text-white whitespace-nowrap">{dam.nombre}</td>
                      <td className="py-1.5 px-1.5 text-right text-gray-300 whitespace-nowrap">{pct(dam.pb, 1)}</td>
                      <td className="py-1.5 px-1.5 text-right text-gray-300 whitespace-nowrap">{pct(dam.prs, 1)}</td>
                      <td className="py-1.5 px-1.5 text-right text-gray-300 whitespace-nowrap">{pct(dam.pbrs, 1)}</td>
                      <td className="py-1.5 px-1.5 text-right text-gray-400 whitespace-nowrap">{dam.last_birth ?? '—'}</td>
                      <td className="py-1.5 px-1.5 text-right text-gray-400 whitespace-nowrap">{dam.expected_birth ?? '—'}</td>
                      <td className="py-1.5 px-1.5 text-right text-gray-300 whitespace-nowrap">{pct(dam.birthRate, 0)}</td>
                      <td className="py-1.5 px-1.5 text-right text-gray-300 whitespace-nowrap">{pct(dam.birthRateLast3, 0)}</td>
                      <td className="py-1.5 px-1.5 text-right text-gray-300 whitespace-nowrap">{dam.hadRestYear ?? '—'}</td>
                      <td className="py-1.5 px-1.5 text-right text-gray-300 whitespace-nowrap">{dam.ran_won_stk ?? '—'}</td>
                      <td className="py-1.5 px-1.5 text-right text-gray-300 whitespace-nowrap">
                        {stats?.bestBsn != null ? <>{fmt(stats.bestBsn, 0)}<span className="text-gray-500 ml-1">({stats.bestBsnDist}m)</span></> : '—'}
                      </td>
                      <td className="py-1.5 px-1.5 text-right text-gray-300 whitespace-nowrap">{offspringEntry?.ran_won_stk ?? '—'}</td>
                      <td className="py-1.5 px-1.5 text-right text-gray-300 whitespace-nowrap">
                        {stats?.bestOffspringName != null ? <>{stats.bestOffspringName}<span className="text-gray-500 ml-1">{fmt(stats.bestOffspringBsn, 0)}</span></> : '—'}
                      </td>
                      <td className="py-1.5 px-1.5 text-center">
                        <ToggleBtn count={dam.races.length} expanded={campaignOpen}
                          onClick={() => toggle(expandedCampaign, setExpandedCampaign, dam.id)} />
                      </td>
                      <td className="py-1.5 px-1.5 text-center">
                        {offspringData.length > 0
                          ? <ToggleBtn count={offspringData.length} expanded={offspringOpen}
                              onClick={() => toggle(expandedOffspring, setExpandedOffspring, dam.id)} />
                          : <span className="text-gray-600 text-xs">—</span>
                        }
                      </td>
                      <td className="py-1.5 pl-1.5 text-center">
                        <a href={studBookUrl(dam.id, dam.nombre)} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors duration-150">
                          Ver →
                        </a>
                      </td>
                    </tr>

                    {/* Dam campaign */}
                    {campaignOpen && (
                      <tr className="bg-white/[0.02]">
                        <td colSpan={17} className="px-8 pb-4 pt-2">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider">
                                  <th className="text-left py-2.5 pr-5 font-medium">Fecha</th>
                                  <th className="text-left py-2.5 pr-5 font-medium">Hipódromo</th>
                                  <th className="text-left py-2.5 pr-5 font-medium">Categoría</th>
                                  <th className="text-left py-2.5 pr-5 font-medium">Cond.</th>
                                  <th className="text-left py-2.5 pr-5 font-medium">Sup.</th>
                                  <th className="text-right py-2.5 px-4 font-medium">Dist.</th>
                                  <th className="text-left py-2.5 px-4 font-medium">Estado</th>
                                  <th className="text-right py-2.5 px-4 font-medium">Pos.</th>
                                  <th className="text-right py-2.5 px-4 font-medium">ECPos</th>
                                  <th className="text-right py-2.5 px-4 font-medium">BSN</th>
                                  <th className="text-right py-2.5 px-4 font-medium">PWin BSN</th>
                                  <th className="text-right py-2.5 px-4 font-medium">EMA</th>
                                  <th className="text-right py-2.5 px-4 font-medium">Glicko</th>
                                  <th className="py-2.5 pl-4 font-medium"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...dam.races].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((race, i) => (
                                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-100">
                                    <td className="py-2.5 pr-5 text-gray-300">{race.fecha}</td>
                                    <td className="py-2.5 pr-5 text-gray-300">{stripHip(race.track)}</td>
                                    <td className="py-2.5 pr-5 text-gray-400">{race.categoria}</td>
                                    <td className="py-2.5 pr-5 text-gray-400">{race.cond ?? '—'}</td>
                                    <td className="py-2.5 pr-5 text-gray-400">{race.surface}</td>
                                    <td className="py-2.5 px-4 text-right text-gray-400">{race.distance}m</td>
                                    <td className="py-2.5 px-4">
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${race.estado === 'Normal' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                                        {race.estado}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-4 text-right text-gray-300">{fmt(race.posicion, 0)}</td>
                                    <td className="py-2.5 px-4 text-right text-gray-400">{fmt(race.ecpos, 2)}</td>
                                    <td className="py-2.5 px-4 text-right text-gray-400">{fmt(race.bsn, 0)}</td>
                                    <td className="py-2.5 px-4 text-right text-gray-400">{fmt(race.pwin_bsn, 0)}</td>
                                    <td className="py-2.5 px-4 text-right text-gray-400">{fmt(race.ema, 1)}</td>
                                    <td className="py-2.5 px-4 text-right text-gray-400">{fmt(race.glicko, 0)}</td>
                                    <td className="py-2.5 pl-4 text-center">
                                      {race.date_link
                                        ? <a href={race.date_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors duration-150">Ver →</a>
                                        : <span className="text-gray-600">—</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Offspring table */}
                    {offspringOpen && (
                      <tr className="bg-white/[0.015]">
                        <td colSpan={17} className="px-8 pb-6 pt-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Crías de {dam.nombre}</p>
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider">
                                <th className="text-left py-2.5 pr-5 font-medium whitespace-nowrap">Nombre</th>
                                <th className="text-left py-2.5 pr-5 font-medium whitespace-nowrap">Padrillo</th>
                                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">Año</th>
                                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">PRS</th>
                                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">PR</th>
                                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">PS</th>
                                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">Carreras</th>
                                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">Wins</th>
                                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">Cl. Ran</th>
                                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">Cl. Won</th>
                                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">Max BSN (Dist)</th>
                                <th className="text-right py-2.5 px-4 font-medium whitespace-nowrap">2nd BSN (Dist)</th>
                                <th className="text-center py-2.5 px-4 font-medium whitespace-nowrap">Campaña</th>
                                <th className="text-center py-2.5 pl-4 font-medium whitespace-nowrap">Studbook</th>
                              </tr>
                            </thead>
                            <tbody>
                              {offspringData.map((child) => {
                                const childCampaignOpen = expandedOffspringCampaign.has(String(child.studbook_id));
                                const [maxBsn, secondBsn] = getTopBsns(child.races);
                                return (
                                  <Fragment key={String(child.studbook_id)}>
                                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors duration-100">
                                      <td className="py-2.5 pr-5 text-gray-200 font-medium whitespace-nowrap">{child.name}</td>
                                      <td className="py-2.5 pr-5 text-gray-400 whitespace-nowrap">{child.padrillo}</td>
                                      <td className="py-2.5 px-4 text-right text-gray-400">{child.year}</td>
                                      <td className="py-2.5 px-4 text-right text-gray-300">{pct(child.PRS, 1)}</td>
                                      <td className="py-2.5 px-4 text-right text-gray-300">{pct(child.PR, 1)}</td>
                                      <td className="py-2.5 px-4 text-right text-gray-300">{pct(child.PS, 1)}</td>
                                      <td className="py-2.5 px-4 text-right text-gray-400">{child.races.length}</td>
                                      <td className="py-2.5 px-4 text-right text-gray-400">{child.total_win != null ? Math.round(child.total_win) : '—'}</td>
                                      <td className="py-2.5 px-4 text-right text-gray-400">{child.clasicos_ran != null ? Math.round(child.clasicos_ran) : '—'}</td>
                                      <td className="py-2.5 px-4 text-right text-gray-400">{child.clasicos_won != null ? Math.round(child.clasicos_won) : '—'}</td>
                                      <td className="py-2.5 px-4 text-right text-gray-300 whitespace-nowrap">
                                        {maxBsn ? <>{fmt(maxBsn.bsn, 0)}<span className="text-gray-500 ml-1">({maxBsn.dist}m)</span></> : '—'}
                                      </td>
                                      <td className="py-2.5 px-4 text-right text-gray-400 whitespace-nowrap">
                                        {secondBsn ? <>{fmt(secondBsn.bsn, 0)}<span className="text-gray-500 ml-1">({secondBsn.dist}m)</span></> : '—'}
                                      </td>
                                      <td className="py-2.5 px-4 text-center">
                                        {child.races.length > 0
                                          ? <ToggleBtn count={child.races.length} expanded={childCampaignOpen}
                                              onClick={() => toggle(expandedOffspringCampaign, setExpandedOffspringCampaign, String(child.studbook_id))} />
                                          : <span className="text-gray-600">—</span>
                                        }
                                      </td>
                                      <td className="py-2.5 pl-4 text-center">
                                        <a href={studBookUrl(String(child.studbook_id), child.name)} target="_blank" rel="noopener noreferrer"
                                          className="text-blue-400 hover:text-blue-300 transition-colors duration-150">
                                          Ver →
                                        </a>
                                      </td>
                                    </tr>
                                    {childCampaignOpen && (
                                      <tr className="bg-white/[0.02]">
                                        <td colSpan={14} className="px-4 pb-3 pt-1">
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-sm border-collapse">
                                              <thead>
                                                <tr className="border-b border-white/10 text-gray-600 uppercase tracking-wider">
                                                  <th className="text-left py-2 pr-4 font-medium">Fecha</th>
                                                  <th className="text-left py-2 pr-4 font-medium">Hipódromo</th>
                                                  <th className="text-left py-2 pr-4 font-medium">Categoría</th>
                                                  <th className="text-left py-2 pr-4 font-medium">Cond.</th>
                                                  <th className="text-left py-2 pr-4 font-medium">Sup.</th>
                                                  <th className="text-right py-2 px-3 font-medium">Dist.</th>
                                                  <th className="text-left py-2 px-3 font-medium">Estado</th>
                                                  <th className="text-right py-2 px-3 font-medium">Pos.</th>
                                                  <th className="text-right py-2 px-3 font-medium">ECPos</th>
                                                  <th className="text-right py-2 px-3 font-medium">BSN</th>
                                                  <th className="text-right py-2 px-3 font-medium">PWin BSN</th>
                                                  <th className="text-right py-2 px-3 font-medium">EMA</th>
                                                  <th className="text-right py-2 px-3 font-medium">Glicko</th>
                                                  <th className="py-2 pl-3 font-medium"></th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {[...child.races].sort((a, b) => normRaceDate(b.race_date).localeCompare(normRaceDate(a.race_date))).map((r, i) => (
                                                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-100">
                                                    <td className="py-2 pr-4 text-gray-300">{normRaceDate(r.race_date)}</td>
                                                    <td className="py-2 pr-4 text-gray-300">{stripHip(r.track)}</td>
                                                    <td className="py-2 pr-4 text-gray-400">{r.categoria}</td>
                                                    <td className="py-2 pr-4 text-gray-400">{r.cond ?? '—'}</td>
                                                    <td className="py-2 pr-4 text-gray-400">{r.surface}</td>
                                                    <td className="py-2 px-3 text-right text-gray-400">{r.distance}m</td>
                                                    <td className="py-2 px-3">
                                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.estado === 'Normal' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                                                        {r.estado}
                                                      </span>
                                                    </td>
                                                    <td className="py-2 px-3 text-right text-gray-300">{fmt(r.p, 0)}</td>
                                                    <td className="py-2 px-3 text-right text-gray-400">{fmt(r.ecpos, 2)}</td>
                                                    <td className="py-2 px-3 text-right text-gray-400">{fmt(r.bsn, 0)}</td>
                                                    <td className="py-2 px-3 text-right text-gray-400">{fmt(r.pwin_bsn, 0)}</td>
                                                    <td className="py-2 px-3 text-right text-gray-400">{fmt(r.ema_past_bsn, 1)}</td>
                                                    <td className="py-2 px-3 text-right text-gray-400">{fmt(r.glicko, 0)}</td>
                                                    <td className="py-2 pl-3 text-center">
                                                      {r.date_link
                                                        ? <a href={r.date_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors duration-150">Ver →</a>
                                                        : <span className="text-gray-600">—</span>}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
