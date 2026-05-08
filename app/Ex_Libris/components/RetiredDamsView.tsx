'use client';

import { useMemo } from 'react';
import rawData from '../../../public/data/ExLibris_Dams.json';
import { useDamRetirements } from '../../../hooks/useDamRetirements';

interface Dam {
  id: string;
  nombre: string;
  pb: number | null;
  prs: number | null;
  pbrs: number | null;
  M_age_at_service: number;
  last_birth: string | null;
  expected_birth: string | null;
}

function pct(val: number | null, decimals = 2) {
  return val == null ? '—' : (val * 100).toFixed(decimals) + '%';
}

function studBookUrl(id: string, name: string) {
  return `https://www.studbook.org.ar/ejemplares/perfil/${id}/${name.toLowerCase().replace(/\s+/g, '-')}`;
}

export default function RetiredDamsView() {
  const damsById = useMemo<Record<string, Dam>>(
    () => Object.fromEntries(
      Object.entries(rawData as Record<string, Omit<Dam, 'id'>>).map(([id, d]) => [id, { id, ...d }])
    ),
    []
  );

  const { retirements, loading, unretireDam } = useDamRetirements();

  const retiredDams = useMemo(
    () => retirements
      .map(r => ({ retirement: r, dam: damsById[r.dam_id] }))
      .filter(({ dam }) => !!dam),
    [retirements, damsById]
  );

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-light tracking-tight mb-4">Dams Retiradas</h2>

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando…</p>
      ) : retiredDams.length === 0 ? (
        <p className="text-gray-500 text-sm italic">No hay dams retiradas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase tracking-wider">
                <th className="text-left py-2 px-2 font-medium whitespace-nowrap">Name</th>
                <th className="text-center py-2 px-2 font-medium whitespace-nowrap">Age</th>
                <th className="text-center py-2 px-2 font-medium whitespace-nowrap">PB</th>
                <th className="text-center py-2 px-2 font-medium whitespace-nowrap">PRS</th>
                <th className="text-center py-2 px-2 font-medium whitespace-nowrap">PBRS</th>
                <th className="text-center py-2 px-2 font-medium whitespace-nowrap">Last Birth</th>
                <th className="text-center py-2 px-2 font-medium whitespace-nowrap">Retirada</th>
                <th className="text-center py-2 px-2 font-medium whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody>
              {retiredDams.map(({ retirement, dam }) => (
                <tr key={retirement.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors duration-100">
                  <td className="py-1.5 px-2 font-medium whitespace-nowrap">
                    <a href={studBookUrl(dam.id, dam.nombre)} target="_blank" rel="noopener noreferrer"
                      className="text-white hover:text-blue-300 transition-colors duration-150">
                      {dam.nombre}
                    </a>
                  </td>
                  <td className="py-1.5 px-2 text-center text-gray-300">{dam.M_age_at_service}</td>
                  <td className="py-1.5 px-2 text-center text-gray-300">{pct(dam.pb, 1)}</td>
                  <td className="py-1.5 px-2 text-center text-gray-300">{pct(dam.prs, 1)}</td>
                  <td className="py-1.5 px-2 text-center text-gray-300">{pct(dam.pbrs, 1)}</td>
                  <td className="py-1.5 px-2 text-center text-gray-400">{dam.last_birth ?? '—'}</td>
                  <td className="py-1.5 px-2 text-center text-gray-400">
                    {new Date(retirement.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-1.5 px-2 text-center">
                    <button
                      onClick={async () => {
                        if (!confirm(`¿Restaurar "${dam.nombre}" a Existing Dams?`)) return;
                        try { await unretireDam(dam.id); }
                        catch { alert('Error al restaurar. Intente nuevamente.'); }
                      }}
                      title="Restaurar a Existing Dams"
                      className="text-[10px] px-2 py-0.5 rounded border border-white/15 text-gray-400 hover:text-green-300 hover:border-green-500/30 transition-colors duration-150">
                      Restaurar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
