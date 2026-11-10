export type CollectionScope = 'all_printings' | 'regular_only';

export type FinishQuantities = Record<string, number>;

export type UserSetCollection = {
  id: string;
  user_id: string;
  set_code: string;
  set_name: string;
  set_icon_svg_uri: string | null;
  released_at: string | null;
  is_public: boolean;
  collection_scope: CollectionScope;
  total_cards: number;
  owned_cards: number;
  created_at: string;
  updated_at: string;
};

export type UserSetCollectionCard = {
  id: string;
  collection_id: string;
  card_scryfall_id: string;
  card_name: string;
  collector_number: string;
  rarity: string | null;
  mana_cost: string | null;
  type_line: string | null;
  colors: string[] | null;
  image_url: string | null;
  available_finishes: string[];
  quantities: FinishQuantities;
  is_regular?: boolean | null;
  created_at: string;
  updated_at: string;
};

const FINISH_LABELS: Record<string, string> = {
  nonfoil: 'Normal',
  foil: 'Foil',
  etched: 'Etched',
  glossy: 'Glossy',
};

export function finishLabel(finish: string): string {
  return FINISH_LABELS[finish] || finish;
}

const NON_COLLECTIBLE_LAYOUTS = new Set([
  'token',
  'emblem',
  'art_series',
  'double_faced_token',
  'planar',
  'scheme',
  'vanguard',
]);

const SPECIAL_FRAME_EFFECTS = new Set([
  'showcase',
  'extendedart',
  'shatteredglass',
  'inverted',
  'etched',
]);

const SPECIAL_PROMO_TYPES = new Set([
  'serialized',
  'surgefoil',
  'confettifoil',
  'galaxyfoil',
  'rainbowfoil',
  'prerelease',
  'release',
  'buyabox',
  'gameday',
  'judgegift',
  'promopack',
  'stamped',
  'alchemy',
  'rebalanced',
  'headliner',
  'bundle',
  'boosterfun',
]);

/** Promo types that do not mark a card as a special-art variant on their own. */
const BENIGN_PROMO_TYPES = new Set(['universesbeyond']);

export type RegularPrintingOptions = {
  /** When false, Scryfall omits booster slots (common in Universes Beyond sets). */
  setUsesBoosterFlag?: boolean;
};

/** True when Scryfall marks at least one card in the set as a booster slot. */
export function inferSetUsesBoosterFlag(
  cards: Array<{ booster?: boolean }>,
): boolean {
  return cards.some((card) => card.booster === true);
}

/** Standard booster printing — excludes borderless, showcase, promos, etc. */
export function isRegularSetPrinting(
  card: {
    layout?: string;
    digital?: boolean;
    border_color?: string;
    frame_effects?: string[];
    promo_types?: string[];
    promo?: boolean;
    booster?: boolean;
    collector_number?: string;
    lang?: string;
    games?: string[];
  },
  options: RegularPrintingOptions = {},
): boolean {
  const layout = card.layout ?? '';
  if (NON_COLLECTIBLE_LAYOUTS.has(layout)) return false;
  if (card.digital) return false;

  const collectorNumber = card.collector_number ?? '';
  // Arena / MTGA-only printings (e.g. A-38)
  if (/^A-\d/i.test(collectorNumber)) return false;
  // Variants like 383z, 123p (special printings in the same slot)
  if (/^\d+[a-z]+$/i.test(collectorNumber)) return false;

  const games = card.games ?? [];
  if (games.length > 0 && games.every((g) => g === 'arena')) return false;

  const border = card.border_color ?? '';
  if (border === 'borderless' || border === 'gold' || border === 'silver') return false;

  const frameEffects = card.frame_effects ?? [];
  if (frameEffects.some((effect) => SPECIAL_FRAME_EFFECTS.has(effect))) return false;

  const promoTypes = card.promo_types ?? [];
  if (promoTypes.some((type) => SPECIAL_PROMO_TYPES.has(type))) return false;

  if (border !== 'black') return false;

  const setUsesBoosterFlag = options.setUsesBoosterFlag ?? true;

  if (setUsesBoosterFlag) {
    // Promos outside booster slots (buy-a-box, etc.)
    if (card.promo && !card.booster) return false;
    if (!card.booster) return false;
    return true;
  }

  // Universes Beyond / sets without booster metadata on Scryfall
  if (card.promo && !card.booster) return false;
  if (promoTypes.some((type) => !BENIGN_PROMO_TYPES.has(type))) return false;

  return true;
}

export function filterCardsByScope<T extends Parameters<typeof isRegularSetPrinting>[0]>(
  cards: T[],
  scope: CollectionScope,
): T[] {
  if (scope === 'all_printings') return cards;
  const setUsesBoosterFlag = inferSetUsesBoosterFlag(cards);
  return cards.filter((card) => isRegularSetPrinting(card, { setUsesBoosterFlag }));
}

export function collectionScopeLabel(scope: CollectionScope): string {
  return scope === 'regular_only' ? 'Somente regulares' : 'Todas as versões';
}

export function collectionScopeDescription(scope: CollectionScope): string {
  return scope === 'regular_only'
    ? 'Cartas do booster com moldura padrão — sem borderless, showcase, extended art ou promos.'
    : 'Todas as impressões da edição, incluindo artes especiais e variantes.';
}

export function filterCollectionCardsForDisplay(
  cards: UserSetCollectionCard[],
  scope: CollectionScope,
): UserSetCollectionCard[] {
  if (scope !== 'regular_only') return cards;
  const flagsResolved = cards.some(
    (c) => c.is_regular === true || c.is_regular === false,
  );
  if (!flagsResolved) return cards;
  return cards.filter((c) => c.is_regular === true);
}

export function normalizeCollectionScope(scope?: string | null): CollectionScope {
  if (scope === 'regular_only') return 'regular_only';
  return 'all_printings';
}
