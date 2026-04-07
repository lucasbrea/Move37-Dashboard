'use client';

import { useState, Fragment, useMemo } from 'react';
import rawData from '../../../public/data/training_horses.json';
import { useTrainingLog, EstadoType, TrainingLogEntry, NewTrainingLogEntry } from '../../../hooks/useTrainingLog';

// ── Types ────────────────────────────────────────────────────────────────────

interface TrainingRace {
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

interface TrainingHorse {
  studbook_id: string;
  name: string;
  padrillo: string;
  M: string;
  PRS: number | null;
  PR: number | null;
  PS: number | null;
  yegua_studbook_id: string;
  races: TrainingRace[];
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

const ESTADO_STYLES: Record<EstadoType, { label: string; bg: string; text: string; dot: string }> = {
  corriendo: { label: 'Corriendo',  bg: 'bg-green-900/40',  text: 'text-green-300',  dot: 'bg-green-400'  },
  lesionado: { label: 'Lesionado',  bg: 'bg-red-900/40',    text: 'text-red-300',    dot: 'bg-red-400'    },
  descanso:  { label: 'En Descanso', bg: 'bg-blue-900/40',  text: 'text-blue-300',   dot: 'bg-blue-400'   },
};

function EstadoBadge({ estado }: { estado: EstadoType }) {
  const s = ESTADO_STYLES[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ── Log Form Modal ────────────────────────────────────────────────────────────

function LogModal({
  horse,
  onSave,
  onClose,
}: {
  horse: TrainingHorse;
  onSave: (entry: NewTrainingLogEntry) => Promise<void>;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [estado, setEstado] = useState<EstadoType>('corriendo');
  const [cuidador, setCuidador] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [proximasCarreras, setProximasCarreras] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave({
        horse_studbook_id: horse.studbook_id,
        horse_name: horse.name,
        fecha: today,
        estado,
        cuidador: cuidador.trim() || null,
        comentarios: comentarios.trim() || null,
        proximas_carreras: proximasCarreras.trim() || null,
      });
      onClose();
    } catch {
      setErr('Error al guardar. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#0a192f] border border-white/15 w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-[#0a192f] z-10">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">LOG de Campaña</p>
            <h3 className="text-white font-medium text-lg leading-tight">{horse.name}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none px-1">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
          {/* Date */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Fecha</label>
            <p className="text-gray-300 text-sm">{new Date(today + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-wider">Estado Actual *</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ESTADO_STYLES) as EstadoType[]).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEstado(e)}
                  className={`py-3 px-2 rounded-lg text-sm font-medium border transition-all duration-150 ${
                    estado === e
                      ? `${ESTADO_STYLES[e].bg} ${ESTADO_STYLES[e].text} border-current`
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {ESTADO_STYLES[e].label}
                </button>
              ))}
            </div>
          </div>

          {/* Cuidador — only if corriendo */}
          {estado === 'corriendo' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Cuidador</label>
              <input
                type="text"
                value={cuidador}
                onChange={e => setCuidador(e.target.value)}
                placeholder="Nombre del cuidador"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-200
                           placeholder-gray-600 focus:outline-none focus:border-white/30 text-sm"
              />
            </div>
          )}

          {/* Comentarios */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Comentarios</label>
            <textarea
              value={comentarios}
              onChange={e => setComentarios(e.target.value)}
              placeholder="Notas sobre el estado del caballo, entrenamiento, etc."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-200
                         placeholder-gray-600 focus:outline-none focus:border-white/30 text-sm resize-none"
            />
          </div>

          {/* Próximas carreras */}
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Próximas Carreras</label>
            <p className="text-[11px] text-gray-600 mb-2">
              Carrera, fecha, hipódromo (SI / PA / LPA). Una por línea.
            </p>
            <textarea
              value={proximasCarreras}
              onChange={e => setProximasCarreras(e.target.value)}
              placeholder={"Ej:\nG3 Premio San Isidro – 20 Apr – SI\nHcp 1200m – 28 Apr – PA"}
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-200
                         placeholder-gray-600 focus:outline-none focus:border-white/30 text-sm resize-none font-mono"
            />
          </div>

          {err && <p className="text-red-400 text-sm">{err}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300
                       font-medium text-sm border border-yellow-500/30 transition-colors duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando…' : 'Guardar Log'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Log History (inline) ──────────────────────────────────────────────────────

function LogHistory({ entries, onDelete }: { entries: TrainingLogEntry[]; onDelete: (id: string) => void }) {
  if (entries.length === 0) return <p className="text-gray-600 text-xs py-2">Sin entradas anteriores.</p>;

  return (
    <div className="space-y-3">
      {entries.map(entry => (
        <div key={entry.id} className="bg-white/[0.04] border border-white/10 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <EstadoBadge estado={entry.estado} />
              {entry.cuidador && <span className="text-xs text-gray-500">Cuidador: {entry.cuidador}</span>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-600">
                {new Date(entry.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <button
                onClick={() => { if (confirm('¿Eliminar esta entrada?')) onDelete(entry.id); }}
                className="text-gray-600 hover:text-red-400 text-xs transition-colors duration-150"
              >
                ×
              </button>
            </div>
          </div>
          {entry.comentarios && (
            <p className="text-gray-300 text-xs leading-relaxed">{entry.comentarios}</p>
          )}
          {entry.proximas_carreras && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Próximas Carreras</p>
              <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">{entry.proximas_carreras}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExLibrisTrainingPage() {
  const horses = useMemo<TrainingHorse[]>(
    () => Object.values(rawData as Record<string, TrainingHorse>),
    []
  );

  const { logs, loading: logsLoading, addLog, deleteLog } = useTrainingLog();

  const [expandedCampaign, setExpandedCampaign] = useState<Set<string>>(new Set());
  const [expandedLog, setExpandedLog] = useState<Set<string>>(new Set());
  const [modalHorse, setModalHorse] = useState<TrainingHorse | null>(null);

  const logsByHorse = useMemo(() => {
    const map: Record<string, TrainingLogEntry[]> = {};
    for (const log of logs) {
      if (!map[log.horse_studbook_id]) map[log.horse_studbook_id] = [];
      map[log.horse_studbook_id].push(log);
    }
    return map;
  }, [logs]);

  const toggleCampaign = (id: string) => {
    setExpandedCampaign(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleLog = (id: string) => {
    setExpandedLog(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-3 text-sm text-gray-400">
          <a href="/" className="hover:text-white transition-colors duration-150">Dashboard</a>
          <span>/</span>
          <a href="/Ex_Libris" className="hover:text-white transition-colors duration-150">Ex Libris</a>
          <span>/</span>
          <span className="text-white">Training</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-light tracking-tight mb-8">Training</h1>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                <th className="text-left py-3 pr-4 font-medium">Nombre</th>
                <th className="text-left py-3 px-3 font-medium">Madre</th>
                <th className="text-left py-3 px-3 font-medium">Padrillo</th>
                <th className="text-right py-3 px-3 font-medium">PRS</th>
                <th className="text-right py-3 px-3 font-medium">PR</th>
                <th className="text-right py-3 px-3 font-medium">PS</th>
                <th className="text-center py-3 px-3 font-medium">Campaña</th>
                <th className="text-center py-3 px-3 font-medium">Estado</th>
                <th className="text-center py-3 px-3 font-medium">LOG</th>
                <th className="text-center py-3 pl-3 font-medium">SB</th>
              </tr>
            </thead>
            <tbody>
              {horses.map(horse => {
                const campaignOpen = expandedCampaign.has(horse.studbook_id);
                const logOpen = expandedLog.has(horse.studbook_id);
                const horseLog = logsByHorse[horse.studbook_id] ?? [];
                const latest = horseLog[0];

                return (
                  <Fragment key={horse.studbook_id}>
                    <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors duration-100">
                      <td className="py-3 pr-4 font-medium text-white whitespace-nowrap">{horse.name}</td>
                      <td className="py-3 px-3 text-gray-300 whitespace-nowrap">{horse.M}</td>
                      <td className="py-3 px-3 text-gray-300 whitespace-nowrap">{horse.padrillo}</td>
                      <td className="py-3 px-3 text-right text-gray-300">{pct(horse.PRS)}</td>
                      <td className="py-3 px-3 text-right text-gray-300">{pct(horse.PR)}</td>
                      <td className="py-3 px-3 text-right text-gray-300">{pct(horse.PS)}</td>
                      <td className="py-3 px-3 text-center">
                        {horse.races.length > 0 ? (
                          <button
                            onClick={() => toggleCampaign(horse.studbook_id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium
                                       border border-white/20 hover:border-yellow-400/50 hover:text-yellow-300
                                       text-gray-400 transition-colors duration-150"
                          >
                            {horse.races.length} carreras
                            <span style={{ display: 'inline-block', transform: campaignOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                          </button>
                        ) : <span className="text-gray-600 text-xs">—</span>}
                      </td>
                      {/* Estado column */}
                      <td className="py-3 px-3 text-center">
                        {logsLoading ? (
                          <span className="text-gray-700 text-xs">…</span>
                        ) : latest ? (
                          <EstadoBadge estado={latest.estado} />
                        ) : (
                          <span className="text-gray-700 text-xs">—</span>
                        )}
                      </td>
                      {/* LOG column */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          {horseLog.length > 0 && (
                            <button
                              onClick={() => toggleLog(horse.studbook_id)}
                              className="text-xs text-gray-500 hover:text-gray-300 border border-white/10 px-2 py-1 rounded transition-colors"
                            >
                              {logOpen ? '▴' : `${horseLog.length}`}
                            </button>
                          )}
                          <button
                            onClick={() => setModalHorse(horse)}
                            className="text-xs font-medium bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300
                                       border border-yellow-500/30 px-2.5 py-1 rounded transition-colors duration-150"
                          >
                            + Log
                          </button>
                        </div>
                      </td>
                      <td className="py-3 pl-3 text-center">
                        <a href={studBookUrl(horse.studbook_id, horse.name)} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors duration-150">
                          Ver →
                        </a>
                      </td>
                    </tr>

                    {/* Campaign expansion */}
                    {campaignOpen && (
                      <tr className="bg-white/[0.02]">
                        <td colSpan={10} className="px-8 pb-4 pt-2">
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
                                  <th className="text-right py-2 px-3 font-medium">BSN</th>
                                  <th className="text-right py-2 px-3 font-medium">PWin BSN</th>
                                  <th className="text-right py-2 px-3 font-medium">EMA</th>
                                  <th className="text-right py-2 pl-3 font-medium">Glicko</th>
                                </tr>
                              </thead>
                              <tbody>
                                {horse.races.map((race, i) => (
                                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-100">
                                    <td className="py-1.5 pr-4 text-gray-300">{race.eday}</td>
                                    <td className="py-1.5 pr-4 text-gray-300">{race.track}</td>
                                    <td className="py-1.5 pr-4 text-gray-400">{race.surface}</td>
                                    <td className="py-1.5 px-3 text-right text-gray-400">{race.distance}m</td>
                                    <td className="py-1.5 px-3">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${race.estado === 'Normal' ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                                        {race.estado}
                                      </span>
                                    </td>
                                    <td className="py-1.5 px-3 text-right text-gray-300">{fmt(race.p, 0)}</td>
                                    <td className="py-1.5 px-3 text-right text-gray-400">{fmt(race.ecpos, 2)}</td>
                                    <td className="py-1.5 px-3 text-right text-gray-400">{fmt(race.bsn, 1)}</td>
                                    <td className="py-1.5 px-3 text-right text-gray-400">{fmt(race.pwin_bsn, 1)}</td>
                                    <td className="py-1.5 px-3 text-right text-gray-400">{fmt(race.ema_past_bsn, 1)}</td>
                                    <td className="py-1.5 pl-3 text-right text-gray-400">{fmt(race.glicko, 0)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Log history expansion */}
                    {logOpen && (
                      <tr className="bg-white/[0.015]">
                        <td colSpan={10} className="px-8 pb-4 pt-3 border-b border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">
                            Historial de LOG — {horse.name}
                          </p>
                          <LogHistory entries={horseLog} onDelete={deleteLog} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Log Modal */}
        {modalHorse && (
          <LogModal
            horse={modalHorse}
            onSave={addLog}
            onClose={() => setModalHorse(null)}
          />
        )}
      </div>
    </div>
  );
}
