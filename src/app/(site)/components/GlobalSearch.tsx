/* eslint-disable no-undef */
'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GlobalSearch({
  className,
  onSubmitted,
}: {
  className?: string;
  onSubmitted?: () => void;
}) {
  const [query, setQuery] = useState('');
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (!inputRef.current?.offsetParent) return;
      e.preventDefault();
      inputRef.current.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setQuery('');
    inputRef.current?.blur();
    onSubmitted?.();
  };

  return (
    <form onSubmit={handleSearch} role="search" className={cn('group relative w-full', className)}>
      <label htmlFor={inputId} className="sr-only">
        Buscar cartas
      </label>
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary"
      />
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        autoComplete="off"
        placeholder="Buscar cartas…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-10 w-full rounded-md border border-input bg-white/[0.03] pl-9 pr-10 text-sm text-foreground placeholder:text-muted-foreground transition-colors hover:border-white/20 focus:border-primary/70 focus:bg-white/[0.05] focus:outline-none"
      />
      <kbd
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/10 px-1.5 font-display text-[11px] text-muted-foreground group-focus-within:opacity-0"
      >
        /
      </kbd>
    </form>
  );
}
