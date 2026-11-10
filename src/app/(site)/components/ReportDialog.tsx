'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { submitReport } from '@/app/actions/communityActions';
import { toast } from 'sonner';
import { Flag } from 'lucide-react';

export default function ReportDialog({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [pending, startTransition] = useTransition();

  const send = () => {
    startTransition(async () => {
      const r = await submitReport(entityType, entityId, reason);
      if (r.success) {
        toast.success(r.message);
        setOpen(false);
        setReason('');
      } else toast.error(r.message);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          <Flag className="h-4 w-4 mr-1" />
          Reportar
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-white/15 text-foreground">
        <DialogHeader>
          <DialogTitle>Reportar conteúdo</DialogTitle>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Descreve o problema (spam, ofensa, conteúdo incorreto…)"
          rows={4}
          className="bg-background border-white/15"
        />
        <Button
          type="button"
          disabled={pending || reason.trim().length < 3}
          onClick={send}
          className="bg-primary text-black"
        >
          Enviar denúncia
        </Button>
      </DialogContent>
    </Dialog>
  );
}
