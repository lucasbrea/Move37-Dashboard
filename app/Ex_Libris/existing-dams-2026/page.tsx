'use client';

import { useState, Fragment, useMemo } from 'react';
import rawData from '../../../public/data/ExLibris_Dams.json';

interface Race {
  fecha: string;
  nombre: string;
  track: string;
  surface: string;
  distance: number;
  estado: string;
  posicion: number;
  ecpos: number;
  pwin_bsn: number;
  ema: number;
  glicko: number;
}

interface Dam {
  id: string;
  nombre: string;
  pb: number;
  prs: number;
  pbrs: number;
  M_age_at_service: number;
  races: Race[];
}

function fmt(val: number | null, decimals = 3) {
  return val == null ? '—' : val.toFixed(decimals);
}

export default function ExistingDams2026Page() {
  const dams = useMemo<Dam[]>(
    () => Object.entries(rawData as Record<string, Omit<Dam, 'id'>>).map(([id, d]) => ({ id, ...d })),
    []
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Breadcrumb */}
        <nav className="mb-12 flex items-center gap-3 text-sm text-gray-400">
          <a href="/" className="hover:text-white transition-colors duration-150">Dashboard</a>
          <span>/</span>
          <a href="/Ex_Libris" className="hover:text-white transition-colors duration-150">Ex Libris</a>
          <span>/</span>
          <span className="text-white">Existing Dams 2026</span>
        </nav>

        <h1 className="text-4xl font-light tracking-tight mb-10">Existing Dams 2026</h1>

        <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left py-3 pr-6 font-medium">Nombre</th>
                  <th className="text-right py-3 px-4 font-medium">PB</th>
                  <th className="text-right py-3 px-4 font-medium">PRS</th>
                  <th className="text-right py-3 px-4 font-medium">PBRS</th>
                  <th className="text-right py-3 px-4 font-medium">Edad Serv.</th>
                  <th className="text-center py-3 pl-4 font-medium">Campaña</th>
                </tr>
              </thead>
              <tbody>
                {dams.map((dam) => {
                  const expanded = expandedIds.has(dam.id);
                  return (
                    <Fragment key={dam.id}>
                      {/* Main dam row */}
                      <tr
                        className="border-b border-white/5 hover:bg-white/3 transition-colors duration-100"
                      >
                        <td className="py-3 pr-6 font-medium text-white">{dam.nombre}</td>
                        <td className="py-3 px-4 text-right text-gray-300">{fmt(dam.pb)}</td>
                        <td className="py-3 px-4 text-right text-gray-300">{fmt(dam.prs)}</td>
                        <td className="py-3 px-4 text-right text-gray-300">{fmt(dam.pbrs)}</td>
                        <td className="py-3 px-4 text-right text-gray-300">{dam.M_age_at_service}</td>
                        <td className="py-3 pl-4 text-center">
                          <button
                            onClick={() => toggle(dam.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium
                                       border border-white/20 hover:border-yellow-400/50 hover:text-yellow-300
                                       text-gray-400 transition-colors duration-150"
                          >
                            {dam.races.length} carreras
                            <span className="transition-transform duration-200" style={{ display: 'inline-block', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                              ▾
                            </span>
                          </button>
                        </td>
                      </tr>

                      {/* Expanded races sub-table */}
                      {expanded && (
                        <tr className="bg-white/[0.02]">
                          <td colSpan={6} className="px-6 pb-4 pt-2">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider">
                                    <th className="text-left py-2 pr-4 font-medium">Fecha</th>
                                    <th className="text-left py-2 pr-4 font-medium">Hipódromo</th>
                                    <th className="text-left py-2 pr-4 font-medium">Sup.</th>
                                    <th className="text-right py-2 px-3 font-medium">Dist.</th>
                                    <th className="text-left py-2 px-3 font-medium">Estado</th>
                                    <th className="text-right py-2 px-3 font-medium">Pos.</th>
                                    <th className="text-right py-2 px-3 font-medium">ECPos</th>
                                    <th className="text-right py-2 px-3 font-medium">PWin BSN</th>
                                    <th className="text-right py-2 px-3 font-medium">EMA</th>
                                    <th className="text-right py-2 pl-3 font-medium">Glicko</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dam.races.map((race, i) => (
                                    <tr
                                      key={i}
                                      className="border-b border-white/5 hover:bg-white/5 transition-colors duration-100"
                                    >
                                      <td className="py-2 pr-4 text-gray-300">{race.fecha}</td>
                                      <td className="py-2 pr-4 text-gray-300">{race.track}</td>
                                      <td className="py-2 pr-4 text-gray-400">{race.surface}</td>
                                      <td className="py-2 px-3 text-right text-gray-400">{race.distance}m</td>
                                      <td className="py-2 px-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                          race.estado === 'Normal'
                                            ? 'bg-green-900/40 text-green-400'
                                            : 'bg-gray-800 text-gray-400'
                                        }`}>
                                          {race.estado}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 text-right text-gray-300">{race.posicion}</td>
                                      <td className="py-2 px-3 text-right text-gray-400">{fmt(race.ecpos, 2)}</td>
                                      <td className="py-2 px-3 text-right text-gray-400">{fmt(race.pwin_bsn, 1)}</td>
                                      <td className="py-2 px-3 text-right text-gray-400">{fmt(race.ema, 1)}</td>
                                      <td className="py-2 pl-3 text-right text-gray-400">{fmt(race.glicko, 0)}</td>
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
          </div>
      </div>
    </div>
  );
}
