import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { HorseMatch } from '../../../types/race-matches';
import calendarData from '../../../public/data/palermo_mayo_2026_calendario.json';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface HorseInput {
  studbook_id: string;
  name: string;
  races: Array<{
    race_date: string;
    categoria: string;
    cond: string | null;
    surface: string;
    distance: number;
    p: number | null;
  }>;
}

function compressCalendar(calendar: Record<string, unknown>) {
  const cal = calendar as {
    calendario: {
      jornadas: Array<{
        fecha: string;
        dia_label: string;
        carreras_perdedores: Array<{ sexo: string; edad: string; distancia_mts: number; pista: string }>;
        carreras_ganadores: Array<{ sexo: string; edad: string; categoria_carrera: string; distancia_mts: number; pista: string }>;
        clasicos_especiales_handicaps: Array<{ nombre: string; grado: string; condicion: string; distancia_mts: number; pista: string }>;
      }>;
    };
  };

  return cal.calendario.jornadas.map(j => ({
    fecha: j.fecha,
    dia: j.dia_label,
    perdedores: j.carreras_perdedores.map(r => ({ sexo: r.sexo, edad: r.edad, dist: r.distancia_mts, pista: r.pista })),
    ganadores: j.carreras_ganadores.map(r => ({ sexo: r.sexo, edad: r.edad, cat: r.categoria_carrera, dist: r.distancia_mts, pista: r.pista })),
    clasicos: j.clasicos_especiales_handicaps?.map(r => ({ nombre: r.nombre, grado: r.grado, cond: r.condicion, dist: r.distancia_mts, pista: r.pista })) ?? [],
  }));
}

const TOOL: Anthropic.Tool = {
  name: 'match_races',
  description: 'Return eligible May 2026 races for each horse in training',
  input_schema: {
    type: 'object' as const,
    properties: {
      horses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            studbook_id: { type: 'string' },
            name: { type: 'string' },
            current_analysis: { type: 'string', description: 'Sex, age in May 2026, eligibility class' },
            eligible_races: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  fecha: { type: 'string' },
                  dia_label: { type: 'string' },
                  race_description: { type: 'string' },
                  condicion: { type: 'string' },
                  categoria_carrera: { type: 'string' },
                  distancia_mts: { type: 'number' },
                  pista: { type: 'string' },
                  match_reason: { type: 'string' },
                },
                required: ['fecha', 'dia_label', 'race_description', 'condicion', 'distancia_mts', 'pista'],
              },
            },
          },
          required: ['studbook_id', 'name', 'current_analysis', 'eligible_races'],
        },
      },
    },
    required: ['horses'],
  },
};

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const { horses }: { horses: HorseInput[] } = await req.json();

  const calendar = compressCalendar(calendarData as Parameters<typeof compressCalendar>[0]);

  const compressedHorses = horses.map(h => ({
    studbook_id: String(h.studbook_id),
    name: h.name,
    races: [...h.races]
      .sort((a, b) => (a.race_date > b.race_date ? -1 : 1))
      .slice(0, 4)
      .map(r => ({ date: r.race_date, cond: r.cond, dist: r.distance, pos: r.p })),
  }));

  const prompt = `You are an expert in Argentine horse racing (turf argentino). Current date: May 2026.

## Cond code reference (most recent race = current eligibility)
- Sex prefix: "h"=todo caballo (open/any sex), "y"=yegua only
- Age number = age at race time (infer current age from race date)
- Condition suffix: "p"=perdedor, "g1"=ganador cat1, "g2"=ganador cat2, "g3"=ganador cat3, "g2/3"=cat2or3, "g"=open ganador
- Examples: h3ap=3yo open perdedor, h4ag1=4yo ganador-cat1, h5a+g2/3=5+yo ganador cat2or3

## Calendar – Palermo May 2026
"todo caballo" races accept all sexes. Ganador cat "1"=won 1, "2"=won 2, "1-2"=won 1 or 2.

${JSON.stringify(calendar, null, 1)}

## Horses
${JSON.stringify(compressedHorses, null, 1)}

For each horse: infer sex, infer current age in May 2026, determine eligibility, call match_races. Keep current_analysis under 10 words. Keep race_description under 25 chars. Omit match_reason.`;

  let message;
  try {
    message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8096,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'match_races' },
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : JSON.stringify(err);
    console.error('[race-matches] Claude error:', detail);
    return NextResponse.json({ error: detail }, { status: 502 });
  }

  const toolUse = message.content.find(b => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    console.error('[race-matches] No tool_use block. Content:', JSON.stringify(message.content));
    return NextResponse.json({ error: 'No tool_use block in response' }, { status: 502 });
  }

  console.log('[race-matches] stop_reason:', message.stop_reason);
  console.log('[race-matches] tool input preview:', JSON.stringify(toolUse.input).slice(0, 300));

  if (message.stop_reason === 'max_tokens') {
    return NextResponse.json({ error: 'Response truncated (max_tokens). Try again.' }, { status: 502 });
  }

  const input = toolUse.input as { horses?: HorseMatch[] } | HorseMatch[];
  const matchedHorses: HorseMatch[] = Array.isArray(input)
    ? input
    : (input as { horses?: HorseMatch[] }).horses ?? [];

  return NextResponse.json({ horses: matchedHorses });
}
