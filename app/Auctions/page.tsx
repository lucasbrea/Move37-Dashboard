'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import DataTable, { TableColumn } from 'react-data-table-component';
import AuctionTable from '../components/dams_auctions';
import AuctionTableHorses from '../components/horses_auctions';
import AuctionTablePastAuctions from '../components/past_auctions';

export default function MyPage() {
  const [activeTab, setActiveTab] = useState('current');
  activeTab === 'current' && setActiveTab('dams');
  const [dams, setDams] = useState([]);
  const [horses, setHorses] = useState([]);
  const [auctions, setAuctions] = useState([]);
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
    { id: 'dams', label: 'Dams' },
    { id: 'horses', label: 'Horses' },
    { id: 'past', label: 'Past Auctions' },
    {id:'summary', label: 'Summary'}
  ];

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