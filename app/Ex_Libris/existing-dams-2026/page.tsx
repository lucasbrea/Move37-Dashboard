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
  posicion: number | null;
  ecpos: number | null;
  bsn: number | null;
  pwin_bsn: number | null;
  ema: number | null;
  glicko: number | null;
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
  eday: string;
  track: string;
  surface: string;
  distance: number;
  estado: string;
  p: number | null;
  ecpos: number | null;
  bsn: number | null;
  pwin_bsn: number | null;
  ema_past_bsn: number | null;
  glicko: number | null;
}

interface Offspring {
  studbook_id: string;
  name: string;
  padrillo: string;
  PRS: number | null;
  PR: number | null;
  PS: number | null;
  year: string;
  races: OffspringRace[];
}

interface OffspringEntry {
  dam_name: string;
  offspring: Offspring[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val: number | null, decimals = 3) {
  return val == null ? '—' : val.toFixed(decimals);
}

function pct(val: number | null) {
  return val == null ? '—' : (val * 100).toFixed(2) + '%';
}

function studBookUrl(id: string, name: string) {
  return `https://www.studbook.org.ar/ejemplares/perfil/${id}/${name.toLowerCase().replace(/\s+/g, '-')}`;
}

function ToggleBtn({ count, expanded, onClick }: { count: number; expanded: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium
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

function RaceRow({ race }: { race: OffspringRace }) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors duration-100">
      <td className="py-2 pr-4 text-gray-300">{race.eday}</td>
      <td className="py-2 pr-4 text-gray-300">{stripHip(race.track)}</td>
      <td className="py-2 pr-4 text-gray-400">{race.surface}</td>
      <td className="py-2 px-3 text-right text-gray-400">{race.distance}m</td>
      <td className="py-2 px-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${race.estado === 'Normal' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
          {race.estado}
        </span>
      </td>
      <td className="py-2 px-3 text-right text-gray-300">{fmt(race.p, 0)}</td>
      <td className="py-2 px-3 text-right text-gray-400">{fmt(race.ecpos, 2)}</td>
      <td className="py-2 px-3 text-right text-gray-400">{fmt(race.bsn, 0)}</td>
      <td className="py-2 px-3 text-right text-gray-400">{fmt(race.pwin_bsn, 0)}</td>
      <td className="py-2 px-3 text-right text-gray-400">{fmt(race.ema_past_bsn, 1)}</td>
      <td className="py-2 pl-3 text-right text-gray-400">{fmt(race.glicko, 0)}</td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExistingDams2026Page() {
  const dams = useMemo<Dam[]>(
    () => Object.entries(rawData as Record<string, Omit<Dam, 'id'>>).map(([id, d]) => ({ id, ...d })),
    []
  );
  const offspringMap = useMemo(
    () => offspringRaw as Record<string, OffspringEntry>,
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
      <div className="max-w-[1600px] mx-auto px-8 py-12">
        <nav className="mb-12 flex items-center gap-3 text-sm text-gray-400">
          <a href="/" className="hover:text-white transition-colors duration-150">Dashboard</a>
          <span>/</span>
          <a href="/Ex_Libris" className="hover:text-white transition-colors duration-150">Ex Libris</a>
          <span>/</span>
          <span className="text-white">Existing Dams 2026</span>
        </nav>

        <h1 className="text-4xl font-light tracking-tight mb-10">Existing Dams 2026</h1>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left py-2.5 pr-4 font-medium whitespace-nowrap">Nombre</th>
                <th className="text-right py-2.5 px-3 font-medium whitespace-nowrap">PB</th>
                <th className="text-right py-2.5 px-3 font-medium whitespace-nowrap">PRS</th>
                <th className="text-right py-2.5 px-3 font-medium whitespace-nowrap">PBRS</th>
                <th className="text-right py-2.5 px-3 font-medium whitespace-nowrap">Age</th>
                <th className="text-right py-2.5 px-3 font-medium whitespace-nowrap">Last Birth</th>
                <th className="text-right py-2.5 px-3 font-medium whitespace-nowrap">Exp. Birth</th>
                <th className="text-right py-2.5 px-3 font-medium whitespace-nowrap">Birth Rate</th>
                <th className="text-right py-2.5 px-3 font-medium whitespace-nowrap">BR Last 3</th>
                <th className="text-right py-2.5 px-3 font-medium whitespace-nowrap">Rest Year</th>
                <th className="text-right py-2.5 px-3 font-medium whitespace-nowrap">Ran/Won STK</th>
                <th className="text-right py-2.5 px-3 font-medium whitespace-nowrap">Best BSN (Dist)</th>
                <th className="text-right py-2.5 px-3 font-medium whitespace-nowrap">Best Offspring BSN</th>
                <th className="text-center py-2.5 px-3 font-medium whitespace-nowrap">Campaña</th>
                <th className="text-center py-2.5 px-3 font-medium whitespace-nowrap">Offspring</th>
                <th className="text-center py-2.5 pl-3 font-medium whitespace-nowrap">Studbook</th>
              </tr>
            </thead>
            <tbody>
              {dams.map((dam) => {
                const campaignOpen = expandedCampaign.has(dam.id);
                const offspringOpen = expandedOffspring.has(dam.id);
                const offspringData = offspringMap[dam.id]?.offspring ?? [];
                const stats = damStats[dam.id];

                return (
                  <Fragment key={dam.id}>
                    {/* Dam row */}
                    <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors duration-100">
                      <td className="py-2.5 pr-4 font-medium text-white whitespace-nowrap">{dam.nombre}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300 whitespace-nowrap">{pct(dam.pb)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300 whitespace-nowrap">{pct(dam.prs)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300 whitespace-nowrap">{pct(dam.pbrs)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300 whitespace-nowrap">{dam.M_age_at_service}</td>
                      <td className="py-2.5 px-3 text-right text-gray-400 whitespace-nowrap">{dam.last_birth ?? '—'}</td>
                      <td className="py-2.5 px-3 text-right text-gray-400 whitespace-nowrap">{dam.expected_birth ?? '—'}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300 whitespace-nowrap">{pct(dam.birthRate)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300 whitespace-nowrap">{pct(dam.birthRateLast3)}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300 whitespace-nowrap">{dam.hadRestYear ?? '—'}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300 whitespace-nowrap">{dam.ran_won_stk ?? '—'}</td>
                      <td className="py-2.5 px-3 text-right text-gray-300 whitespace-nowrap">
                        {stats?.bestBsn != null ? <>{fmt(stats.bestBsn, 0)}<span className="text-gray-500 ml-1">({stats.bestBsnDist}m)</span></> : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-300 whitespace-nowrap">
                        {stats?.bestOffspringName != null ? <>{stats.bestOffspringName}<span className="text-gray-500 ml-1">{fmt(stats.bestOffspringBsn, 0)}</span></> : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <ToggleBtn count={dam.races.length} expanded={campaignOpen}
                          onClick={() => toggle(expandedCampaign, setExpandedCampaign, dam.id)} />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {offspringData.length > 0
                          ? <ToggleBtn count={offspringData.length} expanded={offspringOpen}
                              onClick={() => toggle(expandedOffspring, setExpandedOffspring, dam.id)} />
                          : <span className="text-gray-600 text-xs">—</span>
                        }
                      </td>
                      <td className="py-2.5 pl-3 text-center">
                        <a href={studBookUrl(dam.id, dam.nombre)} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors duration-150">
                          Ver →
                        </a>
                      </td>
                    </tr>

                    {/* Dam campaign */}
                    {campaignOpen && (
                      <tr className="bg-white/[0.02]">
                        <td colSpan={16} className="px-8 pb-4 pt-2">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider">
                                  <th className="text-left py-2.5 pr-5 font-medium">Fecha</th>
                                  <th className="text-left py-2.5 pr-5 font-medium">Hipódromo</th>
                                  <th className="text-left py-2.5 pr-5 font-medium">Categoría</th>
                                  <th className="text-left py-2.5 pr-5 font-medium">Sup.</th>
                                  <th className="text-right py-2.5 px-4 font-medium">Dist.</th>
                                  <th className="text-left py-2.5 px-4 font-medium">Estado</th>
                                  <th className="text-right py-2.5 px-4 font-medium">Pos.</th>
                                  <th className="text-right py-2.5 px-4 font-medium">ECPos</th>
                                  <th className="text-right py-2.5 px-4 font-medium">BSN</th>
                                  <th className="text-right py-2.5 px-4 font-medium">PWin BSN</th>
                                  <th className="text-right py-2.5 px-4 font-medium">EMA</th>
                                  <th className="text-right py-2.5 pl-4 font-medium">Glicko</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...dam.races].sort((a, b) => b.fecha.localeCompare(a.fecha)).map((race, i) => (
                                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-100">
                                    <td className="py-2.5 pr-5 text-gray-300">{race.fecha}</td>
                                    <td className="py-2.5 pr-5 text-gray-300">{stripHip(race.track)}</td>
                                    <td className="py-2.5 pr-5 text-gray-400">{race.categoria}</td>
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
                                    <td className="py-2.5 pl-4 text-right text-gray-400">{fmt(race.glicko, 0)}</td>
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
                        <td colSpan={16} className="px-8 pb-6 pt-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Crías de {dam.nombre}</p>
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider">
                                <th className="text-left py-2.5 pr-5 font-medium">Nombre</th>
                                <th className="text-left py-2.5 pr-5 font-medium">Padrillo</th>
                                <th className="text-right py-2.5 px-4 font-medium">Año</th>
                                <th className="text-right py-2.5 px-4 font-medium">PRS</th>
                                <th className="text-right py-2.5 px-4 font-medium">PR</th>
                                <th className="text-right py-2.5 px-4 font-medium">PS</th>
                                <th className="text-center py-2.5 px-4 font-medium">Campaña</th>
                                <th className="text-center py-2.5 pl-4 font-medium">Studbook</th>
                              </tr>
                            </thead>
                            <tbody>
                              {offspringData.map((child) => {
                                const childCampaignOpen = expandedOffspringCampaign.has(child.studbook_id);
                                return (
                                  <Fragment key={child.studbook_id}>
                                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors duration-100">
                                      <td className="py-2.5 pr-5 text-gray-200 font-medium">{child.name}</td>
                                      <td className="py-2.5 pr-5 text-gray-400">{child.padrillo}</td>
                                      <td className="py-2.5 px-4 text-right text-gray-400">{child.year}</td>
                                      <td className="py-2.5 px-4 text-right text-gray-300">{pct(child.PRS)}</td>
                                      <td className="py-2.5 px-4 text-right text-gray-300">{pct(child.PR)}</td>
                                      <td className="py-2.5 px-4 text-right text-gray-300">{pct(child.PS)}</td>
                                      <td className="py-2.5 px-4 text-center">
                                        {child.races.length > 0
                                          ? <ToggleBtn count={child.races.length} expanded={childCampaignOpen}
                                              onClick={() => toggle(expandedOffspringCampaign, setExpandedOffspringCampaign, child.studbook_id)} />
                                          : <span className="text-gray-600">—</span>
                                        }
                                      </td>
                                      <td className="py-2.5 pl-4 text-center">
                                        <a href={studBookUrl(child.studbook_id, child.name)} target="_blank" rel="noopener noreferrer"
                                          className="text-blue-400 hover:text-blue-300 transition-colors duration-150">
                                          Ver →
                                        </a>
                                      </td>
                                    </tr>
                                    {childCampaignOpen && (
                                      <tr className="bg-white/[0.02]">
                                        <td colSpan={16} className="px-4 pb-3 pt-1">
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-sm border-collapse">
                                              <thead>
                                                <tr className="border-b border-white/10 text-gray-600 uppercase tracking-wider">
                                                  <th className="text-left py-2 pr-4 font-medium">Fecha</th>
                                                  <th className="text-left py-2 pr-4 font-medium">Hipódromo</th>
                                                  <th className="text-left py-2 pr-4 font-medium">Sup.</th>
                                                  <th className="text-right py-2 px-3 font-medium">Dist.</th>
                                                  <th className="text-left py-2 px-3 font-medium">Estado</th>
                                                  <th className="text-right py-2 px-3 font-medium">Pos.</th>
                                                  <th className="text-right py-2 px-3 font-medium">ECPos</th>
                                                  <th className="text-right py-2 px-3 font-medium">BSN</th>
                                                  <th className="text-right py-2 px-3 font-medium">PWin BSN</th>
                                                  <th className="text-right py-2 px-3 font-medium">EMA</th>
                                                  <th className="text-right py-2 pl-3 font-medium">Glicko</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {[...child.races].sort((a, b) => b.eday.localeCompare(a.eday)).map((r, i) => <RaceRow key={i} race={r} />)}
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
