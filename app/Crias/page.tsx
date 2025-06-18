'use client';

import { useState, useMemo } from 'react';
import CategoryLayout from '../components/CategoryLayout';
import CriadorFilter from '../components/CriadorFilter';
import CategoryFilter from '../components/CategoryFilter';
import AddReportButton from '../components/AddReportButton';
import ReportCard from '../components/ReportCard';
import { useLocalStorage } from '../components/useLocalStorage';

interface Report {
  id: string;
  title: string;
  url: string;
  category: string;
  tags: string[];
}

export default function CriasPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCriadores, setSelectedCriadores] = useState<string[]>([]);
  
  // Use local storage for reports
  const [reports, setReports] = useLocalStorage<Report[]>('crias-reports', [
    {
      id: '1',
      title: "Criador Table",
      url: "https://docs.google.com/spreadsheets/d/131ORjkKEyewcLVQkXC00oMI-gmCZKFcO/edit?usp=drive_link&ouid=114898536092612537397&rtpof=true&sd=true",
      category: "tables",
      tags: ["data", "spreadsheet"]
    },
  ]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set(reports.map(report => report.category));
    return ['all', ...Array.from(uniqueCategories)];
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          report.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
      const matchesCriador = selectedCriadores.length === 0 || 
        selectedCriadores.some(criador => 
          report.tags.some(tag => tag.toLowerCase() === criador.toLowerCase())
        );
      return matchesSearch && matchesCategory && matchesCriador;
    });
  }, [searchQuery, selectedCategory, selectedCriadores, reports]);

  const handleAddReport = (newReport: Omit<Report, 'id'>) => {
    const report: Report = {
      ...newReport,
      id: Date.now().toString()
    };
    setReports([...reports, report]);
  };

  const handleEditReport = (editedReport: Report) => {
    setReports(reports.map(report => 
      report.id === editedReport.id ? editedReport : report
    ));
  };

  const handleDeleteReport = (reportToDelete: Report) => {
    setReports(reports.filter(report => report.id !== reportToDelete.id));
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
          Selección Crías Argentina
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
          <div className="w-full sm:w-48">
            <CriadorFilter onFilterChange={setSelectedCriadores} />
          </div>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onEdit={handleEditReport}
              onDelete={handleDeleteReport}
            />
          ))}
        </div>

        {/* Add Report Button */}
        <AddReportButton onAddReport={handleAddReport} />
      </main>
    </div>
  );
} 