import Link from 'next/link';

type Props = {
  recentComments: {
    id: string;
    content: string;
    created_at: string;
    deck_id: string;
    deck_name: string | null;
  }[];
  recentDecks: { id: string; name: string; format: string; created_at: string }[];
};

export default function ProfileActivity({ recentComments, recentDecks }: Props) {
  return (
    <section className="mt-12 border-t border-white/10 pt-8">
      <h2 className="mb-4 font-display text-2xl font-bold uppercase tracking-tight">
        Atividade recente
      </h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Comentários
          </h3>
          <ul className="space-y-2 text-sm">
            {recentComments.map((c) => (
              <li key={c.id} className="rounded border border-white/10 bg-card/50 p-3">
                <p className="text-foreground/80 line-clamp-2">{c.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(c.created_at).toLocaleDateString('pt-BR')} ·{' '}
                  <Link href={`/decksage/${c.deck_id}`} className="text-primary hover:underline">
                    {c.deck_name || 'Deck'}
                  </Link>
                </p>
              </li>
            ))}
            {recentComments.length === 0 && (
              <p className="text-muted-foreground text-sm">Sem comentários públicos recentes.</p>
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Decks novos
          </h3>
          <ul className="space-y-2 text-sm">
            {recentDecks.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/decksage/${d.id}`}
                  className="text-primary hover:underline font-medium"
                >
                  {d.name}
                </Link>
                <span className="text-muted-foreground"> · {d.format}</span>
                <p className="text-xs text-muted-foreground">
                  {new Date(d.created_at).toLocaleDateString('pt-BR')}
                </p>
              </li>
            ))}
            {recentDecks.length === 0 && (
              <p className="text-muted-foreground text-sm">Sem decks públicos recentes.</p>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
