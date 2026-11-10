'use client';

import { useState, useTransition } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createDeckComment } from '@/app/actions/communityActions';
import { toast } from 'sonner';

export default function DeckCommentForm({
  deckId,
  parentId,
  compact,
}: {
  deckId: string;
  parentId?: string;
  compact?: boolean;
}) {
  const [text, setText] = useState('');
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const r = await createDeckComment(deckId, text, parentId ?? null);
      if (r.success) {
        setText('');
        toast.success(r.message);
      } else toast.error(r.message);
    });
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={parentId ? 'Responder…' : 'Comentário (Markdown básico permitido)…'}
        rows={compact ? 2 : 4}
        className="bg-card border-white/15"
      />
      <Button
        type="button"
        size={compact ? 'sm' : 'default'}
        disabled={pending || text.trim().length < 2}
        onClick={submit}
        className=""
      >
        {parentId ? 'Responder' : 'Publicar comentário'}
      </Button>
    </div>
  );
}
