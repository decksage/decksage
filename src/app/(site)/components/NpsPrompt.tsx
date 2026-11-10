'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submitNpsResponse } from '@/app/actions/communityActions';
import { toast } from 'sonner';
import { X } from 'lucide-react';

export default function NpsPrompt() {
  const [open, setOpen] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [followUp, setFollowUp] = useState('');
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  const submit = () => {
    if (score === null) {
      toast.error('Escolhe uma nota de 0 a 10.');
      return;
    }
    startTransition(async () => {
      const r = await submitNpsResponse(score, followUp.trim() || undefined);
      if (r.success) {
        toast.success(r.message);
        setOpen(false);
      } else toast.error(r.message);
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] max-w-md rounded-xl border border-white/15 bg-card p-4 shadow-2xl">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground/80"
        onClick={() => setOpen(false)}
      >
        <X className="h-4 w-4" />
      </button>
      <p className="text-sm font-semibold text-primary pr-6">Quanto recomendarias o DeckSage?</p>
      <p className="text-xs text-muted-foreground mt-1">De 0 (nada) a 10 (muito)</p>
      <div className="flex flex-wrap gap-1 mt-3">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setScore(i)}
            className={`h-8 w-8 rounded text-xs font-bold transition ${
              score === i ? 'bg-primary text-black' : 'bg-white/[0.04] text-foreground hover:bg-neutral-700'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      <Textarea
        className="mt-3 bg-background border-white/15 text-sm"
        rows={2}
        placeholder="Opcional: o que faria dar 10? ou o que mais incomoda?"
        value={followUp}
        onChange={(e) => setFollowUp(e.target.value)}
      />
      <Button
        type="button"
        className="mt-2 w-full "
        disabled={pending}
        onClick={submit}
      >
        Enviar
      </Button>
    </div>
  );
}
