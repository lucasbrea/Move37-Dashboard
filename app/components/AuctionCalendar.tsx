'use client';

import { useState, useEffect, useMemo } from 'react';

interface AuctionEvent {
  name: string;
  link: string;
  catalog: string;
  start: Date;
  end: Date;
  source: string;
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
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

    if (!name || !start || !end) continue;

    // Deduplicate on name + start string
    const key = `${name}|${cols[3].trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Drop events whose end date is before today
    const endDay = new Date(end);
    endDay.setHours(23, 59, 59, 999);
    if (endDay < today) continue;

    events.push({
      name,
      link:    resolveUrl(link, source),
      catalog: resolveUrl(catalog, source),
      start,
      end,
      source,
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

function inRange(date: Date, start: Date, end: Date) {
  const d = new Date(date); d.setHours(12, 0, 0, 0);
  const s = new Date(start); s.setHours(0,  0, 0, 0);
  const e = new Date(end);   e.setHours(23, 59, 59, 0);
  return d >= s && d <= e;
}

function fmtDate(date: Date, opts: Intl.DateTimeFormatOptions) {
  return date.toLocaleDateString('en-GB', opts);
}

// ─── Event pill ──────────────────────────────────────────────────────────────

function EventPill({ event, onClick, active }: { event: AuctionEvent; onClick: () => void; active: boolean }) {
  const s = SOURCE_STYLES[event.source] ?? SOURCE_STYLES.fallowremates;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] leading-tight truncate border transition-opacity ${s.pill} ${active ? 'ring-1 ring-white/40' : 'hover:opacity-80'}`}
    >
      {event.name}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AuctionCalendar() {
  const [csvText, setCsvText]           = useState('');
  const [view, setView]                 = useState<'calendar' | 'list'>('calendar');
  const [selectedEvent, setSelectedEvent] = useState<AuctionEvent | null>(null);

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());
  const [displayYear,  setDisplayYear]  = useState(today.getFullYear());

  useEffect(() => {
    fetch('/data/auctions_calendar.csv')
      .then(r => r.text())
      .then(setCsvText)
      .catch(() => setCsvText(''));
  }, []);

  const events = useMemo(() => parseCSV(csvText), [csvText]);

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const daysInMonth    = new Date(displayYear, displayMonth + 1, 0).getDate();
  const firstDayOffset = (new Date(displayYear, displayMonth, 1).getDay() + 6) % 7; // Mon=0
  const totalCells     = Math.ceil((firstDayOffset + daysInMonth) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstDayOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    return new Date(displayYear, displayMonth, dayNum, 12, 0, 0);
  });

  const eventsOnDay = (date: Date) =>
    events.filter(e => inRange(date, e.start, e.end));

  const prevMonth = () => {
    if (displayMonth === 0) { setDisplayMonth(11); setDisplayYear(y => y - 1); }
    else setDisplayMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (displayMonth === 11) { setDisplayMonth(0); setDisplayYear(y => y + 1); }
    else setDisplayMonth(m => m + 1);
  };

  const toggleEvent = (ev: AuctionEvent) =>
    setSelectedEvent(prev => (prev === ev ? null : ev));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Top bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-light text-gray-100">Auction Calendar</h2>
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
          {/* View toggle */}
          <div className="flex border border-white/10 rounded overflow-hidden">
            {(['calendar', 'list'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs capitalize transition-colors ${view === v ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Calendar view ── */}
      {view === 'calendar' && (
        <div>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-lg">‹</button>
            <h3 className="text-base font-light text-white tracking-wide">{MONTHS[displayMonth]} {displayYear}</h3>
            <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-lg">›</button>
          </div>

          {/* Grid */}
          <div className="border border-white/10 rounded overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.03]">
              {DAYS.map(d => (
                <div key={d} className="py-2 text-center text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7">
              {cells.map((date, i) => {
                if (!date) {
                  return <div key={i} className="bg-white/[0.01] border-b border-r border-white/[0.05] h-28" />;
                }
                const dayEvents = eventsOnDay(date);
                const isToday   = isSameDay(date, today);
                const isPast    = date < today && !isToday;

                return (
                  <div
                    key={i}
                    className={`border-b border-r border-white/[0.05] h-28 p-1.5 flex flex-col transition-colors ${
                      isPast ? 'opacity-35' : isToday ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Day number */}
                    <span className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0 ${
                      isToday ? 'bg-yellow-300 text-black font-semibold' : 'text-gray-400'
                    }`}>
                      {date.getDate()}
                    </span>

                    {/* Events */}
                    <div className="flex-1 space-y-0.5 overflow-hidden min-h-0">
                      {dayEvents.slice(0, 3).map((ev, j) => (
                        <EventPill
                          key={j}
                          event={ev}
                          onClick={() => toggleEvent(ev)}
                          active={selectedEvent === ev}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-gray-600 pl-1">+{dayEvents.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected event detail */}
          {selectedEvent && (
            <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${SOURCE_STYLES[selectedEvent.source]?.pill}`}>
                    {SOURCE_STYLES[selectedEvent.source]?.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {fmtDate(selectedEvent.start, { day: 'numeric', month: 'long', year: 'numeric' })}
                    {!isSameDay(selectedEvent.start, selectedEvent.end) &&
                      ` – ${fmtDate(selectedEvent.end, { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-white mb-2">{selectedEvent.name}</h4>
                <div className="flex items-center gap-4">
                  {selectedEvent.link && (
                    <a href={selectedEvent.link} className="text-xs text-blue-400 hover:text-blue-300 transition-colors" target="_blank" rel="noopener noreferrer">
                      View Auction →
                    </a>
                  )}
                  {selectedEvent.catalog && (
                    <a href={selectedEvent.catalog} className="text-xs text-gray-400 hover:text-gray-200 transition-colors" target="_blank" rel="noopener noreferrer">
                      Download Catalogue
                    </a>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-600 hover:text-gray-300 text-xl leading-none flex-shrink-0">×</button>
            </div>
          )}
        </div>
      )}

      {/* ── List view ── */}
      {view === 'list' && (
        <div className="space-y-2">
          {events.length === 0 ? (
            <p className="text-gray-500 text-sm py-12 text-center">No upcoming auctions</p>
          ) : (
            events.map((ev, i) => {
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
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
