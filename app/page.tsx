'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const categories = [
    { 
      name: 'Padrillo', 
      image: '/horse_sire_dashbaord.jpg', 
      path: '/Padrillo'
    },
    { name: 'Criador',
       image: '/criador_dashboard.jpg',
        path: '/Criador'
       },
    { name: 'Jockey',
      image: 'horse_jockey_dashboard.jpg', 
      path: '/Jockey' 
    },
    { name: 'Entrenador', 
      image: '/trainer_dashboard.jpg', 
      path: '/Entrenador' 
    },
    { name: 'Crías', 
      image: '/foals_dashboard.jpg', 
      path: '/Crias' 
    },
    { name: 'Dams', 
      image: '/dam_dashboard.jpg', 
      path: '/Dams' 
    }
  ];

  const router = useRouter();

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  return (
    <main className="relative min-h-screen">
      <div className="overlay" />
      <div className="relative z-10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-6xl font-light text-center mb-16 text-white drop-shadow-lg">
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
                key={category.name}
                className="dashboard-card group relative cursor-pointer"
                onClick={() => handleCardClick(category.path)}
                style={{
                  minWidth: '300px',
                  width: '100%',
                }}
              >
                <img
                  src={category.image}
                  alt={category.name}
                  className="card-image"
                  width="160"
                  height="160"
                />
                <h2 className="card-title">
                  {category.name}
                </h2>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 