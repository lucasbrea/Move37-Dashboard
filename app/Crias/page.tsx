'use client';

import CategoryLayout from '../components/CategoryLayout';

export default function CriasPage() {
  const externalLinks = [
    {
      title:"Comparing Generations",
      url:"https://docs.google.com/spreadsheets/d/1SL_1IohEmQBG5jECf8bMjABxdC9C46WY/edit?usp=drive_link&ouid=114898536092612537397&rtpof=true&sd=true"
      
    },
    // Add more links here as needed
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <a 
            href="/"
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            ← Back to Dashboard
          </a>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Title */}
        <h1 className="text-5xl font-light text-gray-900 mb-12">
          Crias
        </h1>

        {/* Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {externalLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-6 py-4 bg-white border-2 border-gray-200 
                       rounded-xl text-gray-800 hover:bg-gray-50 hover:border-gray-300 
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