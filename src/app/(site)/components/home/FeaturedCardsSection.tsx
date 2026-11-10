// app/components/home/FeaturedCardsSection.tsx
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FeaturedCardData {
  id: string;
  name: string;
  imageUrl: string;
  set: string;
}

interface FeaturedCardsSectionProps {
  cards: FeaturedCardData[];
}

export default function FeaturedCardsSection({ cards }: FeaturedCardsSectionProps) {
  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-primary mb-12">Cartas em Destaque</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            // Removido legacyBehavior e a tag <a> interna.
            // As classes e o comportamento de grupo foram para o componente Card.
            <Link
              href={`/card/cardId/${card.id}`}
              key={card.id}
              className="block group" // A classe 'block group' agora está no Link, que passará para o Card se ele aceitar, ou aplicamos no Card
            >
              <Card className="bg-white/[0.04] border-white/15 hover:border-primary transition-all duration-300 overflow-hidden h-full flex flex-col">
                <CardContent className="p-0 relative aspect-[5/7]">
                  <Image
                    src={card.imageUrl}
                    alt={card.name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </CardContent>
                <div className="p-4 bg-white/[0.04]">
                  <h3 className="text-lg font-semibold text-primary group-hover:text-primary truncate">
                    {card.name}
                  </h3>
                  <p className="text-sm text-muted-foreground uppercase">{card.set}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link href="/search?sort=popularity">
            <Button
              variant="outline"
              className="border-white/15"
            >
              Ver Mais Cartas Populares
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
