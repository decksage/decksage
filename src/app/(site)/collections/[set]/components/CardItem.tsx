import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type CardItemProps = {
  card: any; // Using any for flexibility with Scryfall object
};

export function CardItem({ card }: CardItemProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Check if double-faced
  const isDoubleFaced =
    card.card_faces &&
    card.card_faces.length > 1 &&
    card.card_faces[0].image_uris &&
    card.card_faces[1].image_uris;

  // Get images
  const frontImage = isDoubleFaced
    ? card.card_faces[0].image_uris?.normal
    : card.image_uris?.normal;
  const backImage = isDoubleFaced ? card.card_faces[1].image_uris?.normal : null;

  // Handling cases where single faced card might be missing image (e.g. text-only promo, placeholder)
  const imageToDisplay = isDoubleFaced
    ? isFlipped
      ? backImage
      : frontImage
    : card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal;

  const handleFlip = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link Click
    e.stopPropagation();
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="relative group perspective-1000">
      <div className="bg-neutral-900 rounded-xl p-2 transition-all duration-300 shadow-sm hover:shadow-md border border-neutral-800 hover:border-amber-500/30">
        <div className="relative aspect-[63/88] w-full">
          {isDoubleFaced && (
            <Button
              size="icon"
              variant="secondary"
              className="absolute top-2 right-2 z-20 h-8 w-8 rounded-full bg-amber-500 text-black hover:bg-amber-600 shadow-lg transition-colors"
              onClick={handleFlip}
              title="Virar carta"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}

          <Link href={`/card/cardId/${card.id}`}>
            <div
              className={cn(
                'w-full h-full transition-all duration-500 preserve-3d',
                isFlipped && isDoubleFaced ? 'rotate-y-180' : '',
              )}
            >
              {imageToDisplay ? (
                <div className="relative w-full h-full">
                  {/* Image with Fade effect for flip */}
                  <img
                    src={imageToDisplay}
                    alt={card.name}
                    className={cn(
                      'rounded-lg w-full h-full object-cover shadow-md transition-opacity duration-300',
                      isFlipped && isDoubleFaced ? 'rotate-y-180' : '',
                    )}
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-700">
                  <div className="text-center p-4">
                    <p className="text-xs text-neutral-400 mb-1 font-semibold">{card.name}</p>
                    <p className="text-[10px] text-neutral-500">Sem imagem disponível</p>
                  </div>
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Optional: Card Name Footer if desired, keeping minimal for now to match grid style */}
      </div>
    </div>
  );
}
