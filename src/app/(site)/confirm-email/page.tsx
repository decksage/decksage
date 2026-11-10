import Link from 'next/link';
import { MailCheck } from 'lucide-react';

export const metadata = { title: 'Confirme seu e-mail | DeckSage' };

export default function ConfirmEmailPage() {
  return (
    <div className="relative isolate flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div
        aria-hidden
        className="absolute left-1/2 top-0 -z-10 h-[28rem] w-[46rem] -translate-x-1/2 bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]"
      />
      <div className="frame w-full max-w-lg p-8 text-center sm:p-10">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
          <MailCheck className="h-8 w-8" />
        </span>
        <p className="kicker mt-6 justify-center">Quase lá</p>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight">
          Verifique seu e-mail
        </h1>
        <p className="mt-4 text-muted-foreground">
          Enviamos um link de confirmação. Clique nele para ativar a conta. Se não encontrar, olhe a
          pasta de spam.
        </p>
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
