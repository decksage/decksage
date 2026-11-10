/* eslint-disable no-undef */
/* eslint-disable no-console */
// app/lib/scryfall.ts

// --- INTERFACE PRINCIPAL PARA CARTAS ---
// Esta interface define a estrutura de dados de uma carta da API Scryfall.
// export interface ScryfallCard {
//   collector_number: any;
//   set: any;
//   id: string;
//   name: string;
//   printed_name?: string; // Nome impresso na carta (pode ser em português)
//   lang: string;
//   mana_cost?: string;
//   cmc: number;
//   type_line: string;
//   oracle_text?: string;
//   colors?: string[];
//   color_identity: string[];
//   rarity: string;
//   set_name: string;
//   legalities: {
//     standard: string;
//     modern: string;
//     pauper: string;
//     commander: string;
//     legacy: string;
//     vintage: string;
//     pioneer: string;
//     [key: string]: string;
//   };
//   prices: { // Campo adicionado para corrigir o erro de build
//     usd: string | null;
//     usd_foil: string | null;
//     eur: string | null;
//     eur_foil: string | null;
//     tix: string | null;
//   };
//   image_uris?: {
//     small: string;
//     normal: string;
//     large: string;
//     art_crop: string;
//     border_crop: string;
//   };
//   // Adicione outros campos que precisar aqui
// }
import type { ScryfallCard } from './types';

// --- Funções para buscar dados no Scryfall ---

/**
 * Busca os dados completos de uma carta pelo seu ID do Scryfall.
 * @param scryfallId - O UUID da carta no Scryfall.
 * @returns Um objeto ScryfallCard completo ou null.
 */

export async function fetchAutocomplete(query: string): Promise<{ data: string[] }> {
  if (!query || typeof query !== 'string') {
    throw new Error('Query de autocomplete inválida');
  }
  const res = await scryfallFetch(
    `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`,
    { cache: 'no-store' },
  );
  if (!res.ok) {
    throw new Error(`Erro no autocomplete: ${res.status} - ${res.statusText}`);
  }
  return res.json();
}

/**
 * Busca carta por ID UUID do Scryfall.
 */
export async function fetchCardById(scryfallId: string): Promise<ScryfallCard | null> {
  if (!scryfallId || scryfallId === 'undefined') return null;

  try {
    const response = await scryfallFetch(`https://api.scryfall.com/cards/${scryfallId}`);

    if (!response.ok) {
      console.error(`Erro Scryfall ID: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Falha ao buscar por ID:', error);
    return null;
  }
}

/**
 * Busca carta por nome. Tenta busca exata, se falhar, tenta fuzzy.
 */
export async function fetchCardByName(
  name: string,
  exact: boolean = true,
): Promise<ScryfallCard | null> {
  if (!name || name === 'undefined') return null;

  const param = exact ? 'exact' : 'fuzzy';
  const url = `https://api.scryfall.com/cards/named?${param}=${encodeURIComponent(name)}`;

  try {
    const res = await scryfallFetch(url, { cache: 'no-store' });

    if (res.status === 404) {
      if (exact) {
        console.log(`Exata não encontrada para "${name}", tentando fuzzy...`);
        return fetchCardByName(name, false);
      }
      return null;
    }

    if (!res.ok) return null;

    return await res.json();
  } catch (error) {
    console.error('Erro em fetchCardByName:', error);
    return null;
  }
}

export async function fetchSearchResults(
  query: string,
  page: number = 1,
): Promise<{ data: ScryfallCard[]; has_more: boolean; next_page?: string }> {
  if (!query || typeof query !== 'string') {
    throw new Error('Query de busca inválida');
  }

  const res = await scryfallFetch(
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&page=${page}`,
  );

  if (res.status === 404) {
    return { data: [], has_more: false };
  }

  if (!res.ok) {
    throw new Error(`Erro na busca: ${res.status} - ${res.statusText}`);
  }

  return res.json();
}

export async function fetchFilteredSearchResults(
  query: string,
  filters: {
    types?: string[];
    colors?: string[];
    rarity?: string[];
    formats?: string[];
    set?: string;
    cmc?: string[];
    artist?: string;
  },
  page: number = 1,
): Promise<{ data: ScryfallCard[]; has_more: boolean; next_page?: string }> {
  if (typeof query !== 'string') {
    throw new Error('Query de busca inválida');
  }

  let scryfallQuery = query.trim();

  if (filters.types?.length) {
    scryfallQuery += ` ${filters.types.map((t) => `t:${t.toLowerCase()}`).join(' ')}`;
  }
  if (filters.colors?.length) {
    const colorMap: Record<string, string> = {
      White: 'W',
      Blue: 'U',
      Black: 'B',
      Red: 'R',
      Green: 'G',
      Colorless: 'C',
      Multicolor: 'M',
    };
    const colorCodes = filters.colors
      .map((c) => colorMap[c] || c)
      .filter((c) => c)
      .join('');
    if (colorCodes) {
      scryfallQuery += ` c:${colorCodes}`;
    }
  }
  if (filters.rarity?.length) {
    scryfallQuery += ` ${filters.rarity.map((r) => `r:${r.toLowerCase()}`).join(' ')}`;
  }
  if (filters.formats?.length) {
    scryfallQuery += ` ${filters.formats.map((f) => `f:${f.toLowerCase()}`).join(' ')}`;
  }
  if (filters.set) {
    scryfallQuery += ` e:${filters.set.toLowerCase()}`;
  }
  if (filters.cmc?.length) {
    const cmcQueries = filters.cmc.map((cmc) =>
      cmc.startsWith('>') || cmc.startsWith('<') || cmc.startsWith('=') || cmc.startsWith('!=')
        ? `cmc${cmc}`
        : `cmc=${cmc}`,
    );
    scryfallQuery += ` (${cmcQueries.join(' or ')})`;
  }
  if (filters.artist) {
    scryfallQuery += ` a:"${filters.artist}"`;
  }

  try {
    const res = await scryfallFetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(scryfallQuery)}&page=${page}`,
    );

    if (res.status === 404) {
      return { data: [], has_more: false, next_page: undefined };
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `Erro na busca filtrada do Scryfall: ${res.status} - ${errorData.details || res.statusText}`,
      );
    }

    const result = await res.json();
    return {
      data: result.data || [],
      has_more: result.has_more || false,
      next_page: result.next_page,
    };
  } catch (error: any) {
    console.error('Exceção em fetchFilteredSearchResults:', error);
    throw new Error(`Falha na requisição para Scryfall: ${error.message}`);
  }
}

// --- Funções para buscar coleções e cartas em lote ---

export interface ScryfallSet {
  object: 'set';
  id: string;
  code: string;
  name: string;
  released_at: string;
  set_type: string;
  icon_svg_uri: string;
  digital: boolean;
  card_count?: number;
  uri?: string;
  search_uri?: string;
}

export interface ScryfallApiListResponse<T> {
  object: 'list';
  has_more: boolean;
  data: T[];
}

const SCRYFALL_USER_AGENT = 'DeckSage/1.0 (https://decksage.com.br; set-collections)';

/** Fetch helper with Scryfall-required User-Agent. */
export async function scryfallFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'User-Agent': SCRYFALL_USER_AGENT,
      ...(init?.headers ?? {}),
    },
  });
}

function isCollectibleSet(set: ScryfallSet): boolean {
  return set.set_type !== 'funny' && set.set_type !== 'token' && set.digital === false;
}

export async function fetchAllScryfallSets(): Promise<ScryfallSet[]> {
  const response = await scryfallFetch('https://api.scryfall.com/sets', {
    next: { revalidate: 86400 },
  });
  if (!response.ok) {
    throw new Error(`Erro na API Scryfall (sets): ${response.status}`);
  }
  const result: ScryfallApiListResponse<ScryfallSet> = await response.json();
  return (result.data ?? [])
    .filter(isCollectibleSet)
    .sort((a, b) => (a.released_at < b.released_at ? 1 : -1));
}

export async function fetchScryfallSetByCode(code: string): Promise<ScryfallSet | null> {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return null;

  const response = await scryfallFetch(
    `https://api.scryfall.com/sets/${encodeURIComponent(normalized)}`,
    {
      cache: 'no-store',
    },
  );
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Erro ao buscar edição ${normalized}: ${response.status}`);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  if (
    payload.object === 'error' ||
    payload.digital === true ||
    payload.set_type === 'funny' ||
    payload.set_type === 'token'
  ) {
    return null;
  }
  return payload as unknown as ScryfallSet;
}

export async function searchScryfallSets(query: string, limit = 50): Promise<ScryfallSet[]> {
  const q = query.trim().toLowerCase();

  if (q && /^[a-z0-9]{2,6}$/.test(q)) {
    const direct = await fetchScryfallSetByCode(q);
    if (direct) return [direct];
  }

  const all = await fetchAllScryfallSets();
  if (!q) return all.slice(0, limit);

  return all
    .filter(
      (set) =>
        set.name.toLowerCase().includes(q) ||
        set.code.toLowerCase().includes(q) ||
        set.set_type.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

function scryfallSleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetches every printing in a set, following Scryfall pagination. */
export async function fetchAllCardsInSet(
  setCode: string,
  searchUri?: string | null,
): Promise<ScryfallCard[]> {
  const cards: ScryfallCard[] = [];
  let url: string | null =
    searchUri ??
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(
      `e:${setCode}`,
    )}&order=set&unique=prints&include_extras=true&include_variations=true`;

  while (url) {
    const res = await scryfallFetch(url, { cache: 'no-store' });
    if (res.status === 404) break;
    if (!res.ok) {
      throw new Error(`Falha ao buscar cartas do set ${setCode}: ${res.status}`);
    }
    const json = (await res.json()) as {
      object?: string;
      data?: ScryfallCard[];
      has_more?: boolean;
      next_page?: string;
      details?: string;
      code?: string;
    };
    if (json.object === 'error') {
      throw new Error(json.details || `Scryfall: ${json.code}`);
    }
    cards.push(...(json.data ?? []));
    url = json.has_more ? (json.next_page ?? null) : null;
    if (url) await scryfallSleep(100);
  }

  return cards;
}

export interface SetData {
  name: string;
  code: string;
  iconUrl?: string;
}

const VALID_SET_TYPES = ['expansion', 'core', 'masters', 'draft_innovation', 'commander'];

export async function fetchLatestSets(count: number = 5): Promise<SetData[]> {
  try {
    const response = await scryfallFetch('https://api.scryfall.com/sets', {
      next: { revalidate: 86400 },
    });
    if (!response.ok) {
      throw new Error(`Erro na API Scryfall (sets): ${response.statusText}`);
    }

    const result: ScryfallApiListResponse<ScryfallSet> = await response.json();
    const latestValidSets = result.data
      .filter(
        (set) =>
          !set.digital &&
          VALID_SET_TYPES.includes(set.set_type) &&
          new Date(set.released_at) <= new Date(),
      )
      .slice(0, count)
      .map((set) => ({
        name: set.name,
        code: set.code,
        iconUrl: set.icon_svg_uri,
      }));

    return latestValidSets;
  } catch (error: any) {
    console.error('Falha ao buscar últimas coleções:', error);
    return [];
  }
}

export async function fetchCardsByNames(names: string[]): Promise<ScryfallCard[]> {
  if (!names || !Array.isArray(names) || names.length === 0) {
    return [];
  }

  const batches = [];
  for (let i = 0; i < names.length; i += 75) {
    batches.push(names.slice(i, i + 75));
  }

  const results: ScryfallCard[] = [];

  for (const batch of batches) {
    try {
      const res = await scryfallFetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: batch.map((name) => ({ name })) }),
      });

      if (!res.ok) {
        console.error(`Erro ao buscar lote de cartas: ${res.status} - ${await res.text()}`);
        continue;
      }

      const json = await res.json();
      const data = json.data || [];
      const notFound = json.not_found || [];

      results.push(...data);

      // Fallback para cartas não encontradas (principalmente dupla-face)
      if (notFound.length > 0) {
        const namesToRetry: string[] = [];

        for (const item of notFound) {
          // Se o objeto not_found tiver 'name' e esse nome tiver '//', tentamos a frente
          if (item.name && typeof item.name === 'string' && item.name.includes(' // ')) {
            const frontName = item.name.split(' // ')[0].trim();
            console.log(
              `fetchCardsByNames: Retentando carta não encontrada "${item.name}" como "${frontName}"`,
            );
            namesToRetry.push(frontName);
          } else {
            console.warn(`fetchCardsByNames: Carta não encontrada e sem fallback: "${item.name}"`);
          }
        }

        if (namesToRetry.length > 0) {
          // Chamada recursiva segura (apenas uma vez, pois nomes simples não têm //)
          const retriedCards = await fetchCardsByNames(namesToRetry);
          console.log(`fetchCardsByNames: Recuperadas ${retriedCards.length} cartas via fallback.`);
          results.push(...retriedCards);
        }
      }
    } catch (error) {
      console.error('Erro na requisição do lote de cartas:', error);
    }
  }

  return results;
}

// Em app/lib/scryfall.ts
export async function searchCards(query: string, filters: { type_line?: string } = {}) {
  const params = new URLSearchParams({ q: `${query} ${filters.type_line || ''}` });
  const response = await scryfallFetch(`https://api.scryfall.com/cards/search?${params}`);
  return response.json();
}

// Agrupa cartas por tipo de linha (type_line)
export function groupCardsByType(cards: (ScryfallCard & { count: number })[]) {
  return cards.reduce<Record<string, (ScryfallCard & { count: number })[]>>((acc, card) => {
    const typeKey = extractCardTypes(card.type_line || 'Outros');
    if (!acc[typeKey]) acc[typeKey] = [];
    acc[typeKey].push(card);
    return acc;
  }, {});
}

// Extrai o tipo primário da carta para agrupamento
function extractCardTypes(typeLine: string): string {
  const parts = typeLine.split('—')[0].trim().split(' ');
  const types = [
    'Creature',
    'Instant',
    'Sorcery',
    'Enchantment',
    'Artifact',
    'Land',
    'Planeswalker',
    'Battle',
  ];
  return types.find((t) => parts.includes(t)) || 'Outros';
}

// Simula atualização do nome do deck (você pode adaptar para Supabase, localStorage, etc.)
export async function updateDeckName(deckId: string, newName: string): Promise<void> {
  // Simulação: no app real, você poderia salvar no Supabase, Firestore ou outro backend
  console.log(`Atualizando nome do deck ${deckId} para "${newName}"`);
  return new Promise((resolve) => setTimeout(resolve, 300)); // Simula atraso
}

/**
 * Busca por cartas na API do Scryfall usando o endpoint de busca geral.
 * Retorna uma lista de objetos de carta completos.
 */

export async function fetchAutocompleteNames(query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  try {
    const res = await scryfallFetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('Erro na busca de autocomplete do Scryfall:', error);
    return [];
  }
}

/**
 * FUNÇÃO ATUALIZADA: Agora busca com uma query mais flexível.
 */
export async function searchScryfallCards(query: string): Promise<ScryfallCard[]> {
  if (!query || query.length < 2) {
    return [];
  }

  // A query agora espera termos exatos, que vamos construir no frontend
  const params = new URLSearchParams({
    q: query,
    unique: 'cards',
  });

  try {
    const response = await scryfallFetch(
      `https://api.scryfall.com/cards/search?${params.toString()}`,
    );
    if (!response.ok) {
      if (response.status === 404) return [];
      const errorDetails = await response.json().catch(() => ({}));
      console.error('Scryfall search API error:', errorDetails);
      return [];
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Falha ao buscar cartas no Scryfall:', error);
    return [];
  }
}

/**
 * Busca os dados de uma única carta, incluindo o preço em USD, da API do Scryfall.
 * @param cardName - O nome exato da carta.
 * @returns O preço em USD ou null se não for encontrado.
 */
export async function getCardPriceFromScryfall(cardName: string): Promise<number | null> {
  if (!cardName) return null;

  try {
    // A API do Scryfall tem um endpoint para buscar pelo nome exato
    const url = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`;

    const response = await scryfallFetch(url, { cache: 'no-store' });

    if (!response.ok) {
      // Se a carta não for encontrada (404) ou houver outro erro, retorna null
      console.error(`Scryfall API error for "${cardName}": ${response.statusText}`);
      return null;
    }

    const cardData = await response.json();

    // O objeto de preços pode ter vários valores (usd, usd_foil, eur, etc.)
    // Vamos pegar o preço normal em USD como referência.
    const priceUsd = cardData?.prices?.usd;

    if (priceUsd) {
      return parseFloat(priceUsd);
    }

    return null; // Retorna null se não houver preço em USD
  } catch (error) {
    console.error(`Failed to fetch price for "${cardName}" from Scryfall:`, error);
    return null;
  }
}
