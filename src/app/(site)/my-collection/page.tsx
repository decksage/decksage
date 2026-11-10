import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/server';
import { listMySetCollections } from '@/app/actions/setCollectionActions';
import { collectionScopeLabel, normalizeCollectionScope } from '@/app/lib/setCollection';
import { Button } from '@/components/ui/button';
import { PlusCircle, Layers, Lock, Globe } from 'lucide-react';

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

  if (!user) {
    redirect('/login?next=/my-collection');
  }

  const { collections, error } = await listMySetCollections();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-400 flex items-center gap-2">
              <Layers className="h-8 w-8" />
              Minhas Coleções
            </h1>
            <p className="text-neutral-400 mt-2">
              Crie uma coleção por edição e marque as cartas que você já tem, com quantidade e
              acabamento.
            </p>
          </div>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            <Link href="/my-collection/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova coleção
            </Link>
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {collections.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-xl border border-neutral-800 bg-neutral-900/50">
            <Layers className="mx-auto h-12 w-12 text-neutral-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma coleção ainda</h2>
            <p className="text-neutral-400 mb-6 max-w-md mx-auto">
              Escolha uma edição (ex.: MH3, DSK) e vincule automaticamente todas as cartas para
              começar a marcar o que você tem.
            </p>
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              <Link href="/my-collection/new">Criar primeira coleção</Link>
            </Button>
            <p className="text-sm text-neutral-500 mt-4">
              Ou explore as edições em{' '}
              <Link href="/collections" className="text-amber-400 hover:underline">
                Guia por Coleções
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {collections.map((c) => {
              const pct =
                c.total_cards > 0 ? Math.round((c.owned_cards / c.total_cards) * 100) : 0;
              return (
                <Link
                  key={c.id}
                  href={`/my-collection/${c.id}`}
                  className="group rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-4">
                    {c.set_icon_svg_uri ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.set_icon_svg_uri}
                        alt=""
                        className="h-10 w-10 invert opacity-80 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-neutral-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-lg truncate group-hover:text-amber-400">
                        {c.set_name}
                      </h2>
                      <p className="text-xs text-neutral-500 uppercase tracking-wide">
                        {c.set_code}
                      </p>
                      <p className="text-[11px] text-neutral-600 mt-0.5">
                        {collectionScopeLabel(normalizeCollectionScope(c.collection_scope))}
                      </p>
                    </div>
                    <span className="text-neutral-500" title={c.is_public ? 'Pública' : 'Privada'}>
                      {c.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Progresso</span>
                      <span className="font-medium text-amber-400">
                        {c.owned_cards}/{c.total_cards} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
