import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type EstadoType = 'corriendo' | 'lesionado' | 'descanso' | 'retirado';
export type MotivoRetiroType = 'lesion' | 'venta';

export interface TrainingLogEntry {
  id: string;
  horse_studbook_id: string;
  horse_name: string;
  fecha: string;           // ISO date yyyy-mm-dd
  estado: EstadoType;
  cuidador: string | null;
  campo: string | null;    // For 'descanso': field name. For 'retirado': motivo ('lesion' | 'venta')
  comentarios: string | null;
  proximas_carreras: string | null;
  created_at: string;
}

export type NewTrainingLogEntry = Omit<TrainingLogEntry, 'id' | 'created_at'>;

export function useTrainingLog() {
  const [logs, setLogs] = useState<TrainingLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('training_logs')
        .select('*')
        .order('fecha', { ascending: false });
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading logs');
    } finally {
      setLoading(false);
    }
  };

  const addLog = async (entry: NewTrainingLogEntry) => {
    const { data, error } = await supabase
      .from('training_logs')
      .insert([entry])
      .select();
    if (error) throw error;
    if (data) setLogs(prev => [data[0], ...prev]);
    return data?.[0];
  };

  const updateLog = async (id: string, updates: Partial<Omit<TrainingLogEntry, 'id' | 'created_at'>>) => {
    const { data, error } = await supabase
      .from('training_logs')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data) setLogs(prev => prev.map(l => l.id === id ? { ...l, ...data[0] } : l));
    return data?.[0];
  };

  const deleteLog = async (id: string) => {
    const { error } = await supabase.from('training_logs').delete().eq('id', id);
    if (error) throw error;
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  useEffect(() => { fetchLogs(); }, []);

  return { logs, loading, error, addLog, updateLog, deleteLog, refetch: fetchLogs };
}
