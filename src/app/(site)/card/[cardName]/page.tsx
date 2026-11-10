import { cache } from 'react';
import type { Metadata } from 'next';
import { SearchX } from 'lucide-react';
import { fetchCardByName } from '@/app/lib/scryfall';
import EmptyState from '@/app/(site)/components/page/EmptyState';
import CardDetailView from '../components/CardDetailView';

interface PageProps {
  params: Promise<{ cardName: string }>;
}

const getCard = cache((name: string) => fetchCardByName(name));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cardName } = await params;
  const card = await getCard(decodeURIComponent(cardName));
  if (!card) return { title: 'Carta não encontrada' };
  return { title: `${card.name} | MTG Deck Builder` };
}

export default async function CardPage({ params }: PageProps) {
  const { cardName } = await params;
  const decodedCardName = decodeURIComponent(cardName);
  const card = await getCard(decodedCardName);

  if (!card) {
    return (
      <div className="container mx-auto px-4 py-20">
        <EmptyState
          icon={SearchX}
          title="Carta não encontrada"
          description={`Não encontramos nenhuma carta chamada “${decodedCardName}”.`}
          action={{
            href: `/search?q=${encodeURIComponent(decodedCardName)}`,
            label: 'Buscar parecidas',
          }}
        />
      </div>
    );
  }

  return <CardDetailView card={card} />;
}
