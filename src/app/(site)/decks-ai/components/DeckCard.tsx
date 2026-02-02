import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Swords } from 'lucide-react';

// Tipagem para os dados que o card espera receber
type DeckCardProps = {
  deck: {
    id: string;
    name: string;
    format: string;
    representative_card_image_url: string | null;
    color_identity: string[];
    user_profiles?: {
      username: string | null;
      avatar_url: string | null;
    } | null;
  };
};

export default function DeckCard({ deck }: DeckCardProps) {
  // Gera um gradiente sutil com base na identidade de cor do deck
  const colorStops = deck.color_identity && deck.color_identity.length > 0
    ? deck.color_identity.map(color => `var(--mana-${color.toLowerCase()})`).join(', ')
    : 'var(--mana-c)'; // Cor para decks incolores
  const gradientStyle = {
    backgroundImage: `radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent), linear-gradient(to bottom right, ${colorStops})`,
  };

  const creatorName = deck.user_profiles?.username || 'Anônimo';
  const creatorAvatar = deck.user_profiles?.avatar_url;

  return (
    <Link href={`/decks/${deck.id}`} className="group block">
      <Card className="bg-neutral-900 py-0 border-neutral-800 h-full flex flex-col group transition-all duration-300 hover:border-amber-500 overflow-hidden relative">
        {/* Imagem de Capa do Deck */}
        <div className="relative w-full aspect-[16/9]" style={gradientStyle}>
          {deck.representative_card_image_url && (
            <Image
              src={deck.representative_card_image_url}
              alt={`Arte do deck ${deck.name}`}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

          {/* Avatar do Criador sobreposto na imagem (canto inferior esquerdo) */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
            <Avatar className="h-8 w-8 border-2 border-neutral-900">
              <AvatarImage src={creatorAvatar || ''} alt={creatorName} />
              <AvatarFallback className="bg-neutral-800 text-xs text-neutral-400">
                {creatorName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-white/90 shadow-black drop-shadow-md">
              {creatorName}
            </span>
          </div>
        </div>

        {/* Informações do Deck */}
        <div className="p-4 pt-10 -mt-6 relative z-0">
          <Badge variant="secondary" className="capitalize mb-2">{deck.format}</Badge>
          <h3 className="font-bold text-lg text-neutral-100 group-hover:text-amber-400 transition-colors line-clamp-2 leading-tight">
            {deck.name}
          </h3>
        </div>
      </Card>
    </Link>
  );
}