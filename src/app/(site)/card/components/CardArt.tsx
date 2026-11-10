'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CardArt({ images, name }: { images: string[]; name: string }) {
  const [face, setFace] = useState(0);
  const canFlip = images.length > 1;

  if (images.length === 0) {
    return (
      <div className="mtg-card grid place-items-center p-6 text-center text-sm text-muted-foreground">
        Imagem não disponível
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="mtg-card w-full">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === 0 ? name : `${name} (verso)`}
            width={672}
            height={936}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'auto'}
            decoding="async"
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-500',
              i !== face && 'opacity-0',
            )}
          />
        ))}
      </div>
      {canFlip && (
        <button
          type="button"
          onClick={() => setFace((f) => (f + 1) % images.length)}
          aria-pressed={face === 1}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-4 font-display text-xs font-semibold uppercase tracking-[0.14em] hover:border-primary/60"
        >
          <RotateCcw
            className={cn('h-4 w-4 transition-transform duration-500', face === 1 && '-rotate-180')}
          />
          {face === 0 ? 'Ver verso' : 'Ver frente'}
        </button>
      )}
    </div>
  );
}
