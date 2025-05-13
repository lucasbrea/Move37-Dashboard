'use client';

import Link from 'next/link';

export default function PadrilloPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-8">
          <Link 
            href="/"
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            ← Back to Dashboard
          </Link>
        </div>
        
        <h1 className="text-5xl font-bold mb-16 text-gray-100">
          Padrillo
        </h1>
        
        {/* Add your Padrillo content here */}
        <div className="bg-gray-800 rounded-xl p-8">
          <p className="text-gray-100">Padrillo content will go here.</p>
        </div>
      </div>
    </div>
  );
} 