import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Report {
  id: string
  title: string
  url: string
  category: string
  location: string
  criador?: string
  created_at?: string
  updated_at?: string
}

export function useReports(location?: string, criador?: string) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch reports from Supabase
  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('Reports')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters if provided
      if (location) {
        query = query.eq('location', location)
      }
      if (criador) {
        query = query.eq('criador', criador)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setReports(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Add a new report
  const addReport = async (report: Omit<Report, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('Reports')
        .insert([report])
        .select()

      if (error) {
        throw error
      }

      if (data) {
        setReports(prev => [data[0], ...prev])
      }

      return data?.[0]
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add report')
      throw err
    }
  }

  // Update a report
  const updateReport = async (id: string, updates: Partial<Report>) => {
    try {
      const { data, error } = await supabase
        .from('Reports')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) {
        throw error
      }

      if (data) {
        setReports(prev => prev.map(report => 
          report.id === id ? data[0] : report
        ))
      }

      return data?.[0]
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report')
      throw err
    }
  }

  // Delete a report
  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('Reports')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      setReports(prev => prev.filter(report => report.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report')
      throw err
    }
  }

  // Fetch reports on mount and when filters change
  useEffect(() => {
    fetchReports()
  }, [location, criador])

  return {
    reports,
    loading,
    error,
    addReport,
    updateReport,
    deleteReport,
    refetch: fetchReports
  }
} 