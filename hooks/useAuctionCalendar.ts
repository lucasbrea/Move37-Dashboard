import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface AuctionEntry {
  id: string
  name: string
  link: string
  catalog: string
  start_date: string   // YYYY-MM-DD
  end_date: string     // YYYY-MM-DD
  source: string
  prs_link: string
  conformation_link: string
  pbrs_link: string
  created_at?: string
  updated_at?: string
}

export type NewAuctionEntry = Omit<AuctionEntry, 'id' | 'created_at' | 'updated_at'>

export function useAuctionCalendar() {
  const [auctions, setAuctions] = useState<AuctionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAuctions = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('auction_calendar')
        .select('*')
        .order('start_date', { ascending: true })
      if (error) throw error
      setAuctions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions')
    } finally {
      setLoading(false)
    }
  }

  const addAuction = async (entry: NewAuctionEntry) => {
    const { data, error } = await supabase
      .from('auction_calendar')
      .insert([entry])
      .select()
    if (error) throw error
    if (data) setAuctions(prev => [...prev, data[0]].sort((a, b) => a.start_date.localeCompare(b.start_date)))
    return data?.[0]
  }

  const updateAuction = async (id: string, updates: Partial<NewAuctionEntry>) => {
    const { data, error } = await supabase
      .from('auction_calendar')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
    if (error) throw error
    if (data) setAuctions(prev => prev.map(a => a.id === id ? data[0] : a))
    return data?.[0]
  }

  const deleteAuction = async (id: string) => {
    const { error } = await supabase
      .from('auction_calendar')
      .delete()
      .eq('id', id)
    if (error) throw error
    setAuctions(prev => prev.filter(a => a.id !== id))
  }

  useEffect(() => { fetchAuctions() }, [])

  return { auctions, loading, error, addAuction, updateAuction, deleteAuction, refetch: fetchAuctions }
}
