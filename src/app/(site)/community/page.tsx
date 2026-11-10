import Link from 'next/link';
import { FileText, PenLine } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/server';
import PageHeader from '../components/page/PageHeader';
import EmptyState from '../components/page/EmptyState';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Comunidade | DeckSage',
  description: 'Primers e tier lists publicados pela comunidade DeckSage.',
};

const TYPE_LABEL: Record<string, string> = {
  primer: 'Primer',
  tier_list: 'Tier list',
};

export default async function CommunityPublicationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from('community_publications')
    .select('id, title, slug, publication_type, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(40);

  return (
    <>
      <PageHeader
        kicker="Comunidade"
        title="Publicações"
        description="Primers e tier lists escritos por jogadores e publicados depois da revisão."
        actions={
          user ? (
            <Link
              href="/community/new"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <PenLine className="h-4 w-4" />
              Novo rascunho
            </Link>
          ) : undefined
        }
        className="border-b-0"
      />
      <div className="mx-auto max-w-3xl px-6 pb-20">
        {rows && rows.length > 0 ? (
          <ul className="divide-y divide-white/5">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/community/${r.slug}`} className="group block py-6">
                  <p className="kicker">{TYPE_LABEL[r.publication_type] ?? r.publication_type}</p>
                  <h2 className="mt-2 font-display text-2xl font-bold uppercase leading-tight tracking-tight group-hover:text-primary">
                    {r.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={FileText}
            title="Ainda não há publicações"
            description="Quando um primer ou tier list passar pela revisão, ele aparece aqui."
            action={user ? { href: '/community/new', label: 'Escrever um rascunho' } : undefined}
          />
        )}
      </div>
    </>
  );
}
