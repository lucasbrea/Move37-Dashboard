'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import AuctionTable from '../components/dams_auctions';
import AuctionTableHorses from '../components/horses_auctions';
import AuctionTablePastAuctions from '../components/past_auctions';
import PlotGenerator from '../components/summary';
import CategoryFilter from '../components/CategoryFilter';
import AddReportButton from '../components/AddReportButton';
import ReportCard from '../components/ReportCard';
import EditReportModal from '../components/EditReportModal';
import { useReports, Report } from '../../hooks/useReports';

export default function MyPage() {
  const [activeTab, setActiveTab] = useState('reports');
  const [dams, setDams] = useState([]);
  const [horses, setHorses] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Use Supabase for reports
  const { reports, loading, error, addReport, updateReport, deleteReport } = useReports('auction-reports');

  useEffect(() => {
    Promise.all([
      fetch('https://auction-dashboard.onrender.com/api/data/dams').then(res => res.json()),
      fetch('https://auction-dashboard.onrender.com/api/data/horses').then(res => res.json()),
      fetch('https://auction-dashboard.onrender.com/api/data/past_auctions').then(res => res.json())
    ])
    .then(([damsData, horsesData,auctionsData]) => {
      setDams(damsData);
      setHorses(horsesData);
      setAuctions(auctionsData);
    })
    .catch(err => console.error("Fetch error:", err));
  }, []);

  const tabs = [
    { id: 'reports', label: 'Reports' },
    { id: 'dams', label: 'Dams' },
    { id: 'horses', label: 'Horses' },
    { id: 'past', label: 'Past Auctions' },
    { id: 'summary', label: 'Summary' }
  ];

  const categories = ['all', ...Array.from(new Set(reports.map(report => report.category)))];

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
      <nav className="border-b border-[#233554]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors duration-150 text-sm font-medium"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 font-sans">
        {/* Tabs */}
        <div className="border-b border-white/10">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150
                  ${activeTab === tab.id
                    ? 'border-yellow-300 text-yellow-300'
                    : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-400'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'dams' && (
            <div>
              <h2 className="text-2xl font-light text-gray-100 mb-4">Dams up for auction</h2>
              <AuctionTable data={dams} />
            </div>
          )}
          {activeTab === 'horses' && (
            <div>
              <h2 className="text-2xl font-light text-gray-100 mb-4">Horses up for auction</h2>
              <AuctionTableHorses data={horses}/>
            </div>
          )}
          {activeTab === 'past' && (
            <div>
              <h2 className="text-2xl font-light text-gray-100 mb-4">Past Auctions</h2>
              <AuctionTablePastAuctions data={auctions}/>
            </div>
          )}
          {activeTab === 'summary' && (
            <div>
              <h2 className="text-2xl font-light text-gray-100 mb-4">Summary</h2>
              <PlotGenerator/>
            </div>
          )}
          {activeTab === 'reports' && (
            <div>
              <h2 className="text-2xl font-light text-gray-100 mb-4">Auction Reports</h2>
              
              {/* Search and Filter Section */}
              <div className="mb-8 space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
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
                <div className="bg-red-500/10 border border-red-500/20 p-4 mb-6">
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
              {!loading && <AddReportButton onAddReport={handleAddReport} location="auction-reports" />}

              {/* Edit Report Modal */}
              <EditReportModal
                report={editingReport}
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                onSave={handleEditReport}
                location="auction-reports"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}