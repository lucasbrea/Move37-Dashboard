'use client';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  const categories = [
    'Padrillo',
    'Criador',
    'Jockey',
    'Entrenador',
    'Crías',
    'Dams'
  ];

  const handleCardClick = (category: string) => {
    // Navigate to category page when implemented
    console.log(`Clicked ${category}`);
    // router.push(`/${category.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold text-center mb-16 text-gray-100">
          Move37 Dashboard
        </h1>
        
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 mx-auto"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          }}
        >
          {categories.map((category) => (
            <div
              key={category}
              onClick={() => handleCardClick(category)}
              className="dashboard-card"
              style={{
                minWidth: '300px',
                width: '100%'
              }}
            >
              <h2 className="text-4xl font-bold text-center text-gray-100 px-6">
                {category}
              </h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 