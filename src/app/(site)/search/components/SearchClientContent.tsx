'use client';

import { useSearchParams } from 'next/navigation';
import useSWRInfinite from 'swr/infinite';
import { useEffect, useRef, useState, useCallback } from 'react';
import { SearchX, AlertTriangle, Search as SearchIcon, Loader2 } from 'lucide-react';
import SearchFilters from '@/app/(site)/search/components/Filter';
import PageHeader, { MetaChip } from '@/app/(site)/components/page/PageHeader';
import EmptyState from '@/app/(site)/components/page/EmptyState';
import CardTile, { CardTileSkeleton } from '@/app/(site)/components/page/CardTile';
import GlobalSearch from '@/app/(site)/components/GlobalSearch';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erro na busca');
  return res.json();
};

interface MTGCard {
  id: string;
  name: string;
  image_uris?: { normal?: string; small?: string; art_crop?: string };
  card_faces?: { image_uris?: { normal?: string } }[];
  type_line?: string;
}

interface ApiResponse {
  data: MTGCard[];
  has_more: boolean;
  next_page?: string;
}

const COLOR_CODES: Record<string, { name: string; label: string }> = {
  W: { name: 'White', label: 'brancas' },
  U: { name: 'Blue', label: 'azuis' },
  B: { name: 'Black', label: 'pretas' },
  R: { name: 'Red', label: 'vermelhas' },
  G: { name: 'Green', label: 'verdes' },
  C: { name: 'Colorless', label: 'incolores' },
  M: { name: 'Multicolor', label: 'multicoloridas' },
};

function colorsFromParam(param: string | null) {
  return (param ?? '')
    .split(',')
    .map((c) => COLOR_CODES[c.trim().toUpperCase()]?.name)
    .filter((c): c is string => Boolean(c));
}

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5';

export default function SearchClientContent() {
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const colorParam = searchParams.get('colors');

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>(() => colorsFromParam(colorParam));
  const [selectedRarity, setSelectedRarity] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedSet, setSelectedSet] = useState<string>('');
  const [selectedCmc, setSelectedCmc] = useState<string[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<string>('');

  const [tempTypes, setTempTypes] = useState<string[]>(selectedTypes);
  const [tempColors, setTempColors] = useState<string[]>(selectedColors);
  const [tempRarity, setTempRarity] = useState<string[]>(selectedRarity);
  const [tempFormats, setTempFormats] = useState<string[]>(selectedFormats);
  const [tempSet, setTempSet] = useState<string>(selectedSet);
  const [tempCmc, setTempCmc] = useState<string[]>(selectedCmc);
  const [tempArtist, setTempArtist] = useState<string>(selectedArtist);

  useEffect(() => {
    const colors = colorsFromParam(colorParam);
    setSelectedColors(colors);
    setTempColors(colors);
  }, [colorParam]);

  const hasFilters =
    selectedTypes.length > 0 ||
    selectedColors.length > 0 ||
    selectedRarity.length > 0 ||
    selectedFormats.length > 0 ||
    !!selectedSet ||
    selectedCmc.length > 0 ||
    !!selectedArtist;
  const canSearch = !!query || hasFilters;

  const getKey = (pageIndex: number, previousPageData: ApiResponse | null): string | null => {
    if (!canSearch) return null;
    if (previousPageData && !previousPageData.has_more) return null;

    const params = new URLSearchParams();
    if (query) params.set('q', query);
    params.set('page', (pageIndex + 1).toString());
    if (selectedTypes.length) params.set('types', selectedTypes.join(','));
    if (selectedColors.length) params.set('colors', selectedColors.join(','));
    if (selectedRarity.length) params.set('rarity', selectedRarity.join(','));
    if (selectedFormats.length) params.set('formats', selectedFormats.join(','));
    if (selectedSet) params.set('set', selectedSet);
    if (selectedCmc.length) params.set('cmc', selectedCmc.join(','));
    if (selectedArtist) params.set('artist', selectedArtist);

    return `/api/search?${params.toString()}`;
  };

  const { data, error, size, setSize, isLoading, isValidating } = useSWRInfinite<ApiResponse>(
    getKey,
    fetcher,
    { revalidateFirstPage: false, revalidateOnFocus: false, revalidateIfStale: false },
  );

  const isLoadingInitialData = !data && !error && isLoading;
  const isLoadingMore =
    isLoadingInitialData ||
    (size > 0 && data && typeof data[size - 1] === 'undefined') ||
    (isLoading && size > 0);

  const isEmpty = data?.[0]?.data?.length === 0 && !isLoadingInitialData;
  const hasMore = data?.[data.length - 1]?.has_more === true;
  const cards: MTGCard[] = data ? data.flatMap((page) => page.data) : [];

  const loaderRef = useRef<HTMLDivElement>(null);

  const handleApplyFilters = useCallback(() => {
    setSelectedTypes(tempTypes);
    setSelectedColors(tempColors);
    setSelectedRarity(tempRarity);
    setSelectedFormats(tempFormats);
    setSelectedSet(tempSet);
    setSelectedCmc(tempCmc);
    setSelectedArtist(tempArtist);
    setSize(1);
  }, [tempTypes, tempColors, tempRarity, tempFormats, tempSet, tempCmc, tempArtist, setSize]);

  const handleOpenFilters = useCallback(() => {
    setTempTypes(selectedTypes);
    setTempColors(selectedColors);
    setTempRarity(selectedRarity);
    setTempFormats(selectedFormats);
    setTempSet(selectedSet);
    setTempCmc(selectedCmc);
    setTempArtist(selectedArtist);
  }, [
    selectedTypes,
    selectedColors,
    selectedRarity,
    selectedFormats,
    selectedSet,
    selectedCmc,
    selectedArtist,
  ]);

  useEffect(() => {
    if (!loaderRef.current || !hasMore || isLoadingMore || isValidating) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setSize((prev) => prev + 1);
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isValidating, setSize]);

  const colorLabel =
    !query && selectedColors.length === 1
      ? Object.values(COLOR_CODES).find((c) => c.name === selectedColors[0])?.label
      : undefined;
  const title = query ? (
    <>
      <span className="text-muted-foreground">“</span>
      {query}
      <span className="text-muted-foreground">”</span>
    </>
  ) : colorLabel ? (
    `Cartas ${colorLabel}`
  ) : (
    'Buscar cartas'
  );

  const filters = (
    <SearchFilters
      selectedTypes={tempTypes}
      setSelectedTypes={setTempTypes}
      selectedColors={tempColors}
      setSelectedColors={setTempColors}
      selectedRarity={tempRarity}
      setSelectedRarity={setTempRarity}
      selectedFormats={tempFormats}
      setSelectedFormats={setTempFormats}
      selectedSet={tempSet}
      setSelectedSet={setTempSet}
      selectedCmc={tempCmc}
      setSelectedCmc={setTempCmc}
      selectedArtist={tempArtist}
      setSelectedArtist={setTempArtist}
      onApplyFilters={handleApplyFilters}
      onOpen={handleOpenFilters}
    />
  );

  return (
    <>
      <PageHeader
        kicker={query ? 'Resultados da busca' : 'Busca de cartas'}
        title={title}
        description={
          canSearch
            ? 'Toque em uma carta para ver o texto traduzido, a legalidade nos formatos e os detalhes.'
            : 'Digite o nome de uma carta, em qualquer idioma, ou use os filtros.'
        }
        meta={
          cards.length > 0 ? (
            <MetaChip icon={SearchIcon}>
              {cards.length}
              {hasMore ? '+' : ''} cartas
            </MetaChip>
          ) : undefined
        }
        actions={canSearch ? filters : undefined}
      >
        {!canSearch && (
          <div className="mt-8 flex max-w-xl items-center gap-3">
            <GlobalSearch className="flex-1" />
            {filters}
          </div>
        )}
      </PageHeader>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:py-12">
        {!canSearch ? (
          <EmptyState
            icon={SearchIcon}
            title="Nenhuma busca ainda"
            description="Experimente “Sol Ring”, “dragão” ou filtre por cor, tipo e raridade."
          />
        ) : error && !isLoadingInitialData ? (
          <EmptyState
            tone="error"
            icon={AlertTriangle}
            title="Erro ao buscar resultados"
            description="Tente novamente em instantes ou use outro termo de busca."
          />
        ) : isEmpty ? (
          <EmptyState
            icon={SearchX}
            title="Nenhuma carta encontrada"
            description={
              query
                ? `Nada encontrado para “${query}” com os filtros atuais. Tente outro termo ou remova filtros.`
                : 'Nenhuma carta corresponde aos filtros atuais.'
            }
          />
        ) : (
          <div className={GRID}>
            {cards.map((card, i) => (
              <CardTile key={card.id} card={card} eager={i < 10} />
            ))}
            {isLoadingMore &&
              Array.from({ length: isLoadingInitialData ? 10 : 5 }).map((_, i) => (
                <CardTileSkeleton key={`s-${i}`} />
              ))}
          </div>
        )}

        <div ref={loaderRef} className="h-10 w-full" />
        {hasMore && isValidating && !isLoadingInitialData && (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando mais cartas…
          </p>
        )}
      </div>
    </>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-10 space-y-4">
        <div className="h-3 w-40 animate-pulse rounded bg-white/[0.06]" />
        <div className="h-12 w-2/3 animate-pulse rounded bg-white/[0.06]" />
      </div>
      <div className={GRID}>
        {Array.from({ length: 10 }).map((_, i) => (
          <CardTileSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
