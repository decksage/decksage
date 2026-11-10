/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, FilterX, Layers, Search, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CardTile, { CardTileSkeleton } from '@/app/(site)/components/page/CardTile';
import EmptyState from '@/app/(site)/components/page/EmptyState';
import { MetaChip } from '@/app/(site)/components/page/PageHeader';
import StartSetCollectionButton from './components/StartSetCollectionButton';

interface SetInfo {
  name: string;
  released_at: string;
  card_count: number;
  icon_svg_uri: string;
}

interface CollectionDetailViewProps {
  setInfo: SetInfo;
  initialCards: any[];
  initialNextPage: string | null;
  setCode: string;
  existingCollectionId?: string | null;
  isAuthenticated?: boolean;
  ad?: React.ReactNode;
}

const AD_AFTER_CARD = 20;

const RARITIES = [
  ['common', 'Comum'],
  ['uncommon', 'Incomum'],
  ['rare', 'Rara'],
  ['mythic', 'Mítica'],
] as const;
const COLORS = [
  ['w', 'Branco'],
  ['u', 'Azul'],
  ['b', 'Preto'],
  ['r', 'Vermelho'],
  ['g', 'Verde'],
  ['m', 'Multicolor'],
  ['c', 'Incolor'],
] as const;
const TYPES = [
  ['creature', 'Criatura'],
  ['instant', 'Instantânea'],
  ['sorcery', 'Feitiço'],
  ['enchantment', 'Encantamento'],
  ['artifact', 'Artefato'],
  ['land', 'Terreno'],
  ['planeswalker', 'Planeswalker'],
] as const;

function buildUrl(setCode: string, search: string, rarity: string, color: string, type: string) {
  let query = `e:${setCode}`;
  if (search.trim()) query += ` ${search.trim()}`;
  if (rarity !== 'all') query += ` r:${rarity}`;
  if (color !== 'all') query += ` c:${color}`;
  if (type !== 'all') query += ` t:${type}`;
  return `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=set`;
}

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5';
const TRIGGER = 'h-11 w-full border-white/10 bg-white/[0.03] lg:w-40';

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={TRIGGER}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{label}: todas</SelectItem>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function CollectionDetailView({
  setInfo,
  initialCards,
  initialNextPage,
  setCode,
  existingCollectionId = null,
  isAuthenticated = false,
  ad,
}: CollectionDetailViewProps) {
  const [cards, setCards] = useState<any[]>(initialCards);
  const [nextPage, setNextPage] = useState<string | null>(initialNextPage);
  const [loading, setLoading] = useState<'append' | 'replace' | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const requestId = useRef(0);
  const lastUrl = useRef(buildUrl(setCode, '', 'all', 'all', 'all'));
  const sentinelRef = useRef<HTMLDivElement>(null);

  const hasFilters =
    !!searchQuery || rarityFilter !== 'all' || colorFilter !== 'all' || typeFilter !== 'all';

  const load = async (url: string, append: boolean) => {
    const id = ++requestId.current;
    setLoading(append ? 'append' : 'replace');
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (id !== requestId.current) return;
      const list = data.object === 'error' ? [] : (data.data ?? []);
      setCards((prev) => (append ? [...prev, ...list] : list));
      setNextPage(data.has_more ? data.next_page : null);
    } catch (error) {
      if (id === requestId.current) console.error('Erro ao buscar cartas:', error);
    } finally {
      if (id === requestId.current) setLoading(null);
    }
  };

  useEffect(() => {
    const url = buildUrl(setCode, searchQuery, rarityFilter, colorFilter, typeFilter);
    if (url === lastUrl.current) return;
    lastUrl.current = url;
    const timer = setTimeout(() => load(url, false), searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
  }, [setCode, searchQuery, rarityFilter, colorFilter, typeFilter]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !nextPage || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) load(nextPage, true);
      },
      { rootMargin: '600px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [nextPage, loading]);

  const clearFilters = () => {
    setSearchQuery('');
    setRarityFilter('all');
    setColorFilter('all');
    setTypeFilter('all');
  };

  const year = setInfo.released_at?.slice(0, 4);

  return (
    <>
      <header className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="absolute -left-40 -top-56 -z-10 h-[28rem] w-[46rem] bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_13%,transparent),transparent)]"
        />
        <div className="mx-auto max-w-7xl px-6 pb-8 pt-10 sm:pt-12">
          <Link
            href="/collections"
            className="rise group mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Todas as coleções
          </Link>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-5 sm:gap-7">
              <div className="frame rise grid h-20 w-20 shrink-0 place-items-center sm:h-28 sm:w-28">
                <img
                  src={setInfo.icon_svg_uri}
                  alt=""
                  width={64}
                  height={64}
                  className="h-11 w-11 brightness-0 invert sm:h-16 sm:w-16"
                />
              </div>
              <div className="min-w-0">
                <p className="rise kicker flex items-center gap-3 [--delay:40ms]">
                  <span className="mana-strip h-1 w-8" aria-hidden />
                  {setCode.toUpperCase()}
                  {year && ` · ${year}`}
                </p>
                <h1 className="rise mt-3 text-balance font-display text-3xl font-bold uppercase leading-[0.95] tracking-tight [--delay:80ms] sm:text-5xl lg:text-6xl">
                  {setInfo.name}
                </h1>
                <div className="rise mt-4 flex flex-wrap gap-2 [--delay:120ms]">
                  <MetaChip icon={Layers}>
                    <span className="font-semibold text-foreground tabular-nums">
                      {setInfo.card_count}
                    </span>{' '}
                    cartas
                  </MetaChip>
                  {setInfo.released_at && (
                    <MetaChip icon={Calendar}>
                      {new Date(`${setInfo.released_at}T12:00:00`).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </MetaChip>
                  )}
                </div>
              </div>
            </div>
            <div className="rise [--delay:160ms]">
              <StartSetCollectionButton
                setCode={setCode}
                existingCollectionId={existingCollectionId}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pb-20">
        <div className="sticky-below-header z-30 -mx-6 border-y border-white/5 bg-background/85 px-6 py-4 backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <label htmlFor="set-card-search" className="sr-only">
                Buscar carta nesta coleção
              </label>
              <input
                id="set-card-search"
                type="search"
                placeholder="Buscar carta nesta coleção"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] pl-10 pr-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-white/[0.05]"
              />
            </div>
            <div className="grid grid-cols-3 gap-3 lg:flex">
              <FilterSelect
                label="Raridade"
                value={rarityFilter}
                onChange={setRarityFilter}
                options={RARITIES}
              />
              <FilterSelect
                label="Cor"
                value={colorFilter}
                onChange={setColorFilter}
                options={COLORS}
              />
              <FilterSelect
                label="Tipo"
                value={typeFilter}
                onChange={setTypeFilter}
                options={TYPES}
              />
            </div>
            {hasFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-11 shrink-0 text-muted-foreground"
              >
                <FilterX className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {!loading && cards.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nenhuma carta encontrada"
            description="Ajuste os filtros ou busque por outro nome."
            action={
              hasFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              ) : undefined
            }
            className="mt-10"
          />
        ) : (
          <div
            className={`mt-8 ${GRID} transition-opacity duration-200 ${loading === 'replace' ? 'opacity-40' : ''}`}
            aria-busy={!!loading}
          >
            {cards.map((card, i) => (
              <Fragment key={card.id}>
                {i === AD_AFTER_CARD && ad && <div className="col-span-full py-4">{ad}</div>}
                <CardTile card={card} eager={i < 5} />
              </Fragment>
            ))}
            {loading === 'append' &&
              Array.from({ length: 10 }, (_, i) => <CardTileSkeleton key={`s-${i}`} />)}
          </div>
        )}
        <div ref={sentinelRef} aria-hidden className="h-px" />
      </div>
    </>
  );
}
