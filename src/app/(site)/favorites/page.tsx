'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/app/(site)/store/favorites';
import PageHeader from '../components/page/PageHeader';
import EmptyState from '../components/page/EmptyState';

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  return (
    <>
      <PageHeader
        kicker="Sua conta"
        title="Favoritos"
        description="Cartas que você marcou neste navegador."
        className="border-b-0"
      />
      <div className="mx-auto max-w-7xl px-6 pb-20">
        {favorites.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nenhuma carta favorita"
            description="Quando você favoritar uma carta, ela fica salva aqui neste dispositivo."
            action={{ href: '/search', label: 'Buscar cartas' }}
          />
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {favorites.map((card) => (
              <li key={card.id}>
                <Link href={`/card/${encodeURIComponent(card.name)}`} className="group block">
                  <div className="mtg-card">
                    <img
                      src={card.image}
                      alt={card.name}
                      width={488}
                      height={680}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <p className="mt-3 truncate text-sm font-medium group-hover:text-primary">
                    {card.name}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
