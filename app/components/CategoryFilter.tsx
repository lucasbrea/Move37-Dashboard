import React, { useState } from 'react';

interface CategoryFilterProps {
  categories: string[];
  onFilterChange: (selectedCategory: string) => void;
  selectedCategory: string;
}

export default function CategoryFilter({ categories, onFilterChange, selectedCategory }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-gray-100 
                 hover:bg-white/10 focus:outline-none focus:border-white/40 flex justify-between items-center"
      >
        <span>Filter by Category</span>
        <span className="ml-2">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-[#0a192f] border border-white/20 rounded-lg shadow-lg">
          <div className="max-h-60 overflow-y-auto">
            {categories.map((category) => (
              <label
                key={category}
                className="flex items-center px-4 py-2 hover:bg-white/10 cursor-pointer"
              >
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === category}
                  onChange={() => {
                    onFilterChange(category);
                    setIsOpen(false);
                  }}
                  className="mr-2"
                />
                <span className="text-gray-300">
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 