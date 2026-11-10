/* eslint-disable no-undef */
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import heroArt from '../../../../../public/bg-header-home.png';
import HeroSearch from './HeroSearch';

const shortcuts = [
  { href: '/collections', label: 'Coleções' },
  { href: '/deck-analyzer', label: 'Analisar deck com IA' },
  { href: '/decks-ai', label: 'Decks prontos' },
  { href: '/glossary', label: 'Glossário' },
];

const delay = (ms: number) => ({ '--delay': `${ms}ms` }) as React.CSSProperties;

export default function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[min(88svh,820px)] items-center overflow-hidden">
      <Image
        src={heroArt}
        alt=""
        fill
        preload
        quality={60}
        sizes="100vw"
        placeholder="blur"
        className="-z-20 object-cover object-[72%_center] lg:object-right"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,var(--background)_8%,color-mix(in_oklch,var(--background)_88%,transparent)_45%,color-mix(in_oklch,var(--background)_35%,transparent)_75%,transparent)] max-lg:bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_55%,transparent),color-mix(in_oklch,var(--background)_92%,transparent)_60%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent"
      />
      <div aria-hidden className="grain absolute inset-0 -z-10" />

      <div className="mx-auto w-full max-w-7xl px-6 py-20 sm:py-24">
        <div className="max-w-3xl">
          <p className="rise kicker flex items-center gap-3" style={delay(0)}>
            <span className="mana-strip h-1.5 w-10" aria-hidden />
            Magic: The Gathering em português
          </p>

          <h1
            className="rise mt-6 font-display text-[clamp(2.6rem,7.2vw,5.75rem)] font-bold uppercase leading-[0.9] tracking-[-0.01em]"
            style={delay(80)}
          >
            Sabe o que
            <br />a carta faz?
            <span className="mt-2 block text-primary">Nós traduzimos.</span>
          </h1>

          <p
            className="rise mt-7 max-w-xl text-pretty text-lg leading-relaxed text-foreground/80 sm:text-xl"
            style={delay(160)}
          >
            Digite o nome da carta, em qualquer idioma, e entenda na hora o que ela faz. Nunca mais
            fique sem saber o que está na mesa.
          </p>

          <div className="rise relative z-20 mt-10 max-w-2xl" style={delay(240)}>
            <HeroSearch />
          </div>

          <nav
            aria-label="Atalhos"
            className="rise mt-6 flex flex-wrap items-center gap-x-1 gap-y-2"
            style={delay(320)}
          >
            <span className="mr-2 text-sm text-muted-foreground">Ou vá direto para</span>
            {shortcuts.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="group inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm text-foreground/85 backdrop-blur-sm hover:border-primary/60 hover:text-foreground"
              >
                {label}
                <ArrowRight className="h-3.5 w-3.5 -translate-x-0.5 opacity-50 transition-all group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100" />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
