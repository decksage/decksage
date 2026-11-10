'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EmailEditor from '@/components/admin/EmailEditor';
import {
  saveCommunityPublicationDraft,
  submitCommunityPublicationForReview,
} from '@/app/actions/communityActions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function CommunityPublicationComposer() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'primer' | 'tier_list'>('primer');
  const [bodyHtml, setBodyHtml] = useState('');
  const [blocksJson, setBlocksJson] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const persistBody = (html: string, blocks: string) => {
    setBodyHtml(html);
    setBlocksJson(blocks);
  };

  const saveDraft = () => {
    startTransition(async () => {
      const r = await saveCommunityPublicationDraft({
        id: draftId ?? undefined,
        title: title || 'Rascunho sem título',
        slug: slug || title || 'rascunho',
        publication_type: type,
        body: bodyHtml || '<p></p>',
      });
      if (r.success && r.id) {
        setDraftId(r.id);
        toast.success('Rascunho guardado.');
      } else toast.error(r.message || 'Erro ao guardar.');
    });
  };

  const submit = () => {
    startTransition(async () => {
      let id = draftId;
      if (!id) {
        const r0 = await saveCommunityPublicationDraft({
          title: title || 'Rascunho sem título',
          slug: slug || title || 'rascunho',
          publication_type: type,
          body: bodyHtml || '<p></p>',
        });
        if (!r0.success || !r0.id) {
          toast.error(r0.message || 'Guarda o rascunho primeiro.');
          return;
        }
        id = r0.id;
        setDraftId(id);
      } else {
        await saveCommunityPublicationDraft({
          id,
          title: title || 'Rascunho sem título',
          slug: slug || title || 'rascunho',
          publication_type: type,
          body: bodyHtml || '<p></p>',
        });
      }
      const r = await submitCommunityPublicationForReview(id);
      if (r.success) {
        toast.success(r.message);
        router.push('/community');
      } else toast.error(r.message);
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Título</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-card border-white/15"
          />
        </div>
        <div>
          <Label>Slug (URL)</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="meu-primer-izzet"
            className="bg-card border-white/15"
          />
        </div>
      </div>
      <div>
        <Label>Tipo</Label>
        <Select value={type} onValueChange={(v) => setType(v as 'primer' | 'tier_list')}>
          <SelectTrigger className="bg-card border-white/15 max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primer">Primer</SelectItem>
            <SelectItem value="tier_list">Tier list</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Conteúdo</Label>
        <EmailEditor
          initialValue={bodyHtml}
          initialBlocks={blocksJson || undefined}
          onChange={persistBody}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" disabled={pending} onClick={saveDraft}>
          Guardar rascunho
        </Button>
        <Button
          type="button"
          className=""
          disabled={pending}
          onClick={submit}
        >
          Enviar para revisão
        </Button>
      </div>
    </div>
  );
}
