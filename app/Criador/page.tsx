'use client';

import CategoryLayout from '../components/CategoryLayout';

export default function CriadorPage() {
  const externalLinks = [
    {
      title: "Criador Table",
      url: "https://docs.google.com/spreadsheets/d/131ORjkKEyewcLVQkXC00oMI-gmCZKFcO/edit?usp=drive_link&ouid=114898536092612537397&rtpof=true&sd=true"
    },
    {
      title: "Firmamento Report",
      url: "https://drive.google.com/file/d/1XPhELxhJy83UCcKbxVFoPjPl-eghul0v/view?usp=drive_link"
    },
    {
      title:"Report Firmamento(cirador)",
      url :"https://drive.google.com/file/d/1hIe5M42vxqQIFNd8mMoLTcnk3BZp8wss/view?usp=drive_link"
    },
    {
      title:"Report Firmamento(stud)",
      url:"https://drive.google.com/file/d/10IfAEtpEKAY-a-rT-2DmE2IuiArgl5f0/view?usp=drive_link"
    },
    {
      title:"Proposal La Pasion",
      url:"https://drive.google.com/file/d/1I7T5c7txWsWIU4baOt8TUrxUs9YFqyxc/view?usp=drive_link"
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
        <h1 className="text-5xl font-light text-gray-100 mb-12">
          Criador
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