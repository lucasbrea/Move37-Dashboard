import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface CriaCommentEntry {
  id: string;
  horse_id: string;
  horse_name: string;
  fecha: string;       // ISO date yyyy-mm-dd
  comentarios: string;
  created_at: string;
}

export type NewCriaCommentEntry = Omit<CriaCommentEntry, 'id' | 'created_at'>;

export function useCriaComments() {
  const [comments, setComments] = useState<CriaCommentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('cria_comments')
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

  const addComment = async (entry: NewCriaCommentEntry) => {
    const { data, error } = await supabase
      .from('cria_comments')
      .insert([entry])
      .select();
    if (error) throw error;
    if (data) setComments(prev => [data[0], ...prev]);
    return data?.[0];
  };

  const updateComment = async (id: string, comentarios: string) => {
    const { data, error } = await supabase
      .from('cria_comments')
      .update({ comentarios })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (data) setComments(prev => prev.map(c => c.id === id ? { ...c, ...data[0] } : c));
    return data?.[0];
  };

  const deleteComment = async (id: string) => {
    const { error } = await supabase.from('cria_comments').delete().eq('id', id);
    if (error) throw error;
    setComments(prev => prev.filter(c => c.id !== id));
  };

  useEffect(() => { fetchComments(); }, []);

  return { comments, loading, error, addComment, updateComment, deleteComment, refetch: fetchComments };
}
