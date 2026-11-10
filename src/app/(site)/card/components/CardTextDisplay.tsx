'use client';

import { useState } from 'react';
import { Languages } from 'lucide-react';
import MagicTextRenderer from '@/app/(site)/components/ui/MagicTextRenderer';
import { cn } from '@/lib/utils';

interface CardTextDisplayProps {
  originalText: string | null | undefined;
  translatedText: string | null | undefined;
}

export default function CardTextDisplay({ originalText, translatedText }: CardTextDisplayProps) {
  const [showOriginal, setShowOriginal] = useState(false);

  if (!originalText) return null;

  const hasTranslation = !!translatedText && translatedText !== originalText;
  const textToDisplay = showOriginal || !hasTranslation ? originalText : translatedText;

  return (
    <div>
      {hasTranslation && (
        <div
          role="tablist"
          aria-label="Idioma do texto"
          className="mb-4 inline-flex rounded-full border border-white/10 p-0.5"
        >
          {[
            { label: 'Português', value: false },
            { label: 'Original', value: true },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              role="tab"
              aria-selected={showOriginal === opt.value}
              onClick={() => setShowOriginal(opt.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[0.14em]',
                showOriginal === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {!opt.value && <Languages className="h-3.5 w-3.5" />}
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <div key={String(showOriginal)} className="animate-in fade-in-0 duration-300">
        <MagicTextRenderer text={textToDisplay} />
      </div>
    </div>
  );
}

export function CardTextSkeleton() {
  return (
    <div aria-label="Traduzindo o texto da carta" className="space-y-3">
      <div className="h-7 w-44 animate-pulse rounded-full bg-white/[0.05]" />
      <div className="h-4 w-full animate-pulse rounded bg-white/[0.05]" />
      <div className="h-4 w-11/12 animate-pulse rounded bg-white/[0.05]" />
      <div className="h-4 w-3/5 animate-pulse rounded bg-white/[0.05]" />
    </div>
  );
}
