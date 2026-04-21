import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface DamCommentEntry {
  id: string;
  dam_id: string;
  dam_name: string;
  fecha: string;       // ISO date yyyy-mm-dd
  comentarios: string;
  created_at: string;
}

export type NewDamCommentEntry = Omit<DamCommentEntry, 'id' | 'created_at'>;

export function useDamComments() {
  const [comments, setComments] = useState<DamCommentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('dam_comments')
        .select('*')
        .order('fecha', { ascending: false });
      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading comments');
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (entry: NewDamCommentEntry) => {
    const { data, error } = await supabase
      .from('dam_comments')
      .insert([entry])
      .select();
    if (error) throw error;
    if (data) setComments(prev => [data[0], ...prev]);
    return data?.[0];
  };

  const updateComment = async (id: string, comentarios: string) => {
    const { data, error } = await supabase
      .from('dam_comments')
      .update({ comentarios })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data) setComments(prev => prev.map(c => c.id === id ? { ...c, ...data[0] } : c));
    return data?.[0];
  };

  const deleteComment = async (id: string) => {
    const { error } = await supabase.from('dam_comments').delete().eq('id', id);
    if (error) throw error;
    setComments(prev => prev.filter(c => c.id !== id));
  };

  useEffect(() => { fetchComments(); }, []);

  return { comments, loading, error, addComment, updateComment, deleteComment, refetch: fetchComments };
}
