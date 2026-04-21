'use client';

import { useState, Fragment, useMemo } from 'react';
import rawData from '../../../public/data/ExLibris_Dams.json';
import offspringRaw from '../../../public/data/dams_offspring.json';
import { useDamComments, DamCommentEntry, NewDamCommentEntry } from '../../../hooks/useDamComments';

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

function getTopBsns(races: OffspringRace[]): [{ bsn: number; dist: number } | null, { bsn: number; dist: number } | null] {
  const sorted = races
    .filter(r => r.bsn != null)
    .sort((a, b) => (b.bsn as number) - (a.bsn as number));
  const first = sorted[0] ? { bsn: sorted[0].bsn as number, dist: sorted[0].distance } : null;
  const second = sorted[1] ? { bsn: sorted[1].bsn as number, dist: sorted[1].distance } : null;
  return [first, second];
}

// ── Comment Modal ─────────────────────────────────────────────────────────────

function CommentModal({ dam, onSave, onClose }: {
  dam: Dam;
  onSave: (entry: NewDamCommentEntry) => Promise<void>;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [comentarios, setComentarios] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentarios.trim()) { setErr('Ingresá un comentario.'); return; }
    try {
      setSaving(true);
      await onSave({ dam_id: dam.id, dam_name: dam.nombre, fecha: today, comentarios: comentarios.trim() });
      onClose();
    } catch { setErr('Error al guardar. Intente nuevamente.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#0a192f] border border-white/15 w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-[#0a192f] z-10">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Comentario</p>
            <h3 className="text-white font-medium text-lg leading-tight">{dam.nombre}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{new Date(today + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none px-1">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Comentario</label>
            <textarea autoFocus value={comentarios} onChange={e => setComentarios(e.target.value)}
rows={4}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/30 text-sm resize-none" />
          </div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button type="submit" disabled={saving}
            className="w-full py-4 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-medium text-sm border border-yellow-500/30 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Guardando…' : 'Guardar Comentario'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Edit Comment Modal ────────────────────────────────────────────────────────

function EditCommentModal({ entry, onSave, onClose }: {
  entry: DamCommentEntry;
  onSave: (id: string, comentarios: string) => Promise<void>;
  onClose: () => void;
}) {
  const [comentarios, setComentarios] = useState(entry.comentarios);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentarios.trim()) { setErr('Ingresá un comentario.'); return; }
    try {
      setSaving(true);
      await onSave(entry.id, comentarios.trim());
      onClose();
    } catch { setErr('Error al guardar. Intente nuevamente.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#0a192f] border border-white/15 w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-[#0a192f] z-10">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Editar Comentario</p>
            <h3 className="text-white font-medium text-lg leading-tight">{entry.dam_name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{new Date(entry.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none px-1">×</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5">
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Comentario</label>
            <textarea autoFocus value={comentarios} onChange={e => setComentarios(e.target.value)} rows={4}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/30 text-sm resize-none" />
          </div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button type="submit" disabled={saving}
            className="w-full py-4 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-medium text-sm border border-yellow-500/30 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Guardando…' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
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
      bestOffspringId: string | null;
    }> = {};

    for (const dam of Object.values(dams)) {
      let bestBsn: number | null = null;
      let bestBsnDist: number | null = null;
      for (const r of dam.races) {
        if (r.bsn != null && (bestBsn === null || r.bsn > bestBsn)) {
          bestBsn = r.bsn;
          bestBsnDist = r.distance;
        }
      }

      const offspring = offspringMap[dam.id]?.offspring ?? [];
      let bestOffspringName: string | null = null;
      let bestOffspringBsn: number | null = null;
      let bestOffspringId: string | null = null;
      for (const child of offspring) {
        for (const r of child.races) {
          if (r.bsn != null && (bestOffspringBsn === null || r.bsn > bestOffspringBsn)) {
            bestOffspringBsn = r.bsn;
            bestOffspringName = child.name;
            bestOffspringId = String(child.studbook_id);
          }
        }
      }

      result[dam.id] = { bestBsn, bestBsnDist, bestOffspringName, bestOffspringBsn, bestOffspringId };
    }
    return result;
  }, [dams, offspringMap]);

  const [expandedCampaign, setExpandedCampaign] = useState<Set<string>>(new Set());
  const [expandedOffspring, setExpandedOffspring] = useState<Set<string>>(new Set());
  const [expandedOffspringCampaign, setExpandedOffspringCampaign] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [modalDam, setModalDam] = useState<Dam | null>(null);
  const [editingComment, setEditingComment] = useState<DamCommentEntry | null>(null);

  const { comments, loading: commentsLoading, addComment, updateComment, deleteComment } = useDamComments();

  const commentsByDam = useMemo(() => {
    const map: Record<string, DamCommentEntry[]> = {};
    for (const c of comments) {
      if (!map[c.dam_id]) map[c.dam_id] = [];
      map[c.dam_id].push(c);
    }
    return map;
  }, [comments]);

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
              <tr className="text-gray-400 text-xs uppercase tracking-tight">
                <th rowSpan={2} className="text-center py-2 px-1.5 font-medium whitespace-nowrap border-b border-white/10">Age</th>
                <th rowSpan={2} className="text-left py-2 pr-2 font-medium whitespace-nowrap border-b border-white/10">Name</th>
                <th rowSpan={2} className="text-center py-2 px-1.5 font-medium whitespace-nowrap border-b border-white/10">PB</th>
                <th rowSpan={2} className="text-center py-2 px-1.5 font-medium whitespace-nowrap border-b border-white/10">PRS</th>
                <th rowSpan={2} className="text-center py-2 px-1.5 font-medium whitespace-nowrap border-b border-white/10">PBRS</th>
                <th colSpan={4} className="text-center py-2 px-1.5 font-medium whitespace-nowrap border-b border-white/10">Births</th>
                <th colSpan={1} className="text-center py-2 px-1.5 font-medium whitespace-nowrap border-b border-white/10">STK</th>
                <th rowSpan={2} className="text-center py-2 px-1.5 font-medium whitespace-nowrap border-b border-white/10">Best BSN (Dist)</th>
                <th colSpan={1} className="text-center py-2 px-1.5 font-medium whitespace-nowrap border-b border-white/10">Offs. STK</th>
                <th rowSpan={2} className="text-center py-2 px-1.5 font-medium whitespace-nowrap border-b border-white/10">Best Offspring BSN</th>
                <th rowSpan={2} className="text-center py-2 px-1.5 font-medium whitespace-nowrap border-b border-white/10">Results</th>
                <th rowSpan={2} className="text-center py-2 px-1.5 font-medium whitespace-nowrap border-b border-white/10">Offspring</th>
                <th rowSpan={2} className="text-center py-2 px-1.5 font-medium whitespace-nowrap border-b border-white/10">Comments</th>
              </tr>
              <tr className="text-gray-400 text-xs uppercase tracking-tight border-b border-white/10">
                <th className="text-center py-1 px-1.5 font-medium whitespace-nowrap">Last</th>
                <th className="text-center py-1 px-1.5 font-medium whitespace-nowrap">Next</th>
                <th className="text-center py-1 px-1.5 font-medium whitespace-nowrap">BR</th>
                <th className="text-center py-1 px-1.5 font-medium whitespace-nowrap">BR L3</th>
                <th className="text-center py-1 px-1.5 font-medium whitespace-nowrap">Ran · Won</th>
                <th className="text-center py-1 px-1.5 font-medium whitespace-nowrap">Ran · Won</th>
              </tr>
            </thead>
            <tbody>
              {dams.map((dam) => {
                const campaignOpen = expandedCampaign.has(dam.id);
                const offspringOpen = expandedOffspring.has(dam.id);
                const offspringEntry = offspringMap[dam.id];
                const offspringData = [...(offspringEntry?.offspring ?? [])].sort((a, b) => (b.PRS ?? -Infinity) - (a.PRS ?? -Infinity));
                const stats = damStats[dam.id];

                const damComments = commentsByDam[dam.id] ?? [];
                const latestComment = damComments[0] ?? null;
                const commentsOpen = expandedComments.has(dam.id);

                return (
                  <Fragment key={dam.id}>
                    {/* Dam row */}
                    <tr className={`border-b border-white/5 transition-colors duration-100 ${campaignOpen || offspringOpen ? 'bg-yellow-400/[0.14] hover:bg-yellow-400/[0.18]' : 'hover:bg-white/[0.03]'}`}>
                      <td className="py-1.5 px-1.5 text-center text-gray-300 whitespace-nowrap">{dam.M_age_at_service}</td>
                      <td className="py-1.5 pr-2 font-medium whitespace-nowrap">
                        <a href={studBookUrl(dam.id, dam.nombre)} target="_blank" rel="noopener noreferrer"
                          className="text-white hover:text-blue-300 transition-colors duration-150">
                          {dam.nombre}
                        </a>
                      </td>
                      <td className="py-1.5 px-1.5 text-center text-gray-300 whitespace-nowrap">{pct(dam.pb, 1)}</td>
                      <td className="py-1.5 px-1.5 text-center text-gray-300 whitespace-nowrap">{pct(dam.prs, 1)}</td>
                      <td className="py-1.5 px-1.5 text-center text-gray-300 whitespace-nowrap">{pct(dam.pbrs, 1)}</td>
                      <td className="py-1.5 px-1.5 text-center text-gray-400 whitespace-nowrap">{dam.last_birth ?? '—'}</td>
                      <td className="py-1.5 px-1.5 text-center text-gray-400 whitespace-nowrap">{dam.expected_birth ?? '—'}</td>
                      <td className="py-1.5 px-1.5 text-center text-gray-300 whitespace-nowrap">{pct(dam.birthRate, 0)}</td>
                      <td className="py-1.5 px-1.5 text-center text-gray-300 whitespace-nowrap">{pct(dam.birthRateLast3, 0)}</td>
                      <td className="py-1.5 px-1.5 text-center text-gray-300 whitespace-nowrap">{dam.ran_won_stk ?? '—'}</td>
                      <td className="py-1.5 px-1.5 text-center text-gray-300 whitespace-nowrap">
                        {stats?.bestBsn != null ? <>{fmt(stats.bestBsn, 0)}<span className="text-gray-500 ml-1">({stats.bestBsnDist}m)</span></> : '—'}
                      </td>
                      <td className="py-1.5 px-1.5 text-center text-gray-300 whitespace-nowrap">{offspringEntry?.ran_won_stk ?? '—'}</td>
                      <td className="py-1.5 px-1.5 text-center text-gray-300 whitespace-nowrap">
                        {stats?.bestOffspringName != null
                          ? <><a href={studBookUrl(stats.bestOffspringId!, stats.bestOffspringName)} target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 transition-colors duration-150">{stats.bestOffspringName}</a><span className="text-gray-500 ml-1">{fmt(stats.bestOffspringBsn, 0)}</span></>
                          : '—'}
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
                      <td className="py-1.5 px-1.5 text-center">
                        <button onClick={() => setModalDam(dam)}
                          className="font-medium bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded transition-colors duration-150">
                          +
                        </button>
                      </td>
                    </tr>

                    {/* Latest comment sub-row */}
                    {!commentsLoading && (latestComment || damComments.length > 0) && (
                      <tr className="border-b border-white/5" style={{ background: 'rgba(255,255,255,0.025)' }}>
                        <td colSpan={16} className="px-4 py-2">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex items-start gap-3 min-w-0">
                              {latestComment && (
                                <>
                                  <span className="text-gray-500 text-xs whitespace-nowrap mt-px shrink-0">
                                    {new Date(latestComment.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                  <span className="text-gray-200 text-xs leading-relaxed">{latestComment.comentarios}</span>
                                </>
                              )}
                            </div>
                            {damComments.length > 0 && (
                              <button onClick={() => toggle(expandedComments, setExpandedComments, dam.id)}
                                className={`flex-shrink-0 text-xs flex items-center gap-1.5 px-2.5 py-1 border rounded transition-colors duration-150 ${commentsOpen ? 'border-yellow-400/40 text-yellow-300' : 'border-white/15 text-gray-400 hover:text-white hover:border-white/30'}`}>
                                {damComments.length} {damComments.length === 1 ? 'entrada' : 'entradas'}
                                <span style={{ display: 'inline-block', transform: commentsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Comment history */}
                    {commentsOpen && damComments.length > 0 && (
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <td colSpan={16} className="px-6 pb-5 pt-4 border-b border-white/8">
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Historial — {dam.nombre}</p>
                          <div className="space-y-3">
                            {damComments.map(entry => (
                              <div key={entry.id} className="flex gap-4 items-start border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                <div className="shrink-0 w-24 text-gray-500 text-xs pt-0.5">
                                  {new Date(entry.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-200 text-sm leading-relaxed">{entry.comentarios}</p>
                                </div>
                                <div className="shrink-0 flex items-center gap-1.5">
                                  <button onClick={() => setEditingComment(entry)}
                                    className="text-xs px-2 py-1 rounded border border-white/10 text-gray-400 hover:text-yellow-300 hover:border-yellow-500/30 transition-colors duration-150">Edit</button>
                                  <button onClick={() => { if (confirm('¿Eliminar este comentario?')) deleteComment(entry.id); }}
                                    className="text-xs px-2 py-1 rounded border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-colors duration-150">Delete</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Dam campaign */}
                    {campaignOpen && (() => {
                      const sortedRaces = [...dam.races].sort((a, b) => b.fecha.localeCompare(a.fecha));
                      const bsnVals = sortedRaces.map(r => r.bsn);
                      const posVals = sortedRaces.map(r => r.posicion);
                      return (
                      <tr className="bg-white/[0.02]">
                        <td colSpan={16} className="px-8 pb-4 pt-2">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="border-b border-white/10 text-gray-500 uppercase tracking-wider">
                                  <th className="text-left py-2.5 pr-5 font-medium">Date</th>
                                  <th className="text-left py-2.5 pr-5 font-medium">Track</th>
                                  <th className="text-left py-2.5 pr-5 font-medium">Category</th>
                                  <th className="text-left py-2.5 pr-5 font-medium">Cond.</th>
                                  <th className="text-left py-2.5 pr-5 font-medium">Surf.</th>
                                  <th className="text-center py-2.5 px-4 font-medium">Dist.</th>
                                  <th className="text-left py-2.5 px-4 font-medium">Status</th>
                                  <th className="text-center py-2.5 px-4 font-medium">Pos.</th>
                                  <th className="text-center py-2.5 px-4 font-medium">ECPos</th>
                                  <th className="text-center py-2.5 px-4 font-medium">BSN</th>
                                  <th className="text-center py-2.5 px-4 font-medium">PWin BSN</th>
                                  <th className="text-center py-2.5 px-4 font-medium">EMA</th>
                                  <th className="text-center py-2.5 px-4 font-medium">Glicko</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sortedRaces.map((race, i) => (
                                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-100">
                                    <td className="py-2.5 pr-5 text-gray-300">
                                      {race.date_link
                                        ? <a href={race.date_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors duration-150">{race.fecha}</a>
                                        : race.fecha}
                                    </td>
                                    <td className="py-2.5 pr-5 text-gray-300">{stripHip(race.track)}</td>
                                    <td className="py-2.5 pr-5 text-gray-400">{race.categoria}</td>
                                    <td className="py-2.5 pr-5 text-gray-400">{race.cond ?? '—'}</td>
                                    <td className="py-2.5 pr-5 text-gray-400">{race.surface}</td>
                                    <td className="py-2.5 px-4 text-center text-gray-400">{race.distance}m</td>
                                    <td className="py-2.5 px-4 text-gray-400">{race.estado}</td>
                                    <td className="py-2.5 px-4 text-center font-medium" style={{ color: heatColor(race.posicion, posVals, false) || undefined }}>{fmt(race.posicion, 0)}</td>
                                    <td className="py-2.5 px-4 text-center text-gray-400">{fmt(race.ecpos, 2)}</td>
                                    <td className="py-2.5 px-4 text-center font-medium" style={{ color: heatColor(race.bsn, bsnVals, true) || undefined }}>{fmt(race.bsn, 0)}</td>
                                    <td className="py-2.5 px-4 text-center text-gray-400">{fmt(race.pwin_bsn, 0)}</td>
                                    <td className="py-2.5 px-4 text-center text-gray-400">{fmt(race.ema, 1)}</td>
                                    <td className="py-2.5 px-4 text-center text-gray-400">{fmt(race.glicko, 0)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                      );
                    })()}

                    {/* Offspring table */}
                    {offspringOpen && (
                      <tr className="bg-blue-900/20">
                        <td colSpan={16} className="px-8 pb-6 pt-3">
                          <p className="text-xs text-blue-300/60 uppercase tracking-wider mb-3">Offspring of {dam.nombre}</p>
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="border-b border-blue-400/20 text-blue-300/60 uppercase tracking-wider">
                                <th className="text-left py-2.5 pr-5 font-medium whitespace-nowrap">Name</th>
                                <th className="text-left py-2.5 pr-5 font-medium whitespace-nowrap">Sire</th>
                                <th className="text-center py-2.5 px-4 font-medium whitespace-nowrap">Birth YR</th>
                                <th className="text-center py-2.5 px-4 font-medium whitespace-nowrap">PRS</th>
                                <th className="text-center py-2.5 px-4 font-medium whitespace-nowrap">PR</th>
                                <th className="text-center py-2.5 px-4 font-medium whitespace-nowrap">PS</th>
                                <th className="text-center py-2.5 px-4 font-medium whitespace-nowrap">Races</th>
                                <th className="text-center py-2.5 px-4 font-medium whitespace-nowrap">Wins</th>
                                <th className="text-center py-2.5 px-4 font-medium whitespace-nowrap">STK Ran</th>
                                <th className="text-center py-2.5 px-4 font-medium whitespace-nowrap">STK Won</th>
                                <th className="text-center py-2.5 px-4 font-medium whitespace-nowrap">Max BSN (Dist)</th>
                                <th className="text-center py-2.5 px-4 font-medium whitespace-nowrap">2nd BSN (Dist)</th>
                                <th className="text-center py-2.5 px-4 font-medium whitespace-nowrap">Results</th>
                              </tr>
                            </thead>
                            <tbody>
                              {offspringData.map((child) => {
                                const childCampaignOpen = expandedOffspringCampaign.has(String(child.studbook_id));
                                const [maxBsn, secondBsn] = getTopBsns(child.races);
                                return (
                                  <Fragment key={String(child.studbook_id)}>
                                    <tr className="border-b border-blue-400/10 hover:bg-blue-400/5 transition-colors duration-100">
                                      <td className="py-2.5 pr-5 text-gray-200 font-medium whitespace-nowrap">
                                        <a href={studBookUrl(String(child.studbook_id), child.name)} target="_blank" rel="noopener noreferrer"
                                          className="hover:text-blue-300 transition-colors duration-150">
                                          {child.name}
                                        </a>
                                      </td>
                                      <td className="py-2.5 pr-5 text-gray-400 whitespace-nowrap">{child.padrillo}</td>
                                      <td className="py-2.5 px-4 text-center text-gray-400">{child.year}</td>
                                      <td className="py-2.5 px-4 text-center text-gray-300">{pct(child.PRS, 1)}</td>
                                      <td className="py-2.5 px-4 text-center text-gray-300">{pct(child.PR, 1)}</td>
                                      <td className="py-2.5 px-4 text-center text-gray-300">{pct(child.PS, 1)}</td>
                                      <td className="py-2.5 px-4 text-center text-gray-400">{child.races.length}</td>
                                      <td className="py-2.5 px-4 text-center text-gray-400">{child.total_win != null ? Math.round(child.total_win) : '—'}</td>
                                      <td className="py-2.5 px-4 text-center text-gray-400">{child.clasicos_ran != null ? Math.round(child.clasicos_ran) : '—'}</td>
                                      <td className="py-2.5 px-4 text-center text-gray-400">{child.clasicos_won != null ? Math.round(child.clasicos_won) : '—'}</td>
                                      <td className="py-2.5 px-4 text-center text-gray-300 whitespace-nowrap">
                                        {maxBsn ? <>{fmt(maxBsn.bsn, 0)}<span className="text-gray-500 ml-1">({maxBsn.dist}m)</span></> : '—'}
                                      </td>
                                      <td className="py-2.5 px-4 text-center text-gray-400 whitespace-nowrap">
                                        {secondBsn ? <>{fmt(secondBsn.bsn, 0)}<span className="text-gray-500 ml-1">({secondBsn.dist}m)</span></> : '—'}
                                      </td>
                                      <td className="py-2.5 px-4 text-center">
                                        {child.races.length > 0
                                          ? <ToggleBtn count={child.races.length} expanded={childCampaignOpen}
                                              onClick={() => toggle(expandedOffspringCampaign, setExpandedOffspringCampaign, String(child.studbook_id))} />
                                          : <span className="text-gray-600">—</span>
                                        }
                                      </td>
                                    </tr>
                                    {childCampaignOpen && (() => {
                                      const sortedChildRaces = [...child.races].sort((a, b) => normRaceDate(b.race_date).localeCompare(normRaceDate(a.race_date)));
                                      const childBsnVals = sortedChildRaces.map(r => r.bsn);
                                      const childPosVals = sortedChildRaces.map(r => r.p);
                                      return (
                                      <tr className="bg-blue-950/40">
                                        <td colSpan={13} className="px-4 pb-3 pt-1">
                                          <div className="overflow-x-auto">
                                            <table className="w-full text-sm border-collapse">
                                              <thead>
                                                <tr className="border-b border-blue-400/20 text-blue-300/50 uppercase tracking-wider">
                                                  <th className="text-left py-2 pr-4 font-medium">Date</th>
                                                  <th className="text-left py-2 pr-4 font-medium">Track</th>
                                                  <th className="text-left py-2 pr-4 font-medium">Category</th>
                                                  <th className="text-left py-2 pr-4 font-medium">Cond.</th>
                                                  <th className="text-left py-2 pr-4 font-medium">Surf.</th>
                                                  <th className="text-center py-2 px-3 font-medium">Dist.</th>
                                                  <th className="text-left py-2 px-3 font-medium">Status</th>
                                                  <th className="text-center py-2 px-3 font-medium">Pos.</th>
                                                  <th className="text-center py-2 px-3 font-medium">ECPos</th>
                                                  <th className="text-center py-2 px-3 font-medium">BSN</th>
                                                  <th className="text-center py-2 px-3 font-medium">PWin BSN</th>
                                                  <th className="text-center py-2 px-3 font-medium">EMA</th>
                                                  <th className="text-center py-2 px-3 font-medium">Glicko</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {sortedChildRaces.map((r, i) => (
                                                  <tr key={i} className="border-b border-blue-400/10 hover:bg-blue-400/5 transition-colors duration-100">
                                                    <td className="py-2 pr-4 text-gray-300">
                                                      {r.date_link
                                                        ? <a href={r.date_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors duration-150">{normRaceDate(r.race_date)}</a>
                                                        : normRaceDate(r.race_date)}
                                                    </td>
                                                    <td className="py-2 pr-4 text-gray-300">{stripHip(r.track)}</td>
                                                    <td className="py-2 pr-4 text-gray-400">{r.categoria}</td>
                                                    <td className="py-2 pr-4 text-gray-400">{r.cond ?? '—'}</td>
                                                    <td className="py-2 pr-4 text-gray-400">{r.surface}</td>
                                                    <td className="py-2 px-3 text-center text-gray-400">{r.distance}m</td>
                                                    <td className="py-2 px-3 text-gray-400">{r.estado}</td>
                                                    <td className="py-2 px-3 text-center font-medium" style={{ color: heatColor(r.p, childPosVals, false) || undefined }}>{fmt(r.p, 0)}</td>
                                                    <td className="py-2 px-3 text-center text-gray-400">{fmt(r.ecpos, 2)}</td>
                                                    <td className="py-2 px-3 text-center font-medium" style={{ color: heatColor(r.bsn, childBsnVals, true) || undefined }}>{fmt(r.bsn, 0)}</td>
                                                    <td className="py-2 px-3 text-center text-gray-400">{fmt(r.pwin_bsn, 0)}</td>
                                                    <td className="py-2 px-3 text-center text-gray-400">{fmt(r.ema_past_bsn, 1)}</td>
                                                    <td className="py-2 px-3 text-center text-gray-400">{fmt(r.glicko, 0)}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                      );
                                    })()}
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
      {modalDam && <CommentModal dam={modalDam} onSave={addComment} onClose={() => setModalDam(null)} />}
      {editingComment && <EditCommentModal entry={editingComment} onSave={updateComment} onClose={() => setEditingComment(null)} />}
    </div>
  );
}
