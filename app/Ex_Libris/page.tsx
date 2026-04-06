'use client';

import { useRouter } from 'next/navigation';

const sections = [
  { id: 'existing-dams-2026', label: 'Existing Dams 2026' },
  { id: 'servicios-optimos-2026', label: 'Servicios Óptimos 2026' },
  { id: 'crias-2024-2025', label: 'Crías 2024 & 2025' },
  { id: 'training', label: 'Training' },
  { id: 'retirados', label: 'Retirados' },
];

export default function ExLibrisPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a192f] text-white">
      {/* Nav */}
      <div className="max-w-7xl mx-auto px-8 pt-8">
        <a
          href="/"
          className="text-gray-400 hover:text-white transition-colors duration-150 text-sm font-medium"
        >
          ← Dashboard
        </a>
      </div>

      {/* Cover */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: 340 }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a192f]/30 via-transparent to-[#0a192f] z-10" />
        <div className="flex items-center justify-center py-16 px-8 relative z-20">
          <div className="flex flex-col items-center gap-8">
            {/* Silks image */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-yellow-400/10 blur-2xl scale-150" />
              <img
                src="/ex_libris_silks.png"
                alt="Ex Libris Silks"
                className="relative h-56 w-auto drop-shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            {/* Title */}
            <div className="text-center">
              <h1 className="text-6xl font-light tracking-widest uppercase text-white mb-2">
                Ex Libris
              </h1>
              <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent mt-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <div
              key={section.id}
              onClick={() => router.push(`/Ex_Libris/${section.id}`)}
              className="group p-8 bg-white/5 border border-white/10 hover:bg-white/10
                         hover:border-yellow-400/30 transition-all duration-200 cursor-pointer"
            >
              <div className="mb-4">
                <h2 className="text-2xl font-light text-white mb-2 group-hover:text-yellow-300 transition-colors duration-200">
                  {section.label}
                </h2>
              </div>
              <div className="text-gray-500 group-hover:text-yellow-400 text-xs font-medium tracking-wide transition-colors duration-200">
                VIEW →
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
