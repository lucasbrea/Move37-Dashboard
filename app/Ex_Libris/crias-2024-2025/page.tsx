'use client';

import { useMemo, useState, Fragment } from 'react';
import rawData from '../../../public/data/crias_exlibris.json';
import { useCriaComments, CriaCommentEntry, NewCriaCommentEntry } from '../../../hooks/useCriaComments';

interface Cria {
  id: string;
  name: string;
  padrillo: string;
  M: string;
  sexo: string;
  birthYear: number;
  month: number;
  PRS: number | null;
  PR: number | null;
  PS: number | null;
  inbreedingCoefficient: number | null;
  FSib_StkWnrs_Rnrs: number | null;
  FathSib_RnrsLast4Gens_NEW: number | null;
  Dam_Raced_Won_STK: string | null;
  Dam_Total_Rcs: number | null;
  Dam_Mean_T3_BSN: number | null;
  M_cumAEI: number | null;
  MomSib_Sibs_at2y: number | null;
  MSib_Raced_Won_STK_2y: string | null;
  G1G2G3_Total_Rcs: number | null;
  G1G2G3_Racesh: number | null;
}

function fmt(val: number | null, decimals = 1) {
  return val == null ? '—' : val.toFixed(decimals);
}

function pct(val: number | null, decimals = 1) {
  return val == null ? '—' : (val * 100).toFixed(decimals) + '%';
}

function studBookUrl(id: string, name: string) {
  return `https://www.studbook.org.ar/ejemplares/perfil/${id}/${name.toLowerCase().replace(/\s+/g, '-')}`;
}

function heatColor(value: number | null, values: (number | null)[]): string {
  if (value == null) return '';
  const valid = values.filter((v): v is number => v != null);
  if (valid.length < 2) return '';
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  if (min === max) return '';
  const t = (value - min) / (max - min);
  const hue = Math.round(t * 120);
  return `hsl(${hue}, 65%, 50%)`;
}

const TOTAL_COLS = 21; // 20 data cols + 1 comments col

const GH = 'text-center py-1 px-1 text-[9px] font-semibold uppercase tracking-widest';
const SH = 'text-center py-0.5 px-1 text-[9px] font-medium uppercase tracking-wide';
const CH = 'text-center py-1 px-1 text-[9px] font-medium uppercase tracking-tight whitespace-nowrap border-b border-white/10';
const CHl = CH + ' border-l border-white/15';
const TD = 'py-[3px] px-1 text-center text-[10px] text-gray-400 whitespace-nowrap';
const TDL = 'py-[3px] px-1 text-left text-[10px] text-gray-400 whitespace-nowrap';
const TDl = TD + ' border-l border-white/10';

// ── Comment Modal ─────────────────────────────────────────────────────────────

function CommentModal({ cria, onSave, onClose }: {
  cria: Cria;
  onSave: (entry: NewCriaCommentEntry) => Promise<void>;
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
      await onSave({ horse_id: cria.id, horse_name: cria.name, fecha: today, comentarios: comentarios.trim() });
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
            <h3 className="text-white font-medium text-lg leading-tight">{cria.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{new Date(today + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
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
            {saving ? 'Guardando…' : 'Guardar Comentario'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Edit Comment Modal ────────────────────────────────────────────────────────

function EditCommentModal({ entry, onSave, onClose }: {
  entry: CriaCommentEntry;
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
            <h3 className="text-white font-medium text-lg leading-tight">{entry.horse_name}</h3>
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

export default function CriasExLibrisPage() {
  const crias = useMemo<Cria[]>(
    () =>
      Object.entries(rawData as Record<string, Omit<Cria, 'id'>>)
        .map(([id, d]) => ({ id, ...d }))
        .sort((a, b) => a.birthYear - b.birthYear || (b.PRS ?? -Infinity) - (a.PRS ?? -Infinity)),
    []
  );

  const prsVals = useMemo(() => crias.map(c => c.PRS), [crias]);

  const { comments, loading: commentsLoading, addComment, updateComment, deleteComment } = useCriaComments();

  const commentsByHorse = useMemo(() => {
    const map: Record<string, CriaCommentEntry[]> = {};
    for (const c of comments) {
      if (!map[c.horse_id]) map[c.horse_id] = [];
      map[c.horse_id].push(c);
    }
    return map;
  }, [comments]);

  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [modalCria, setModalCria] = useState<Cria | null>(null);
  const [editingComment, setEditingComment] = useState<CriaCommentEntry | null>(null);

  function toggleComments(id: string) {
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[#0a192f] text-white">
      <div className="w-full px-4 py-8">
        <nav className="mb-8 flex items-center gap-3 text-sm text-gray-400">
          <a href="/" className="hover:text-white transition-colors duration-150">Dashboard</a>
          <span>/</span>
          <a href="/Ex_Libris" className="hover:text-white transition-colors duration-150">Ex Libris</a>
          <span>/</span>
          <span className="text-white">Crías Ex Libris</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-light tracking-tight">Crías Ex Libris</h1>
          <a
            href="https://docs.google.com/spreadsheets/d/14nbTTkBnc1P4Ng3HinSHBJ4-QqtLBWOf/edit?gid=1620171233#gid=1620171233"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-green-400 border border-green-400/30 hover:bg-green-400/10 transition-colors duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            PRS Sheet
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ fontSize: '10px' }}>
            <thead>
              {/* Row 1 — top group headers */}
              <tr className="text-gray-300">
                <th colSpan={6} className={GH + ' text-left border-b border-white/20 border-r border-white/15 bg-white/[0.04]'}>
                  Horse Characteristics
                </th>
                <th colSpan={4} className="border-b border-white/5" />
                <th colSpan={10} className={GH + ' border-b border-white/20 border-l border-white/15 bg-white/[0.04]'}>
                  Family Overview
                </th>
                <th className="border-b border-white/5" />
              </tr>

              {/* Row 2 — sub-group headers */}
              <tr className="text-gray-400">
                <th colSpan={6} className="border-r border-white/15" />
                <th colSpan={4} />
                <th colSpan={2} className={SH + ' border-l border-white/15 border-b border-white/10 text-gray-400'}>Sire (L4 Gens)</th>
                <th colSpan={4} className={SH + ' border-l border-white/10 border-b border-white/10 text-gray-400'}>Dam</th>
                <th colSpan={4} className={SH + ' border-l border-white/10 border-b border-white/10 text-gray-400'}>Dam&apos;s Offspring</th>
                <th className="border-b border-white/5" />
              </tr>

              {/* Row 3 — column headers */}
              <tr className="text-gray-500 border-b border-white/10">
                <th className={CH + ' text-left pr-2'}>Name</th>
                <th className={CH + ' text-left'}>Sire</th>
                <th className={CH + ' text-left'}>Dam</th>
                <th className={CH}>Sex</th>
                <th className={CH}>YR</th>
                <th className={CH + ' border-r border-white/15'}>MM</th>
                <th className={CH}>PRS</th>
                <th className={CH}>PR</th>
                <th className={CH}>PS</th>
                <th className={CH}>Inbreed.</th>
                <th className={CHl}>Stk Wnrs / Rnrs</th>
                <th className={CH}>Runners</th>
                <th className={CHl}>Raced-Won-Stk</th>
                <th className={CH}>Total Rcs</th>
                <th className={CH}>Top3 BSN</th>
                <th className={CH}>CEI</th>
                <th className={CHl}>RA Offs.</th>
                <th className={CH}>Raced-Won-Stk</th>
                <th className={CH}>Total G-STK</th>
                <th className={CH}>G-STK/Rcs</th>
                <th className={CH}>Comments</th>
              </tr>
            </thead>
            <tbody>
              {crias.map((c) => {
                const horseComments = commentsByHorse[c.id] ?? [];
                const latestComment = horseComments[0] ?? null;
                const commentsOpen = expandedComments.has(c.id);

                return (
                  <Fragment key={c.id}>
                    <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors duration-100">
                      {/* Horse */}
                      <td className="py-[3px] pr-2 text-[10px] font-medium whitespace-nowrap">
                        <a href={studBookUrl(c.id, c.name)} target="_blank" rel="noopener noreferrer"
                          className="text-white hover:text-blue-300 transition-colors duration-150">
                          {c.name}
                        </a>
                      </td>
                      <td className={TDL}>{c.padrillo}</td>
                      <td className={TDL}>{c.M}</td>
                      <td className={TD}>{c.sexo === 'Macho' ? 'M' : 'F'}</td>
                      <td className={TD}>{c.birthYear}</td>
                      <td className={TD + ' border-r border-white/15'}>{c.month}</td>
                      {/* Scores */}
                      <td className="py-[3px] px-1 text-center text-[10px] font-semibold whitespace-nowrap"
                        style={{ color: heatColor(c.PRS, prsVals) || undefined }}>
                        {pct(c.PRS, 2)}
                      </td>
                      <td className={TD}>{pct(c.PR, 1)}</td>
                      <td className={TD}>{pct(c.PS, 2)}</td>
                      <td className={TD}>{pct(c.inbreedingCoefficient, 2)}</td>
                      {/* Sire L4 */}
                      <td className={TDl}>{pct(c.FSib_StkWnrs_Rnrs, 1)}</td>
                      <td className={TD}>{c.FathSib_RnrsLast4Gens_NEW ?? '—'}</td>
                      {/* Dam */}
                      <td className={TDl}>{c.Dam_Raced_Won_STK ?? '—'}</td>
                      <td className={TD}>{c.Dam_Total_Rcs ?? '—'}</td>
                      <td className={TD}>{fmt(c.Dam_Mean_T3_BSN, 1)}</td>
                      <td className={TD}>{fmt(c.M_cumAEI, 2)}</td>
                      {/* Dam's Offspring */}
                      <td className={TDl}>{c.MomSib_Sibs_at2y ?? '—'}</td>
                      <td className={TD}>{c.MSib_Raced_Won_STK_2y ?? '—'}</td>
                      <td className={TD}>{c.G1G2G3_Total_Rcs ?? '—'}</td>
                      <td className={TD}>{c.G1G2G3_Racesh != null ? pct(c.G1G2G3_Racesh, 1) : '—'}</td>
                      {/* Comments */}
                      <td className={TD}>
                        <button onClick={() => setModalCria(c)}
                          className="font-medium bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded transition-colors duration-150">
                          +
                        </button>
                      </td>
                    </tr>

                    {/* Latest comment sub-row */}
                    {!commentsLoading && horseComments.length > 0 && (
                      <tr className="border-b border-white/5" style={{ background: 'rgba(255,255,255,0.025)' }}>
                        <td colSpan={TOTAL_COLS} className="px-4 py-1.5">
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex items-start gap-3 min-w-0">
                              {latestComment && (
                                <>
                                  <span className="text-gray-500 text-[10px] whitespace-nowrap mt-px shrink-0">
                                    {new Date(latestComment.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                  <span className="text-gray-300 text-[10px] leading-relaxed">{latestComment.comentarios}</span>
                                </>
                              )}
                            </div>
                            <button onClick={() => toggleComments(c.id)}
                              className={`flex-shrink-0 text-[10px] flex items-center gap-1 px-2 py-0.5 border rounded transition-colors duration-150 ${commentsOpen ? 'border-yellow-400/40 text-yellow-300' : 'border-white/15 text-gray-400 hover:text-white hover:border-white/30'}`}>
                              {horseComments.length} {horseComments.length === 1 ? 'entrada' : 'entradas'}
                              <span style={{ display: 'inline-block', transform: commentsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Comment history */}
                    {commentsOpen && horseComments.length > 0 && (
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <td colSpan={TOTAL_COLS} className="px-6 pb-4 pt-3 border-b border-white/8">
                          <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-3">Historial — {c.name}</p>
                          <div className="space-y-2">
                            {horseComments.map(entry => (
                              <div key={entry.id} className="flex gap-4 items-start border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                <div className="shrink-0 w-24 text-gray-500 text-[10px] pt-0.5">
                                  {new Date(entry.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-gray-200 text-xs leading-relaxed">{entry.comentarios}</p>
                                </div>
                                <div className="shrink-0 flex items-center gap-1.5">
                                  <button onClick={() => setEditingComment(entry)}
                                    className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-gray-400 hover:text-yellow-300 hover:border-yellow-500/30 transition-colors duration-150">Edit</button>
                                  <button onClick={() => { if (confirm('¿Eliminar este comentario?')) deleteComment(entry.id); }}
                                    className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-colors duration-150">Delete</button>
                                </div>
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
      </div>

      {modalCria && <CommentModal cria={modalCria} onSave={addComment} onClose={() => setModalCria(null)} />}
      {editingComment && <EditCommentModal entry={editingComment} onSave={updateComment} onClose={() => setEditingComment(null)} />}
    </div>
  );
}
