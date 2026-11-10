'use client';

import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { setFeedbackPublicRoadmap } from '@/app/actions/communityActions';
import { toast } from 'sonner';

export default function UpdateRoadmapVisibilityForm({
  feedbackId,
  initialPublic,
}: {
  feedbackId: string;
  initialPublic: boolean;
}) {
  const [pub, setPub] = useState(initialPublic);
  const [pending, startTransition] = useTransition();

  const onChange = (checked: boolean) => {
    startTransition(async () => {
      try {
        await setFeedbackPublicRoadmap(feedbackId, checked);
        setPub(checked);
        toast.success(checked ? 'Visível no roadmap público.' : 'Removido do roadmap público.');
      } catch {
        toast.error('Falha ao atualizar.');
      }
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">
      <div>
        <Label htmlFor="roadmap-public" className="text-neutral-200">
          Mostrar no roadmap público
        </Label>
        <p className="text-xs text-neutral-500 mt-1">Utilizadores podem votar para priorizar.</p>
      </div>
      <Switch id="roadmap-public" checked={pub} disabled={pending} onCheckedChange={onChange} />
    </div>
  );
}
