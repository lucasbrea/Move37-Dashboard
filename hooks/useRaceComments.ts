import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface RaceComment {
  id: string;
  horse_studbook_id: string;
  race_date: string;   // ISO yyyy-mm-dd
  track: string;
  comment: string;
  created_at: string;
}

export function useRaceComments() {
  const [comments, setComments] = useState<RaceComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('race_comments').select('*');
      if (error) throw error;
      setComments(data || []);
    } finally {
      setLoading(false);
    }
  };

  const match = (c: RaceComment, horseId: string, raceDate: string, track: string) =>
    String(c.horse_studbook_id) === String(horseId) && c.race_date === raceDate && c.track === track;

  // Returns the comment text for a given horse + race
  const getComment = (horseId: string, raceDate: string, track: string) =>
    comments.find(c => match(c, horseId, raceDate, track))?.comment ?? '';

  const upsertComment = async (horseId: string, raceDate: string, track: string, comment: string) => {
    const existing = comments.find(c => match(c, horseId, raceDate, track));

    if (existing) {
      if (comment.trim() === '') {
        // Delete if cleared
        await supabase.from('race_comments').delete().eq('id', existing.id);
        setComments(prev => prev.filter(c => c.id !== existing.id));
      } else {
        const { data, error } = await supabase
          .from('race_comments')
          .update({ comment })
          .eq('id', existing.id)
          .select();
        if (error) throw error;
        if (data) setComments(prev => prev.map(c => c.id === existing.id ? data[0] : c));
      }
    } else if (comment.trim() !== '') {
      const { data, error } = await supabase
        .from('race_comments')
        .insert([{ horse_studbook_id: String(horseId), race_date: raceDate, track, comment }])
        .select();
      if (error) throw error;
      if (data) setComments(prev => [...prev, data[0]]);
    }
  };

  useEffect(() => { fetchComments(); }, []);

  return { comments, loading, getComment, upsertComment };
}
