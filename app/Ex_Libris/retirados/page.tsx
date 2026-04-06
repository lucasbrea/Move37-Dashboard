'use client';

import AddReportButton from '../../components/AddReportButton';
import ReportCard from '../../components/ReportCard';
import EditReportModal from '../../components/EditReportModal';
import { useReports, Report } from '../../../hooks/useReports';
import { useState } from 'react';

export default function RetiradosPage() {
  const { reports, loading, addReport, updateReport, deleteReport } = useReports('ex-libris-retirados');
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleAddReport = async (newReport: Omit<Report, 'id' | 'created_at' | 'updated_at'> & { location: string }) => {
    try { await addReport(newReport); } catch (e) { console.error(e); }
  };

  const handleEditReport = async (edited: Report) => {
    try {
      await updateReport(edited.id, edited);
      setIsEditModalOpen(false);
      setEditingReport(null);
    } catch (e) { console.error(e); }
  };

  const handleDeleteReport = async (report: Report) => {
    try { await deleteReport(report.id); } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <nav className="mb-12 flex items-center gap-3 text-sm text-gray-400">
          <a href="/" className="hover:text-white transition-colors duration-150">Dashboard</a>
          <span>/</span>
          <a href="/Ex_Libris" className="hover:text-white transition-colors duration-150">Ex Libris</a>
          <span>/</span>
          <span className="text-white">Retirados</span>
        </nav>

        <div className="flex items-center justify-between mb-12">
          <h1 className="text-4xl font-light tracking-tight">Retirados</h1>
          <AddReportButton
            onAdd={handleAddReport}
            location="ex-libris-retirados"
          />
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="text-gray-500 text-sm">No reports yet. Add the first one.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onEdit={() => { setEditingReport(report); setIsEditModalOpen(true); }}
                onDelete={() => handleDeleteReport(report)}
              />
            ))}
          </div>
        )}

        {isEditModalOpen && editingReport && (
          <EditReportModal
            report={editingReport}
            onSave={handleEditReport}
            onClose={() => { setIsEditModalOpen(false); setEditingReport(null); }}
          />
        )}
      </div>
    </div>
  );
}
