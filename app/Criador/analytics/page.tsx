'use client';

import Link from 'next/link';
import CriadorAnalytics from '../CriadorAnalytics';

export default function CriadorAnalyticsPage() {
  return (
    <div className="min-h-screen bg-[#0a192f]">
      <nav className="border-b border-[#233554]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/Criador"
            className="text-gray-400 hover:text-white transition-colors duration-150 text-sm font-medium"
          >
            ← Criador
          </Link>
        </div>
      </nav>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 font-sans">
        <h1 className="text-3xl font-light text-white mb-6">Criador Analytics</h1>
        <CriadorAnalytics />
      </div>
    </div>
  );
}
