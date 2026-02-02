'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Calendar, Layers, X, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ScryfallSet {
    id: string;
    code: string;
    name: string;
    uri: string;
    scryfall_uri: string;
    search_uri: string;
    released_at: string;
    set_type: string;
    card_count: number;
    digital: boolean;
    nonfoil_only: boolean;
    foil_only: boolean;
    icon_svg_uri: string;
}

interface CollectionsViewProps {
    sets: ScryfallSet[];
}

export default function CollectionsView({ sets }: CollectionsViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [yearFilter, setYearFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Normaliza o texto para remover acentos na busca
    const normalizeText = (text: string) => {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const filteredSets = useMemo(() => {
        const query = normalizeText(searchQuery);
        return sets.filter((set) => {
            const matchesSearch =
                normalizeText(set.name).includes(query) ||
                normalizeText(set.code).includes(query);

            const matchesType = typeFilter === 'all' || set.set_type === typeFilter;

            const setYear = set.released_at?.split('-')[0];
            const matchesYear = yearFilter === 'all' || setYear === yearFilter;

            return matchesSearch && matchesType && matchesYear;
        });
    }, [sets, searchQuery, typeFilter, yearFilter]);

    // Reset page when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, typeFilter, yearFilter]);

    // Calculate pagination
    const totalPages = Math.ceil(filteredSets.length / itemsPerPage);
    const paginatedSets = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredSets.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredSets, currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Extract unique set types for filter
    const setTypes = useMemo(() => {
        const types = new Set(sets.map(s => s.set_type));
        return Array.from(types).sort();
    }, [sets]);

    // Extract unique years for filter
    const years = useMemo(() => {
        const uniqueYears = new Set(sets.map(s => s.released_at?.split('-')[0]).filter(Boolean));
        return Array.from(uniqueYears).sort((a, b) => Number(b) - Number(a)); // Descendente
    }, [sets]);

    const getSetTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            expansion: 'Expansão',
            core: 'Série Principal',
            masters: 'Masters',
            commander: 'Commander',
            planechase: 'Planechase',
            archenemy: 'Archenemy',
            vanguard: 'Vanguard',
            funny: 'Humor',
            starter: 'Starter',
            box: 'Box Set',
            promo: 'Promocional',
            token: 'Tokens',
            memorabilia: 'Memorabilia',
        };
        return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-amber-500 mb-2">Coleções de Magic</h1>
                    <p className="text-neutral-400 max-w-2xl">
                        Explore todas as edições lançadas. Filtre por nome, código ou tipo de conjunto.
                    </p>
                </div>

                <div className="text-right text-sm text-neutral-500">
                    <Badge variant="outline" className="text-amber-500 border-amber-500/20">
                        {filteredSets.length} coleções encontradas
                    </Badge>
                </div>
            </div>

            {/* Controls Section */}
            <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl flex flex-col xl:flex-row gap-6 sticky top-4 z-30 shadow-2xl shadow-black/50 transition-all duration-300">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 h-5 w-5 transition-colors group-focus-within:text-amber-500" />
                    <Input
                        placeholder="Buscar coleção por nome ou sigla (ex: Bloomburrow, BLB)..."
                        className="pl-12 pr-10 h-12 bg-neutral-950/50 border-neutral-800 text-neutral-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all text-base rounded-xl placeholder:text-neutral-600"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-1 hover:bg-neutral-800 rounded-full transition-all"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <div className="w-full sm:w-48">
                        <Select value={yearFilter} onValueChange={setYearFilter}>
                            <SelectTrigger className="h-12 bg-neutral-950/50 border-neutral-800 text-neutral-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 rounded-xl">
                                <SelectValue placeholder="Ano" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-100 max-h-[300px]">
                                <SelectItem value="all">Todos os Anos</SelectItem>
                                {years.map(year => (
                                    <SelectItem key={year} value={year}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full sm:w-64">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="h-12 bg-neutral-950/50 border-neutral-800 text-neutral-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 rounded-xl">
                                <SelectValue placeholder="Filtrar por tipo" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-neutral-800 text-neutral-100">
                                <SelectItem value="all">Todos os Tipos</SelectItem>
                                {setTypes.map(type => (
                                    <SelectItem key={type} value={type}>
                                        {getSetTypeLabel(type)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {(searchQuery || typeFilter !== 'all' || yearFilter !== 'all') && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSearchQuery('');
                                setTypeFilter('all');
                                setYearFilter('all');
                            }}
                            className="h-12 px-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all"
                        >
                            <FilterX className="mr-2 h-4 w-4" />
                            Limpar
                        </Button>
                    )}
                </div>
            </div>

            {/* Sets Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {paginatedSets.map((set) => (
                    <Link key={set.id} href={`/collections/${set.code}`} className="group">
                        <Card className="h-full bg-neutral-900/40 border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-900/80 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl group-hover:shadow-amber-500/10 overflow-hidden relative">
                            <CardContent className="p-4 flex flex-col items-center justify-between h-full gap-4">

                                {/* Decorative background glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="relative z-10 w-full flex-1 flex items-center justify-center p-4">
                                    {/* SVG Icon with invert filter for visibility on dark bg */}
                                    <img
                                        src={set.icon_svg_uri}
                                        alt={set.name}
                                        className="w-16 h-16 opacity-70 group-hover:opacity-100 transition-all duration-300 filter invert brightness-0 group-hover:scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                                        loading="lazy"
                                    />
                                </div>

                                <div className="relative z-10 w-full text-center space-y-1">
                                    <h3 className="font-semibold text-neutral-200 group-hover:text-amber-400 transition-colors line-clamp-2 leading-tight min-h-[2.5em]">
                                        {set.name}
                                    </h3>

                                    <div className="flex items-center justify-center gap-3 text-xs text-neutral-500 group-hover:text-neutral-400">
                                        <span className="flex items-center gap-1 bg-neutral-950/50 px-2 py-0.5 rounded-full font-mono border border-neutral-800">
                                            {set.code.toUpperCase()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {set.released_at?.split('-')[0] || 'N/A'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Layers className="h-3 w-3" />
                                            {set.card_count}
                                        </span>
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {filteredSets.length === 0 && (
                    <div className="col-span-full py-12 text-center text-neutral-500 bg-neutral-900/20 rounded-xl border border-neutral-800 border-dashed">
                        <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">Nenhuma coleção encontrada.</p>
                        <p className="text-sm">Tente buscar por outro termo.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:text-amber-500"
                    >
                        Anterior
                    </Button>

                    <div className="flex items-center gap-2 mx-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            // Logic to show a window of pages around current page
                            let pageNum = i + 1;
                            if (totalPages > 5) {
                                if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                            }

                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => handlePageChange(pageNum)}
                                    className={`w-8 h-8 p-0 ${currentPage === pageNum ? 'bg-amber-500 text-black hover:bg-amber-600' : 'text-neutral-400 hover:text-neutral-200'}`}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:text-amber-500"
                    >
                        Próximo
                    </Button>
                </div>
            )}

            <div className="text-center text-xs text-neutral-600 pb-8">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredSets.length)} de {filteredSets.length} coleções
            </div>

        </div>
    );
}
