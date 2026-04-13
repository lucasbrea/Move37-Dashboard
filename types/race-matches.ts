export interface EligibleRace {
  fecha: string;
  dia_label: string;
  race_description: string;
  condicion: string;
  categoria_carrera?: string;
  distancia_mts: number;
  pista: string;
  group?: string | null;
  match_reason: string;
  // Popup detail fields
  name?: string | null;
  section?: string;
  conditions?: string | null;
  categoria_raw?: string;
  wins_range?: string | null;
  // Filter fields
  track?: string;
  month?: string;
  week?: string;
}

export interface HorseMatch {
  studbook_id: string;
  name: string;
  current_analysis: string;
  eligible_races: EligibleRace[];
}
