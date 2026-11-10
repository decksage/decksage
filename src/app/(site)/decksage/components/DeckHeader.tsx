'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Globe, Lock, Pencil, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeckPrivacyToggle } from '@/app/(site)/components/deck/DeckPrivacyToggle';
import DeckViewActions from '@/app/(site)/components/deck/DeckViewActions';
import SaveDeckButton from '@/app/(site)/components/deck/SaveDeckButton';
import type { DeckFromDB } from '@/app/lib/types';

interface DeckHeaderProps {
  deck: DeckFromDB;
  isOwner: boolean;
  isInitiallySaved: boolean;
  creatorProfile?: {
    id: string;
    full_name: string | null;
    username: string | null;
  } | null;
  colors?: string[];
  cardCount?: number;
}

export default function DeckHeader({
  deck,
  isOwner,
  isInitiallySaved,
  creatorProfile,
  colors = [],
  cardCount,
}: DeckHeaderProps) {
  const router = useRouter();
  const creatorHref = creatorProfile
    ? `/profile/${creatorProfile.username || creatorProfile.id}`
    : null;
  const creatorName = creatorProfile?.full_name || creatorProfile?.username;

  return (
    <header>
      <button
        type="button"
        onClick={() => router.back()}
        className="rise group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Voltar
      </button>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="kicker flex flex-wrap items-center gap-3">
            <span className="mana-strip h-1 w-8" aria-hidden />
            <span>{deck.format}</span>
            {colors.length > 0 && (
              <span className="flex items-center gap-0.5" aria-label={`Cores: ${colors.join(', ')}`}>
                {colors.map((color) => (
                  <i
                    key={color}
                    className={`ms ms-${color.toLowerCase()} ms-cost`}
                    style={{ fontSize: '1.05rem' }}
                    aria-hidden
                  />
                ))}
              </span>
            )}
          </p>
          <h1 className="mt-4 break-words font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight sm:text-5xl">
            {deck.name}
          </h1>
          {deck.description && (
            <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              {deck.description}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            {creatorName && creatorHref && (
              <span>
                por{' '}
                <Link href={creatorHref} className="text-foreground hover:text-primary">
                  {creatorName}
                </Link>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              {deck.is_public ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {deck.is_public ? 'Público' : 'Privado'}
            </span>
            {typeof cardCount === 'number' && (
              <span className="tabular-nums">{cardCount} cartas</span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="lg">
            <Link href={`/my-deck/${deck.format}/${deck.id}/playtest`}>
              <PlayCircle className="mr-2 h-5 w-5" />
              Testar deck
            </Link>
          </Button>
          <DeckViewActions deck={deck} />
          <SaveDeckButton deckId={deck.id} initialIsSaved={isInitiallySaved} />
          {isOwner && (
            <>
              <Button
                variant="secondary"
                onClick={() => router.push(`/my-deck/${deck.format}/${deck.id}/edit`)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <DeckPrivacyToggle deckId={deck.id} initialIsPublic={deck.is_public} />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
