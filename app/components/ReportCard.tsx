'use client';

import { useState } from 'react';

import { Report } from '../../hooks/useReports';

interface ReportCardProps {
  report: Report;
  onEdit: (report: Report) => void;
  onDelete: (report: Report) => void;
}

export default function ReportCard({ report, onEdit, onDelete }: ReportCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleEdit = () => {
    onEdit(report);
    setShowActions(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this report?')) {
      onDelete(report);
    }
    setShowActions(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="relative group bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-all duration-150">
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={() => setShowActions(!showActions)}
          className="w-8 h-8 bg-white/10 hover:bg-white/20 flex items-center justify-center 
                   text-gray-300 hover:text-white transition-all duration-150"
        >
          <span className="text-sm font-light">⋯</span>
        </button>

        {showActions && (
          <div className="absolute right-0 top-10 bg-[#0a192f] border border-white/10 py-2 min-w-[120px] z-10">
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 
                       transition-colors duration-150"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 
                       transition-colors duration-150"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Report Content */}
      <div className="pr-12">
        <h3 className="text-lg font-light text-white mb-3 group-hover:text-yellow-300 transition-colors duration-150">
          {report.title}
        </h3>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-white/10 text-xs font-medium text-gray-300">
            {report.category}
          </span>
          {report.criador && (
            <span className="px-3 py-1 bg-blue-500/20 text-xs font-medium text-blue-300">
              {report.criador}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <a
            href={report.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors duration-150 text-sm font-medium"
          >
            View Report →
          </a>
          
          {report.updated_at && (
            <span className="text-gray-500 text-xs font-medium">
              Updated {formatDate(report.updated_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 