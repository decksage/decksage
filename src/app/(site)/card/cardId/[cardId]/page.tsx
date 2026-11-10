import { cache } from 'react';
import type { Metadata } from 'next';
import { SearchX } from 'lucide-react';
import { fetchCardById } from '@/app/lib/scryfall';
import EmptyState from '@/app/(site)/components/page/EmptyState';
import CardDetailView from '../../components/CardDetailView';

interface PageProps {
  params: Promise<{ cardId: string }>;
}

const getCard = cache((id: string) => fetchCardById(id));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cardId } = await params;
  const card = cardId ? await getCard(cardId) : null;
  if (!card) return { title: 'Carta não encontrada' };

  const art = card.image_uris?.art_crop ?? card.card_faces?.[0]?.image_uris?.art_crop;
  return {
    title: `${card.name} | MTG Deck Builder`,
    description:
      card.oracle_text || card.card_faces?.[0]?.oracle_text || `Detalhes da carta ${card.name}.`,
    openGraph: { title: card.name, images: art ? [art] : undefined },
  };
}

export default async function CardByIdPage({ params }: PageProps) {
  const { cardId } = await params;
  const card = cardId ? await getCard(cardId) : null;

  if (!card) {
    return (
      <div className="container mx-auto px-4 py-20">
        <EmptyState
          icon={SearchX}
          title="Carta não encontrada"
          description="Esse link não corresponde a nenhuma carta. Tente buscar pelo nome."
          action={{ href: '/search', label: 'Buscar cartas' }}
        />
      </div>
    );
  }

  return <CardDetailView card={card} />;
}
