'use client';

import { useRouter } from 'next/navigation';

export default function DamsPage() {
  const router = useRouter();

  const sections = [
    { id: 'pbrs-year', label: 'PBRS - Year', description: '' },
  ];

  return (
    <div className="min-h-screen bg-[#0a192f] text-white">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <nav className="mb-12">
          <a
            href="/"
            className="text-gray-400 hover:text-white transition-colors duration-150 text-sm font-medium"
          >
            ← Dashboard
          </a>
        </nav>

        <h1 className="text-5xl font-light mb-16 tracking-tight">Dams</h1>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sections.map((section) => (
            <div
              key={section.id}
              onClick={() => router.push(`/Dams/${section.id}`)}
              className="group p-8 bg-white/5 border border-white/10 hover:bg-white/10
                       hover:border-white/20 transition-all duration-200 cursor-pointer"
            >
              <div className="mb-4">
                <h2 className="text-2xl font-light text-white mb-2 group-hover:text-yellow-300 transition-colors duration-200">
                  {section.label}
                </h2>
                {section.description && (
                  <p className="text-gray-400 text-sm">{section.description}</p>
                )}
              </div>
              <div className="text-gray-500 text-xs font-medium tracking-wide">
                VIEW →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
