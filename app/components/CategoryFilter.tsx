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
        className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white 
                 hover:bg-white/10 focus:outline-none focus:border-white/20 
                 transition-colors duration-150 text-sm font-medium flex justify-between items-center"
      >
        <span>Filter by Category</span>
        <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-[#0a192f] border border-white/10">
          <div className="max-h-60 overflow-y-auto">
            {categories.map((category) => (
              <label
                key={category}
                className="flex items-center px-4 py-3 hover:bg-white/10 cursor-pointer 
                         transition-colors duration-150"
              >
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === category}
                  onChange={() => {
                    onFilterChange(category);
                    setIsOpen(false);
                  }}
                  className="mr-3"
                />
                <span className="text-gray-300 text-sm font-medium">
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