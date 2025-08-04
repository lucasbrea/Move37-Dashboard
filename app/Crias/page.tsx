'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CategoryLayout from '../components/CategoryLayout';
import CriadorFilter from '../components/CriadorFilter';
import CategoryFilter from '../components/CategoryFilter';
import AddReportButton from '../components/AddReportButton';
import ReportCard from '../components/ReportCard';
import EditReportModal from '../components/EditReportModal';
import { useReports, Report } from '../../hooks/useReports';

export default function CriasPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCriadores, setSelectedCriadores] = useState<string[]>([]);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  
  // Use Supabase for reports
  const { reports, loading, error, addReport, updateReport, deleteReport } = useReports('crias-backtesting');

  const sections = [
    { id: 'backtesting', label: 'Backtesting', description: '' },
    { id: 'stk-winners-updates', label: 'STK Winners Updates', description: ' ' },
    { id: 'prs-delivered', label: 'PRS Delivered', description: ' ' },
    { id: 'prs-camada', label: 'PRS Camada', description: ' ' }
  ];

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

  const handleSectionClick = (sectionId: string) => {
    router.push(`/Crias/${sectionId}`);
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <nav className="mb-12">
          <a 
            href="/"
            className="text-gray-400 hover:text-white transition-colors duration-150 text-sm font-medium"
          >
            ← Dashboard
          </a>
        </nav>
        
        <h1 className="text-5xl font-light mb-16 tracking-tight">Selección Crías Argentina</h1>
        
        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((section) => (
            <div
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              className="group p-8 bg-white/5 border border-white/10 hover:bg-white/10 
                       hover:border-white/20 transition-all duration-200 cursor-pointer"
            >
              <div className="mb-4">
                <h2 className="text-2xl font-light text-white mb-2 group-hover:text-yellow-300 transition-colors duration-200">
                  {section.label}
                </h2>
                <p className="text-gray-400 text-sm">
                  {section.description}
                </p>
              </div>
              <div className="text-gray-500 text-xs font-medium tracking-wide">
                VIEW →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 