'use client';

import Link from 'next/link';

interface CategoryLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function CategoryLayout({ children, title }: CategoryLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href="/"
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-light text-gray-900 mb-8">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
} 