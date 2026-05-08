import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DamRetirementEntry {
  id: string;
  dam_id: string;
  dam_name: string;
  fecha: string;       // ISO date yyyy-mm-dd
  created_at: string;
}

export function useDamRetirements() {
  const [retirements, setRetirements] = useState<DamRetirementEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRetirements = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('dam_retirements')
        .select('*')
        .order('fecha', { ascending: false });
      if (error) throw error;
      setRetirements(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading retirements');
    } finally {
      setLoading(false);
    }
  };

  const retireDam = async (dam_id: string, dam_name: string) => {
    const fecha = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('dam_retirements')
      .insert([{ dam_id, dam_name, fecha }])
      .select();
    if (error) throw error;
    if (data) setRetirements(prev => [data[0], ...prev]);
    return data?.[0];
  };

  const unretireDam = async (dam_id: string) => {
    const { error } = await supabase.from('dam_retirements').delete().eq('dam_id', dam_id);
    if (error) throw error;
    setRetirements(prev => prev.filter(r => r.dam_id !== dam_id));
  };

  const isRetired = (dam_id: string) => retirements.some(r => r.dam_id === dam_id);

  useEffect(() => { fetchRetirements(); }, []);

  return { retirements, loading, error, retireDam, unretireDam, isRetired, refetch: fetchRetirements };
}
