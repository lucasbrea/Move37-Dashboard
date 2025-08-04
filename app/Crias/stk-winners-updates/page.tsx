'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CategoryLayout from '../../components/CategoryLayout';
import CriadorFilter from '../../components/CriadorFilter';
import CategoryFilter from '../../components/CategoryFilter';
import AddReportButton from '../../components/AddReportButton';
import ReportCard from '../../components/ReportCard';
import EditReportModal from '../../components/EditReportModal';
import { useReports, Report } from '../../../hooks/useReports';

export default function STKWinnersUpdatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCriadores, setSelectedCriadores] = useState<string[]>([]);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  
  // Use Supabase for reports
  const { reports, loading, error, addReport, updateReport, deleteReport } = useReports('crias-stk-winners-updates');

  const categories = useMemo(() => {
    const uniqueCategories = new Set(reports.map(report => report.category));
    return ['all', ...Array.from(uniqueCategories)];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
      const matchesCriador = selectedCriadores.length === 0 || 
        (report.criador && selectedCriadores.some(criador => 
          criador.toLowerCase() === report.criador?.toLowerCase()
        ));
      return matchesSearch && matchesCategory && matchesCriador;
    });
  }, [searchQuery, selectedCategory, selectedCriadores, reports]);

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
    <div className="min-h-screen bg-[#0a192f] text-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <nav className="mb-12">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition-colors duration-150 text-sm font-medium"
          >
            ← Back to Crias
          </button>
        </nav>

        <h1 className="text-5xl font-light mb-16 tracking-tight">STK Winners Updates</h1>

        {/* Search and Filter Section */}
        <div className="mb-12 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by title or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white 
                       placeholder-gray-500 focus:outline-none focus:border-white/20 
                       transition-colors duration-150 text-sm"
            />
          </div>
          <div className="w-full md:w-48">
            <CategoryFilter 
              categories={categories}
              selectedCategory={selectedCategory}
              onFilterChange={setSelectedCategory}
            />
          </div>
          <div className="w-full md:w-48">
            <CriadorFilter onFilterChange={setSelectedCriadores} />
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
          <div className="bg-red-500/10 border border-red-500/20 p-4 mb-6">
            <div className="text-red-300">Error: {error}</div>
          </div>
        )}

        {/* Reports Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
        {!loading && <AddReportButton onAddReport={handleAddReport} location="crias-stk-winners-updates" />}

        {/* Edit Report Modal */}
        <EditReportModal
          report={editingReport}
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleEditReport}
          location="crias-stk-winners-updates"
        />
      </div>
    </div>
  );
} 