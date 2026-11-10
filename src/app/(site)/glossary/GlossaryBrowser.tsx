'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { Search, SearchX, X } from 'lucide-react';
import EmptyState from '../components/page/EmptyState';

export interface GlossaryTerm {
  original: string;
  translated: string;
  definition: string;
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const letterOf = (term: string) => normalize(term).charAt(0).toUpperCase();

export default function GlossaryBrowser({ terms }: { terms: GlossaryTerm[] }) {
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);

  const allLetters = useMemo(
    () => Array.from(new Set(terms.map((t) => letterOf(t.translated)))),
    [terms],
  );

  const groups = useMemo(() => {
    const q = normalize(deferred.trim());
    const filtered = q
      ? terms.filter((t) =>
          [t.translated, t.original, t.definition].some((field) => normalize(field).includes(q)),
        )
      : terms;
    const map = new Map<string, GlossaryTerm[]>();
    for (const t of filtered) {
      const letter = letterOf(t.translated);
      map.set(letter, [...(map.get(letter) ?? []), t]);
    }
    return Array.from(map.entries());
  }, [terms, deferred]);

  const activeLetters = new Set(groups.map(([l]) => l));
  const count = groups.reduce((n, [, list]) => n + list.length, 0);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-20">
      <div className="sticky-below-header z-30 -mx-6 border-b border-white/5 bg-background/85 px-6 py-4 backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative md:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="glossary-search" className="sr-only">
              Buscar termo
            </label>
            <input
              id="glossary-search"
              type="search"
              placeholder="Buscar termo ou definição"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] pl-10 pr-10 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-white/[0.05] [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <nav aria-label="Índice alfabético" className="-mx-1 flex flex-1 flex-wrap gap-0.5">
            {allLetters.map((letter) =>
              activeLetters.has(letter) ? (
                <a
                  key={letter}
                  href={`#letra-${letter}`}
                  className="grid h-8 min-w-8 place-items-center rounded font-display text-sm font-semibold text-foreground/80 hover:bg-primary hover:text-primary-foreground"
                >
                  {letter}
                </a>
              ) : (
                <span
                  key={letter}
                  aria-hidden
                  className="grid h-8 min-w-8 place-items-center font-display text-sm font-semibold text-muted-foreground/30"
                >
                  {letter}
                </span>
              ),
            )}
          </nav>
        </div>
        {query && (
          <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
            <span className="font-semibold text-foreground tabular-nums">{count}</span>{' '}
            {count === 1 ? 'termo encontrado' : 'termos encontrados'}
          </p>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nenhum termo encontrado"
          description={`Nada no glossário corresponde a “${query}”. Tente o nome em inglês.`}
          className="mt-10"
        />
      ) : (
        <div className="mt-6">
          {groups.map(([letter, list]) => (
            <section
              key={letter}
              id={`letra-${letter}`}
              aria-labelledby={`h-letra-${letter}`}
              className="grid scroll-mt-[calc(var(--header-offset)+9rem)] gap-x-10 border-b border-white/5 py-10 md:grid-cols-[5rem_1fr] md:scroll-mt-[calc(var(--header-offset)+6rem)]"
            >
              <h2
                id={`h-letra-${letter}`}
                className="mb-4 font-display text-5xl font-bold leading-none text-primary md:mb-0 md:text-6xl"
              >
                {letter}
              </h2>
              <dl className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
                {list.map((term) => (
                  <div key={term.original} className="reveal">
                    <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-xl font-semibold uppercase tracking-wide">
                        {term.translated}
                      </span>
                      {term.original !== term.translated && (
                        <span
                          lang="en"
                          className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                        >
                          {term.original}
                        </span>
                      )}
                    </dt>
                    <dd className="mt-2 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
                      {term.definition || <em>Nenhuma definição disponível.</em>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}

      <p className="mt-12 max-w-2xl text-xs leading-relaxed text-muted-foreground/80">
        As definições são geradas com auxílio de IA e podem precisar de interpretação em casos de
        regras muito específicos. Para informações oficiais, consulte sempre as Comprehensive Rules.
      </p>
    </div>
  );
}
