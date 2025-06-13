'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ExternalLink {
  title: string;
  url: string;
  category: string;
  tags: string[];
}

export default function FirmamentoPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const externalLinks: ExternalLink[] = [
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
      title: "Criador Report - Firmamento",
      url: "https://drive.google.com/file/d/1paVDsYxXHp6LNKoGPIXLiLcP-v4EpJ7j/view?usp=drive_link",
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
      title: "Clasico Winners - Firmamento",
      url: "https://docs.google.com/spreadsheets/d/1nPtSaUjvyH9XkR2OaMDG56xJnJn_iUnQ/edit?usp=sharing&ouid=114898536092612537397&rtpof=true&sd=true",
      category: "tables",
      tags: ["Firmamento", "Clasico"]
    },
    {
      title: "Add-Ons Firmamento",
      url: "https://drive.google.com/file/d/1V-6Op3g4kihyXPOrEqJY-g_BxULXT4YC/view?usp=drive_link",
      category: "reports",
      tags: ["firmamento", "auctions"]
    }
  ];

  const filteredLinks = externalLinks.filter(link => {
    const matchesSearch = link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         link.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const categories = ['all', ...Array.from(new Set(externalLinks.map(link => link.category)))];

  return (
    <div className="min-h-screen bg-[#0a192f] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-300 hover:text-white transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Criadores
          </button>
        </div>

        {/* Criador Info */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Firmamento</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4">Overview</h2>
              <p className="text-gray-300">
                Firmamento is one of the leading criadores in the industry, known for their exceptional breeding program and successful auction results.
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4">Key Statistics</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total Auctions</span>
                  <span className="text-white">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Average Price</span>
                  <span className="text-white">$45,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Success Rate</span>
                  <span className="text-white">92%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/20 text-gray-100 
                     placeholder-gray-400 focus:outline-none focus:border-white/40"
          />
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col p-6 backdrop-blur-md bg-white/5 border border-white/10 
                       rounded-xl text-gray-100 hover:bg-white/10 hover:border-white/20 
                       transition-all duration-200"
            >
              <span className="text-lg font-medium mb-2">{link.title}</span>
              <div className="flex flex-wrap gap-2 mt-auto">
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
      </div>
    </div>
  );
} 