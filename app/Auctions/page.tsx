'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import AuctionTable from '../components/dams_auctions';
import AuctionTableHorses from '../components/horses_auctions';
import AuctionTablePastAuctions from '../components/past_auctions';
import PlotGenerator from '../components/summary';
import CategoryFilter from '../components/CategoryFilter';

export default function MyPage() {
  const [activeTab, setActiveTab] = useState('reports');
  const [dams, setDams] = useState([]);
  const [horses, setHorses] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const auctionReports = [
    {
      title:"Firmamento Auction Analysis(Sep 2024)",
      url:"https://drive.google.com/file/d/1bcs_Ck1iTGmDDRoKqbdLP3_R9EDt5D5T/view?usp=drive_link",
      category:"reports",
      tags:["firmamento","auction","analysis"],
      criador: "Firmamento"
    }
    // Add more reports as needed
  ];

  const categories = ['all', ...Array.from(new Set(auctionReports.map(report => report.category)))];

  const filteredReports = auctionReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
                {filteredReports.map((report, index) => (
                  <a
                    key={index}
                    href={report.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col px-6 py-4 backdrop-blur-md bg-white/5 border-2 border-white/20 
                             rounded-xl text-gray-100 hover:bg-white/10 hover:border-white/30 
                             transition-all duration-200"
                  >
                    <span className="text-center font-light mb-2">{report.title}</span>
                    <div className="flex flex-wrap gap-2 justify-center">
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
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
//   return (
//     <div className="min-h-screen bg-white">
//       <nav className="border-b">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <Link
//             href="/"
//             className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
//           >
//             ← Back to Dashboard
//           </Link>
//         </div>
//       </nav>

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         <h1 className="text-3xl font-semibold text-gray-900 mb-6">
//           Data from Flask
//         </h1>
//         <DataTable
//           columns={columns}
//           data={data}
//           pagination
//           dense
//           highlightOnHover
//           responsive
//         />
//       </main>
//     </div>
//   );
// }