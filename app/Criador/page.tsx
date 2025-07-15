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
        
        <h1 className="text-5xl font-light mb-16 tracking-tight">Criadores</h1>
        
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

          {/* Delivered PRS Card */}
          <div
            onClick={handleDeliveredPRSClick}
            className="group p-8 bg-white/5 border border-white/10 hover:bg-white/10 
                     hover:border-white/20 transition-all duration-200 cursor-pointer"
          >
            <div className="mb-4">
              <h2 className="text-2xl font-light text-white mb-2 group-hover:text-yellow-300 transition-colors duration-200">
                Delivered PRS
              </h2>
              <p className="text-gray-400 text-sm">
                Delivered PRS Reports
              </p>
            </div>
            <div className="text-gray-500 text-xs font-medium tracking-wide">
              VIEW →
            </div>
          </div>

          {/* Backtesting STK Wnrs Card */}
          <div
            onClick={handleBacktestingSTKWnrsClick}
            className="group p-8 bg-white/5 border border-white/10 hover:bg-white/10 
                     hover:border-white/20 transition-all duration-200 cursor-pointer"
          >
            <div className="mb-4">
              <h2 className="text-2xl font-light text-white mb-2 group-hover:text-yellow-300 transition-colors duration-200">
                Backtesting STK Wnrs
              </h2>
              <p className="text-gray-400 text-sm">
                Backtesting STK Winners Reports
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