'use client';

import { useState, useEffect, useMemo } from 'react';

interface AuctionEvent {
  name: string;
  link: string;
  catalog: string;
  start: Date;
  end: Date;
  source: string;
  prsLink: string;
  conformationLink: string;
  pbrsLink: string;
}

const SOURCE_BASE_URLS: Record<string, string> = {
  bullrich:  'https://antoniobullrich.com',
  argsales:  'https://arg-sales.com',
};

function resolveUrl(url: string, source: string): string {
  if (!url || url.startsWith('http')) return url;
  const base = SOURCE_BASE_URLS[source];
  return base ? base + url : url;
}

const SOURCE_STYLES: Record<string, { pill: string; dot: string; label: string }> = {
  fallowremates:   { pill: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',     dot: 'bg-blue-400',    label: 'Fallow'         },
  bullrich:        { pill: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',  dot: 'bg-amber-400',   label: 'Bullrich'       },
  argsales:        { pill: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', dot: 'bg-emerald-400', label: 'ArgSales'  },
  martinzubeldia:  { pill: 'bg-violet-500/20 text-violet-300 border border-violet-500/30', dot: 'bg-violet-400', label: 'M. Zubeldia'  },
  blacktype:       { pill: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',       dot: 'bg-rose-400',    label: 'Blacktype'      },
};

// ─── Date parsing ────────────────────────────────────────────────────────────

function parseDate(str: string): Date | null {
  if (!str) return null;
  const s = str.trim();
  // YYYY-MM-DD or YYYY-MM-DD HH:MM:SS
  if (/^\d{4}-\d{2}-\d{2}/.test(s))
    return new Date(s.slice(0, 10) + 'T12:00:00');
  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/');
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00`);
  }
  // DD-MM-YYYY
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) {
    const [d, m, y] = s.split('-');
    return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00`);
  }
  return null;
}

// ─── CSV parsing ─────────────────────────────────────────────────────────────

function parseCSV(text: string): AuctionEvent[] {
  const lines = text.trim().split('\n').slice(1); // skip header
  const seen  = new Set<string>();
  const events: AuctionEvent[] = [];

  for (const line of lines) {
    const cols    = line.split(',');
    if (cols.length < 6) continue;
    const name    = cols[0].trim();
    const link    = cols[1].trim();
    const catalog = cols[2].trim();
    const start   = parseDate(cols[3]);
    const end     = parseDate(cols[4]);
    const source  = cols[5].trim();
    const prsLink         = cols[6]?.trim() ?? '';
    const conformationLink = cols[7]?.trim() ?? '';
    const pbrsLink         = cols[8]?.trim() ?? '';

    if (!name || !start || !end) continue;

    // Deduplicate on name + start string
    const key = `${name}|${cols[3].trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    events.push({
      name,
      link:    resolveUrl(link, source),
      catalog: resolveUrl(catalog, source),
      start,
      end,
      source,
      prsLink,
      conformationLink,
      pbrsLink,
    });
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function fmtDate(date: Date, opts: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString('en-GB', opts);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AuctionCalendar() {
  const [csvText, setCsvText] = useState('');

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  useEffect(() => {
    fetch('/data/auctions_calendar.csv')
      .then(r => r.text())
      .then(setCsvText)
      .catch(() => setCsvText(''));
  }, []);

  const events = useMemo(() => parseCSV(csvText), [csvText]);

  return (
    <div>
      {/* ── Top bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-light text-gray-100">Upcoming Auctions</h2>
        {/* Legend */}
        <div className="flex items-center gap-3">
          {Object.entries(SOURCE_STYLES).map(([src, s]) => (
            <span key={src} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── List view ── */}
      <div className="space-y-2">
        {events.filter(ev => ev.end >= today).length === 0 ? (
          <p className="text-gray-500 text-sm py-12 text-center">No upcoming auctions</p>
        ) : (
          events.filter(ev => ev.end >= today).map((ev, i) => {
            const s = SOURCE_STYLES[ev.source] ?? SOURCE_STYLES.fallowremates;
            const multiDay = !isSameDay(ev.start, ev.end);
            return (
              <div key={i} className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors rounded">
                {/* Date block */}
                <div className="flex-shrink-0 text-center w-14">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                    {fmtDate(ev.start, { month: 'short' })}
                  </div>
                  <div className="text-2xl font-light text-white leading-tight">{ev.start.getDate()}</div>
                  <div className="text-[10px] text-gray-600">{ev.start.getFullYear()}</div>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${s.pill}`}>{s.label}</span>
                    {multiDay && (
                      <span className="text-[10px] text-gray-500">
                        until {fmtDate(ev.end, { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm text-gray-200 truncate">{ev.name}</h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    {ev.link && (
                      <a href={ev.link} className="text-xs text-blue-400 hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">
                        View Auction →
                      </a>
                    )}
                    {ev.catalog && (
                      <a href={ev.catalog} className="text-xs text-gray-500 hover:text-gray-300 transition-colors" target="_blank" rel="noopener noreferrer">
                        Catalogue
                      </a>
                    )}
                    {ev.prsLink && (
                      <a href={ev.prsLink} className="text-xs text-violet-400 hover:text-violet-300 transition-colors" target="_blank" rel="noopener noreferrer">
                        PRS →
                      </a>
                    )}
                    {ev.conformationLink && (
                      <a href={ev.conformationLink} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors" target="_blank" rel="noopener noreferrer">
                        Conformation →
                      </a>
                    )}
                    {ev.pbrsLink && (
                      <a href={ev.pbrsLink} className="text-xs text-orange-400 hover:text-orange-300 transition-colors" target="_blank" rel="noopener noreferrer">
                        Dams →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Past Auctions List ───────────────────────────────────────────────────────

export function PastAuctionsList() {
  const [csvText, setCsvText] = useState('');
  const [cutoffDate, setCutoffDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    fetch('/data/auctions_calendar.csv')
      .then(r => r.text())
      .then(setCsvText)
      .catch(() => setCsvText(''));
  }, []);

  const events = useMemo(() => parseCSV(csvText), [csvText]);

  const pastEvents = useMemo(() => {
    const cutoff = new Date(cutoffDate + 'T23:59:59');
    return events
      .filter(ev => ev.end < cutoff)
      .sort((a, b) =>
        sortDir === 'desc'
          ? b.start.getTime() - a.start.getTime()
          : a.start.getTime() - b.start.getTime()
      );
  }, [events, cutoffDate, sortDir]);

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
        </div>
      </div>

      {/* List */}
      <div className="space-y-2">
        {pastEvents.length === 0 ? (
          <p className="text-gray-500 text-sm py-12 text-center">No past auctions found</p>
        ) : (
          pastEvents.map((ev, i) => {
            const s = SOURCE_STYLES[ev.source] ?? SOURCE_STYLES.fallowremates;
            const multiDay = !isSameDay(ev.start, ev.end);
            return (
              <div key={i} className="flex items-start gap-4 p-4 bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-colors rounded opacity-75 hover:opacity-100">
                <div className="flex-shrink-0 text-center w-14">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wide">
                    {fmtDate(ev.start, { month: 'short' })}
                  </div>
                  <div className="text-2xl font-light text-white leading-tight">{ev.start.getDate()}</div>
                  <div className="text-[10px] text-gray-600">{ev.start.getFullYear()}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${s.pill}`}>{s.label}</span>
                    {multiDay && (
                      <span className="text-[10px] text-gray-500">
                        until {fmtDate(ev.end, { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm text-gray-200 truncate">{ev.name}</h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    {ev.link && (
                      <a href={ev.link} className="text-xs text-blue-400 hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">
                        View Auction →
                      </a>
                    )}
                    {ev.catalog && (
                      <a href={ev.catalog} className="text-xs text-gray-500 hover:text-gray-300 transition-colors" target="_blank" rel="noopener noreferrer">
                        Catalogue
                      </a>
                    )}
                    {ev.prsLink && (
                      <a href={ev.prsLink} className="text-xs text-violet-400 hover:text-violet-300 transition-colors" target="_blank" rel="noopener noreferrer">
                        PRS →
                      </a>
                    )}
                    {ev.conformationLink && (
                      <a href={ev.conformationLink} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors" target="_blank" rel="noopener noreferrer">
                        Conformation →
                      </a>
                    )}
                    {ev.pbrsLink && (
                      <a href={ev.pbrsLink} className="text-xs text-orange-400 hover:text-orange-300 transition-colors" target="_blank" rel="noopener noreferrer">
                        Dams →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
