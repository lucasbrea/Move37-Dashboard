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
        className="fixed bottom-8 right-8 w-14 h-14 bg-white/10 hover:bg-white/20 text-white 
                 flex items-center justify-center transition-all duration-150 hover:scale-105 z-50
                 border border-white/20"
        title="Add Report"
      >
        <span className="text-xl font-light">+</span>
      </button>

      {/* Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a192f] border border-white/10 p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-light text-white">Add New Report</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors duration-150"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white 
                           placeholder-gray-500 focus:outline-none focus:border-white/20 
                           transition-colors duration-150 text-sm"
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white 
                           placeholder-gray-500 focus:outline-none focus:border-white/20 
                           transition-colors duration-150 text-sm"
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
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white 
                           focus:outline-none focus:border-white/20 transition-colors duration-150 text-sm"
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
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white 
                             placeholder-gray-500 focus:outline-none focus:border-white/20 
                             transition-colors duration-150 text-sm"
                    placeholder="Enter criador name (optional)"
                  />
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 
                           hover:border-white/20 transition-all duration-150 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white 
                           transition-all duration-150 text-sm font-medium"
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