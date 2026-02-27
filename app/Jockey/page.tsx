'use client';

import { useState, useMemo } from 'react';
import CategoryFilter from '../components/CategoryFilter';
import AddReportButton from '../components/AddReportButton';
import ReportCard from '../components/ReportCard';
import EditReportModal from '../components/EditReportModal';
import { useReports, Report } from '../../hooks/useReports';
import JockeyAnalytics from './JockeyAnalytics';

type ActiveTab = 'reports' | 'analytics';

export default function JockeyPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Use Supabase for reports
  const { reports, loading, error, addReport, updateReport, deleteReport } = useReports('jockey');

  const categories = useMemo(() => {
    const uniqueCategories = new Set(reports.map(report => report.category));
    return ['all', ...Array.from(uniqueCategories)];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;

      if (startDate || endDate) {
        const reportDate = new Date(report.created_at || '');
        const matchesStartDate = !startDate || reportDate >= new Date(startDate);
        const matchesEndDate = !endDate || reportDate <= new Date(endDate);
        return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate;
      }

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, startDate, endDate, reports]);

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Title */}
        <h1 className="text-5xl font-light text-gray-100 mb-8">Jockey</h1>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-8 border-b border-white/10 pb-0">
          {(['reports', 'analytics'] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-sm font-medium capitalize transition-colors duration-150 border-b-2 -mb-px ${
                activeTab === tab
                  ? 'text-white border-blue-500'
                  : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >
              {tab === 'analytics' ? 'Analytics' : 'Reports'}
            </button>
          ))}
        </div>

        {/* ── Analytics Tab ── */}
        {activeTab === 'analytics' && <JockeyAnalytics />}

        {/* ── Reports Tab ── */}
        {activeTab === 'reports' && (
          <>
            {/* Search and Filter Section */}
            <div className="mb-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
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

              {/* Date Range Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 sm:flex-none sm:w-48">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-gray-100
                             focus:outline-none focus:border-white/40 [&::-webkit-calendar-picker-indicator]:invert"
                    placeholder="Start Date"
                  />
                </div>
                <div className="flex-1 sm:flex-none sm:w-48">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-gray-100
                             focus:outline-none focus:border-white/40 [&::-webkit-calendar-picker-indicator]:invert"
                    placeholder="End Date"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20
                             transition-colors duration-200"
                  >
                    Clear Dates
                  </button>
                )}
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
            {!loading && (
              <AddReportButton onAddReport={handleAddReport} location="jockey" />
            )}

            {/* Edit Report Modal */}
            <EditReportModal
              report={editingReport}
              isOpen={isEditModalOpen}
              onClose={handleCloseEditModal}
              onSave={handleEditReport}
              location="jockey"
            />
          </>
        )}
      </main>
    </div>
  );
}
