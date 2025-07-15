import React, { useState } from 'react';

interface CriadorFilterProps {
  onFilterChange: (selectedCriadores: string[]) => void;
}

const criadores = [
  'El Paraiso',
  'Firmamento',
  'La Pasion',
  'Abolengo',
  'Vacacion',
  'Santa Ines',
  'Haras Gran Muñeca',
  'Santa Maria de Araras',
  'El Alfalfar',
  'Triple Alliance S.A.',
  'Juan Antonio',
  'Masama',
  'La Providencia',
  'Carampangue',
  'Pozo de Luna'
];

export default function CriadorFilter({ onFilterChange }: CriadorFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCriadores, setSelectedCriadores] = useState<string[]>(criadores);

  const handleSelectAll = () => {
    setSelectedCriadores(criadores);
    onFilterChange(criadores);
  };

  const handleDeselectAll = () => {
    setSelectedCriadores([]);
    onFilterChange([]);
  };

  const handleCriadorToggle = (criador: string) => {
    const newSelection = selectedCriadores.includes(criador)
      ? selectedCriadores.filter(c => c !== criador)
      : [...selectedCriadores, criador];
    
    setSelectedCriadores(newSelection);
    onFilterChange(newSelection);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white 
                 hover:bg-white/10 focus:outline-none focus:border-white/20 
                 transition-colors duration-150 text-sm font-medium flex justify-between items-center"
      >
        <span>Filter by Criador</span>
        <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-[#0a192f] border border-white/10">
          <div className="p-3 border-b border-white/10">
            <button
              onClick={handleSelectAll}
              className="w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/10 
                       transition-colors duration-150 font-medium"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/10 
                       transition-colors duration-150 font-medium mt-2"
            >
              Deselect All
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {criadores.map((criador) => (
              <label
                key={criador}
                className="flex items-center px-4 py-3 hover:bg-white/10 cursor-pointer 
                         transition-colors duration-150"
              >
                <input
                  type="checkbox"
                  checked={selectedCriadores.includes(criador)}
                  onChange={() => handleCriadorToggle(criador)}
                  className="mr-3"
                />
                <span className="text-gray-300 text-sm font-medium">{criador}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 