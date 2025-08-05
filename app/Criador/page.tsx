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
      name: 'Performance Reports',
      path: '/Criador/performance-reports',
      description: 'Criador Reports'
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
        
        <h1 className="text-5xl font-light mb-16 tracking-tight">Criador Performance</h1>
        
        {/* Search and Filters */}
        <div className="mb-12 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search criadores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white 
                       placeholder-gray-500 focus:outline-none focus:border-white/20 
                       transition-colors duration-150 text-sm"
            />
          </div>
          <div className="flex gap-4">
            <CriadorFilter onFilterChange={setSelectedCriadores} />
          </div>
        </div>

        {/* Criadores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* General Statistics Card */}
          <div
            onClick={handleGeneralStatsClick}
            className="group p-8 bg-white/5 border border-white/10 hover:bg-white/10 
                     hover:border-white/20 transition-all duration-200 cursor-pointer"
          >
            <div className="mb-4">
              <h2 className="text-2xl font-light text-white mb-2 group-hover:text-yellow-300 transition-colors duration-200">
                General Statistics
              </h2>
              <p className="text-gray-400 text-sm">
                Overview and analytics
              </p>
            </div>
            <div className="text-gray-500 text-xs font-medium tracking-wide">
              VIEW →
            </div>
          </div>

          {/* Individual Criador Cards */}
          {filteredCriadores.map((criador) => (
            <div
              key={criador.name}
              onClick={() => handleCardClick(criador.path)}
              className="group p-8 bg-white/5 border border-white/10 hover:bg-white/10 
                       hover:border-white/20 transition-all duration-200 cursor-pointer"
            >
              <div className="mb-4">
                <h2 className="text-2xl font-light text-white mb-2 group-hover:text-yellow-300 transition-colors duration-200">
                  {criador.name}
                </h2>
                <p className="text-gray-400 text-sm">
                  {criador.description}
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