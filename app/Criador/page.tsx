'use client';

import { useState, useMemo } from 'react';
import CategoryLayout from '../components/CategoryLayout';

export default function CriadorPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const externalLinks = [
    {
      title: "Criador Table",
      url: "https://docs.google.com/spreadsheets/d/131ORjkKEyewcLVQkXC00oMI-gmCZKFcO/edit?usp=drive_link&ouid=114898536092612537397&rtpof=true&sd=true",
      category: "tables",
      tags: ["data", "spreadsheet"]
    },
    {
      title: "Firmamento Report",
      url: "https://drive.google.com/file/d/1XPhELxhJy83UCcKbxVFoPjPl-eghul0v/view?usp=drive_link",
      category: "reports",
      tags: ["firmamento", "analysis"]
    },
    {
      title: "Report Firmamento(criador)",
      url: "https://drive.google.com/file/d/1hIe5M42vxqQIFNd8mMoLTcnk3BZp8wss/view?usp=drive_link",
      category: "reports",
      tags: ["firmamento", "criador"]
    },
    {
      title: "Report Firmamento(stud)",
      url: "https://drive.google.com/file/d/10IfAEtpEKAY-a-rT-2DmE2IuiArgl5f0/view?usp=drive_link",
      category: "reports",
      tags: ["firmamento", "stud"]
    },
    {
      title: "Proposal La Pasion",
      url: "https://drive.google.com/file/d/1I7T5c7txWsWIU4baOt8TUrxUs9YFqyxc/view?usp=drive_link",
      category: "proposals",
      tags: ["proposal", "la pasion"]
    },
    {
      title:"Clasico Winners - Firmamento",
      url: "https://docs.google.com/spreadsheets/d/1nPtSaUjvyH9XkR2OaMDG56xJnJn_iUnQ/edit?usp=sharing&ouid=114898536092612537397&rtpof=true&sd=true",
      category: "tables",
      tags:["Firmamento","Clasico"]
    }
  ];

  const categories = useMemo(() => {
    const uniqueCategories = new Set(externalLinks.map(link => link.category));
    return ['all', ...Array.from(uniqueCategories)];
  }, []);

  const filteredLinks = useMemo(() => {
    return externalLinks.filter(link => {
      const matchesSearch = link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          link.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || link.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#0a192f]">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <h1 className="text-5xl font-light text-gray-100 mb-12">
          Criador
        </h1>

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
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-gray-100 
                       focus:outline-none focus:border-white/40"
            >
              {categories.map(category => (
                <option key={category} value={category} className="bg-[#0a192f]">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col px-6 py-4 backdrop-blur-md bg-white/5 border-2 border-white/20 
                       rounded-xl text-gray-100 hover:bg-white/10 hover:border-white/30 
                       transition-all duration-200"
            >
              <span className="text-center font-light mb-2">{link.title}</span>
              <div className="flex flex-wrap gap-2 justify-center">
                {link.tags.map((tag, tagIndex) => (
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
      </main>
    </div>
  );
} 