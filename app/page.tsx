'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

const allLinks = [
  // Padrillo
  {
    title: 'Padrillos Table - CB',
    url: 'https://docs.google.com/spreadsheets/d/1UgWSZ4W2axebW6bOiqMLKWLCVlHP7VkW/edit?usp=drive_link',
    category: 'Padrillo',
    tags: ['data', 'spreadsheet'],
  },
  {
    title: 'Envidienme - Profile',
    url: 'https://drive.google.com/file/d/1k72dGx4w32kruH1uSLl6Y_naH-_JXy3A/view?usp=drive_link',
    category: 'Padrillo',
    tags: ['envidienme', 'profile'],
  },
  {
    title: 'Past Auctions Table',
    url: 'https://docs.google.com/spreadsheets/d/1BLXQ1t2lgHsptAADF8xueVqb4Zkm0pkV3X6tbeYllyw/edit?usp=drive_link',
    category: 'Padrillo',
    tags: ['auctions', 'history'],
  },
  // Criador
  {
    title: 'Criador Table',
    url: 'https://docs.google.com/spreadsheets/d/131ORjkKEyewcLVQkXC00oMI-gmCZKFcO/edit?usp=drive_link&ouid=114898536092612537397&rtpof=true&sd=true',
    category: 'Criador',
    tags: ['data', 'spreadsheet'],
  },
  {
    title: 'Firmamento Report',
    url: 'https://drive.google.com/file/d/1XPhELxhJy83UCcKbxVFoPjPl-eghul0v/view?usp=drive_link',
    category: 'Criador',
    tags: ['firmamento', 'analysis'],
  },
  {
    title: 'Report Firmamento(criador)',
    url: 'https://drive.google.com/file/d/1hIe5M42vxqQIFNd8mMoLTcnk3BZp8wss/view?usp=drive_link',
    category: 'Criador',
    tags: ['firmamento', 'criador'],
  },
  {
    title: 'Report Firmamento(stud)',
    url: 'https://drive.google.com/file/d/10IfAEtpEKAY-a-rT-2DmE2IuiArgl5f0/view?usp=drive_link',
    category: 'Criador',
    tags: ['firmamento', 'stud'],
  },
  {
    title: 'Proposal La Pasion',
    url: 'https://drive.google.com/file/d/1I7T5c7txWsWIU4baOt8TUrxUs9YFqyxc/view?usp=drive_link',
    category: 'Criador',
    tags: ['proposal', 'la pasion'],
  },
  {
    title: 'Clasico Winners - Firmamento',
    url: 'https://docs.google.com/spreadsheets/d/1nPtSaUjvyH9XkR2OaMDG56xJnJn_iUnQ/edit?usp=sharing&ouid=114898536092612537397&rtpof=true&sd=true',
    category: 'Criador',
    tags: ['Firmamento', 'Clasico'],
  },
  // Entrenador
  {
    title: 'Report Frenkel',
    url: 'https://drive.google.com/file/d/1MJ8IKVKJK2Ea4jA1615Z7BMW1CmQvG6k/view?usp=drive_link',
    category: 'Entrenador',
    tags: ['frenkel', 'analysis'],
  },
  // Jockey
  {
    title: 'Report Gonzalo D. Borda',
    url: 'https://drive.google.com/file/d/1tYF3isWs8y61tewyZRZa67-u3-5uHWYP/view?usp=drive_link',
    category: 'Jockey',
    tags: ['gonzalo', 'borda', 'analysis'],
  },
  // Dams
  {
    title: 'Spreadsheet de Padrillos',
    url: 'https://docs.google.com/spreadsheets/d/1UgWSZ4W2axebW6bOiqMLKWLCVlHP7VkW/edit?usp=drive_link',
    category: 'Dams',
    tags: ['data', 'spreadsheet', 'padrillos'],
  },
  {
    title: 'Dams Up for Auction',
    url: 'https://docs.google.com/spreadsheets/d/14s20DVU6yj5ShNVu8Y4ybqLIsXzhIQjf/edit?usp=drive_link&ouid=114898536092612537397&rtpof=true&sd=true',
    category: 'Dams',
    tags: ['auctions', 'dams'],
  },
  // Crias
  {
    title: 'Spreadsheet de Padrillos',
    url: 'https://docs.google.com/spreadsheets/d/1UgWSZ4W2axebW6bOiqMLKWLCVlHP7VkW/edit?usp=drive_link',
    category: 'Crías',
    tags: ['data', 'spreadsheet', 'padrillos'],
  },
];

const categories = [
  { 
    name: 'Padrillo', 
    image: '/horse_sire_dashbaord.jpg', 
    path: '/Padrillo',
    description: ''
  },
  { name: 'Criador',
    image: '/criador_dashboard.jpg',
    path: '/Criador',
    description: ''
  },
  { name: 'Jockey',
    image: 'horse_jockey_dashboard.jpg', 
    path: '/Jockey',
    description: ''
  },
  { name: 'Entrenador', 
    image: '/trainer_dashboard.jpg', 
    path: '/Entrenador',
    description: ''
  },
  { name: 'Crías', 
    image: '/foals_dashboard.jpg', 
    path: '/Crias',
    description: ''
  },
  { name: 'Dams', 
    image: '/dam_dashboard.jpg', 
    path: '/Dams',
    description: ''
  },
  {
    name:'Auctions',
    image: '/horse_auction.jpg',
    path:'/Auctions',
    description: ''
  }
];

export default function HomePage() {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  const filteredLinks = useMemo(() => {
    if (!search) return null;
    return allLinks.filter(link =>
      link.title.toLowerCase().includes(search.toLowerCase()) ||
      link.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search]);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(search.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-[#0a192f] flex flex-col">
      {/* Logo Header */}
      <header className="w-full flex items-center px-8 py-6">
        <img  
          src="/Move 37 Logo.svg"
          alt="Move37AI Logo"
          className="h-10 w-auto"
          style={{ maxWidth: 200 }}
        />
      </header>
      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl font-bold font-sans text-center mb-8 text-white tracking-tight">
          Move37 Dashboard
        </h1>
        {/* Global Search Bar */}
        <div className="w-full flex justify-center mb-10 font-sans">
          <input
            type="text"
            placeholder="Search files, links, or categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-xl px-5 py-3 rounded-lg bg-white/5 border border-white/20 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-white/40 shadow-md"
          />
        </div>
        {/* Cards Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 font-sans">
          {/* If searching, show files/links. Otherwise, show categories. */}
          {search && filteredLinks && filteredLinks.length > 0 ? (
            filteredLinks.map((link, idx) => (
              <a
                key={link.url + idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col justify-between p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-200 cursor-pointer group min-h-[140px]"
              >
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1 group-hover:text-yellow-300 transition-colors duration-200">
                    {link.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {link.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 text-xs rounded-full bg-white/10 text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{link.category}</span>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-yellow-300 transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
              </a>
            ))
          ) : !search ? (
            categories.map((category) => (
              <div
                key={category.name}
                className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/10 transition-all duration-200 cursor-pointer group min-h-[140px]"
                onClick={() => handleCardClick(category.path)}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="rounded-xl object-cover w-20 h-20 bg-[#1a233a] border border-white/10 shadow-sm"
                />
                <div className="flex-1">
                  <h2 className="text-2xl text-white mb-1 group-hover:text-yellow-300 transition-colors duration-200">
                    {category.name}
                  </h2>
                  <p className="text-gray-300 text-base font-light">
                    {category.description}
                  </p>
                </div>
                <svg className="w-7 h-7 text-gray-400 group-hover:text-yellow-300 transition-colors duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-12 col-span-full">No results found.</div>
          )}
        </div>
      </main>
    </div>
  );
} 