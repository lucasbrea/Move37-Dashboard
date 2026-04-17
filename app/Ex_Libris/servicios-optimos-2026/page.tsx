'use client';

import { useState, Fragment } from 'react';
import rawData from '../../../public/data/dams_servicios.json';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SireRow {
  padrillo: string;
  fam_m_f_name: string;
  PBRS: number;
  PRS: number;
  PB: number;
  PR: number;
  PS: number;
  inbreedingCoefficient: number;
  rank_within_dam: number;
}

interface DamEntry {
  id: string;
  dam_name: string;
  fam_m_m_name: string;
  mother: number;
  Momsiblings: number;
  uncles: number;
  maternalParents: number;
  M_age_at_service: number;
  M_season: number;
  birthRate: number;
  birthRateLast3: number;
  hadRestYear: number;
  M_total_rcs: number;
  M_won_rcs: number;
  M_cumAEI: number;
  M_STK_ran: number;
  M_STK_won: number;
  M_g1_STK_placed: number;
  M_g1_STK_won: number;
  sires: SireRow[];
}

const dams: DamEntry[] = Object.entries(rawData as Record<string, Omit<DamEntry, 'id'>>)
  .map(([id, d]) => ({ ...d, id }))
  .sort((a, b) => a.dam_name.localeCompare(b.dam_name));

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(v: number) { return (v * 100).toFixed(1) + '%'; }
function dec(v: number, d = 3) { return v.toFixed(d); }

function SignedCell({ v, decimals = 3 }: { v: number; decimals?: number }) {
  const pos = v > 0;
  return (
    <span className={pos ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-gray-500'}>
      {pos ? '+' : ''}{v.toFixed(decimals)}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ServiciosOptimos2026Page() {
  const [expandedDams, setExpandedDams] = useState<Set<string>>(new Set());

  const toggleDam = (id: string) =>
    setExpandedDams(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="min-h-screen bg-[#0a192f] text-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <nav className="mb-12 flex items-center gap-3 text-sm text-gray-400">
          <a href="/" className="hover:text-white transition-colors duration-150">Dashboard</a>
          <span>/</span>
          <a href="/Ex_Libris" className="hover:text-white transition-colors duration-150">Ex Libris</a>
          <span>/</span>
          <span className="text-white">Servicios Óptimos 2026</span>
        </nav>

        <h1 className="text-4xl font-light tracking-tight mb-10">Servicios Óptimos 2026</h1>

        {/* ── Dam × Sire table ── */}
        <div className="mb-14 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="text-[9px] uppercase tracking-wider text-gray-400">
              {/* Row 1 — Section headers */}
              <tr className="border-b border-white/5">
                <th rowSpan={3} className="px-2 w-6" />
                <th rowSpan={3} className="text-left py-2 px-2 font-medium whitespace-nowrap">Dam</th>
                <th colSpan={4} className="text-center py-1.5 px-2 font-medium border-b border-white/10 border-l border-white/10">Decomposing PS Factors</th>
                <th colSpan={4} className="text-center py-1.5 px-2 font-medium border-b border-white/10 border-l border-white/10">Factors PB / PR</th>
                <th colSpan={5} className="text-center py-1.5 px-2 font-medium border-b border-white/10 border-l border-white/10">Dams Racing Career</th>
              </tr>
              {/* Row 2 — Sub-section headers */}
              <tr className="border-b border-white/5">
                {/* PS Factors (leaf → rowspan=2) */}
                <th rowSpan={2} className="text-center py-1.5 px-2 font-medium whitespace-nowrap border-l border-white/10">Age &amp; Career</th>
                <th rowSpan={2} className="text-center py-1.5 px-2 font-medium whitespace-nowrap">Offsprings</th>
                <th rowSpan={2} className="text-center py-1.5 px-2 font-medium whitespace-nowrap">Siblings</th>
                <th rowSpan={2} className="text-center py-1.5 px-2 font-medium whitespace-nowrap">Parents Career</th>
                {/* PB/PR */}
                <th rowSpan={2} className="text-right py-1.5 px-2 font-medium whitespace-nowrap border-l border-white/10">Age</th>
                <th rowSpan={2} className="text-right py-1.5 px-2 font-medium whitespace-nowrap">Season</th>
                <th colSpan={2} className="text-center py-1.5 px-2 font-medium border-b border-white/10">Births</th>
                {/* Racing Career */}
                <th rowSpan={2} className="text-right py-1.5 px-2 font-medium whitespace-nowrap border-l border-white/10">Rcs</th>
                <th rowSpan={2} className="text-right py-1.5 px-2 font-medium whitespace-nowrap">Wins</th>
                <th rowSpan={2} className="text-right py-1.5 px-2 font-medium whitespace-nowrap">CEI</th>
                <th className="text-center py-1.5 px-2 font-medium whitespace-nowrap border-b border-white/10">STK&apos;s</th>
                <th className="text-center py-1.5 px-2 font-medium whitespace-nowrap border-b border-white/10">G1&apos;s</th>
              </tr>
              {/* Row 3 — Leaf headers for sub-groups */}
              <tr className="border-b border-white/10">
                <th className="text-right py-1.5 px-2 font-medium whitespace-nowrap">BR</th>
                <th className="text-right py-1.5 px-2 font-medium whitespace-nowrap">BR L3</th>
                <th className="text-center py-1.5 px-2 font-medium whitespace-nowrap">Ran · Won</th>
                <th className="text-center py-1.5 px-2 font-medium whitespace-nowrap">Placed · Won</th>
              </tr>
            </thead>
            <tbody>
              {dams.map(dam => {
                const open = expandedDams.has(dam.id);
                const sortedSires = [...dam.sires].sort((a, b) => a.rank_within_dam - b.rank_within_dam);

                function yn(v: number) {
                  return v > 0
                    ? <span className="text-emerald-400 font-medium">Y</span>
                    : <span className="text-gray-600">N</span>;
                }

                return (
                  <Fragment key={dam.id}>
                    {/* Dam row */}
                    <tr
                      className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                      onClick={() => toggleDam(dam.id)}
                    >
                      <td className="py-2 px-2 text-center text-gray-500">
                        <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>▶</span>
                      </td>
                      <td className="py-2 px-2 font-medium text-white whitespace-nowrap">{dam.dam_name}</td>
                      {/* PS Factors */}
                      <td className="py-2 px-2 text-right border-l border-white/5"><SignedCell v={dam.mother} /></td>
                      <td className="py-2 px-2 text-right"><SignedCell v={dam.Momsiblings} /></td>
                      <td className="py-2 px-2 text-right"><SignedCell v={dam.uncles} /></td>
                      <td className="py-2 px-2 text-right"><SignedCell v={dam.maternalParents} /></td>
                      {/* PB/PR */}
                      <td className="py-2 px-2 text-right text-gray-300 border-l border-white/5">{Math.floor(dam.M_age_at_service)}</td>
                      <td className="py-2 px-2 text-right text-gray-300">{dam.M_season}</td>
                      <td className="py-2 px-2 text-right text-gray-300">{pct(dam.birthRate)}</td>
                      <td className="py-2 px-2 text-right text-gray-300">{pct(dam.birthRateLast3)}</td>
                      {/* Racing Career */}
                      <td className="py-2 px-2 text-right text-gray-300 border-l border-white/5">{dam.M_total_rcs}</td>
                      <td className="py-2 px-2 text-right text-gray-300">{dam.M_won_rcs}</td>
                      <td className="py-2 px-2 text-right text-gray-300">{dec(dam.M_cumAEI, 2)}</td>
                      <td className="py-2 px-2 text-center">{yn(dam.M_STK_ran)} · {yn(dam.M_STK_won)}</td>
                      <td className="py-2 px-2 text-center">{yn(dam.M_g1_STK_placed)} · {yn(dam.M_g1_STK_won)}</td>
                    </tr>

                    {/* Sire expansion */}
                    {open && (
                      <tr key={`${dam.id}-sires`} className="border-b border-white/5">
                        <td colSpan={15} className="px-0 pb-2 pt-0" style={{ background: 'rgba(99,102,241,0.04)' }}>
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr className="text-gray-500 text-[9px] uppercase tracking-wider">
                                <th className="text-left py-1.5 pl-10 pr-2 font-medium">#</th>
                                <th className="text-left py-1.5 px-2 font-medium whitespace-nowrap">Sire</th>
                                <th className="text-right py-1.5 px-2 font-medium">PBRS</th>
                                <th className="text-right py-1.5 px-2 font-medium">PRS</th>
                                <th className="text-right py-1.5 px-2 font-medium">PB</th>
                                <th className="text-right py-1.5 px-2 font-medium">PR</th>
                                <th className="text-right py-1.5 px-2 font-medium">PS</th>
                                <th className="text-right py-1.5 px-2 font-medium whitespace-nowrap">Inbr. %</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedSires.map((s, i) => (
                                <tr
                                  key={s.padrillo}
                                  className={`border-t border-white/5 ${i === 0 ? 'text-indigo-200' : 'text-gray-300'}`}
                                >
                                  <td className="py-1.5 pl-10 pr-2 text-gray-500">{s.rank_within_dam}</td>
                                  <td className="py-1.5 px-2 font-medium whitespace-nowrap">
                                    {i === 0 && <span className="mr-1.5 text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 py-0.5 rounded">Best</span>}
                                    {s.padrillo}
                                  </td>
                                  <td className="py-1.5 px-2 text-right">{pct(s.PBRS)}</td>
                                  <td className="py-1.5 px-2 text-right">{pct(s.PRS)}</td>
                                  <td className="py-1.5 px-2 text-right">{pct(s.PB)}</td>
                                  <td className="py-1.5 px-2 text-right">{pct(s.PR)}</td>
                                  <td className="py-1.5 px-2 text-right">{pct(s.PS)}</td>
                                  <td className="py-1.5 px-2 text-right text-gray-400">{Math.round(s.inbreedingCoefficient * 100)}%</td>
                                </tr>
                              ))}
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
