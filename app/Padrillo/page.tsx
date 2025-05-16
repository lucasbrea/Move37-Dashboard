'use client';

import CategoryLayout from '../components/CategoryLayout';

export default function PadrilloPage() {
  const externalLinks = [
    {
      title: "Padrillos Table - CB",
      url: "https://docs.google.com/spreadsheets/d/1UgWSZ4W2axebW6bOiqMLKWLCVlHP7VkW/edit?usp=drive_link"
    },
    {
      title:"Envidienme - Profile",
      url:"https://drive.google.com/file/d/1k72dGx4w32kruH1uSLl6Y_naH-_JXy3A/view?usp=drive_link"
    },
    {
      title:"Past Auctions Table",
      url: "https://docs.google.com/spreadsheets/d/13tjcOk3hUZAMk65gZk_peJV4XVUHgu0hyO6ch3cPlBg/edit?usp=drive_link"
    }
    // Add more links here as needed
  ];

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
        <h1 className="text-5xl font-light text-gray-100 mb-16">
          Padrillo
        </h1>

        {/* Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {externalLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-6 py-4 backdrop-blur-md bg-white/5 border-2 border-white/20 
                       rounded-xl text-gray-100 hover:bg-white/10 hover:border-white/30 
                       transition-all duration-200 text-center font-light"
            >
              {link.title}
            </a>
          ))}
        </div>
      </main>
    </div>
  );
} 