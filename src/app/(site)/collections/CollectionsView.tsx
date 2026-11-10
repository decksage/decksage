/* eslint-disable no-unused-vars */
'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X, FilterX, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EmptyState from '@/app/(site)/components/page/EmptyState';
import type { ScryfallSet } from '@/app/lib/scryfall';

const PAGE_SIZE = 30;

const SET_TYPE_LABELS: Record<string, string> = {
  expansion: 'Expansão',
  core: 'Série principal',
  masters: 'Masters',
  commander: 'Commander',
  planechase: 'Planechase',
  archenemy: 'Archenemy',
  vanguard: 'Vanguard',
  funny: 'Humor',
  starter: 'Starter',
  box: 'Box set',
  promo: 'Promocional',
  token: 'Tokens',
  memorabilia: 'Memorabilia',
};

const getSetTypeLabel = (type: string) =>
  SET_TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');

const normalizeText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const TRIGGER = 'h-11 border-white/10 bg-white/[0.03] focus-visible:border-primary/60';

export default function CollectionsView({ sets }: { sets: ScryfallSet[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const deferredQuery = useDeferredValue(searchQuery);

  const filteredSets = useMemo(() => {
    const query = normalizeText(deferredQuery.trim());
    return sets.filter((set) => {
      const matchesSearch =
        !query || normalizeText(set.name).includes(query) || set.code.toLowerCase().includes(query);
      const matchesType = typeFilter === 'all' || set.set_type === typeFilter;
      const matchesYear = yearFilter === 'all' || set.released_at?.startsWith(yearFilter);
      return matchesSearch && matchesType && matchesYear;
    });
  }, [sets, deferredQuery, typeFilter, yearFilter]);

  const setTypes = useMemo(() => Array.from(new Set(sets.map((s) => s.set_type))).sort(), [sets]);
  const years = useMemo(
    () =>
      Array.from(
        new Set(sets.map((s) => s.released_at?.slice(0, 4)).filter(Boolean) as string[]),
      ).sort((a, b) => Number(b) - Number(a)),
    [sets],
  );

  const hasFilters = !!searchQuery || typeFilter !== 'all' || yearFilter !== 'all';
  const shown = filteredSets.slice(0, visible);

  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setVisible(PAGE_SIZE);
    };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setYearFilter('all');
    setVisible(PAGE_SIZE);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20">
      <div className="sticky-below-header z-30 -mx-6 border-b border-white/5 bg-background/85 px-6 py-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="collections-search" className="sr-only">
              Buscar coleção
            </label>
            <input
              id="collections-search"
              type="search"
              placeholder="Nome ou sigla — ex.: Bloomburrow, BLB"
              value={searchQuery}
              onChange={(e) => withReset(setSearchQuery)(e.target.value)}
              className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] pl-10 pr-10 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-white/[0.05] [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => withReset(setSearchQuery)('')}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <Select value={yearFilter} onValueChange={withReset(setYearFilter)}>
              <SelectTrigger aria-label="Ano" className={`${TRIGGER} w-full sm:w-36`}>
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all">Todos os anos</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={withReset(setTypeFilter)}>
              <SelectTrigger aria-label="Tipo de coleção" className={`${TRIGGER} w-full sm:w-52`}>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="max-h-[320px]">
                <SelectItem value="all">Todos os tipos</SelectItem>
                {setTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getSetTypeLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-11 shrink-0 px-3 text-muted-foreground"
              >
                <FilterX className="h-4 w-4" />
                <span className="hidden sm:inline">Limpar</span>
              </Button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
          <span className="font-semibold text-foreground tabular-nums">{filteredSets.length}</span>{' '}
          {filteredSets.length === 1 ? 'coleção' : 'coleções'}
        </p>
      </div>

      {filteredSets.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nenhuma coleção encontrada"
          description="Tente outro nome, sigla ou remova os filtros."
          action={
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          }
          className="mt-10"
        />
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((set) => (
            <li key={set.id}>
              <Link
                href={`/collections/${set.code}`}
                className="frame group flex h-full flex-col p-4 hover:-translate-y-0.5 hover:[--frame-border:color-mix(in_oklch,var(--primary)_70%,transparent)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {set.code}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {set.released_at?.slice(0, 4) || '—'}
                  </span>
                </div>
                <div className="grid flex-1 place-items-center py-6">
                  <img
                    src={set.icon_svg_uri}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                    decoding="async"
                    className="h-14 w-14 opacity-60 brightness-0 invert transition duration-300 group-hover:scale-110 group-hover:opacity-100"
                  />
                </div>
                <h3 className="line-clamp-2 min-h-[2.5em] text-sm font-semibold leading-tight group-hover:text-primary">
                  {set.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {getSetTypeLabel(set.set_type)} · {set.card_count} cartas
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {visible < filteredSets.length && (
        <div className="mt-10 flex flex-col items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="h-11 px-6"
          >
            Mostrar mais coleções
          </Button>
          <p className="text-xs text-muted-foreground">
            {shown.length} de {filteredSets.length}
          </p>
        </div>
      )}
    </div>
  );
}
