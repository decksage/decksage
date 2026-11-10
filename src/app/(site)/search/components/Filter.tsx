/* eslint-disable no-unused-vars */
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Filter, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useSets } from '@/app/(site)/hooks/useSets';
import { Skeleton } from '@/components/ui/skeleton';
import { DialogTitle } from '@radix-ui/react-dialog';

interface SearchFiltersProps {
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  selectedColors: string[];
  setSelectedColors: (colors: string[]) => void;
  selectedRarity: string[];
  setSelectedRarity: (rarity: string[]) => void;
  selectedFormats: string[];
  setSelectedFormats: (formats: string[]) => void;
  selectedSet: string;
  setSelectedSet: (set: string) => void;
  selectedCmc: string[];
  setSelectedCmc: (cmc: string[]) => void;
  selectedArtist: string;
  setSelectedArtist: (artist: string) => void;
  onApplyFilters: () => void;
  onOpen?: () => void;
}

const types = ['Creature', 'Instant', 'Sorcery', 'Land', 'Enchantment', 'Artifact', 'Planeswalker'];
const colors = ['White', 'Blue', 'Black', 'Red', 'Green', 'Colorless', 'Multicolor'];
const rarities = ['Common', 'Uncommon', 'Rare', 'Mythic'];
const formats = ['Standard', 'Modern', 'Commander', 'Legacy', 'Vintage', 'Pioneer', 'Pauper'];
const cmcOptions = ['1', '2', '3', '4', '5', '>5'];

const colorStyles: Record<string, string> = {
  White: 'bg-white text-black',
  Blue: 'bg-blue-500',
  Black: 'bg-black text-white',
  Red: 'bg-red-500',
  Green: 'bg-green-500',
  Colorless: 'bg-neutral-500',
  Multicolor: 'bg-gradient-to-r from-blue-500 via-red-500 to-green-500',
};

const rarityStyles: Record<string, string> = {
  Common: 'bg-neutral-500',
  Uncommon: 'bg-blue-500',
  Rare: 'bg-orange-500',
  Mythic: 'bg-red-600',
};

export default function SearchFilters({
  selectedTypes,
  setSelectedTypes,
  selectedColors,
  setSelectedColors,
  selectedRarity,
  setSelectedRarity,
  selectedFormats,
  setSelectedFormats,
  selectedSet,
  setSelectedSet,
  selectedCmc,
  setSelectedCmc,
  selectedArtist,
  setSelectedArtist,
  onApplyFilters,
  onOpen,
}: SearchFiltersProps) {
  const { sets, isLoading: setsLoading, error: setsError } = useSets();
  const [openCombobox, setOpenCombobox] = useState(false);

  const totalFilters = useMemo(() => {
    let count =
      selectedTypes.length + selectedColors.length + selectedRarity.length + selectedFormats.length;
    if (selectedSet) count += 1;
    if (selectedCmc.length > 0) count += 1;
    if (selectedArtist) count += 1;
    return count;
  }, [
    selectedTypes,
    selectedColors,
    selectedRarity,
    selectedFormats,
    selectedSet,
    selectedCmc,
    selectedArtist,
  ]);

  const toggle = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedColors([]);
    setSelectedRarity([]);
    setSelectedFormats([]);
    setSelectedSet('');
    setSelectedCmc([]);
    setSelectedArtist('');
    onApplyFilters();
  };

  return (
    <Sheet
      onOpenChange={(open) => {
        if (open && onOpen) onOpen();
      }}
    >
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-10 border-white/15 bg-white/[0.03] font-display text-xs font-semibold uppercase tracking-[0.14em] hover:border-primary/60 hover:bg-white/[0.06]"
          aria-label={`Filtros (${totalFilters} ativos)`}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filtros
          {totalFilters > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-5 rounded-full bg-primary px-1.5 text-primary-foreground"
            >
              {totalFilters}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[88vw] gap-0 overflow-y-auto border-white/10 bg-background/95 p-0 backdrop-blur-xl sm:w-[400px] sm:max-w-[400px]"
      >
        <div className="flex h-full flex-col">
          <div className="sticky top-0 z-10 border-b border-white/10 bg-background/95 p-5 backdrop-blur">
            <DialogTitle asChild>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide">
                Filtros de busca
              </h2>
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Refine sua busca por cartas</p>
          </div>

          <div className="flex-1 p-4 space-y-4">
            <Accordion type="multiple" className="w-full space-y-2">
              {/* Tipo */}
              <AccordionItem value="type" className="border-none">
                <AccordionTrigger className="text-foreground hover:text-primary py-2">
                  Tipo
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="bg-white/[0.04] border-white/15">
                    <CardContent className="p-4 space-y-2">
                      {types.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={selectedTypes.includes(type)}
                            onCheckedChange={() => toggle(type, selectedTypes, setSelectedTypes)}
                            aria-label={`Filtrar por ${type}`}
                          />
                          <label
                            htmlFor={`type-${type}`}
                            className="text-sm text-foreground hover:text-foreground cursor-pointer"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Cor */}
              <AccordionItem value="color" className="border-none">
                <AccordionTrigger className="text-foreground hover:text-primary py-2">
                  Cor
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="bg-white/[0.04] border-white/15">
                    <CardContent className="p-4 space-y-2">
                      {colors.map((color) => (
                        <div key={color} className="flex items-center space-x-2">
                          <Checkbox
                            id={`color-${color}`}
                            checked={selectedColors.includes(color)}
                            onCheckedChange={() => toggle(color, selectedColors, setSelectedColors)}
                            aria-label={`Filtrar por ${color}`}
                          />
                          <label
                            htmlFor={`color-${color}`}
                            className="text-sm text-foreground hover:text-foreground cursor-pointer flex items-center space-x-2"
                          >
                            <span
                              className={cn(
                                'inline-flex items-center justify-center rounded-full w-4 h-4',
                                colorStyles[color],
                              )}
                            />
                            <span>{color}</span>
                          </label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Raridade */}
              <AccordionItem value="rarity" className="border-none">
                <AccordionTrigger className="text-foreground hover:text-primary py-2">
                  Raridade
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="bg-white/[0.04] border-white/15">
                    <CardContent className="p-4 space-y-2">
                      {rarities.map((rarity) => (
                        <div key={rarity} className="flex items-center space-x-2">
                          <Checkbox
                            id={`rarity-${rarity}`}
                            checked={selectedRarity.includes(rarity)}
                            onCheckedChange={() =>
                              toggle(rarity, selectedRarity, setSelectedRarity)
                            }
                            aria-label={`Filtrar por ${rarity}`}
                          />
                          <label
                            htmlFor={`rarity-${rarity}`}
                            className="text-sm text-foreground hover:text-foreground cursor-pointer flex items-center space-x-2"
                          >
                            <span className={cn('w-3 h-3 rounded-full', rarityStyles[rarity])} />
                            <span>{rarity}</span>
                          </label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Formato */}
              <AccordionItem value="formats" className="border-none">
                <AccordionTrigger className="text-foreground hover:text-primary py-2">
                  Formato
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="bg-white/[0.04] border-white/15">
                    <CardContent className="p-4 space-y-2">
                      {formats.map((format) => (
                        <div key={format} className="flex items-center space-x-2">
                          <Checkbox
                            id={`format-${format}`}
                            checked={selectedFormats.includes(format)}
                            onCheckedChange={() =>
                              toggle(format, selectedFormats, setSelectedFormats)
                            }
                            aria-label={`Filtrar por ${format}`}
                          />
                          <label
                            htmlFor={`format-${format}`}
                            className="text-sm text-foreground hover:text-foreground cursor-pointer"
                          >
                            {format}
                          </label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Coleção */}
              <AccordionItem value="set" className="border-none">
                <AccordionTrigger className="text-foreground hover:text-primary py-2">
                  Coleção
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="bg-white/[0.04] border-white/15">
                    <CardContent className="p-4">
                      <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openCombobox}
                            className="w-full justify-between bg-white/[0.04] border-white/15 text-foreground hover:bg-neutral-700"
                          >
                            {selectedSet
                              ? sets.find((set) => set.code === selectedSet)?.name ||
                                'Selecione a coleção'
                              : 'Selecione a coleção'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 bg-card border-white/15">
                          <Command className="bg-card">
                            <CommandInput
                              placeholder="Buscar coleção..."
                              className="text-foreground"
                            />
                            <CommandList>
                              <CommandEmpty className="text-muted-foreground p-4">
                                Nenhuma coleção encontrada.
                              </CommandEmpty>
                              {setsLoading ? (
                                <div className="p-4 space-y-2">
                                  <Skeleton className="h-8 w-full bg-neutral-700" />
                                  <Skeleton className="h-8 w-full bg-neutral-700" />
                                </div>
                              ) : setsError ? (
                                <div className="p-4 text-red-500">Erro ao carregar coleções.</div>
                              ) : (
                                <CommandGroup>
                                  {sets.map((set) => (
                                    <CommandItem
                                      key={set.code}
                                      value={set.code}
                                      onSelect={() => {
                                        setSelectedSet(set.code === selectedSet ? '' : set.code);
                                        setOpenCombobox(false);
                                      }}
                                      className="text-foreground hover:bg-white/[0.06]"
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          selectedSet === set.code ? 'opacity-100' : 'opacity-0',
                                        )}
                                      />
                                      {set.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Custo de Mana */}
              <AccordionItem value="cmc" className="border-none">
                <AccordionTrigger className="text-foreground hover:text-primary py-2">
                  Custo de Mana
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="bg-white/[0.04] border-white/15">
                    <CardContent className="p-4 space-y-2">
                      {cmcOptions.map((cmc) => (
                        <div key={cmc} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cmc-${cmc}`}
                            checked={selectedCmc.includes(cmc)}
                            onCheckedChange={() => toggle(cmc, selectedCmc, setSelectedCmc)}
                            aria-label={`Filtrar por CMC ${cmc}`}
                          />
                          <label
                            htmlFor={`cmc-${cmc}`}
                            className="text-sm text-foreground hover:text-foreground cursor-pointer"
                          >
                            {cmc === '>5' ? 'Mais de 5' : cmc}
                          </label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>

              {/* Artista */}
              <AccordionItem value="artist" className="border-none">
                <AccordionTrigger className="text-foreground hover:text-primary py-2">
                  Artista
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="bg-white/[0.04] border-white/15">
                    <CardContent className="p-4">
                      <Input
                        id="artist"
                        type="text"
                        value={selectedArtist}
                        onChange={(e) => setSelectedArtist(e.target.value)}
                        placeholder="Digite o nome do artista"
                        className="bg-neutral-700 border-neutral-600 text-foreground"
                      />
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="sticky bottom-0 bg-card p-4 border-t border-white/15">
            <div className="flex gap-2">
              <Button
                className="flex-1 "
                onClick={onApplyFilters}
              >
                Aplicar Filtros
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-white/15 text-foreground hover:bg-white/[0.06]"
                onClick={clearFilters}
                disabled={totalFilters === 0}
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
