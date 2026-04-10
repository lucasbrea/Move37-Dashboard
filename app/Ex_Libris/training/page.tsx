'use client';

import { useState, Fragment, useMemo, useEffect } from 'react';
import rawData from '../../../public/data/training_horses.json';
import { useTrainingLog, EstadoType, TrainingLogEntry, NewTrainingLogEntry } from '../../../hooks/useTrainingLog';
import type { HorseMatch } from '../../../types/race-matches';

// ── Types ────────────────────────────────────────────────────────────────────

interface TrainingRace {
  race_date: string;
  track: string;
  categoria: string;
  cond: string | null;
  surface: string;
  distance: number;
  estado: string;
  p: number | null;
  ecpos: number | null;
  bsn: number | null;
  pwin_bsn: number | null;
  ema_past_bsn: number | null;
  glicko: number | null;
  date_link?: string | null;
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

function stripHip(track: string) {
  return track.replace(/^Hip[oó]dromo de\s*/i, '');
}

const MONTHS: Record<string, string> = {
  jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
  jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
};

function race_dateToISO(d: string): string {
  const m = d.match(/^(\d{2})([a-z]{3})(\d{4})$/i);
  if (!m) return d;
  const [, day, mon, year] = m;
  const mm = MONTHS[mon.toLowerCase()] ?? '??';
  return `${year}-${mm}-${day}`;
}


const ESTADO_STYLES: Record<EstadoType, { label: string; bg: string; text: string; dot: string }> = {
  corriendo: { label: 'Corriendo',  bg: 'bg-green-900/40',  text: 'text-green-300',  dot: 'bg-green-400'  },
  lesionado: { label: 'Lesionado',  bg: 'bg-red-900/40',    text: 'text-red-300',    dot: 'bg-red-400'    },
  descanso:  { label: 'En Descanso', bg: 'bg-blue-900/40',  text: 'text-blue-300',   dot: 'bg-blue-400'   },
};

function EstadoBadge({ estado }: { estado: EstadoType }) {
  const s = ESTADO_STYLES[estado];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1 h-1 rounded-full ${s.dot}`} />
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
  const [campo, setCampo] = useState('');
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
        campo: campo.trim() || null,
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

          {/* Campo — only if descanso */}
          {estado === 'descanso' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Campo</label>
              <input
                type="text"
                value={campo}
                onChange={e => setCampo(e.target.value)}
                placeholder="Nombre del campo"
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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExLibrisTrainingPage() {
  const horses = useMemo<TrainingHorse[]>(
    () => Object.values(rawData as unknown as Record<string, TrainingHorse>).sort((a, b) => (b.PRS ?? -Infinity) - (a.PRS ?? -Infinity)),
    []
  );

  const { logs, loading: logsLoading, addLog, deleteLog } = useTrainingLog();

  const [expandedCampaign, setExpandedCampaign] = useState<Set<string>>(new Set());
  const [expandedLog, setExpandedLog] = useState<Set<string>>(new Set());
  const [modalHorse, setModalHorse] = useState<TrainingHorse | null>(null);

  const [suggestedRaces, setSuggestedRaces] = useState<Record<string, HorseMatch> | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState('');
  const [suggestionsUpdatedAt, setSuggestionsUpdatedAt] = useState<string | null>(null);

  const STORAGE_KEY = 'race_suggestions_v1';

  // Load persisted suggestions on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { data, updatedAt } = JSON.parse(stored) as { data: Record<string, HorseMatch>; updatedAt: string };
        setSuggestedRaces(data);
        setSuggestionsUpdatedAt(updatedAt);
      }
    } catch { /* ignore corrupt storage */ }
  }, []);

  const fetchSuggestions = async () => {
    setSuggestionsLoading(true);
    setSuggestionsError('');
    try {
      const res = await fetch('/api/race-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horses: horses.map(h => ({
            studbook_id: h.studbook_id,
            name: h.name,
            races: h.races,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: { horses: HorseMatch[] } = await res.json();
      const byId: Record<string, HorseMatch> = {};
      for (const m of data.horses) byId[m.studbook_id] = m;
      const updatedAt = new Date().toISOString();
      setSuggestedRaces(byId);
      setSuggestionsUpdatedAt(updatedAt);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: byId, updatedAt }));
    } catch (e) {
      setSuggestionsError(e instanceof Error ? e.message : 'Error loading suggestions');
    } finally {
      setSuggestionsLoading(false);
    }
  };

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
      <div className="w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-3 text-sm text-gray-400">
          <a href="/" className="hover:text-white transition-colors duration-150">Dashboard</a>
          <span>/</span>
          <a href="/Ex_Libris" className="hover:text-white transition-colors duration-150">Ex Libris</a>
          <span>/</span>
          <span className="text-white">Training</span>
        </nav>

        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight">Training</h1>
          <div className="flex items-center gap-3">
            {suggestionsError && (
              <span className="text-red-400 text-xs">{suggestionsError}</span>
            )}
            {suggestedRaces && !suggestionsLoading && suggestionsUpdatedAt && (
              <span className="text-green-400/70 text-xs">
                ✓ Suggestions updated {new Date(suggestionsUpdatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            <button
              onClick={fetchSuggestions}
              disabled={suggestionsLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-150
                         bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 border-yellow-500/30
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {suggestionsLoading ? (
                <>
                  <span className="inline-block w-3 h-3 border border-yellow-400/60 border-t-yellow-300 rounded-full animate-spin" />
                  Thinking…
                </>
              ) : suggestedRaces ? 'Suggest Races' : 'Suggest Races'}
            </button>
          </div>
        </div>

        <div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-[10px] uppercase tracking-wider">
                <th className="text-left py-2 px-2 font-medium whitespace-nowrap">Name</th>
                <th className="text-left py-2 px-2 font-medium whitespace-nowrap">Dam</th>
                <th className="text-left py-2 px-2 font-medium whitespace-nowrap">Sire</th>
                <th className="text-right py-2 px-2 font-medium whitespace-nowrap">PRS</th>
                <th className="text-right py-2 px-2 font-medium whitespace-nowrap">PR</th>
                <th className="text-right py-2 px-2 font-medium whitespace-nowrap">PS</th>
                <th className="text-center py-2 px-2 font-medium whitespace-nowrap">State</th>
                <th className="text-left py-2 px-2 font-medium whitespace-nowrap">Last Race</th>
                <th className="text-center py-2 px-2 font-medium whitespace-nowrap">Results</th>
                <th className="text-center py-2 pl-2 font-medium whitespace-nowrap">LOG</th>
              </tr>
            </thead>
            <tbody>
              {horses.map(horse => {
                const campaignOpen = expandedCampaign.has(horse.studbook_id);
                const logOpen = expandedLog.has(horse.studbook_id);
                const horseLog = logsByHorse[horse.studbook_id] ?? [];
                const latest = horseLog[0];

                // Latest race (sorted by date desc)
                const latestRace = horse.races.length > 0
                  ? [...horse.races].sort((a, b) => race_dateToISO(b.race_date).localeCompare(race_dateToISO(a.race_date)))[0]
                  : null;

                return (
                  <Fragment key={horse.studbook_id}>
                    <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors duration-100">
                      <td className="py-1.5 px-2 font-medium whitespace-nowrap">
                        <a href={studBookUrl(horse.studbook_id, horse.name)} target="_blank" rel="noopener noreferrer"
                          className="text-white hover:text-blue-300 transition-colors duration-150">
                          {horse.name}
                        </a>
                      </td>
                      <td className="py-1.5 px-2 text-gray-300 whitespace-nowrap">{horse.M}</td>
                      <td className="py-1.5 px-2 text-gray-300 whitespace-nowrap">{horse.padrillo}</td>
                      <td className="py-1.5 px-2 text-right text-gray-300">{pct(horse.PRS)}</td>
                      <td className="py-1.5 px-2 text-right text-gray-300">{pct(horse.PR)}</td>
                      <td className="py-1.5 px-2 text-right text-gray-300">{pct(horse.PS)}</td>

                      {/* Estado */}
                      <td className="py-1.5 px-2 text-center">
                        {logsLoading ? (
                          <span className="text-gray-700 text-xs">…</span>
                        ) : latest ? (
                          <EstadoBadge estado={latest.estado} />
                        ) : (
                          <span className="text-gray-700 text-xs">—</span>
                        )}
                      </td>

                      {/* Última carrera */}
                      <td className="py-1.5 px-2 text-gray-400">
                        {latestRace ? (
                          <div>
                            <div className="text-gray-300 whitespace-nowrap">{race_dateToISO(latestRace.race_date)} · {stripHip(latestRace.track)}</div>
                            <div className="text-gray-500">
                              {latestRace.distance}m
                              {latestRace.bsn != null && <span className="text-yellow-400/70 ml-1">BSN {fmt(latestRace.bsn, 0)}</span>}
                            </div>
                          </div>
                        ) : <span className="text-gray-700">—</span>}
                      </td>

                      {/* Results */}
                      <td className="py-1.5 px-2 text-center">
                        {horse.races.length > 0 ? (
                          <button
                            onClick={() => toggleCampaign(horse.studbook_id)}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium
                                       border border-white/20 hover:border-yellow-400/50 hover:text-yellow-300
                                       text-gray-400 transition-colors duration-150"
                          >
                            {horse.races.length}
                            <span style={{ display: 'inline-block', transform: campaignOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                          </button>
                        ) : <span className="text-gray-600">—</span>}
                      </td>

                      {/* LOG */}
                      <td className="py-1.5 pl-2 text-center">
                        <button
                          onClick={() => setModalHorse(horse)}
                          className="font-medium bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300
                                     border border-yellow-500/30 px-2 py-0.5 rounded transition-colors duration-150"
                        >
                          +
                        </button>
                      </td>
                    </tr>

                    {/* Latest comment row — always visible */}
                    {!logsLoading && latest?.comentarios && (
                      <tr className="border-b border-white/5" style={{ background: 'rgba(255,255,255,0.025)' }}>
                        <td colSpan={10} className="px-4 py-2">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex items-start gap-3 min-w-0">
                              <span className="text-gray-500 text-xs whitespace-nowrap mt-px shrink-0">
                                {new Date(latest.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-gray-200 text-xs leading-relaxed">{latest.comentarios}</span>
                            </div>
                            {horseLog.length > 0 && (
                              <button
                                onClick={() => toggleLog(horse.studbook_id)}
                                className={`flex-shrink-0 text-xs flex items-center gap-1.5 px-2.5 py-1 border rounded transition-colors duration-150 ${
                                  logOpen
                                    ? 'border-yellow-400/40 text-yellow-300'
                                    : 'border-white/15 text-gray-400 hover:text-white hover:border-white/30'
                                }`}
                              >
                                {horseLog.length} {horseLog.length === 1 ? 'entrada' : 'entradas'}
                                <span style={{ display: 'inline-block', transform: logOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Campaign expansion */}
                    {campaignOpen && (
                      <tr className="bg-white/[0.02]">
                        <td colSpan={10} className="px-8 pb-4 pt-2">
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
                                {[...horse.races].sort((a, b) => race_dateToISO(b.race_date).localeCompare(race_dateToISO(a.race_date))).map((race, i) => (
                                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-100">
                                    <td className="py-2.5 pr-5 text-gray-300">{race_dateToISO(race.race_date)}</td>
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
                                    <td className="py-2.5 px-4 text-right text-gray-300">{fmt(race.p, 0)}</td>
                                    <td className="py-2.5 px-4 text-right text-gray-400">{fmt(race.ecpos, 2)}</td>
                                    <td className="py-2.5 px-4 text-right text-gray-400">{fmt(race.bsn, 0)}</td>
                                    <td className="py-2.5 px-4 text-right text-gray-400">{fmt(race.pwin_bsn, 0)}</td>
                                    <td className="py-2.5 px-4 text-right text-gray-400">{fmt(race.ema_past_bsn, 1)}</td>
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

                    {/* AI race suggestions row */}
                    {suggestedRaces?.[horse.studbook_id] && (() => {
                      const match = suggestedRaces[horse.studbook_id];
                      if (!match.eligible_races.length) return null;
                      // Group by date
                      const byDate: Record<string, typeof match.eligible_races> = {};
                      for (const r of match.eligible_races) {
                        if (!byDate[r.fecha]) byDate[r.fecha] = [];
                        byDate[r.fecha].push(r);
                      }
                      return (
                        <tr style={{ background: 'rgba(234,179,8,0.04)' }}>
                          <td colSpan={10} className="px-4 pb-3 pt-2 border-b border-yellow-500/10">
                            <div className="flex items-start gap-3 flex-wrap">
                              <span className="text-[10px] text-yellow-500/60 uppercase tracking-widest shrink-0 mt-1">
                                Mayo 2026
                              </span>
                              <span className="text-[10px] text-gray-600 shrink-0 mt-1 hidden sm:inline">
                                {match.current_analysis}
                              </span>
                              <div className="flex flex-wrap gap-1.5 mt-0.5">
                                {Object.entries(byDate).sort().map(([fecha, races]) =>
                                  races.map((r, i) => (
                                    <span
                                      key={`${fecha}-${i}`}
                                      title={r.match_reason}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]
                                                 bg-yellow-500/10 text-yellow-200/80 border border-yellow-500/20
                                                 hover:bg-yellow-500/20 transition-colors cursor-default"
                                    >
                                      <span className="text-yellow-500/50">{r.dia_label}</span>
                                      {r.race_description}
                                    </span>
                                  ))
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })()}

                    {/* Log history expansion */}
                    {logOpen && horseLog.length > 0 && (
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <td colSpan={10} className="px-6 pb-5 pt-4 border-b border-white/8">
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">
                            Historial — {horse.name}
                          </p>
                          <div className="space-y-3">
                            {horseLog.map(entry => (
                              <div key={entry.id} className="flex gap-4 items-start border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                <div className="shrink-0 w-24 text-gray-500 text-xs pt-0.5">
                                  {new Date(entry.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <EstadoBadge estado={entry.estado} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-200 text-sm leading-relaxed">{entry.comentarios ?? '—'}</p>
                                  {entry.proximas_carreras && (
                                    <div className="mt-1.5 pl-3 border-l border-white/10">
                                      <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">Próximas carreras</p>
                                      <pre className="text-gray-400 text-xs font-mono whitespace-pre-wrap">{entry.proximas_carreras}</pre>
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => { if (confirm('¿Eliminar esta entrada?')) deleteLog(entry.id); }}
                                  className="shrink-0 text-gray-700 hover:text-red-400 text-sm transition-colors duration-150 leading-none"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
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
