/* eslint-disable no-undef */
'use client';

import { LayoutList, BookOpenText, BrainCircuit, MessageSquare } from 'lucide-react';

const links = [
  { id: 'decklist', label: 'Decklist', icon: LayoutList, flag: 'decklist' },
  { id: 'analysis', label: 'Análise', icon: BookOpenText, flag: 'analysis' },
  { id: 'guide', label: 'Guia', icon: BrainCircuit, flag: 'guide' },
  { id: 'comments', label: 'Comentários', icon: MessageSquare, flag: 'comments' },
] as const;

export default function DeckPageNav({
  hasAnalysis = false,
  hasGuide = false,
  hasComments = false,
}: {
  hasAnalysis?: boolean;
  hasGuide?: boolean;
  hasComments?: boolean;
}) {
  const visible = {
    decklist: true,
    analysis: hasAnalysis,
    guide: hasGuide,
    comments: hasComments,
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="sticky top-14 z-40 -mx-6 mt-8 border-y border-white/10 bg-background/95 px-6 backdrop-blur">
      <div className="flex gap-1 overflow-x-auto py-1">
        {links
          .filter((link) => visible[link.flag])
          .map((link) => (
            <button
              key={link.id}
              type="button"
              onClick={() => scrollTo(link.id)}
              className="inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </button>
          ))}
      </div>
    </nav>
  );
}
