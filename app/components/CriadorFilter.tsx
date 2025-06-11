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
        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-gray-100 
                 hover:bg-white/10 focus:outline-none focus:border-white/40 flex justify-between items-center"
      >
        <span>Filter by Criador</span>
        <span className="ml-2">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-[#0a192f] border border-white/20 rounded-lg shadow-lg">
          <div className="p-2 border-b border-white/20">
            <button
              onClick={handleSelectAll}
              className="w-full px-2 py-1 text-sm text-gray-300 hover:bg-white/10 rounded"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="w-full px-2 py-1 text-sm text-gray-300 hover:bg-white/10 rounded mt-1"
            >
              Deselect All
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {criadores.map((criador) => (
              <label
                key={criador}
                className="flex items-center px-4 py-2 hover:bg-white/10 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedCriadores.includes(criador)}
                  onChange={() => handleCriadorToggle(criador)}
                  className="mr-2"
                />
                <span className="text-gray-300">{criador}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 