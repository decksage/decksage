'use server';

import { createClient } from '@/app/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ScryfallCard } from '@/app/lib/types';
import { fetchScryfallSetByCode, fetchAllCardsInSet } from '@/app/lib/scryfall';
import type {
  FinishQuantities,
  UserSetCollection,
  UserSetCollectionCard,
  CollectionScope,
} from '@/app/lib/setCollection';
import {
  filterCardsByScope,
  inferSetUsesBoosterFlag,
  isRegularSetPrinting,
  normalizeCollectionScope,
} from '@/app/lib/setCollection';

function cardImageUrl(card: ScryfallCard): string | null {
  return (
    card.image_uris?.normal ||
    card.card_faces?.[0]?.image_uris?.normal ||
    null
  );
}

function emptyQuantities(finishes: string[]): FinishQuantities {
  return Object.fromEntries(finishes.map((f) => [f, 0]));
}

function cardRowFromScryfall(
  collectionId: string,
  card: ScryfallCard,
  setUsesBoosterFlag: boolean,
) {
  const finishes =
    Array.isArray(card.finishes) && card.finishes.length > 0
      ? card.finishes
      : [card.foil && !card.nonfoil ? 'foil' : 'nonfoil'];

  return {
    collection_id: collectionId,
    card_scryfall_id: card.id,
    card_name: card.name,
    collector_number: card.collector_number,
    rarity: card.rarity ?? null,
    mana_cost: card.mana_cost ?? card.card_faces?.[0]?.mana_cost ?? null,
    type_line: card.type_line ?? null,
    colors: card.colors ?? card.card_faces?.[0]?.colors ?? [],
    image_url: cardImageUrl(card),
    available_finishes: finishes,
    quantities: emptyQuantities(finishes),
    is_regular: isRegularSetPrinting(card, { setUsesBoosterFlag }),
  };
}

function sortCollectionCards(cards: UserSetCollectionCard[]): UserSetCollectionCard[] {
  return [...cards].sort((a, b) =>
    a.collector_number.localeCompare(b.collector_number, undefined, {
      numeric: true,
      sensitivity: 'base',
    }),
  );
}

async function fetchAllCollectionCards(
  supabase: ReturnType<typeof createClient>,
  collectionId: string,
): Promise<UserSetCollectionCard[]> {
  const pageSize = 1000;
  let offset = 0;
  const all: UserSetCollectionCard[] = [];

  while (true) {
    const { data, error } = await supabase
      .from('user_set_collection_cards')
      .select('*')
      .eq('collection_id', collectionId)
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;
    all.push(...(data as UserSetCollectionCard[]));
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return sortCollectionCards(all);
}

async function insertCollectionCardRows(
  supabase: ReturnType<typeof createClient>,
  collectionId: string,
  cards: ScryfallCard[],
  setUsesBoosterFlag: boolean,
) {
  const rows = cards.map((card) =>
    cardRowFromScryfall(collectionId, card, setUsesBoosterFlag),
  );
  const batchSize = 200;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from('user_set_collection_cards').insert(batch);
    if (error) throw error;
  }
}

function resolveScope(scope?: CollectionScope | string | null): CollectionScope {
  return normalizeCollectionScope(scope);
}

function countOwnedCards(cards: UserSetCollectionCard[]): number {
  return cards.filter((c) =>
    Object.values(c.quantities || {}).some((n) => Number(n) > 0),
  ).length;
}

async function backfillRegularFlags(
  supabase: ReturnType<typeof createClient>,
  collectionId: string,
  setCode: string,
  searchUri: string | null | undefined,
): Promise<Set<string>> {
  const allScryfallCards = await fetchAllCardsInSet(setCode, searchUri);
  const regularCards = filterCardsByScope(allScryfallCards, 'regular_only');
  const regularIds = new Set(regularCards.map((c) => c.id));
  const allIds = allScryfallCards.map((c) => c.id);

  const { data: existingRows, error } = await supabase
    .from('user_set_collection_cards')
    .select('id, card_scryfall_id')
    .eq('collection_id', collectionId);

  if (error) throw error;

  const regularRowIds: string[] = [];
  const specialRowIds: string[] = [];

  for (const row of existingRows ?? []) {
    if (regularIds.has(row.card_scryfall_id)) {
      regularRowIds.push(row.id);
    } else if (allIds.includes(row.card_scryfall_id)) {
      specialRowIds.push(row.id);
    }
  }

  const batchSize = 100;
  for (let i = 0; i < regularRowIds.length; i += batchSize) {
    const batch = regularRowIds.slice(i, i + batchSize);
    const { error: updateError } = await supabase
      .from('user_set_collection_cards')
      .update({ is_regular: true })
      .in('id', batch);
    if (updateError && !updateError.message.includes('is_regular')) throw updateError;
  }

  for (let i = 0; i < specialRowIds.length; i += batchSize) {
    const batch = specialRowIds.slice(i, i + batchSize);
    const { error: updateError } = await supabase
      .from('user_set_collection_cards')
      .update({ is_regular: false })
      .in('id', batch);
    if (updateError && !updateError.message.includes('is_regular')) throw updateError;
  }

  return regularIds;
}

async function loadCardsForScope(
  supabase: ReturnType<typeof createClient>,
  collection: UserSetCollection,
  searchUri?: string | null,
): Promise<{ cards: UserSetCollectionCard[]; totalCards: number; ownedCards: number }> {
  const scope = resolveScope(collection.collection_scope);
  let cards = await fetchAllCollectionCards(supabase, collection.id);

  if (scope === 'regular_only') {
    const regularIds = await backfillRegularFlags(
      supabase,
      collection.id,
      collection.set_code,
      searchUri,
    );
    cards = cards.filter((c) => regularIds.has(c.card_scryfall_id));
    return {
      cards,
      totalCards: regularIds.size,
      ownedCards: countOwnedCards(cards),
    };
  }

  const allScryfall = await fetchAllCardsInSet(collection.set_code, searchUri);
  return {
    cards,
    totalCards: allScryfall.length,
    ownedCards: countOwnedCards(cards),
  };
}

async function syncCollectionCardsFromScryfall(
  supabase: ReturnType<typeof createClient>,
  collectionId: string,
  setCode: string,
  searchUri: string | null | undefined,
  scope: CollectionScope,
) {
  const allScryfallCards = await fetchAllCardsInSet(setCode, searchUri);
  if (allScryfallCards.length === 0) {
    throw new Error('Scryfall não retornou cartas — operação cancelada para proteger sua coleção.');
  }

  const scopedCards =
    scope === 'regular_only'
      ? filterCardsByScope(allScryfallCards, 'regular_only')
      : allScryfallCards;

  if (scopedCards.length === 0) {
    throw new Error('Nenhuma carta encontrada para este tipo de coleção.');
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('user_set_collection_cards')
    .select('card_scryfall_id')
    .eq('collection_id', collectionId);

  if (existingError) throw existingError;

  const existingIds = new Set((existingRows ?? []).map((r) => r.card_scryfall_id));
  const cardsToInsert =
    scope === 'regular_only' ? scopedCards : allScryfallCards;
  const missing = cardsToInsert.filter((c) => !existingIds.has(c.id));
  const setUsesBoosterFlag = inferSetUsesBoosterFlag(allScryfallCards);

  if (missing.length > 0) {
    await insertCollectionCardRows(supabase, collectionId, missing, setUsesBoosterFlag);
  }

  await backfillRegularFlags(supabase, collectionId, setCode, searchUri);

  const updatePayload: Record<string, unknown> = {
    total_cards: scopedCards.length,
    updated_at: new Date().toISOString(),
    collection_scope: scope,
  };

  const { error: updateError } = await supabase
    .from('user_set_collections')
    .update(updatePayload)
    .eq('id', collectionId);
  if (updateError) throw updateError;

  return {
    scopedCards,
    added: missing.length,
    removed: 0,
    totalCards: scopedCards.length,
  };
}

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null as null, error: 'Faça login para continuar.' };
  return { supabase, user, error: null as null };
}

/**
 * Creates a set collection and links cards from that edition.
 */
export async function createSetCollection(
  setCodeRaw: string,
  scope: CollectionScope = 'all_printings',
) {
  const setCode = setCodeRaw.trim().toLowerCase();
  if (!setCode) return { error: 'Informe o código da edição.' };
  const collectionScope = resolveScope(scope);

  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) return { error: authError || 'Não autenticado.' };

  const { data: existing } = await supabase
    .from('user_set_collections')
    .select('id')
    .eq('user_id', user.id)
    .eq('set_code', setCode)
    .maybeSingle();

  if (existing) {
    return { error: 'Você já tem uma coleção desta edição.', collectionId: existing.id };
  }

  const setInfo = await fetchScryfallSetByCode(setCode);
  if (!setInfo) {
    return { error: 'Edição não encontrada no Scryfall.' };
  }

  let cards: ScryfallCard[];
  let setUsesBoosterFlag = true;
  try {
    const allCards = await fetchAllCardsInSet(setCode, setInfo.search_uri);
    setUsesBoosterFlag = inferSetUsesBoosterFlag(allCards);
    cards = filterCardsByScope(allCards, collectionScope);
  } catch (e: any) {
    console.error(e);
    return { error: 'Não foi possível carregar as cartas da edição.' };
  }

  if (cards.length === 0) {
    return {
      error:
        collectionScope === 'regular_only'
          ? 'Nenhuma carta regular encontrada nesta edição.'
          : 'Nenhuma carta encontrada para esta edição.',
    };
  }

  const { data: collection, error: insertError } = await supabase
    .from('user_set_collections')
    .insert({
      user_id: user.id,
      set_code: setCode,
      set_name: setInfo.name,
      set_icon_svg_uri: setInfo.icon_svg_uri ?? null,
      released_at: setInfo.released_at ?? null,
      is_public: false,
      collection_scope: collectionScope,
      total_cards: cards.length,
      owned_cards: 0,
    })
    .select('*')
    .single();

  if (insertError || !collection) {
    console.error(insertError);
    return { error: 'Não foi possível criar a coleção.' };
  }

  try {
    await insertCollectionCardRows(supabase, collection.id, cards, setUsesBoosterFlag);
    await backfillRegularFlags(supabase, collection.id, setCode, setInfo.search_uri);
  } catch (cardsError) {
    console.error(cardsError);
    await supabase.from('user_set_collections').delete().eq('id', collection.id);
    return { error: 'Falha ao vincular as cartas. Tente novamente.' };
  }

  revalidatePath('/my-collection');
  revalidatePath(`/collections/${setCode}`);
  return { success: true, collectionId: collection.id as string };
}

export async function listMySetCollections(): Promise<{
  collections: UserSetCollection[];
  error?: string;
}> {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) return { collections: [], error: authError || undefined };

  const { data, error } = await supabase
    .from('user_set_collections')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error(error);
    return { collections: [], error: 'Não foi possível carregar suas coleções.' };
  }

  return { collections: (data || []) as UserSetCollection[] };
}

export async function getSetCollection(collectionId: string): Promise<{
  collection: UserSetCollection | null;
  cards: UserSetCollectionCard[];
  isOwner: boolean;
  error?: string;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: collection, error } = await supabase
    .from('user_set_collections')
    .select('*')
    .eq('id', collectionId)
    .maybeSingle();

  if (error || !collection) {
    return { collection: null, cards: [], isOwner: false, error: 'Coleção não encontrada.' };
  }

  const isOwner = !!user && user.id === collection.user_id;
  if (!isOwner && !collection.is_public) {
    return { collection: null, cards: [], isOwner: false, error: 'Coleção privada.' };
  }

  let cards: UserSetCollectionCard[] = [];
  let totalCards = collection.total_cards;
  let ownedCards = collection.owned_cards;

  try {
    const setInfo = await fetchScryfallSetByCode(collection.set_code);
    const loaded = await loadCardsForScope(
      supabase,
      {
        ...(collection as UserSetCollection),
        collection_scope: resolveScope(collection.collection_scope),
      },
      setInfo?.search_uri,
    );
    cards = loaded.cards;
    totalCards = loaded.totalCards;
    ownedCards = loaded.ownedCards;
  } catch (cardsError) {
    console.error(cardsError);
    return {
      collection: collection as UserSetCollection,
      cards: [],
      isOwner,
      error: 'Não foi possível carregar as cartas.',
    };
  }

  return {
    collection: {
      ...(collection as UserSetCollection),
      collection_scope: resolveScope(collection.collection_scope),
      total_cards: totalCards,
      owned_cards: ownedCards,
    },
    cards,
    isOwner,
  };
}

/** Re-fetch and align cards with the collection scope. */
export async function resyncSetCollectionCards(collectionId: string) {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) return { error: authError || 'Não autenticado.' };

  const { data: collection, error: collError } = await supabase
    .from('user_set_collections')
    .select('*')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (collError || !collection) return { error: 'Coleção não encontrada.' };

  const setInfo = await fetchScryfallSetByCode(collection.set_code);
  if (!setInfo) return { error: 'Edição não encontrada no Scryfall.' };

  const scope = resolveScope(collection.collection_scope as CollectionScope | undefined);

  try {
    const result = await syncCollectionCardsFromScryfall(
      supabase,
      collectionId,
      collection.set_code,
      setInfo.search_uri,
      scope,
    );

    revalidatePath(`/my-collection/${collectionId}`);
    revalidatePath('/my-collection');

    const loaded = await loadCardsForScope(
      supabase,
      {
        ...(collection as UserSetCollection),
        collection_scope: scope,
      },
      setInfo.search_uri,
    );
    return {
      success: true,
      added: result.added,
      removed: result.removed,
      totalCards: loaded.totalCards,
      cards: loaded.cards,
      collection: {
        ...collection,
        total_cards: loaded.totalCards,
        owned_cards: loaded.ownedCards,
        collection_scope: scope,
      } as UserSetCollection,
    };
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : 'Não foi possível sincronizar as cartas.';
    return { error: msg };
  }
}

export async function setCollectionScope(collectionId: string, scope: CollectionScope) {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) return { error: authError || 'Não autenticado.' };

  const { data: collection, error: collError } = await supabase
    .from('user_set_collections')
    .select('*')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (collError || !collection) return { error: 'Coleção não encontrada.' };

  const newScope = resolveScope(scope);
  const currentScope = resolveScope(collection.collection_scope as CollectionScope | undefined);
  const setInfo = await fetchScryfallSetByCode(collection.set_code);
  if (!setInfo) return { error: 'Edição não encontrada no Scryfall.' };

  if (newScope === currentScope) {
    const loaded = await loadCardsForScope(
      supabase,
      {
        ...(collection as UserSetCollection),
        collection_scope: newScope,
      },
      setInfo.search_uri,
    );
    return {
      success: true,
      added: 0,
      removed: 0,
      totalCards: loaded.totalCards,
      cards: loaded.cards,
      collection: {
        ...collection,
        total_cards: loaded.totalCards,
        owned_cards: loaded.ownedCards,
        collection_scope: newScope,
      } as UserSetCollection,
    };
  }

  try {
    const result = await syncCollectionCardsFromScryfall(
      supabase,
      collectionId,
      collection.set_code,
      setInfo.search_uri,
      newScope,
    );

    revalidatePath(`/my-collection/${collectionId}`);
    revalidatePath('/my-collection');

    const loaded = await loadCardsForScope(
      supabase,
      {
        ...(collection as UserSetCollection),
        collection_scope: newScope,
      },
      setInfo.search_uri,
    );
    return {
      success: true,
      added: result.added,
      removed: 0,
      totalCards: loaded.totalCards,
      cards: loaded.cards,
      collection: {
        ...collection,
        total_cards: loaded.totalCards,
        owned_cards: loaded.ownedCards,
        collection_scope: newScope,
      } as UserSetCollection,
    };
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : 'Não foi possível alterar o tipo da coleção.';
    return { error: msg };
  }
}

/** Restore all printings from the set (recovery after accidental deletion). */
export async function restoreSetCollectionCards(collectionId: string) {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) return { error: authError || 'Não autenticado.' };

  const { data: collection, error: collError } = await supabase
    .from('user_set_collections')
    .select('*')
    .eq('id', collectionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (collError || !collection) return { error: 'Coleção não encontrada.' };

  const setInfo = await fetchScryfallSetByCode(collection.set_code);
  if (!setInfo) return { error: 'Edição não encontrada no Scryfall.' };

  try {
    const result = await syncCollectionCardsFromScryfall(
      supabase,
      collectionId,
      collection.set_code,
      setInfo.search_uri,
      'all_printings',
    );

    revalidatePath(`/my-collection/${collectionId}`);
    revalidatePath('/my-collection');

    const loaded = await loadCardsForScope(
      supabase,
      {
        ...(collection as UserSetCollection),
        collection_scope: 'all_printings',
      },
      setInfo.search_uri,
    );
    return {
      success: true,
      added: result.added,
      totalCards: loaded.totalCards,
      cards: loaded.cards,
      collection: {
        ...collection,
        total_cards: loaded.totalCards,
        owned_cards: loaded.ownedCards,
        collection_scope: 'all_printings' as CollectionScope,
      } as UserSetCollection,
    };
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : 'Não foi possível restaurar as cartas.';
    return { error: msg };
  }
}

export async function updateCardFinishQuantity(input: {
  collectionId: string;
  cardId: string;
  finish: string;
  quantity: number;
}) {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) return { error: authError || 'Não autenticado.' };

  const qty = Math.max(0, Math.min(99, Math.floor(input.quantity)));

  const { data: collection } = await supabase
    .from('user_set_collections')
    .select('id, user_id, set_code, set_name')
    .eq('id', input.collectionId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!collection) return { error: 'Coleção não encontrada.' };

  const { data: card, error: cardError } = await supabase
    .from('user_set_collection_cards')
    .select('*')
    .eq('id', input.cardId)
    .eq('collection_id', input.collectionId)
    .maybeSingle();

  if (cardError || !card) return { error: 'Carta não encontrada na coleção.' };

  const finishes: string[] = card.available_finishes || [];
  if (!finishes.includes(input.finish)) {
    return { error: 'Acabamento inválido para esta carta.' };
  }

  const quantities: FinishQuantities = {
    ...(card.quantities || {}),
    [input.finish]: qty,
  };

  const { error: updateError } = await supabase
    .from('user_set_collection_cards')
    .update({
      quantities,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.cardId);

  if (updateError) {
    console.error(updateError);
    return { error: 'Não foi possível atualizar a quantidade.' };
  }

  // Keep flat physical collection in sync for deck "owned" checks
  const totalOwned = Object.values(quantities).reduce((sum, n) => sum + (Number(n) || 0), 0);
  if (totalOwned > 0) {
    await supabase.from('user_collections').upsert(
      {
        user_id: user.id,
        card_scryfall_id: card.card_scryfall_id,
        card_name: card.card_name,
        quantity: totalOwned,
        set_code: collection.set_code,
        set_name: collection.set_name,
        collector_number: card.collector_number,
        image_url: card.image_url,
        is_foil: (quantities.foil || 0) > 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id, card_scryfall_id' },
    );
  } else {
    await supabase
      .from('user_collections')
      .delete()
      .eq('user_id', user.id)
      .eq('card_scryfall_id', card.card_scryfall_id);
  }

  revalidatePath(`/my-collection/${input.collectionId}`);
  revalidatePath('/my-collection');
  return { success: true, quantities };
}

export async function setCollectionVisibility(collectionId: string, isPublic: boolean) {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) return { error: authError || 'Não autenticado.' };

  const { error } = await supabase
    .from('user_set_collections')
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq('id', collectionId)
    .eq('user_id', user.id);

  if (error) {
    console.error(error);
    return { error: 'Não foi possível atualizar a visibilidade.' };
  }

  revalidatePath(`/my-collection/${collectionId}`);
  revalidatePath('/my-collection');
  revalidatePath('/profile');
  return { success: true };
}

export async function deleteSetCollection(collectionId: string) {
  const { supabase, user, error: authError } = await requireUser();
  if (authError || !user) return { error: authError || 'Não autenticado.' };

  const { error } = await supabase
    .from('user_set_collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', user.id);

  if (error) {
    console.error(error);
    return { error: 'Não foi possível apagar a coleção.' };
  }

  revalidatePath('/my-collection');
  return { success: true };
}

export async function getMyCollectionForSet(setCode: string): Promise<{
  collectionId: string | null;
}> {
  const { supabase, user } = await requireUser();
  if (!user) return { collectionId: null };

  const { data } = await supabase
    .from('user_set_collections')
    .select('id')
    .eq('user_id', user.id)
    .eq('set_code', setCode.toLowerCase())
    .maybeSingle();

  return { collectionId: data?.id ?? null };
}

export async function listPublicSetCollectionsForUser(userId: string): Promise<UserSetCollection[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('user_set_collections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('updated_at', { ascending: false });

  return (data || []) as UserSetCollection[];
}
