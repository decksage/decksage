import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Globe, Layers, Lock, PlusCircle } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/server';
import { listMySetCollections } from '@/app/actions/setCollectionActions';
import { collectionScopeLabel, normalizeCollectionScope } from '@/app/lib/setCollection';
import PageHeader from '../components/page/PageHeader';
import EmptyState from '../components/page/EmptyState';

export const metadata = {
  title: 'Minhas Coleções por Edição | DeckSage',
  description: 'Acompanhe quais cartas de cada edição você já possui.',
};

export const dynamic = 'force-dynamic';

export default async function MyCollectionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login?next=/my-collection');

  const { collections, error } = await listMySetCollections();

  return (
    <>
      <PageHeader
        kicker="Sua conta"
        title="Minhas coleções"
        description="Uma coleção por edição. Marque o que você já tem, com quantidade e acabamento."
        actions={
          <Link
            href="/my-collection/new"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <PlusCircle className="h-4 w-4" />
            Nova coleção
          </Link>
        }
        className="border-b-0"
      />
      <div className="mx-auto max-w-7xl px-6 pb-20">
        {error && (
          <p
            role="alert"
            className="mb-6 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}
        {collections.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Nenhuma coleção ainda"
            description="Escolha uma edição, como MH3 ou DSK, e comece a marcar as cartas que você já tem."
            action={{ href: '/my-collection/new', label: 'Criar a primeira coleção' }}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => {
              const pct = c.total_cards > 0 ? Math.round((c.owned_cards / c.total_cards) * 100) : 0;
              return (
                <li key={c.id}>
                  <Link
                    href={`/my-collection/${c.id}`}
                    className="frame group flex h-full flex-col p-5 hover:-translate-y-0.5 hover:[--frame-border:color-mix(in_oklch,var(--primary)_70%,transparent)]"
                  >
                    <div className="flex items-start gap-3">
                      {c.set_icon_svg_uri ? (
                        <img
                          src={c.set_icon_svg_uri}
                          alt=""
                          className="h-10 w-10 brightness-0 invert opacity-80"
                        />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-md border border-white/10">
                          <Layers className="h-5 w-5 text-muted-foreground" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <h2 className="truncate text-lg font-semibold group-hover:text-primary">
                          {c.set_name}
                        </h2>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          {c.set_code} ·{' '}
                          {collectionScopeLabel(normalizeCollectionScope(c.collection_scope))}
                        </p>
                      </div>
                      <span
                        className="text-muted-foreground"
                        title={c.is_public ? 'Pública' : 'Privada'}
                      >
                        {c.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </span>
                    </div>
                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium tabular-nums">
                          {c.owned_cards}/{c.total_cards} · {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
