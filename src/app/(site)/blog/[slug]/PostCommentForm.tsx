'use client';

import { useId, useState, useTransition } from 'react';
import { Reply } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createPostComment } from '@/app/actions/communityActions';
import { toast } from 'sonner';

export default function PostCommentForm({
  postId,
  parentId,
  compact,
}: {
  postId: string;
  parentId?: string;
  compact?: boolean;
}) {
  const [text, setText] = useState('');
  const [open, setOpen] = useState(!compact);
  const [pending, startTransition] = useTransition();
  const id = useId();

  const submit = () => {
    startTransition(async () => {
      const r = await createPostComment(postId, text, parentId ?? null);
      if (r.success) {
        setText('');
        if (compact) setOpen(false);
        toast.success(r.message);
      } else toast.error(r.message);
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
      >
        <Reply className="h-3.5 w-3.5" />
        Responder
      </button>
    );
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <label htmlFor={id} className="sr-only">
        {parentId ? 'Sua resposta' : 'Seu comentário'}
      </label>
      <Textarea
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={parentId ? 'Escreva sua resposta…' : 'O que você achou do artigo?'}
        rows={compact ? 2 : 4}
        className="border-white/10 bg-white/[0.03] focus-visible:border-primary/60"
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size={compact ? 'sm' : 'default'}
          disabled={pending || text.trim().length < 2}
          onClick={submit}
        >
          {pending ? 'Enviando…' : parentId ? 'Responder' : 'Comentar'}
        </Button>
        {compact && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        )}
      </div>
    </div>
  );
}
