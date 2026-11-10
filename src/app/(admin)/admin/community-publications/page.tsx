import { checkUserRole } from '@/lib/auth';
import { createClient } from '@/app/utils/supabase/server';
import { notFound } from 'next/navigation';
import { reviewCommunityPublicationForm } from '@/app/actions/communityActions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export const dynamic = 'force-dynamic';

export default async function AdminCommunityPublicationsPage() {
  const isAdmin = await checkUserRole('admin');
  if (!isAdmin) notFound();

  const supabase = createClient();
  const { data: rows } = await supabase
    .from('community_publications')
    .select('id, title, slug, publication_type, status, created_at')
    .eq('status', 'submitted')
    .order('created_at', { ascending: false });

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-amber-500">UGC — revisão</h1>
        <p className="text-neutral-400 mt-1">Primers e tier lists submetidos pela comunidade.</p>
      </header>

      <div className="space-y-6">
        {(rows ?? []).map((r) => (
          <div key={r.id} className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-neutral-100">{r.title}</h2>
              <p className="text-xs text-neutral-500 mt-1">
                {r.publication_type} · <span className="font-mono">{r.slug}</span>
              </p>
            </div>
            <form action={reviewCommunityPublicationForm} className="space-y-2">
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="decision" value="published" />
              <Textarea name="note" rows={2} placeholder="Nota ao autor (opcional)" className="bg-neutral-950 border-neutral-700 text-sm" />
              <Button type="submit" size="sm" className="bg-green-700 hover:bg-green-600">
                Publicar
              </Button>
            </form>
            <form action={reviewCommunityPublicationForm} className="space-y-2">
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="decision" value="rejected" />
              <Textarea name="note" rows={2} placeholder="Motivo da rejeição" className="bg-neutral-950 border-neutral-700 text-sm" />
              <Button type="submit" size="sm" variant="destructive">
                Rejeitar
              </Button>
            </form>
          </div>
        ))}
      </div>

      {(!rows || rows.length === 0) && (
        <p className="text-neutral-500 mt-6 text-sm">Nada na fila de revisão.</p>
      )}
    </div>
  );
}
