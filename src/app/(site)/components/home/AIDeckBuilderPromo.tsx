import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';

const examplePrompts = [
  'Commander da Atraxa focado em marcadores +1/+1',
  'Mono-vermelho agressivo e barato para Pauper',
  'Tribal de Elfos para jogar com os amigos',
  'Deck de controle azul e preto no Standard',
];

export default function AIDeckBuilderPromo() {
  return (
    <section className="reveal mx-auto max-w-7xl px-6 py-20 sm:py-28">
      <div className="frame overflow-hidden [--cut:28px] [--frame-border:color-mix(in_oklch,var(--primary)_35%,transparent)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_22%,transparent),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 -left-32 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.7_0.13_240/0.14),transparent)]"
        />

        <div className="relative grid items-center gap-12 px-6 py-14 sm:px-12 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="kicker flex items-center gap-2 text-sky-300">
              <Sparkles className="h-4 w-4" />
              Construtor com IA
            </p>
            <h2 className="mt-5 text-balance font-display text-4xl font-bold uppercase leading-[0.95] sm:text-5xl">
              Sem ideias para o próximo deck?{' '}
              <span className="text-primary">Deixa com a IA.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Dê um comandante, uma carta que você ama ou apenas uma ideia maluca. Nossa IA vasculha
              o multiverso para construir um deck completo e sinérgico em segundos.
            </p>
            <Link
              href="/ai-deck-builder"
              className="group mt-9 inline-flex h-12 items-center gap-3 bg-primary px-6 font-display text-sm font-bold uppercase tracking-[0.14em] text-primary-foreground [clip-path:polygon(12px_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%,0_12px)] hover:brightness-110"
            >
              Criar com Magia Artificial
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div aria-hidden className="relative">
            <div className="rounded-lg border border-white/10 bg-background/70 p-5 shadow-2xl backdrop-blur">
              <div className="flex items-center gap-1.5 border-b border-white/5 pb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-mana-r/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-mana-w/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-mana-g/80" />
                <span className="ml-3 font-display text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Pedido
                </span>
              </div>
              <div className="mt-5 h-14 overflow-hidden">
                <ul className="prompt-cycle">
                  {examplePrompts.map((prompt) => (
                    <li key={prompt} className="flex h-14 items-center gap-3 text-lg text-foreground">
                      <span className="font-display text-primary">›</span>
                      <span className="truncate">{prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {['Rampa', 'Remoção', 'Finalizadores'].map((tag, i) => (
                  <div key={tag} className="rounded border border-white/5 bg-white/[0.03] px-3 py-2.5">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{tag}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-primary/80"
                        style={{ width: `${[72, 48, 64][i]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
