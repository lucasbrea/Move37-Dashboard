'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AddReportButton from '../../components/AddReportButton';
import ReportCard from '../../components/ReportCard';
import { useLocalStorage } from '../../components/useLocalStorage';

interface Report {
  id: string;
  title: string;
  url: string;
  category: string;
  tags: string[];
  criador?: string;
}

export default function FirmamentoPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useLocalStorage<Report[]>('firmamento-reports', [
    {
      id: '1',
      title: "Tracking PRS 2022 - Gran Muñeca",
      url: "https://docs.google.com/spreadsheets/d/1lGF2QVITIEYjnzPBSc_P3t673vWZePTH/edit?usp=drive_link&ouid=114898536092612537397&rtpof=true&sd=true",
      category: "tables",
      tags: ["prs", "gran muneca"]
    },
    {
      id: '2',
      title: "Tracking PRS 2023 - Gran Muñeca",
      url: "https://docs.google.com/spreadsheets/d/1Ozyy9_duTKs2ZR8_5kgTmSxHYo37xTIx/edit?usp=drive_link&ouid=114898536092612537397&rtpof=true&sd=true",
      category: "tables",
      tags: ["gran muneca", "prs"]
    },
    {
      id: '3',
      title: "Criador Report - Gran Muñeca",
      url: "https://drive.google.com/file/d/1JcVedR7m-BnrOsoxQ-aCOXqb6KOyK1XE/view?usp=drive_link",
      category: "reports",
      tags: ["firmamento", "analysis"]
    },
    {
      id: '4',
      title: "PRS - Family Data - Gran Muñeca - 2022",
      url: "https://docs.google.com/spreadsheets/d/1vyeo5R6zDA8Ya00qP65Z_PcdQnLGQWTM/edit?usp=drive_link&ouid=114898536092612537397&rtpof=true&sd=true",
      category: "tables",
      tags: ["gran muñeca"]
    },
    {
      id: '5',
      title: "PRS - Family Data - Gran Muñeca - 2023",
      url: "https://docs.google.com/spreadsheets/d/1La1Jr909eIMUXwiWnfocV91Uew3N8z7Z/edit?usp=drive_link&ouid=114898536092612537397&rtpof=true&sd=true",
      category: "tables",
      tags: ["gran muñeca"]
    },
    {
      id: '6',
      title: "Stake Winners - Gran Muñeca",
      url: "https://docs.google.com/spreadsheets/d/1vDmTqyt6kjUwY83oSr0DEZGxe1TOKBHofaXLIz0C7DQ/edit?usp=drive_link",
      category: "tables",
      tags: ["gran muñeca"]
    },
  
  ]);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleAddReport = (newReport: Omit<Report, 'id'>) => {
    const report: Report = {
      ...newReport,
      id: Date.now().toString(),
      criador: 'Firmamento'
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
    <div className="min-h-screen bg-[#0a192f] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-300 hover:text-white transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Criadores
          </button>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-bold mb-8">Gran Muñeca</h1>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-gray-100 
                     placeholder-gray-400 focus:outline-none focus:border-white/40"
          />
        </div>

        {/* Documents Grid */}
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
        <AddReportButton onAddReport={handleAddReport} criador="Firmamento" />
      </div>
    </div>
  );
} 