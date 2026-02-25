'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, FilterX, Layers, Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CardItem } from './components/CardItem';
import { SkeletonCard } from './components/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface SetInfo {
  name: string;
  released_at: string;
  card_count: number;
  icon_svg_uri: string;
  uri: string;
  search_uri: string;
}

interface CollectionDetailViewProps {
  setInfo: SetInfo;
  initialCards: any[];
  setCode: string;
}

export default function CollectionDetailView({
  setInfo,
  initialCards,
  setCode,
}: CollectionDetailViewProps) {
  const [cards, setCards] = useState<any[]>(initialCards);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [colorFilter, setColorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const observer = useRef<IntersectionObserver | undefined>(undefined);

  // Initial fetch for pagination logic if needed, but we might want to rely on the search API for filtering
  // Scryfall API allows filtering in the query string.
  // Ideally, we should rebuild the query URL when filters change.

  const buildSearchUrl = useCallback(
    (pageUrl?: string) => {
      if (pageUrl) return pageUrl;

      let query = `e:${setCode}`;
      if (searchQuery) query += ` ${searchQuery}`;
      if (rarityFilter !== 'all') query += ` r:${rarityFilter}`;
      if (colorFilter !== 'all') query += ` c:${colorFilter}`;
      if (typeFilter !== 'all') query += ` t:${typeFilter}`;

      return `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=set`;
    },
    [setCode, searchQuery, rarityFilter, colorFilter, typeFilter],
  );

  const fetchCards = useCallback(
    async (isNewSearch = false) => {
      if (loading) return;
      setLoading(true);

      try {
        const url = isNewSearch ? buildSearchUrl() : nextPage;
        if (!url) {
          setLoading(false);
          return;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (data.code === 'not_found') {
          setCards([]);
          setHasMore(false);
          setNextPage(null);
        } else {
          setCards((prev) => (isNewSearch ? data.data : [...prev, ...data.data]));
          setNextPage(data.has_more ? data.next_page : null);
          setHasMore(data.has_more);
        }
      } catch (error) {
        console.error('Error fetching cards:', error);
      } finally {
        setLoading(false);
      }
    },
    [buildSearchUrl, nextPage, loading],
  );

  // Effect to trigger search when filters change
  useEffect(() => {
    // Debounce search query could be added here if needed, sticking to simple effect for now
    const timer = setTimeout(() => {
      fetchCards(true);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, rarityFilter, colorFilter, typeFilter]); // Re-run when filters change

  const lastCardRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && nextPage) {
          fetchCards(false);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, nextPage, fetchCards],
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      {/* Header with Glassmorphism */}
      <header className="relative bg-neutral-900 border-b border-neutral-800 pb-8 pt-8 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />

        <div className="container mx-auto max-w-7xl relative z-10">
          <Link
            href="/collections"
            className="inline-flex items-center text-neutral-400 hover:text-amber-500 mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Coleções
          </Link>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="bg-neutral-800 p-4 rounded-2xl shadow-xl border border-neutral-700/50">
              <img
                src={setInfo.icon_svg_uri}
                alt={setInfo.name}
                className="w-16 h-16 md:w-20 md:h-20 filter invert brightness-0 opacity-90"
              />
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                {setInfo.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-neutral-400">
                <span className="flex items-center gap-1.5 bg-neutral-800/50 px-3 py-1 rounded-full border border-neutral-700/50">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  {setInfo.released_at}
                </span>
                <span className="flex items-center gap-1.5 bg-neutral-800/50 px-3 py-1 rounded-full border border-neutral-700/50">
                  <Layers className="h-4 w-4 text-amber-500" />
                  {setInfo.card_count} cartas
                </span>
                <span className="flex items-center gap-1.5 bg-neutral-800/50 px-3 py-1 rounded-full border border-neutral-700/50 uppercase font-mono tracking-wider">
                  {setCode}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-7xl p-4 md:p-8 space-y-8">
        {/* Filters Bar */}
        <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 p-4 md:p-6 rounded-2xl flex flex-col xl:flex-row gap-4 sticky top-4 z-30 shadow-2xl shadow-black/50 transition-all duration-300">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 h-5 w-5" />
            <Input
              placeholder="Buscar carta..."
              className="pl-12 h-12 bg-neutral-950/50 border-neutral-800 text-neutral-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full xl:w-auto">
            <Select value={rarityFilter} onValueChange={setRarityFilter}>
              <SelectTrigger className="h-12 bg-neutral-950/50 border-neutral-800 text-neutral-100 rounded-xl">
                <SelectValue placeholder="Raridade" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
                <SelectItem value="all">Todas as Raridades</SelectItem>
                <SelectItem value="common">Comum</SelectItem>
                <SelectItem value="uncommon">Incomum</SelectItem>
                <SelectItem value="rare">Rara</SelectItem>
                <SelectItem value="mythic">Mítica</SelectItem>
              </SelectContent>
            </Select>

            <Select value={colorFilter} onValueChange={setColorFilter}>
              <SelectTrigger className="h-12 bg-neutral-950/50 border-neutral-800 text-neutral-100 rounded-xl">
                <SelectValue placeholder="Cor" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
                <SelectItem value="all">Todas as Cores</SelectItem>
                <SelectItem value="w">Branco</SelectItem>
                <SelectItem value="u">Azul</SelectItem>
                <SelectItem value="b">Preto</SelectItem>
                <SelectItem value="r">Vermelho</SelectItem>
                <SelectItem value="g">Verde</SelectItem>
                <SelectItem value="m">Multicolor</SelectItem>
                <SelectItem value="c">Incolor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-12 bg-neutral-950/50 border-neutral-800 text-neutral-100 rounded-xl">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="creature">Criatura</SelectItem>
                <SelectItem value="instant">Instantânea</SelectItem>
                <SelectItem value="sorcery">Feitiço</SelectItem>
                <SelectItem value="enchantment">Encantamento</SelectItem>
                <SelectItem value="artifact">Artefato</SelectItem>
                <SelectItem value="land">Terreno</SelectItem>
                <SelectItem value="planeswalker">Planeswalker</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery ||
              rarityFilter !== 'all' ||
              colorFilter !== 'all' ||
              typeFilter !== 'all') && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setRarityFilter('all');
                  setColorFilter('all');
                  setTypeFilter('all');
                }}
                className="h-12 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl"
              >
                <FilterX className="h-4 w-4 mr-2" /> Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
          {cards.map((card, index) => {
            const isLast = index === cards.length - 1;
            return (
              <div
                ref={isLast ? lastCardRef : null}
                key={card.id}
                className="transform transition-transform duration-300 hover:scale-[1.03] hover:z-10"
              >
                <CardItem card={card} />
                {/* Optional: Add price or other info below card if desired */}
              </div>
            );
          })}
          {loading && Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>

        {!loading && cards.length === 0 && (
          <div className="text-center py-20 text-neutral-500">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-medium">Nenhuma carta encontrada</p>
            <p className="text-sm">Tente ajustar seus filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}
