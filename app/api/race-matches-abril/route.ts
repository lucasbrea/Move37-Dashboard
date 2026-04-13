import { NextRequest, NextResponse } from 'next/server';
import masterData from '../../../public/data/master_calendar_2026.json';
import type { EligibleRace } from '../../../types/race-matches';

// ── Calendar types ────────────────────────────────────────────────────────────

interface RaceCategory {
  sex: string;    // "yeguas" | "machos" | "all"
  age_min: number;
  age_max: number | null;
  raw: string;
}

interface MasterRace {
  id: number;
  date: string;
  date_label: string;
  section: string;
  race_type: string;
  category?: RaceCategory;
  distance: number;
  surface: string;
  name?: string;
  eligible?: string;
  group?: string;
  conditions?: string;
  wins_min?: number;
  wins_max?: number | null;
  age_note?: string;
  track: string;
  month: string;
}

// ── Horse input ───────────────────────────────────────────────────────────────

interface HorseInput {
  studbook_id: string;
  name: string;
  age: number;
  sex_cat: string;   // "Hembra" | "Macho"
  total_win: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sexMatches(sex_cat: string, race_sex: string): boolean {
  if (race_sex === 'all') return true;
  if (race_sex === 'yeguas' && sex_cat === 'Hembra') return true;
  if (race_sex === 'machos' && sex_cat === 'Macho') return true;
  return false;
}

function ageInRange(age: number, age_min: number, age_max: number | null, age_note?: string): boolean {
  let eff_max = age_max;
  if (age_note === '4y5' && eff_max !== null) eff_max = eff_max + 1;
  if (age < age_min) return false;
  if (eff_max !== null && age > eff_max) return false;
  return true;
}

/** Parse "Yeguas 3+", "T.Caballo 4+", "T.Caballo 3+ Perdedores" etc. */
function parseEligible(eligible: string): {
  sex: string; age_min: number; losers_only: boolean; conditions?: string;
} | null {
  const m = eligible.match(/^(T\.Caballo|Yeguas|Machos)\s+(\d+)\+/i);
  if (!m) return null;
  const tag = m[1].toLowerCase();
  const sex = tag === 'yeguas' ? 'yeguas' : tag === 'machos' ? 'machos' : 'all';
  return {
    sex,
    age_min: parseInt(m[2], 10),
    losers_only: /perdedor/i.test(eligible),
    conditions: /P\.P\.E\./i.test(eligible) ? 'P.P.E.' : undefined,
  };
}

/** ISO week start (Monday) as YYYY-MM-DD */
function weekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

// ── Matching ──────────────────────────────────────────────────────────────────

const RACES = (masterData as { races: MasterRace[] }).races;

function matchHorse(horse: HorseInput): EligibleRace[] {
  const wins = horse.total_win ?? 0;
  const result: EligibleRace[] = [];

  for (const race of RACES) {
    let matched = false;
    let section: 'PERDEDORES' | 'GANADORES' | 'CLASICOS' | undefined;
    let wins_range: string | undefined;
    let categoria_raw: string | undefined;
    let conditions: string | undefined;

    if (race.section === 'PERDEDORES') {
      if (wins !== 0 || !race.category) continue;
      if (!sexMatches(horse.sex_cat, race.category.sex)) continue;
      if (!ageInRange(horse.age, race.category.age_min, race.category.age_max, race.age_note)) continue;
      matched = true;
      section = 'PERDEDORES';
      categoria_raw = race.category.raw;

    } else if (race.section === 'GANADORES') {
      if (wins === 0 || !race.category) continue;
      if (!sexMatches(horse.sex_cat, race.category.sex)) continue;
      if (!ageInRange(horse.age, race.category.age_min, race.category.age_max)) continue;
      if (race.wins_min != null && wins < race.wins_min) continue;
      if (race.wins_max != null && wins > race.wins_max) continue;
      matched = true;
      section = 'GANADORES';
      categoria_raw = race.category.raw;
      wins_range = race.wins_min != null
        ? `${race.wins_min}–${race.wins_max != null ? race.wins_max : '+'}G`
        : undefined;

    } else if (race.section === 'CLASICOS_ESPECIALES_HANDICAPS') {
      if (!race.eligible) continue;
      const parsed = parseEligible(race.eligible);
      if (!parsed) continue;
      if (!sexMatches(horse.sex_cat, parsed.sex)) continue;
      if (horse.age < parsed.age_min) continue;
      if (parsed.losers_only && wins !== 0) continue;
      matched = true;
      section = 'CLASICOS';
      categoria_raw = race.eligible;
      conditions = race.conditions ?? parsed.conditions;
    }

    if (!matched || !section) continue;

    const namePart = race.name ?? null;
    const desc = [namePart ?? `${race.distance}m`, namePart ? `${race.distance}m` : null, race.group]
      .filter(Boolean).join(' ');

    result.push({
      fecha: race.date,
      dia_label: race.date_label,
      race_description: desc,
      condicion: section === 'PERDEDORES' ? 'Perdedor'
        : section === 'GANADORES' ? (wins_range ?? 'Ganador')
        : race.race_type,
      distancia_mts: race.distance,
      pista: race.surface,
      group: race.group ?? null,
      match_reason: categoria_raw ?? '',
      name: namePart,
      section,
      conditions: conditions ?? null,
      categoria_raw,
      wins_range: wins_range ?? null,
      track: race.track,
      month: race.month,
      week: weekStart(race.date),
    });
  }

  return result;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { horses }: { horses: HorseInput[] } = await req.json();

  const results = horses.map(horse => ({
    studbook_id: horse.studbook_id,
    name: horse.name,
    current_analysis: `${horse.sex_cat}, ${horse.age}a, ${horse.total_win ?? 0}G`,
    eligible_races: matchHorse(horse),
  }));

  return NextResponse.json({ horses: results });
}
