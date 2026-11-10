'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { submitOnboardingAnswer } from '@/app/actions/communityActions';
import { toast } from 'sonner';

const OPTIONS = [
  { value: 'deck_builder' as const, label: 'Construtor / gestão de decks' },
  { value: 'translations' as const, label: 'Traduções de cartas' },
  { value: 'ai_analysis' as const, label: 'Análise de deck por IA' },
  { value: 'community' as const, label: 'Comunidade / decks de outros' },
  { value: 'friend' as const, label: 'Indicação de um amigo' },
  { value: 'other' as const, label: 'Outro' },
];

export default function OnboardingSurvey() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const pick = (answer: (typeof OPTIONS)[number]['value']) => {
    startTransition(async () => {
      const r = await submitOnboardingAnswer(answer);
      if (r.success) {
        toast.success('Obrigado!');
        setDone(true);
      } else toast.error(r.message);
    });
  };

  if (done) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[60] max-w-sm rounded-xl border border-white/15 bg-card p-4 shadow-2xl">
      <p className="text-sm font-semibold text-primary">O que te trouxe ao DeckSage?</p>
      <p className="text-xs text-muted-foreground mt-1">Uma pergunta — ajuda-nos a priorizar o produto.</p>
      <div className="mt-3 flex flex-col gap-2">
        {OPTIONS.map((o) => (
          <Button
            key={o.value}
            type="button"
            variant="outline"
            size="sm"
            className="justify-start border-white/15 hover:bg-white/[0.06]"
            disabled={pending}
            onClick={() => pick(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
