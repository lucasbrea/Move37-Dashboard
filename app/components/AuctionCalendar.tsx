'use client';

import { useState, useMemo } from 'react';
import { useAuctionCalendar, AuctionEntry, NewAuctionEntry } from '../../hooks/useAuctionCalendar';

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCE_BASE_URLS: Record<string, string> = {
  bullrich: 'https://antoniobullrich.com',
  argsales: 'https://arg-sales.com',
};

function resolveUrl(url: string, source: string): string {
  if (!url || url.startsWith('http')) return url;
  const base = SOURCE_BASE_URLS[source];
  return base ? base + url : url;
}

const SOURCE_STYLES: Record<string, { pill: string; dot: string; label: string }> = {
  fallowremates:       { pill: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',       dot: 'bg-blue-400',    label: 'Fallow'           },
  bullrich:            { pill: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',    dot: 'bg-amber-400',   label: 'Bullrich'         },
  argsales:            { pill: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', dot: 'bg-emerald-400', label: 'ArgSales'     },
  martinzubeldia:      { pill: 'bg-violet-500/20 text-violet-300 border border-violet-500/30', dot: 'bg-violet-400',  label: 'M. Zubeldia'     },
  blacktype:           { pill: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',       dot: 'bg-rose-400',    label: 'Blacktype'        },
  racehorse:           { pill: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',       dot: 'bg-cyan-400',    label: 'Racehorse'        },
  monasteriotattersall:{ pill: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30', dot: 'bg-yellow-400',  label: 'Mon. Tattersall'  },
  marketingequino:     { pill: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',       dot: 'bg-pink-400',    label: 'Marketing Equino' },
};

const SOURCE_OPTIONS = ['fallowremates', 'bullrich', 'argsales', 'martinzubeldia', 'blacktype', 'racehorse', 'monasteriotattersall', 'marketingequino'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function fmtDate(date: Date, opts: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString('en-GB', opts);
}

function entryToDates(entry: AuctionEntry) {
  return {
    start: new Date(entry.start_date + 'T12:00:00'),
    end:   new Date(entry.end_date   + 'T12:00:00'),
  };
}

// ─── Empty form ───────────────────────────────────────────────────────────────

const EMPTY_FORM: NewAuctionEntry = {
  name: '', link: '', catalog: '', start_date: '', end_date: '',
  source: 'fallowremates', prs_link: '', conformation_link: '', pbrs_link: '',
};

// ─── AuctionModal ─────────────────────────────────────────────────────────────

function AuctionModal({
  initial,
  onSave,
  onClose,
}: {
  initial: NewAuctionEntry;
  onSave: (v: NewAuctionEntry) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<NewAuctionEntry>(initial);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: keyof NewAuctionEntry) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.start_date || !form.end_date) { setErr('Name, start date and end date are required.'); return; }
    try {
      setSaving(true);
      await onSave(form);
      onClose();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, k: keyof NewAuctionEntry, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={form[k] as string}
        onChange={set(k)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-[#1a2f4a] border border-white/15 text-gray-200
                   placeholder-gray-500 focus:outline-none focus:border-white/40 rounded"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#0a192f] border border-white/20 rounded-lg w-full max-w-lg p-6 space-y-4 overflow-y-auto max-h-[90vh]"
      >
        <h3 className="text-lg font-light text-white">
          {initial.name ? 'Edit Auction' : 'Add Auction'}
        </h3>

        {field('Auction Name *', 'name', 'text', 'e.g. Gran Venta Fallow Derby')}

        <div className="grid grid-cols-2 gap-3">
          {field('Start Date *', 'start_date', 'date')}
          {field('End Date *',   'end_date',   'date')}
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Source</label>
          <select
            value={form.source}
            onChange={set('source')}
            className="w-full px-3 py-2 text-sm bg-[#1a2f4a] border border-white/15 text-gray-200
                       focus:outline-none focus:border-white/40 rounded"
          >
            {SOURCE_OPTIONS.map(s => (
              <option key={s} value={s}>{SOURCE_STYLES[s]?.label ?? s}</option>
            ))}
          </select>
        </div>

        {field('Auction Link', 'link', 'text', 'https://…')}
        {field('Catalogue Link', 'catalog', 'text', 'https://…')}
        {field('PRS Link', 'prs_link', 'text', 'https://…')}
        {field('Conformation Link', 'conformation_link', 'text', 'https://…')}
        {field('Dams (PBRS) Link', 'pbrs_link', 'text', 'https://…')}

        {err && <p className="text-red-400 text-xs">{err}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Auction Row ──────────────────────────────────────────────────────────────

function AuctionRow({
  entry,
  onEdit,
  onDelete,
  muted,
}: {
  entry: AuctionEntry;
  onEdit: (e: AuctionEntry) => void;
  onDelete: (id: string) => void;
  muted?: boolean;
}) {
  const { start, end } = entryToDates(entry);
  const s = SOURCE_STYLES[entry.source] ?? SOURCE_STYLES.fallowremates;
  const multiDay = !isSameDay(start, end);
  const link    = resolveUrl(entry.link, entry.source);
  const catalog = resolveUrl(entry.catalog, entry.source);

  return (
    <div className={`group flex items-start gap-4 p-4 bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors rounded ${muted ? 'opacity-75 hover:opacity-100' : ''}`}>
      {/* Date block */}
      <div className="flex-shrink-0 text-center w-14">
        <div className="text-[10px] text-gray-500 uppercase tracking-wide">{fmtDate(start, { month: 'short' })}</div>
        <div className="text-2xl font-light text-white leading-tight">{start.getDate()}</div>
        <div className="text-[10px] text-gray-600">{start.getFullYear()}</div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${s.pill}`}>{s.label}</span>
          {multiDay && (
            <span className="text-[10px] text-gray-500">
              until {fmtDate(end, { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        <h4 className="text-sm text-gray-200 truncate">{entry.name}</h4>
        <div className="flex items-center gap-3 mt-1.5">
          {link && <a href={link} className="text-xs text-blue-400 hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">View Auction →</a>}
          {catalog && <a href={catalog} className="text-xs text-gray-500 hover:text-gray-300 transition-colors" target="_blank" rel="noopener noreferrer">Catalogue</a>}
          {entry.prs_link && <a href={entry.prs_link} className="text-xs text-violet-400 hover:text-violet-300 transition-colors" target="_blank" rel="noopener noreferrer">PRS →</a>}
          {entry.conformation_link && <a href={entry.conformation_link} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors" target="_blank" rel="noopener noreferrer">Conformation →</a>}
          {entry.pbrs_link && <a href={entry.pbrs_link} className="text-xs text-orange-400 hover:text-orange-300 transition-colors" target="_blank" rel="noopener noreferrer">Dams →</a>}
        </div>
      </div>

      {/* Actions — visible on hover */}
      <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(entry)}
          className="px-2 py-1 text-[10px] text-gray-400 hover:text-white border border-white/10 hover:border-white/30 rounded transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => { if (confirm(`Delete "${entry.name}"?`)) onDelete(entry.id); }}
          className="px-2 py-1 text-[10px] text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded transition-colors"
        >
          Del
        </button>
      </div>
    </div>
  );
}

// ─── AuctionCalendar ──────────────────────────────────────────────────────────

export default function AuctionCalendar() {
  const { auctions, loading, error, addAuction, updateAuction, deleteAuction } = useAuctionCalendar();
  const [modalEntry, setModalEntry] = useState<AuctionEntry | null | 'new'>(null);

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  const upcoming = useMemo(
    () => auctions.filter(a => new Date(a.end_date + 'T23:59:59') >= today),
    [auctions, today]
  );

  const handleSave = async (form: NewAuctionEntry) => {
    if (modalEntry && modalEntry !== 'new') {
      await updateAuction(modalEntry.id, form);
    } else {
      await addAuction(form);
    }
  };

  const initialForm = (): NewAuctionEntry =>
    modalEntry && modalEntry !== 'new'
      ? { name: modalEntry.name, link: modalEntry.link, catalog: modalEntry.catalog,
          start_date: modalEntry.start_date, end_date: modalEntry.end_date, source: modalEntry.source,
          prs_link: modalEntry.prs_link, conformation_link: modalEntry.conformation_link, pbrs_link: modalEntry.pbrs_link }
      : EMPTY_FORM;

  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-light text-gray-100">Upcoming Auctions</h2>
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-3">
            {Object.entries(SOURCE_STYLES).map(([src, s]) => (
              <span key={src} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                {s.label}
              </span>
            ))}
          </div>
          <button
            onClick={() => setModalEntry('new')}
            className="px-3 py-1.5 text-xs border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded transition-colors"
          >
            + Add Auction
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-500 text-sm py-12 text-center">Loading…</p>}
      {error   && <p className="text-red-400 text-sm py-4">{error}</p>}

      {!loading && (
        <div className="space-y-2">
          {upcoming.length === 0
            ? <p className="text-gray-500 text-sm py-12 text-center">No upcoming auctions</p>
            : upcoming.map(entry => (
                <AuctionRow
                  key={entry.id}
                  entry={entry}
                  onEdit={e => setModalEntry(e)}
                  onDelete={id => deleteAuction(id)}
                />
              ))
          }
        </div>
      )}

      {modalEntry !== null && (
        <AuctionModal
          initial={initialForm()}
          onSave={handleSave}
          onClose={() => setModalEntry(null)}
        />
      )}
    </div>
  );
}

// ─── PastAuctionsList ─────────────────────────────────────────────────────────

export function PastAuctionsList() {
  const { auctions, loading, error, addAuction, updateAuction, deleteAuction } = useAuctionCalendar();
  const [cutoffDate, setCutoffDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [modalEntry, setModalEntry] = useState<AuctionEntry | null | 'new'>(null);

  const pastEvents = useMemo(() => {
    return auctions
      .filter(a => new Date(a.end_date + 'T23:59:59') < new Date(cutoffDate + 'T23:59:59'))
      .sort((a, b) =>
        sortDir === 'desc'
          ? b.start_date.localeCompare(a.start_date)
          : a.start_date.localeCompare(b.start_date)
      );
  }, [auctions, cutoffDate, sortDir]);

  const handleSave = async (form: NewAuctionEntry) => {
    if (modalEntry && modalEntry !== 'new') {
      await updateAuction(modalEntry.id, form);
    } else {
      await addAuction(form);
    }
  };

  const initialForm = (): NewAuctionEntry =>
    modalEntry && modalEntry !== 'new'
      ? { name: modalEntry.name, link: modalEntry.link, catalog: modalEntry.catalog,
          start_date: modalEntry.start_date, end_date: modalEntry.end_date, source: modalEntry.source,
          prs_link: modalEntry.prs_link, conformation_link: modalEntry.conformation_link, pbrs_link: modalEntry.pbrs_link }
      : EMPTY_FORM;

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <h2 className="text-2xl font-light text-gray-100">Past Auctions</h2>
        <div className="flex items-center gap-3 ml-auto">
          <label className="text-xs text-gray-500">Before</label>
          <input
            type="date"
            value={cutoffDate}
            onChange={e => setCutoffDate(e.target.value)}
            className="px-2.5 py-1.5 text-sm bg-white/5 border border-white/10 text-gray-300
                       focus:outline-none focus:border-white/30 rounded"
          />
          <button
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1.5 text-xs border border-white/10 text-gray-400 hover:text-white
                       hover:border-white/30 rounded transition-colors"
          >
            Date {sortDir === 'desc' ? '↓' : '↑'}
          </button>
          <button
            onClick={() => setModalEntry('new')}
            className="px-3 py-1.5 text-xs border border-white/20 text-gray-300 hover:text-white hover:border-white/40 rounded transition-colors"
          >
            + Add Auction
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-500 text-sm py-12 text-center">Loading…</p>}
      {error   && <p className="text-red-400 text-sm py-4">{error}</p>}

      {!loading && (
        <div className="space-y-2">
          {pastEvents.length === 0
            ? <p className="text-gray-500 text-sm py-12 text-center">No past auctions found</p>
            : pastEvents.map(entry => (
                <AuctionRow
                  key={entry.id}
                  entry={entry}
                  muted
                  onEdit={e => setModalEntry(e)}
                  onDelete={id => deleteAuction(id)}
                />
              ))
          }
        </div>
      )}

      {modalEntry !== null && (
        <AuctionModal
          initial={initialForm()}
          onSave={handleSave}
          onClose={() => setModalEntry(null)}
        />
      )}
    </div>
  );
}
