'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSetCollection } from '@/app/actions/setCollectionActions';
import type { ScryfallSet } from '@/app/lib/scryfall';
import {
  collectionScopeDescription,
  collectionScopeLabel,
  type CollectionScope,
} from '@/app/lib/setCollection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Search, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NewSetCollectionClient() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sets, setSets] = useState<ScryfallSet[]>([]);
  const [loadingSets, setLoadingSets] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ScryfallSet | null>(null);
  const [scope, setScope] = useState<CollectionScope>('all_printings');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingSets(true);
      setLoadError(null);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        const res = await fetch(`/api/sets?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Falha ao buscar edições');
        }
        setSets(data.sets ?? []);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar edições.');
        setSets([]);
      } finally {
        setLoadingSets(false);
      }
    }, query.trim() ? 300 : 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleCreate = () => {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const result = await createSetCollection(selected.code, scope);
      if (result.error) {
        if (result.collectionId) {
          router.push(`/my-collection/${result.collectionId}`);
          return;
        }
        setError(result.error);
        return;
      }
      if (result.collectionId) {
        router.push(`/my-collection/${result.collectionId}`);
      }
    });
  };

  return (
    <div className="min-h-screen  text-foreground">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <Link
          href="/my-collection"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Link>

        <h1 className="mb-2 font-display text-3xl font-bold uppercase tracking-tight">Nova coleção por edição</h1>
        <p className="text-muted-foreground mb-8">
          Selecione uma edição. Todas as cartas serão vinculadas automaticamente; depois você marca
          quantidade por acabamento (normal, foil, etched, etc.).
        </p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou código (ex.: Modern Horizons, mh3, dsk)"
            className="pl-10 bg-card border-white/15"
          />
        </div>

        {loadError && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {loadError}
          </div>
        )}

        <div className="rounded-xl border border-white/10 divide-y divide-neutral-800 max-h-[420px] overflow-y-auto mb-6">
          {loadingSets ? (
            <div className="flex items-center justify-center gap-2 px-4 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Buscando edições…
            </div>
          ) : (
            <>
              {sets.map((set) => {
                const isSelected = selected?.id === set.id;
                return (
                  <button
                    key={set.id}
                    type="button"
                    onClick={() => setSelected(set)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-l-2 border-l-amber-500'
                        : 'hover:bg-card'
                    }`}
                  >
                    <img src={set.icon_svg_uri} alt="" className="h-8 w-8 invert opacity-80" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{set.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {set.code.toUpperCase()} · {set.card_count ?? '?'} cartas ·{' '}
                        {set.released_at}
                      </p>
                    </div>
                  </button>
                );
              })}
              {sets.length === 0 && !loadError && (
                <p className="px-4 py-8 text-center text-muted-foreground">
                  {query.trim()
                    ? 'Nenhuma edição encontrada. Tente o código exato (ex.: mh3).'
                    : 'Nenhuma edição disponível.'}
                </p>
              )}
            </>
          )}
        </div>

        <div className="mb-6 space-y-3">
          <p className="text-sm font-medium text-foreground/80">Tipo de coleção</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['all_printings', 'regular_only'] as CollectionScope[]).map((option) => {
              const active = scope === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScope(option)}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-colors',
                    active
                      ? 'border-amber-500/60 bg-primary/10'
                      : 'border-white/10 bg-card/40 hover:border-white/15',
                  )}
                >
                  <p className="font-medium text-sm">{collectionScopeLabel(option)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{collectionScopeDescription(option)}</p>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <Button
          onClick={handleCreate}
          disabled={!selected || pending}
          className="w-full sm:w-auto"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Vinculando cartas…
            </>
          ) : (
            <>Criar coleção{selected ? ` — ${selected.name}` : ''}</>
          )}
        </Button>
        {pending && (
          <p className="text-xs text-muted-foreground mt-3">
            Sets grandes podem levar alguns segundos enquanto buscamos todas as cartas no Scryfall.
          </p>
        )}
      </div>
    </div>
  );
}
