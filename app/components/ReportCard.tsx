'use client';

import { useState } from 'react';

interface Report {
  id: string;
  title: string;
  url: string;
  category: string;
  tags: string[];
  criador?: string;
}

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

  return (
    <div className="relative group">
      <a
        href={report.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col p-6 backdrop-blur-md bg-white/5 border border-white/10 
                 rounded-xl text-gray-100 hover:bg-white/10 hover:border-white/20 
                 transition-all duration-200"
      >
        <span className="text-lg font-medium mb-2">{report.title}</span>
        <div className="flex flex-wrap gap-2 mt-auto">
          {report.tags.map((tag, tagIndex) => (
            <span
              key={tagIndex}
              className="px-2 py-1 text-xs rounded-full bg-white/10 text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </a>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => setShowActions(!showActions)}
          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center 
                   text-gray-300 hover:text-white transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {showActions && (
          <div className="absolute right-0 top-10 bg-[#0a192f] border border-white/20 rounded-lg shadow-lg py-2 min-w-[120px] z-10">
            <button
              onClick={handleEdit}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/10 
                       flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-white/10 
                       flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 