import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export const metadata = { title: 'Conta confirmada | DeckSage' };

export default function AuthConfirmedPage() {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center bg-background px-4">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 -z-10 h-[28rem] w-[46rem] -translate-x-1/2 bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_16%,transparent),transparent)]"
      />
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-card/80 p-8 text-center shadow-2xl backdrop-blur-sm sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <p className="mt-6 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pronto</p>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight">Conta confirmada</h1>
        <p className="mt-4 text-muted-foreground">Seu e-mail foi verificado. Já pode entrar e usar o DeckSage.</p>
        <Link
          href="/login"
          className="mt-8 inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Ir para o login
        </Link>
      </div>
    </div>
  );
}
