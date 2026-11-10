/* eslint-disable no-undef */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Camera, CornerDownLeft } from 'lucide-react';

interface SearchBarProps {
  onCameraClick: () => void;
  showCameraButton: boolean;
}

export default function SearchBar({ onCameraClick, showCameraButton }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 250);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const commandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    setIsOpen(true);
    fetch(`/api/autocomplete?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then(({ suggestions }) => setSuggestions(suggestions || []))
      .catch((error) => {
        if (error.name !== 'AbortError') setSuggestions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [debouncedQuery]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSelect = (suggestion: string) => {
    setQuery(suggestion);
    setIsOpen(false);
    // Remove " // " e tudo depois para evitar problemas de rota com cartas duplas
    const safeName = suggestion.split(' // ')[0];
    router.push(`/card/${encodeURIComponent(safeName)}`);
    (commandRef.current?.querySelector('input') as HTMLInputElement | null)?.blur();
  };

  return (
    <form onSubmit={handleSearch} role="search" className="w-full">
      <Command
        ref={commandRef}
        className="frame relative overflow-visible rounded-none bg-transparent [--cut:18px] [--frame-fill:color-mix(in_oklch,var(--background)_78%,transparent)] hover:[--frame-border:oklch(1_0_0/22%)] focus-within:[--frame-border:var(--primary)] focus-within:shadow-[0_0_60px_-12px_color-mix(in_oklch,var(--primary)_55%,transparent)]"
      >
        <div className="flex h-16 items-center gap-1 pl-5 pr-2 sm:h-[4.5rem]">
          <Search aria-hidden className="h-5 w-5 shrink-0 text-primary" />
          <div className="flex-1">
            <CommandInput
              aria-label="Nome da carta"
              placeholder="Nome da carta, em qualquer idioma…"
              value={query}
              onValueChange={setQuery}
              onBlur={() => setTimeout(() => setIsOpen(false), 150)}
              onFocus={() => query.length > 1 && setIsOpen(true)}
              className="h-full w-full border-0 bg-transparent pl-1 text-base text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-lg"
            />
          </div>
          {showCameraButton && (
            <button
              type="button"
              onClick={onCameraClick}
              aria-label="Escanear carta com a câmera"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <Camera className="h-5 w-5" />
            </button>
          )}
          <button
            type="submit"
            className="hidden h-11 items-center gap-2 bg-primary px-5 font-display text-sm font-bold uppercase tracking-[0.12em] text-primary-foreground [clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)] hover:brightness-110 sm:inline-flex"
          >
            Buscar
            <CornerDownLeft className="h-4 w-4" />
          </button>
        </div>

        {isOpen && (
          <CommandList className="absolute left-0 right-0 top-full z-20 mt-2 max-h-72 overflow-y-auto rounded-md border border-white/10 bg-popover/95 p-1 shadow-2xl backdrop-blur-xl animate-in fade-in-0 slide-in-from-top-1">
            {isLoading && suggestions.length === 0 ? (
              <div className="space-y-1.5 p-1.5">
                <Skeleton className="h-9 w-full bg-white/5" />
                <Skeleton className="h-9 w-4/5 bg-white/5" />
                <Skeleton className="h-9 w-3/5 bg-white/5" />
              </div>
            ) : (
              <CommandGroup>
                {suggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion}
                    value={suggestion}
                    onSelect={() => handleSelect(suggestion)}
                    className="cursor-pointer rounded px-3 py-2.5 text-base text-foreground aria-selected:bg-primary aria-selected:text-primary-foreground"
                  >
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {suggestions.length === 0 && debouncedQuery.length > 1 && !isLoading && (
              <CommandEmpty className="px-3 py-4 text-sm text-muted-foreground">
                Nenhuma carta encontrada para &quot;{debouncedQuery}&quot;
              </CommandEmpty>
            )}
          </CommandList>
        )}
      </Command>
    </form>
  );
}
