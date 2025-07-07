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
import { useLocalStorage } from '../components/useLocalStorage';

interface Report {
  id: string;
  title: string;
  url: string;
  category: string;
  tags: string[];
  criador?: string;
}

export default function MyPage() {
  const [activeTab, setActiveTab] = useState('reports');
  const [dams, setDams] = useState([]);
  const [horses, setHorses] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Use local storage for reports
  const [reports, setReports] = useLocalStorage<Report[]>('auctions-reports', [
    {
      id: '1',
      title: "Auction Analysis - Firmamento",
      url: "https://drive.google.com/file/d/1bcs_Ck1iTGmDDRoKqbdLP3_R9EDt5D5T/view?usp=drive_link",
      category: "repo",
      tags: ["auction"]
    },
    {
      id: '2',
      title: "Add-Ons Firmamento",
      url: "https://drive.google.com/file/d/1V-6Op3g4kihyXPOrEqJY-g_BxULXT4YC/view?usp=drive_link",
      category: "reports",
      tags: ["auctions", "firmamento"]
    },
    {
      id:'3',
      title:"Vacación Auction - 06/06/2025",
      url: "https://docs.google.com/spreadsheets/d/1yz-54Y_YGwQL8N5ihptxDi5frRrGVcYz/edit?usp=sharing&ouid=114898536092612537397&rtpof=true&sd=true",
      category:"tables",
      tags:["vacacion", "auction"]
    },
    {
      id:'4',
      title:"Horses Up For Auction - 06/07/2025",
      url:"https://docs.google.com/spreadsheets/d/1qSqZRzUeWLHMyOrbBPBXkwPl5tVCwlur/edit?usp=sharing&ouid=114898536092612537397&rtpof=true&sd=true",
      category:"tables",
      tags:["horses", "auction"]
    }
  ]);

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
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
      <nav className="border-b border-[#233554]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="text-gray-300 hover:text-white transition-colors duration-200 font-sans"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 font-sans">
        {/* Tabs */}
        <div className="border-b border-[#233554]">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}