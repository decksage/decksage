/* eslint-disable no-undef */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Plus, Search, Sparkles, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { createClient } from '@/app/utils/supabase/client';
import { cn } from '@/lib/utils';
import DeckSageLogo from '../../../../public/decksage.png';
import GlobalSearch from './GlobalSearch';
import UserMenu, { accountLinks, ViewerAvatar } from './UserMenu';
import NotificationBell from './NotificationBell';
import type { Viewer } from './viewer';

const navLinks = [
  { href: '/collections', label: 'Coleções' },
  { href: '/decks-ai', label: 'Decks' },
  { href: '/blog', label: 'Conteúdo' },
  { href: '/glossary', label: 'Glossário' },
  { href: '/deck-analyzer', label: 'Análise IA' },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header({ viewer }: { viewer: Viewer | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') router.refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled
          ? 'border-white/10 bg-background/80 backdrop-blur-xl backdrop-saturate-150'
          : 'border-transparent bg-background/40 backdrop-blur-sm',
      )}
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      <div
        className={cn(
          'mx-auto flex max-w-7xl items-center gap-6 px-4 transition-[height] duration-300 sm:px-6',
          scrolled ? 'h-14' : 'h-16 lg:h-[4.5rem]',
        )}
      >
        <Link href="/" aria-label="DeckSage — página inicial" className="shrink-0">
          <Image
            src={DeckSageLogo}
            alt="DeckSage"
            loading="eager"
            sizes="110px"
            className={cn('h-auto transition-[width] duration-300', scrolled ? 'w-[92px]' : 'w-[110px]')}
          />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
          {navLinks.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative whitespace-nowrap rounded-md px-3 py-2 font-display text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
                <span
                  aria-hidden
                  className={cn(
                    'mana-strip absolute inset-x-3 -bottom-px h-0.5 origin-left transition-transform duration-300',
                    active ? 'scale-x-100' : 'scale-x-0',
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <GlobalSearch className="hidden w-60 2xl:block" />
          <Link
            href="/search"
            aria-label="Buscar cartas"
            className="hidden h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground lg:inline-flex 2xl:hidden"
          >
            <Search className="h-5 w-5" />
          </Link>

          {viewer && <NotificationBell />}

          <Link
            href="/ai-deck-builder"
            className="hidden h-10 items-center gap-2 whitespace-nowrap rounded-md border border-sky-400/25 bg-sky-400/10 px-3 text-sm font-semibold text-sky-200 hover:border-sky-300/50 hover:bg-sky-400/15 md:inline-flex"
          >
            <Sparkles className="h-4 w-4" />
            <span>Criar com IA</span>
          </Link>
          <Button asChild className="hidden h-10 md:inline-flex">
            <Link href="/my-deck/create">
              <Plus className="h-4 w-4" />
              Criar Deck
            </Link>
          </Button>

          <div className="hidden md:block">
            <UserMenu viewer={viewer} onSignOut={handleSignOut} />
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-white/5 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="right"
          className="w-[88vw] gap-0 overflow-y-auto border-white/10 bg-background/95 p-0 backdrop-blur-xl sm:max-w-sm"
        >
          <div className="mana-strip h-1 w-full" aria-hidden />
          <div className="flex flex-col gap-6 p-6">
            <div>
              <SheetTitle className="font-display text-lg uppercase tracking-[0.14em]">Menu</SheetTitle>
              <SheetDescription className="sr-only">Navegação do DeckSage</SheetDescription>
            </div>

            <GlobalSearch onSubmitted={() => setMenuOpen(false)} />

            <nav aria-label="Principal (mobile)" className="flex flex-col">
              {navLinks.map(({ href, label }, i) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'rise flex items-baseline gap-4 border-b border-white/5 py-3.5 font-display text-xl font-semibold uppercase tracking-wide',
                    isActive(pathname, href) ? 'text-primary' : 'text-foreground hover:text-primary',
                  )}
                  style={{ '--delay': `${60 + i * 40}ms` } as React.CSSProperties}
                >
                  <span className="text-xs text-muted-foreground tabular-nums">0{i + 1}</span>
                  {label}
                </Link>
              ))}
            </nav>

            <div className="grid grid-cols-2 gap-3">
              <Button asChild className="h-11">
                <Link href="/my-deck/create">
                  <Plus className="h-4 w-4" />
                  Criar Deck
                </Link>
              </Button>
              <Link
                href="/ai-deck-builder"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-sky-400/25 bg-sky-400/10 text-sm font-semibold text-sky-200"
              >
                <Sparkles className="h-4 w-4" />
                Com IA
              </Link>
            </div>

            {viewer ? (
              <div className="flex flex-col gap-1 border-t border-white/10 pt-5">
                <div className="mb-3 flex items-center gap-3">
                  <ViewerAvatar viewer={viewer} className="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold">{viewer.name}</p>
                    {viewer.email && (
                      <p className="truncate text-xs text-muted-foreground">{viewer.email}</p>
                    )}
                  </div>
                </div>
                {accountLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 rounded-md px-2 py-2.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
                {viewer.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 rounded-md px-2 py-2.5 text-primary hover:bg-white/5"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Painel Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-1 flex items-center gap-3 rounded-md px-2 py-2.5 text-left text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            ) : (
              <Button asChild variant="outline" className="h-11 border-white/15 bg-transparent">
                <Link href="/login">Entrar</Link>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
