const discordUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL;

export default function DiscordCta({ variant = 'inline' }: { variant?: 'inline' | 'banner' }) {
  if (!discordUrl) return null;

  if (variant === 'banner') {
    return (
      <div className="rounded-lg border border-indigo-500/40 bg-indigo-950/40 px-4 py-3 text-sm text-indigo-100">
        <p className="font-semibold text-indigo-200">Junta-te à comunidade DeckSage no Discord</p>
        <p className="mt-1 text-foreground/80">
          Partilha listas, recebe dicas e fala com outros jogadores.
        </p>
        <a
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-primary hover:text-primary underline"
        >
          Abrir convite do Discord →
        </a>
      </div>
    );
  }

  return (
    <a
      href={discordUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary transition"
    >
      Discord
    </a>
  );
}
