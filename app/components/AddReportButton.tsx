'use client';

import { useState } from 'react';

interface Report {
  title: string;
  url: string;
  category: string;
  criador?: string;
}

interface AddReportButtonProps {
  onAddReport: (report: Omit<Report, 'id' | 'created_at' | 'updated_at'> & { location: string }) => void;
  criador?: string; // Optional criador for criador-specific pages
  location: string; // Required location for the page
}

export default function AddReportButton({ onAddReport, criador, location }: AddReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: '',
    criador: criador || ''
  });

  const categories = ['reports', 'tables', 'analysis', 'proposals', 'auctions'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const report: Omit<Report, 'id' | 'created_at' | 'updated_at'> & { location: string } = {
      title: formData.title,
      url: formData.url,
      category: formData.category,
      criador: formData.criador || undefined,
      location: location
    };

    onAddReport(report);
    setIsOpen(false);
    setFormData({
      title: '',
      url: '',
      category: '',
      criador: criador || ''
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setFormData({
      title: '',
      url: '',
      category: '',
      criador: criador || ''
    });
  };

  return (
    <>
      {/* Add Report Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full 
                 flex items-center justify-center transition-all duration-200 hover:scale-105 z-50
                 border border-white/20 backdrop-blur-sm"
        title="Add Report"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a192f] border border-white/20 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Add New Report</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white 
                           placeholder-gray-400 focus:outline-none focus:border-white/40"
                  placeholder="Enter report title"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white 
                           placeholder-gray-400 focus:outline-none focus:border-white/40"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Category *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white 
                           focus:outline-none focus:border-white/40"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {!criador && (
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Criador
                  </label>
                  <input
                    type="text"
                    value={formData.criador}
                    onChange={(e) => setFormData({ ...formData, criador: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white 
                             placeholder-gray-400 focus:outline-none focus:border-white/40"
                    placeholder="Enter criador name (optional)"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg 
                           transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg 
                           transition-colors duration-200"
                >
                  Add Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 