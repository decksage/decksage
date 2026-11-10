'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toggleDeckLike } from '@/app/actions/communityActions';
import { toast } from 'sonner';

export default function DeckLikeButton({
  deckId,
  initialCount,
  initialLiked,
  canInteract,
}: {
  deckId: string;
  initialCount: number;
  initialLiked: boolean;
  canInteract: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!canInteract) {
      toast.message('Faça login para curtir.');
      return;
    }
    startTransition(async () => {
      const r = await toggleDeckLike(deckId);
      if (!r.success && r.message) {
        toast.error(r.message);
        return;
      }
      setLiked(!!r.liked);
      setCount((c) => (r.liked ? c + 1 : Math.max(0, c - 1)));
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={onClick}
      className={liked ? 'border-rose-500 text-rose-400' : 'border-neutral-600'}
    >
      <Heart className={`h-4 w-4 mr-2 ${liked ? 'fill-current' : ''}`} />
      {count}
    </Button>
  );
}
