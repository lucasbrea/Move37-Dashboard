'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import CriadorFilter from '../components/CriadorFilter';

export default function CriadorPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCriadores, setSelectedCriadores] = useState<string[]>([]);
  const router = useRouter();

  const criadores = [
    { 
      name: 'El Paraiso',
      path: '/Criador/el-paraiso',
      description: 'El Paraiso Criador Profile'
    },
    { 
      name: 'Firmamento',
      path: '/Criador/firmamento',
      description: 'Firmamento Criador Profile'
    },
    { 
      name: 'La Pasion',
      path: '/Criador/la-pasion',
      description: 'La Pasion Criador Profile'
    },
    { 
      name: 'Abolengo',
      path: '/Criador/abolengo',
      description: 'Abolengo Criador Profile'
    },
    { 
      name: 'Vacacion',
      path: '/Criador/vacacion',
      description: 'Vacacion Criador Profile'
    },
    { 
      name: 'Santa Ines',
      path: '/Criador/santa-ines',
      description: 'Santa Ines Criador Profile'
    },
    { 
      name: 'Haras Gran Muñeca',
      path: '/Criador/gran-muneca',
      description: 'Haras Gran Muñeca Criador Profile'
    },
    { 
      name: 'Santa Maria de Araras',
      path: '/Criador/santa-maria-araras',
      description: 'Santa Maria de Araras Criador Profile'
    },
    { 
      name: 'El Alfalfar',
      path: '/Criador/el-alfalfar',
      description: 'El Alfalfar Criador Profile'
    },
    { 
      name: 'Triple Alliance S.A.',
      path: '/Criador/triple-alliance',
      description: 'Triple Alliance S.A. Criador Profile'
    },
    { 
      name: 'Pozo de Luna',
      path: '/Criador/pozo-luna',
      description: 'Pozo de Luna Criador Profile'
    },
    { 
      name: 'San Benito',
      path: '/Criador/san-benito',
      description: 'San Benito Criador Profile'
    },
    {   
      name: 'La Nora',
      path: '/Criador/la-nora',
      description: 'La Nora Criador Profile'
    },
    { 
      name: 'La Providencia',
      path: '/Criador/la_providencia',
      description: 'La Providencia Criador Profile'
    },
  ];

  const filteredCriadores = useMemo(() => {
    return criadores.filter(criador => {
      const matchesSearch = criador.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          criador.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCriador = selectedCriadores.length === 0 || 
        selectedCriadores.includes(criador.name);
      return matchesSearch && matchesCriador;
    });
  }, [searchQuery, selectedCriadores]);

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  const handleGeneralStatsClick = () => {
    router.push('/Criador/general-statistics');
  };

  const handleDeliveredPRSClick = () => {
    router.push('/Criador/Delivered_PRS');
  };

  const handleBacktestingSTKWnrsClick = () => {
    router.push('/Criador/Backtesting_STK_Wnrs');
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-white p-8">
      <div className="max-w-7xl mx-auto">
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
        <h1 className="text-4xl font-bold mb-8">Criadores</h1>
        
        {/* Search and Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search criadores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-gray-100 
                       placeholder-gray-400 focus:outline-none focus:border-white/40"
            />
          </div>
          <div className="flex gap-4">
            <CriadorFilter onFilterChange={setSelectedCriadores} />
          </div>
        </div>

        {/* Criadores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* General Statistics Card */}
          <div
            onClick={handleGeneralStatsClick}
            className="flex items-center gap-6 p-6 backdrop-blur-md bg-white/5 border border-white/10 
                     rounded-xl text-gray-100 hover:bg-white/10 hover:border-white/20 
                     transition-all duration-200 cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-xl bg-[#1a233a] border border-white/10 shadow-sm flex items-center justify-center">
              <svg className="w-10 h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl text-white mb-1 group-hover:text-yellow-300 transition-colors duration-200">
                General Statistics
              </h2>
        
            </div>
            <svg className="w-7 h-7 text-gray-400 group-hover:text-yellow-300 transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Delivered PRS Card */}
          <div
            onClick={handleDeliveredPRSClick}
            className="flex items-center gap-6 p-6 backdrop-blur-md bg-white/5 border border-white/10 
                     rounded-xl text-gray-100 hover:bg-white/10 hover:border-white/20 
                     transition-all duration-200 cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-xl bg-[#1a233a] border border-white/10 shadow-sm flex items-center justify-center">
              <svg className="w-10 h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl text-white mb-1 group-hover:text-yellow-300 transition-colors duration-200">
                Delivered PRS
              </h2>
              <p className="text-gray-300 text-base font-light">
                Delivered PRS Reports
              </p>
            </div>
            <svg className="w-7 h-7 text-gray-400 group-hover:text-yellow-300 transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Backtesting STK Wnrs Card */}
          <div
            onClick={handleBacktestingSTKWnrsClick}
            className="flex items-center gap-6 p-6 backdrop-blur-md bg-white/5 border border-white/10 
                     rounded-xl text-gray-100 hover:bg-white/10 hover:border-white/20 
                     transition-all duration-200 cursor-pointer group"
          >
            <div className="w-20 h-20 rounded-xl bg-[#1a233a] border border-white/10 shadow-sm flex items-center justify-center">
              <svg className="w-10 h-10 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl text-white mb-1 group-hover:text-yellow-300 transition-colors duration-200">
                Backtesting STK Wnrs
              </h2>
            </div>
            <svg className="w-7 h-7 text-gray-400 group-hover:text-yellow-300 transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Individual Criador Cards */}
          {filteredCriadores.map((criador) => (
            <div
              key={criador.name}
              onClick={() => handleCardClick(criador.path)}
              className="flex items-center gap-6 p-6 backdrop-blur-md bg-white/5 border border-white/10 
                       rounded-xl text-gray-100 hover:bg-white/10 hover:border-white/20 
                       transition-all duration-200 cursor-pointer group"
            >
              <div className="w-20 h-20 rounded-xl bg-[#1a233a] border border-white/10 shadow-sm flex items-center justify-center">
                <span className="text-2xl text-white/60">{criador.name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl text-white mb-1 group-hover:text-yellow-300 transition-colors duration-200">
                  {criador.name}
                </h2>
                <p className="text-gray-300 text-base font-light">
                  {criador.description}
                </p>
              </div>
              <svg className="w-7 h-7 text-gray-400 group-hover:text-yellow-300 transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 