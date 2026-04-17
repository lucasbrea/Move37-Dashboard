'use client';

import { useState, Fragment, useMemo, useEffect } from 'react';
import rawData from '../../../public/data/training_horses.json';
import { useTrainingLog, EstadoType, TrainingLogEntry, NewTrainingLogEntry } from '../../../hooks/useTrainingLog';
import type { HorseMatch, EligibleRace } from '../../../types/race-matches';

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
  sire_precocity: string | null;
  sire_wa: number | null;
  yegua_studbook_id: string;
  age: number | null;
  sex_cat: string | null;
  total_win: number | null;
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

/** Excel-style heat color: t=1 → green, t=0 → red */
function heatColor(value: number | null, values: (number | null)[], higherIsBetter: boolean): string {
  if (value == null) return '';
  const valid = values.filter((v): v is number => v != null);
  if (valid.length < 2) return '';
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  if (min === max) return '';
  let t = (value - min) / (max - min);
  if (!higherIsBetter) t = 1 - t;
  const hue = Math.round(t * 120);
  return `hsl(${hue}, 65%, 50%)`;
}


// Distance bands for Argentine racing (based on actual calendar distances)
const DIST_BANDS: { label: string; min: number; max: number }[] = [
  { label: '1000–1200m', min: 1000, max: 1200 },
  { label: '1300–1400m', min: 1300, max: 1400 },
  { label: '1500–1600m', min: 1500, max: 1600 },
  { label: '1700–1800m', min: 1700, max: 1800 },
  { label: '2000–2200m', min: 2000, max: 2200 },
  { label: '2400–2500m', min: 2400, max: 2500 },
];

function distBandIndex(m: number): number {
  for (let i = 0; i < DIST_BANDS.length; i++) {
    if (m >= DIST_BANDS[i].min && m <= DIST_BANDS[i].max) return i;
  }
  // fallback: nearest band
  let best = 0, bestDiff = Infinity;
  for (let i = 0; i < DIST_BANDS.length; i++) {
    const mid = (DIST_BANDS[i].min + DIST_BANDS[i].max) / 2;
    const diff = Math.abs(m - mid);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  }
  return best;
}


const TRACK_DOT: Record<string, string> = {
  'Palermo':    'bg-sky-400',
  'San Isidro': 'bg-emerald-400',
  'La Plata':   'bg-orange-400',
};

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

// ── Race Detail Modal ─────────────────────────────────────────────────────────

function RaceDetailModal({ race, onClose }: { race: EligibleRace; onClose: () => void }) {
  const monthLabel = race.fecha.startsWith('2026-04') ? 'Abril 2026' : race.fecha.startsWith('2026-05') ? 'Mayo 2026' : race.fecha.slice(0, 7);
  const surface = race.pista === 'cesped' ? 'Césped (Turf)' : 'Arena';
  const sectionLabel = race.section === 'PERDEDORES' ? 'Perdedores' : race.section === 'GANADORES' ? 'Ganadores' : 'Clásico / Especial / HCP';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0a192f] border border-white/15 rounded-xl max-w-sm w-full shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 flex items-start justify-between gap-3 border-b border-white/10
          ${race.group === 'G1' ? 'bg-amber-500/10' : race.group === 'G2' ? 'bg-purple-500/10' : race.group ? 'bg-blue-500/10' : 'bg-white/5'}`}>
          <div>
            {race.group && (
              <span className={`text-[10px] font-bold uppercase tracking-widest mr-2
                ${race.group === 'G1' ? 'text-amber-400' : race.group === 'G2' ? 'text-purple-400' : 'text-blue-400'}`}>
                {race.group}
              </span>
            )}
            <span className="text-white font-medium">
              {race.name ?? sectionLabel}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none shrink-0 mt-0.5">×</button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-gray-500 w-24 shrink-0 text-xs uppercase tracking-wider">Fecha</span>
            <span>{race.dia_label} · <span className="text-gray-500">{monthLabel}</span></span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-gray-500 w-24 shrink-0 text-xs uppercase tracking-wider">Distancia</span>
            <span>{race.distancia_mts}m</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-gray-500 w-24 shrink-0 text-xs uppercase tracking-wider">Superficie</span>
            <span className={race.pista === 'cesped' ? 'text-green-400' : ''}>{surface}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-gray-500 w-24 shrink-0 text-xs uppercase tracking-wider">Sección</span>
            <span>{sectionLabel}</span>
          </div>
          {race.categoria_raw && (
            <div className="flex items-start gap-2 text-gray-300">
              <span className="text-gray-500 w-24 shrink-0 text-xs uppercase tracking-wider">Categoría</span>
              <span className="leading-relaxed">{race.categoria_raw}</span>
            </div>
          )}
          {race.wins_range && (
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-gray-500 w-24 shrink-0 text-xs uppercase tracking-wider">Victorias</span>
              <span>{race.wins_range}</span>
            </div>
          )}
          {race.conditions && (
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-gray-500 w-24 shrink-0 text-xs uppercase tracking-wider">Condición</span>
              <span className="text-yellow-300/80">{race.conditions}</span>
            </div>
          )}
          {race.condicion && !['Perdedor'].includes(race.condicion) && (
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-gray-500 w-24 shrink-0 text-xs uppercase tracking-wider">Tipo</span>
              <span className="text-gray-400">{race.condicion}</span>
            </div>
          )}
        </div>
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
  const [selectedRace, setSelectedRace] = useState<EligibleRace | null>(null);

  // ── Race suggestion filters ────────────────────────────────────────────────
  const [filterTrack, setFilterTrack] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterWeek, setFilterWeek] = useState<string>('all');

  const [suggestedRaces, setSuggestedRaces] = useState<Record<string, HorseMatch> | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState('');
  const [visibleSuggestions, setVisibleSuggestions] = useState<Set<string>>(new Set());
  const [suggestionsUpdatedAt, setSuggestionsUpdatedAt] = useState<string | null>(null);
  // Per-horse extra distance bands unlocked via dropdown (band index set)
  const [extraBands, setExtraBands] = useState<Record<string, Set<number>>>({});

  const STORAGE_KEY = 'race_suggestions_master_v1';

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
      const res = await fetch('/api/race-matches-abril', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          horses: horses.map(h => ({
            studbook_id: h.studbook_id,
            name: h.name,
            age: h.age,
            sex_cat: h.sex_cat,
            total_win: h.total_win,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: { horses: HorseMatch[] } = await res.json();
      console.log('[race-matches] response keys:', Object.keys(data));
      console.log('[race-matches] horses count:', data.horses?.length);
      console.log('[race-matches] first horse:', JSON.stringify(data.horses?.[0]));
      const byId: Record<string, HorseMatch> = {};
      for (const m of data.horses) byId[String(m.studbook_id)] = m;
      console.log('[race-matches] byId keys:', Object.keys(byId));
      console.log('[race-matches] horse studbook_ids in training:', horses.map(h => String(h.studbook_id)));
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

  // ── Filter options derived from all eligible races ─────────────────────────
  const filterOptions = useMemo(() => {
    if (!suggestedRaces) return { tracks: [] as string[], months: [] as string[], weeks: [] as string[] };
    const today = new Date().toISOString().slice(0, 10);
    const all = Object.values(suggestedRaces).flatMap(h => h.eligible_races).filter(r => r.fecha >= today);
    const tracks = Array.from(new Set(all.map(r => r.track).filter(Boolean) as string[])).sort();
    const months = Array.from(new Set(all.map(r => r.month).filter(Boolean) as string[]));
    const weeks  = Array.from(new Set(all.map(r => r.week).filter(Boolean) as string[])).sort();
    return { tracks, months, weeks };
  }, [suggestedRaces]);

  function weekLabel(iso: string) {
    const mon = new Date(iso + 'T12:00:00Z');
    const sun = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6);
    const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${M[mon.getUTCMonth()]} ${mon.getUTCDate()}–${sun.getUTCDate()}`;
  }

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

        {/* ── Filter bar (shown once suggestions are loaded) ── */}
        {suggestedRaces && (
          <div className="mb-4 flex flex-wrap gap-y-2 gap-x-4 text-[11px]">
            {/* Track */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 uppercase tracking-wider">Track</span>
              {['all', ...filterOptions.tracks].map(t => (
                <button key={t} onClick={() => setFilterTrack(t)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    filterTrack === t
                      ? 'bg-white/15 text-white border-white/30'
                      : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'
                  }`}>
                  {t === 'all' ? 'Todos' : t}
                </button>
              ))}
            </div>
            {/* Track color key */}
            <div className="flex items-center gap-2 ml-1">
              {Object.entries(TRACK_DOT).map(([name, dot]) => (
                <span key={name} className="flex items-center gap-1 text-gray-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                  {name}
                </span>
              ))}
            </div>
            {/* Month */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 uppercase tracking-wider">Mes</span>
              {['all', ...filterOptions.months].map(m => (
                <button key={m} onClick={() => { setFilterMonth(m); setFilterWeek('all'); }}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    filterMonth === m
                      ? 'bg-white/15 text-white border-white/30'
                      : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'
                  }`}>
                  {m === 'all' ? 'Todos' : m.replace(' 2026', '')}
                </button>
              ))}
            </div>
            {/* Week */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-gray-500 uppercase tracking-wider">Semana</span>
              {['all', ...filterOptions.weeks
                .filter(w => filterMonth === 'all' || (() => {
                  const d = new Date(w + 'T12:00:00Z');
                  const label = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
                  return filterMonth === 'all' || filterMonth.toLowerCase().startsWith(label.split(' ')[0].substring(0,3).toLowerCase());
                })())
              ].map(w => (
                <button key={w} onClick={() => setFilterWeek(w)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    filterWeek === w
                      ? 'bg-white/15 text-white border-white/30'
                      : 'text-gray-400 border-white/10 hover:text-white hover:border-white/20'
                  }`}>
                  {w === 'all' ? 'Todas' : weekLabel(w)}
                </button>
              ))}
            </div>
          </div>
        )}

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
                <th className="text-center py-2 px-2 font-medium whitespace-nowrap">Precocity</th>
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
                      <td className="py-1.5 px-2 text-center text-gray-300 whitespace-nowrap">{horse.sire_precocity ?? '—'}</td>

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
                        <div className="flex items-center justify-center gap-1">
                          {suggestedRaces?.[String(horse.studbook_id)] && (
                            <button
                              onClick={() => setVisibleSuggestions((prev: Set<string>) => {
                                const next = new Set(prev);
                                next.has(horse.studbook_id) ? next.delete(horse.studbook_id) : next.add(horse.studbook_id);
                                return next;
                              })}
                              title={visibleSuggestions.has(horse.studbook_id) ? 'Hide race suggestions' : 'Show race suggestions'}
                              className={`text-[10px] px-2 py-0.5 rounded border transition-colors duration-150 whitespace-nowrap
                                ${visibleSuggestions.has(horse.studbook_id)
                                  ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40 hover:bg-yellow-500/10'
                                  : 'bg-white/5 text-gray-400 border-white/15 hover:text-yellow-300 hover:border-yellow-500/30'
                                }`}
                            >
                              {visibleSuggestions.has(horse.studbook_id) ? '🏁 Hide' : '🏁 Races'}
                            </button>
                          )}
                          <button
                            onClick={() => setModalHorse(horse)}
                            className="font-medium bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300
                                       border border-yellow-500/30 px-2 py-0.5 rounded transition-colors duration-150"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Latest comment row — always visible */}
                    {!logsLoading && latest?.comentarios && (
                      <tr className="border-b border-white/5" style={{ background: 'rgba(255,255,255,0.025)' }}>
                        <td colSpan={12} className="px-4 py-2">
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
                    {campaignOpen && (() => {
                      const sortedRaces = [...horse.races].sort((a, b) => race_dateToISO(b.race_date).localeCompare(race_dateToISO(a.race_date)));
                      const bsnVals = sortedRaces.map(r => r.bsn);
                      const posVals = sortedRaces.map(r => r.p);
                      return (
                      <tr className="bg-white/[0.02]">
                        <td colSpan={12} className="px-8 pb-4 pt-2">
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
                                {sortedRaces.map((race, i) => (
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
                                    <td className="py-2.5 px-4 text-right font-medium" style={{ color: heatColor(race.p, posVals, false) || undefined }}>{fmt(race.p, 0)}</td>
                                    <td className="py-2.5 px-4 text-right text-gray-400">{fmt(race.ecpos, 2)}</td>
                                    <td className="py-2.5 px-4 text-right font-medium" style={{ color: heatColor(race.bsn, bsnVals, true) || undefined }}>{fmt(race.bsn, 0)}</td>
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
                      );
                    })()}

                    {/* AI race suggestions row */}
                    {visibleSuggestions.has(horse.studbook_id) && suggestedRaces?.[String(horse.studbook_id)] && (() => {
                      const match = suggestedRaces[String(horse.studbook_id)];
                      if (!match.eligible_races.length) return null;

                      // Compute allowed band indices: last race band ±1, plus any extras
                      const lastDist = latestRace?.distance ?? null;
                      const baseBand = lastDist != null ? distBandIndex(lastDist) : null;
                      const horseExtra = extraBands[horse.studbook_id] ?? new Set<number>();
                      const allowedBands: Set<number> | null = baseBand != null
                        ? new Set([baseBand - 1, baseBand, baseBand + 1, ...Array.from(horseExtra)].filter(i => i >= 0 && i < DIST_BANDS.length))
                        : null;

                      const today = new Date().toISOString().slice(0, 10);
                      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 14);
                      const cutoffStr = cutoff.toISOString().slice(0, 10);
                      const filtered = match.eligible_races.filter(r => {
                        if (r.fecha < today) return false;
                        if (filterWeek === 'all' && filterMonth === 'all' && r.fecha > cutoffStr) return false;
                        if (allowedBands != null) {
                          const rb = distBandIndex(r.distancia_mts);
                          if (!allowedBands.has(rb)) return false;
                        }
                        if (filterTrack !== 'all' && r.track !== filterTrack) return false;
                        if (filterMonth !== 'all' && r.month !== filterMonth) return false;
                        if (filterWeek !== 'all' && r.week !== filterWeek) return false;
                        return true;
                      });

                      // Bands not yet included (for the dropdown)
                      const availableExtra = DIST_BANDS
                        .map((b, i) => ({ ...b, i }))
                        .filter(b => allowedBands != null && !allowedBands.has(b.i));

                      const byDate: Record<string, typeof match.eligible_races> = {};
                      for (const r of filtered) {
                        if (!byDate[r.fecha]) byDate[r.fecha] = [];
                        byDate[r.fecha].push(r);
                      }

                      // Label for the active distance filter
                      const bandLabel = allowedBands != null
                        ? Array.from(allowedBands).sort((a,b)=>a-b).map(i => DIST_BANDS[i].label).join(', ')
                        : 'all';

                      return (
                        <tr style={{ background: 'rgba(234,179,8,0.04)' }}>
                          <td colSpan={12} className="px-4 pb-3 pt-2 border-b border-yellow-500/10">
                            {/* Distance filter header */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-[9px] text-yellow-500/50 uppercase tracking-widest">Distancia:</span>
                              <span className="text-[10px] text-yellow-300/70">{bandLabel}</span>
                              {allowedBands != null && horseExtra.size > 0 && (
                                <button
                                  onClick={() => setExtraBands(prev => ({ ...prev, [horse.studbook_id]: new Set() }))}
                                  className="text-[9px] text-gray-500 hover:text-red-400 border border-white/10 px-1.5 py-0.5 rounded transition-colors"
                                >
                                  Reset
                                </button>
                              )}
                              {availableExtra.length > 0 && (
                                <select
                                  value=""
                                  onChange={e => {
                                    const idx = parseInt(e.target.value, 10);
                                    if (isNaN(idx)) return;
                                    setExtraBands(prev => {
                                      const cur = new Set(prev[horse.studbook_id] ?? []);
                                      cur.add(idx);
                                      return { ...prev, [horse.studbook_id]: cur };
                                    });
                                  }}
                                  className="text-[10px] bg-white/5 border border-white/15 text-gray-400 rounded px-1.5 py-0.5 cursor-pointer hover:border-yellow-500/30 focus:outline-none"
                                >
                                  <option value="">+ Add distance</option>
                                  {availableExtra.map(b => (
                                    <option key={b.i} value={b.i}>{b.label}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <div className="flex items-start gap-3 flex-wrap">
                              <span className="text-[10px] text-gray-600 shrink-0 hidden sm:inline">
                                {match.current_analysis}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {filtered.length === 0 ? (
                                  <span className="text-[10px] text-gray-600 italic">No upcoming races in this distance range</span>
                                ) : Object.entries(byDate).sort().map(([fecha, races]) =>
                                  races.map((r, i) => {
                                    const isGroup = !!r.group;
                                    const isG1 = r.group === 'G1';
                                    const isG2 = r.group === 'G2';
                                    const trackDot = r.track ? (TRACK_DOT[r.track] ?? 'bg-gray-400') : null;
                                    return (
                                      <span
                                        key={`${fecha}-${i}`}
                                        title={`${r.track ? r.track + ' · ' : ''}${r.distancia_mts}m · ${r.match_reason}`}
                                        onClick={() => setSelectedRace(r)}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]
                                                   border transition-colors cursor-pointer
                                                   ${isG1
                                                     ? 'bg-amber-500/15 text-amber-200/90 border-amber-500/30 hover:bg-amber-500/25'
                                                     : isG2
                                                     ? 'bg-purple-500/15 text-purple-200/90 border-purple-500/30 hover:bg-purple-500/25'
                                                     : isGroup
                                                     ? 'bg-blue-500/15 text-blue-200/90 border-blue-500/30 hover:bg-blue-500/25'
                                                     : 'bg-yellow-500/10 text-yellow-200/80 border-yellow-500/20 hover:bg-yellow-500/20'
                                                   }`}
                                      >
                                        {trackDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${trackDot}`} />}
                                        <span className="opacity-50">{r.dia_label}</span>
                                        {r.race_description}
                                        {r.condicion && (
                                          <span className="opacity-40 text-[9px] ml-0.5">· {r.condicion}</span>
                                        )}
                                      </span>
                                    );
                                  })
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
                        <td colSpan={12} className="px-6 pb-5 pt-4 border-b border-white/8">
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

        {/* Race Detail Modal */}
        {selectedRace && (
          <RaceDetailModal race={selectedRace} onClose={() => setSelectedRace(null)} />
        )}

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
