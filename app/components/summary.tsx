'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function PlotFromPrompt() {
  const [prompt, setPrompt] = useState('');
  const [plotData, setPlotData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPlot = async () => {
    setError('');
    setLoading(true);
    setPlotData(null);

    try {
      const res = await fetch('https://auction-dashboard.onrender.com/api/ai-plot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();

      if (res.ok) {
        setPlotData(JSON.parse(data.plot));
      } else {
        setError(data.error || 'Error generating plot.');
      }
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
      <div className="flex-1">
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-400 mb-1">
          Describe your chart
        </label>
        <input
          id="prompt"
          type="text"
          className="w-full rounded-xl border text-gray-800 border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="e.g. show average price by breeder over time"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
        />
      </div>
  
      <button
        onClick={fetchPlot}
        disabled={loading}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-md hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 transition-all"
      >
        {loading ? 'Generating…' : 'Generate Plot'}
      </button>
    </div>
  
    {loading && (
      <div className="flex justify-center items-center mt-4">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )}
  
    {error && <div className="text-red-500">{error}</div>}
  
    {plotData && !loading && (
      <Plot
        data={plotData.data}
        layout={plotData.layout}
        style={{ width: '100%', height: '500px' }}
      />
    )}
  </div>
  );
}