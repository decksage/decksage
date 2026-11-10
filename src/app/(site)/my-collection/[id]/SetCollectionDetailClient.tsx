'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  setCollectionVisibility,
  deleteSetCollection,
  updateCardFinishQuantity,
  resyncSetCollectionCards,
  setCollectionScope,
  restoreSetCollectionCards,
  getSetCollection,
} from '@/app/actions/setCollectionActions';
import {
  finishLabel,
  collectionScopeLabel,
  collectionScopeDescription,
  filterCollectionCardsForDisplay,
  type FinishQuantities,
  type UserSetCollection,
  type UserSetCollectionCard,
  type CollectionScope,
} from '@/app/lib/setCollection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Globe,
  Lock,
  Loader2,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function isOwned(quantities: FinishQuantities): boolean {
  return Object.values(quantities || {}).some((n) => Number(n) > 0);
}

function totalQty(quantities: FinishQuantities): number {
  return Object.values(quantities || {}).reduce((s, n) => s + (Number(n) || 0), 0);
}

export default function SetCollectionDetailClient({
  collection: initialCollection,
  cards: initialCards,
  isOwner,
}: {
  collection: UserSetCollection;
  cards: UserSetCollectionCard[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [collection, setCollection] = useState(initialCollection);
  const [cards, setCards] = useState(initialCards);
  const [search, setSearch] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'owned' | 'missing'>('all');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [visPending, startVisTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [syncPending, startSyncTransition] = useTransition();
  const [scopePending, startScopeTransition] = useTransition();
  const [restorePending, startRestoreTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const scopedCards = useMemo(
    () => filterCollectionCardsForDisplay(cards, collection.collection_scope),
    [cards, collection.collection_scope],
  );

  useEffect(() => {
    if (collection.collection_scope !== 'regular_only') return;

    let cancelled = false;
    (async () => {
      const result = await getSetCollection(collection.id);
      if (cancelled || !result.collection) return;
      setCollection(result.collection);
      setCards(result.cards);
    })();

    return () => {
      cancelled = true;
    };
  }, [collection.id, collection.collection_scope]);

  const cardsMismatch =
    scopedCards.length > 0 && scopedCards.length < collection.total_cards;
  const collectionEmpty = scopedCards.length === 0;

  const ownedCount = useMemo(
    () => scopedCards.filter((c) => isOwned(c.quantities)).length,
    [scopedCards],
  );
  const pct =
    collection.total_cards > 0 ? Math.round((ownedCount / collection.total_cards) * 100) : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scopedCards.filter((card) => {
      if (ownershipFilter === 'owned' && !isOwned(card.quantities)) return false;
      if (ownershipFilter === 'missing' && isOwned(card.quantities)) return false;
      if (rarityFilter !== 'all' && card.rarity !== rarityFilter) return false;
      if (q) {
        const hay = `${card.card_name} ${card.collector_number}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [scopedCards, search, ownershipFilter, rarityFilter]);

  const bumpQty = async (card: UserSetCollectionCard, finish: string, delta: number) => {
    if (!isOwner) return;
    const current = Number(card.quantities?.[finish] || 0);
    const next = Math.max(0, Math.min(99, current + delta));
    if (next === current) return;

    const prevQuantities = card.quantities;
    const optimistic: FinishQuantities = { ...card.quantities, [finish]: next };
    setCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, quantities: optimistic } : c)),
    );
    setPendingCardId(card.id);

    const result = await updateCardFinishQuantity({
      collectionId: collection.id,
      cardId: card.id,
      finish,
      quantity: next,
    });

    setPendingCardId(null);
    if (result.error) {
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, quantities: prevQuantities } : c)),
      );
      setMessage(result.error);
      return;
    }
    if (result.quantities) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id ? { ...c, quantities: result.quantities as FinishQuantities } : c,
        ),
      );
    }
  };

  const togglePublic = (value: boolean) => {
    startVisTransition(async () => {
      const result = await setCollectionVisibility(collection.id, value);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setCollection((c) => ({ ...c, is_public: value }));
    });
  };

  const handleDelete = () => {
    if (!confirm('Apagar esta coleção? O progresso marcado será perdido.')) return;
    startDeleteTransition(async () => {
      const result = await deleteSetCollection(collection.id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      router.push('/my-collection');
    });
  };

  const handleScopeChange = (newScope: CollectionScope) => {
    const switchingMode = newScope !== collection.collection_scope;
    if (switchingMode) {
      const confirmMsg =
        newScope === 'regular_only'
          ? 'Artes especiais serão ocultadas nesta coleção. Seu progresso nelas é mantido — você pode voltar a"Todas as versões" a qualquer momento. Continuar?'
          : 'Todas as variantes da edição serão exibidas novamente. Continuar?';
      if (!confirm(confirmMsg)) return;
    }

    startScopeTransition(async () => {
      const result = await setCollectionScope(collection.id, newScope);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      if (result.cards) setCards(result.cards);
      if (result.collection) setCollection(result.collection);
      setMessage(
        result.added
          ? `Modo atualizado. ${result.added} cartas adicionadas.`
          : 'Modo atualizado — artes especiais ocultas.',
      );
    });
  };

  const handleRestore = () => {
    if (
      !confirm(
        'Restaurar TODAS as cartas da edição do Scryfall? Cartas que ainda existem mantêm suas quantidades; o que foi apagado volta zerado.',
      )
    ) {
      return;
    }
    startRestoreTransition(async () => {
      const result = await restoreSetCollectionCards(collection.id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      if (result.cards) setCards(result.cards);
      if (result.collection) setCollection(result.collection);
      setMessage(
        result.added
          ? `Restauradas ${result.added} cartas. Total: ${result.totalCards}.`
          : `Coleção restaurada com ${result.totalCards} cartas.`,
      );
    });
  };

  return (
    <div className="min-h-screen  text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link
          href="/my-collection"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Minhas coleções
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-8">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {collection.set_icon_svg_uri && (
              <img
                src={collection.set_icon_svg_uri}
                alt=""
                className="h-14 w-14 invert opacity-90 shrink-0"
              />
            )}
            <div className="min-w-0">
              <h1 className="truncate font-display text-3xl font-bold uppercase tracking-tight">{collection.set_name}</h1>
              <p className="text-muted-foreground uppercase tracking-wide text-sm mt-1">
                {collection.set_code}
                {collection.released_at ? ` · ${collection.released_at}` : ''}
              </p>
              <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground border border-white/15">
                {collectionScopeLabel(collection.collection_scope)}
              </span>
              <div className="mt-4 max-w-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium text-primary">
                    {ownedCount}/{collection.total_cards} ({pct}%)
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {isOwner && (
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-card/50 p-4 min-w-[240px]">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="public-toggle" className="flex items-center gap-2 text-sm">
                  {collection.is_public ? (
                    <Globe className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  {collection.is_public ? 'Pública' : 'Privada'}
                </Label>
                <Switch
                  id="public-toggle"
                  checked={collection.is_public}
                  onCheckedChange={togglePublic}
                  disabled={visPending}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Coleções públicas aparecem no seu perfil.
              </p>
              <div className="space-y-2 pt-1 border-t border-white/10">
                <Label className="text-sm text-foreground/80">Tipo de coleção</Label>
                <Select
                  value={collection.collection_scope}
                  onValueChange={(v) => handleScopeChange(v as CollectionScope)}
                  disabled={scopePending || syncPending}
                >
                  <SelectTrigger className="border-white/15 text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular_only">{collectionScopeLabel('regular_only')}</SelectItem>
                    <SelectItem value="all_printings">{collectionScopeLabel('all_printings')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {collectionScopeDescription(collection.collection_scope)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestore}
                disabled={restorePending || syncPending}
                className="border-primary/40 text-primary hover:bg-primary/10"
              >
                {restorePending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Restaurar cartas da edição
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deletePending}
                className="border-red-500/40 text-red-400 hover:bg-red-500/10"
              >
                {deletePending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Apagar coleção
              </Button>
            </div>
          )}
        </div>

        {collectionEmpty && isOwner && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-4">
            <div>
              <p className="text-red-200 font-medium">Sua coleção está vazia</p>
              <p className="text-sm text-red-300/80 mt-1">
                Isso pode ter ocorrido ao mudar para &quot;Somente regulares&quot;. Clique abaixo para
                recarregar todas as cartas da edição.
              </p>
            </div>
            <Button
              onClick={handleRestore}
              disabled={restorePending}
              className="shrink-0"
            >
              {restorePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restaurando…
                </>
              ) : (
                'Restaurar todas as cartas'
              )}
            </Button>
          </div>
        )}

        {cardsMismatch && (
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-primary text-sm">
            <span>
              {syncPending
                ? 'Sincronizando cartas faltantes com o Scryfall…'
                : `Carregadas ${scopedCards.length} de ${collection.total_cards} cartas.`}
            </span>
            {isOwner && !syncPending && (
              <Button
                size="sm"
                variant="outline"
                className="border-primary/40 text-primary shrink-0"
                onClick={() => {
                  startSyncTransition(async () => {
                    const result = await resyncSetCollectionCards(collection.id);
                    if (result.error) {
                      setMessage(result.error);
                      return;
                    }
                    if (result.cards) setCards(result.cards);
                    if (result.collection) setCollection(result.collection);
                    setMessage(
                      result.added
                        ? `${result.added} cartas adicionadas. Total: ${result.totalCards}.`
                        : `Coleção já está completa (${result.totalCards} cartas).`,
                    );
                  });
                }}
              >
                Sincronizar cartas
              </Button>
            )}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-primary text-sm">
            {message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou número…"
              className="pl-10 bg-card border-white/15"
            />
          </div>
          <Select
            value={ownershipFilter}
            onValueChange={(v) => setOwnershipFilter(v as typeof ownershipFilter)}
          >
            <SelectTrigger className="w-full sm:w-[160px] bg-card border-white/15">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="owned">Que tenho</SelectItem>
              <SelectItem value="missing">Que faltam</SelectItem>
            </SelectContent>
          </Select>
          <Select value={rarityFilter} onValueChange={setRarityFilter}>
            <SelectTrigger className="w-full sm:w-[160px] bg-card border-white/15">
              <SelectValue placeholder="Raridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Raridade</SelectItem>
              <SelectItem value="common">Common</SelectItem>
              <SelectItem value="uncommon">Uncommon</SelectItem>
              <SelectItem value="rare">Rare</SelectItem>
              <SelectItem value="mythic">Mythic</SelectItem>
              <SelectItem value="special">Special</SelectItem>
              <SelectItem value="bonus">Bonus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Mostrando {filtered.length} de {scopedCards.length} cartas
          {!isOwner && ' · visualização somente leitura'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((card) => {
            const owned = isOwned(card.quantities);
            const busy = pendingCardId === card.id;
            return (
              <div
                key={card.id}
                className={cn(
                  'rounded-xl border bg-card/60 overflow-hidden transition-colors',
                  owned ? 'border-primary/40' : 'border-white/10',
                )}
              >
                <div className="relative aspect-[63/88]">
                  {card.image_url ? (
                    <img
                      src={card.image_url}
                      alt={card.card_name}
                      className={cn(
                        'w-full h-full object-cover',
                        !owned && 'opacity-50 grayscale-[30%]',
                      )}
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
                      {card.card_name}
                    </div>
                  )}
                  <div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    #{card.collector_number}
                  </div>
                  {owned && (
                    <div className="absolute top-2 right-2 rounded bg-primary text-black px-2 py-0.5 text-[10px] font-bold">
                      ×{totalQty(card.quantities)}
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2">
                  <div>
                    <Link
                      href={`/card/cardId/${card.card_scryfall_id}`}
                      className="font-medium text-sm hover:text-primary line-clamp-1"
                    >
                      {card.card_name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground capitalize">{card.rarity}</p>
                  </div>

                  <div className="space-y-1.5">
                    {(card.available_finishes || []).map((finish) => {
                      const qty = Number(card.quantities?.[finish] || 0);
                      return (
                        <div
                          key={finish}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="text-muted-foreground truncate">{finishLabel(finish)}</span>
                          {isOwner ? (
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                disabled={busy || qty <= 0}
                                onClick={() => bumpQty(card, finish, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center font-mono tabular-nums">{qty}</span>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                disabled={busy || qty >= 99}
                                onClick={() => bumpQty(card, finish, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="font-mono tabular-nums">{qty}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            Nenhuma carta corresponde aos filtros.
          </div>
        )}
      </div>
    </div>
  );
}
