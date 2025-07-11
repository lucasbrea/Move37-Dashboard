'use client';

import { useState, useMemo } from 'react';
import CategoryLayout from '../components/CategoryLayout';
import CategoryFilter from '../components/CategoryFilter';
import AddReportButton from '../components/AddReportButton';
import ReportCard from '../components/ReportCard';
import EditReportModal from '../components/EditReportModal';
import { useReports, Report } from '../../hooks/useReports';

export default function EntrenadorPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Use Supabase for reports
  const { reports, loading, error, addReport, updateReport, deleteReport } = useReports('trainer');

  const categories = useMemo(() => {
    const uniqueCategories = new Set(reports.map(report => report.category));
    return ['all', ...Array.from(uniqueCategories)];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, reports]);

  const handleAddReport = async (newReport: Omit<Report, 'id' | 'created_at' | 'updated_at'> & { location: string }) => {
    try {
      await addReport(newReport);
    } catch (error) {
      console.error('Failed to add report:', error);
    }
  };

  const handleEditReport = async (editedReport: Report) => {
    try {
      await updateReport(editedReport.id, editedReport);
      setIsEditModalOpen(false);
      setEditingReport(null);
    } catch (error) {
      console.error('Failed to update report:', error);
    }
  };

  const handleOpenEditModal = (report: Report) => {
    setEditingReport(report);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingReport(null);
  };

  const handleDeleteReport = async (reportToDelete: Report) => {
    try {
      await deleteReport(reportToDelete.id);
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a192f]">
      {/* Header */}
      <nav className="border-b border-[#233554]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <a 
            href="/"
            className="text-gray-300 hover:text-white transition-colors duration-200"
          >
            ← Back to Dashboard
          </a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <h1 className="text-5xl font-light text-gray-100 mb-12">
          Entrenador
        </h1>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-gray-100 
                       placeholder-gray-400 focus:outline-none focus:border-white/40"
            />
          </div>
          <div className="w-full sm:w-48">
            <CategoryFilter 
              categories={categories}
              selectedCategory={selectedCategory}
              onFilterChange={setSelectedCategory}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-300">Loading reports...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="text-red-300">Error: {error}</div>
          </div>
        )}

        {/* Reports Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteReport}
              />
            ))}
          </div>
        )}

        {/* Add Report Button */}
        {!loading && <AddReportButton onAddReport={handleAddReport} location="trainer" />}

        {/* Edit Report Modal */}
        <EditReportModal
          report={editingReport}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleEditReport}
          location="trainer"
        />
      </main>
    </div>
  );
} 