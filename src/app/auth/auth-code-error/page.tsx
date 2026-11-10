import Link from 'next/link';

export const metadata = { title: 'Link inválido | DeckSage' };

export default function AuthCodeErrorPage() {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center bg-background px-4">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 -z-10 h-[28rem] w-[46rem] -translate-x-1/2 bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--destructive)_18%,transparent),transparent)]"
      />
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-card/80 p-8 text-center shadow-2xl backdrop-blur-sm sm:p-10">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Link inválido</p>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight">Não foi possível confirmar</h1>
        <p className="mt-4 text-muted-foreground">
          Esse link expirou ou já foi usado. Entre na sua conta ou crie uma nova.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Ir para o login
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-md border border-white/15 px-6 text-sm font-semibold hover:border-primary/60"
          >
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
