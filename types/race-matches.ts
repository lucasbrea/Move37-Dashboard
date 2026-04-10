export interface EligibleRace {
  fecha: string;
  dia_label: string;
  race_description: string;
  condicion: string;
  categoria_carrera?: string;
  distancia_mts: number;
  pista: string;
  match_reason: string;
}

export interface HorseMatch {
  studbook_id: string;
  name: string;
  current_analysis: string;
  eligible_races: EligibleRace[];
}
