'use client';

import { useState, useMemo } from 'react';
import CategoryLayout from '../components/CategoryLayout';
import CriadorFilter from '../components/CriadorFilter';
import CategoryFilter from '../components/CategoryFilter';

export default function CriadorPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCriadores, setSelectedCriadores] = useState<string[]>([]);

  const externalLinks = [
    {
      title: "Criador Table",
      url: "https://docs.google.com/spreadsheets/d/131ORjkKEyewcLVQkXC00oMI-gmCZKFcO/edit?usp=drive_link&ouid=114898536092612537397&rtpof=true&sd=true",
      category: "tables",
      tags: ["data", "spreadsheet"],
      criador: "Firmamento"
    },
    {
      title: "Firmamento Report",
      url: "https://drive.google.com/file/d/1XPhELxhJy83UCcKbxVFoPjPl-eghul0v/view?usp=drive_link",
      category: "reports",
      tags: ["firmamento", "analysis"],
      criador: "Firmamento"
    },
    {
      title: "Report Firmamento(criador)",
      url: "https://drive.google.com/file/d/1hIe5M42vxqQIFNd8mMoLTcnk3BZp8wss/view?usp=drive_link",
      category: "reports",
      tags: ["firmamento", "criador"],
      criador: "Firmamento"
    },
    {
      title: "Report Firmamento(stud)",
      url: "https://drive.google.com/file/d/10IfAEtpEKAY-a-rT-2DmE2IuiArgl5f0/view?usp=drive_link",
      category: "reports",
      tags: ["firmamento", "stud"],
      criador: "Firmamento"
    },
    {
      title: "Proposal La Pasion",
      url: "https://drive.google.com/file/d/1I7T5c7txWsWIU4baOt8TUrxUs9YFqyxc/view?usp=drive_link",
      category: "proposals",
      tags: ["proposal", "la pasion"],
      criador: "La Pasion"
    },
    {
      title:"Clasico Winners - Firmamento",
      url: "https://docs.google.com/spreadsheets/d/1nPtSaUjvyH9XkR2OaMDG56xJnJn_iUnQ/edit?usp=sharing&ouid=114898536092612537397&rtpof=true&sd=true",
      category: "tables",
      tags:["Firmamento","Clasico"],
      criador: "Firmamento"
    },
    {
      title:"Add-Ons Firmamento",
      url:"https://drive.google.com/file/d/1V-6Op3g4kihyXPOrEqJY-g_BxULXT4YC/view?usp=drive_link",
      category:"reports",
      tags:["firmamento","auctions"],
      criador: "Firmamento"
    },
    {
      title:"Criador Report - Gran Muñeca",
      url: "https://drive.google.com/file/d/1Co17XCKtkWcWVglZeYFZIbb6l_1VBL_1/view?usp=drive_link",
      category:"reports",
      tags:["gran muñeca","criador"],
      criador: "Gran Muñeca"
    },
    {
      title:"Criador Report - Abolengo",
      url:"https://drive.google.com/file/d/1TxWgkTH2S5HBlyLcK2hYl87zvu8ArY6M/view?usp=drive_link",
      category:"reports",
      tags:["abolengo","criador"],
      criador: "Abolengo"
    },
    {
      title:"Criador Report - La Pasion",
      url:"https://drive.google.com/file/d/1LB6qJMnQ6af6LhYVbN69AcJF3aMl0vOY/view?usp=drive_link",  
      category:"reports",
      tags:["la pasion","criador"],
      criador: "La Pasion"
    },
    {
      title:"Criador Report - El Alfalfar",
      url:"https://drive.google.com/file/d/1JsYHKyHTUOI6PaZ8-PuUeFbD17GyAm75/view?usp=drive_link",
      category:"reports",
      tags:["el alfalfar","criador"],
      criador: "El Alfalfar"
    },
    {
      title:"Criador Report - El Paraiso",
      url:"https://drive.google.com/file/d/1h8d7s4v2Yb0p9H5Qk6e3b7x9Xj8fXk7L/view?usp=drive_link",
      category:"reports",
      tags:["el paraiso","criador"],
      criador: "El Paraiso"
    },
    {
      title:"Criador Report - La Biznaga",
      url:"https://drive.google.com/file/d/1EVTyCbQf52aNlLHTZ_YGlDhv9oQnD8Yq/view?usp=drive_link",
      category:"reports",
      tags:["la biznaga","criador"],
      criador: "La Biznaga"
    },
    {
      title:"Criador Report - La Nora",
      url:"https://drive.google.com/file/d/1bA-Lc-PTuNbsfsuD12KAGG0vtj2aY2XZ/view?usp=drive_link",
      category:"reports",
      tags:["la nora","criador"],
      criador: "La Nora"
    },
    {
      title:"Criador Report - La Providencia",
      url:"https://drive.google.com/file/d/1LB6qJMnQ6af6LhYVbN69AcJF3aMl0vOY/view?usp=drive_link",
      category:"reports",
      tags:["la providencia","criador"],
      criador: "La Providencia"
    },
    {
      title:"Criador Report - La Quebrada",
      url:"https://drive.google.com/file/d/1AsfB0kWNJezxtNwMqf0Of0doSlcoQ6K1/view?usp=drive_link",
      category:"reports",
      tags:["la quebrada","criador"],
      criador: "La Quebrada"
    },
    {
      title:"Criador Report - Santa Ines",
      url:"https://drive.google.com/file/d/1_4pNhoL8qCEbMl0zYddrPRmXVMM_nHP5/view?usp=drive_link",
      category:"reports",
      tags:["santa ines","criador"],
      criador: "Santa Ines"
    },
    {
      title:"Criador Report - Santa Maria de Araras",
      url:"https://drive.google.com/file/d/1C42Ow3UFHdOxE3ZkDtnxUxH_SrPR8Aji/view?usp=drive_link",
      category:"reports",
      tags:["santa maria de araras","criador"],
      criador: "Santa Maria de Araras"
    },
    {
      title:"Criador Report - Vacacion",
      url:"https://drive.google.com/file/d/10QXGNl6pFlrGtPz3SkZhmzbh26_de2DB/view?usp=drive_link",
      category:"reports",
      tags:["vacacion","criador"],
      criador: "Vacacion"
    },
    {
      title:"Criador Report - Triple Alliance S.A.",
      url:"https://drive.google.com/file/d/1bfGK4tZpzNkOTXcLbNrTgnpjMwbaPztB/view?usp=drive_link",
      category:"reports",
      tags:["triple alliance s.a.","criador"],
      criador: "Triple Alliance S.A."
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
      const matchesCriador = selectedCriadores.length === 0 || 
        selectedCriadores.some(criador => 
          link.tags.some(tag => tag.toLowerCase() === criador.toLowerCase())
        );
      return matchesSearch && matchesCategory && matchesCriador;
    });
  }, [searchQuery, selectedCategory, selectedCriadores]);

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
            <CategoryFilter 
              categories={categories}
              selectedCategory={selectedCategory}
              onFilterChange={setSelectedCategory}
            />
          </div>
          <div className="w-full sm:w-48">
            <CriadorFilter onFilterChange={setSelectedCriadores} />
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