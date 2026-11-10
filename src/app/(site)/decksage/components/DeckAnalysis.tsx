import { ThumbsUp, ThumbsDown, BarChart3, Swords } from 'lucide-react';

interface DeckAnalysisProps {
  deckCheck: {
    playstyle?: string;
    win_condition?: string;
    difficulty?: string;
    strengths?: string[];
    weaknesses?: string[];
  } | null;
}

const LEVELS = ['Fácil', 'Médio', 'Difícil'];
const LEVEL_COLORS = ['bg-green-500', 'bg-yellow-500', 'bg-red-500'];

function DifficultyMeter({ level }: { level: string }) {
  const current = LEVELS.indexOf(level);
  return (
    <div className="mt-3 flex gap-1.5">
      {LEVELS.map((name, index) => (
        <div
          key={name}
          className={`h-1.5 flex-1 rounded-full ${index <= current && current >= 0 ? LEVEL_COLORS[current] : 'bg-white/10'}`}
        />
      ))}
    </div>
  );
}

function Points({
  title,
  items,
  tone,
}: {
  title: string;
  items?: string[];
  tone: 'good' | 'bad';
}) {
  const good = tone === 'good';
  return (
    <div
      className={`rounded-lg border p-5 ${good ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}
    >
      <h3 className={`flex items-center gap-2 font-display text-sm uppercase tracking-wide ${good ? 'text-green-400' : 'text-red-400'}`}>
        {good ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
        {title}
      </h3>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed">
        {items && items.length > 0 ? items.map((item) => <li key={item}>{item}</li>) : <li>N/A</li>}
      </ul>
    </div>
  );
}

export default function DeckAnalysis({ deckCheck }: DeckAnalysisProps) {
  if (!deckCheck) return null;

  return (
    <section id="analysis" className="scroll-mt-32">
      <p className="kicker">Deck check</p>
      <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight">
        Análise estratégica
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-card p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Swords className="h-4 w-4" />
            Estilo de jogo
          </p>
          <p className="mt-2 font-display text-xl uppercase tracking-wide">
            {deckCheck.playstyle ?? 'N/A'}
          </p>
        </div>
        <div className="rounded-lg border border-white/10 bg-card p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            Dificuldade
          </p>
          <p className="mt-2 font-display text-xl uppercase tracking-wide">
            {deckCheck.difficulty ?? 'N/A'}
          </p>
          {deckCheck.difficulty && <DifficultyMeter level={deckCheck.difficulty} />}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-card p-5">
        <p className="kicker">Condição de vitória</p>
        <p className="mt-3 max-w-3xl leading-relaxed">{deckCheck.win_condition ?? 'N/A'}</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Points title="Pontos fortes" items={deckCheck.strengths} tone="good" />
        <Points title="Pontos fracos" items={deckCheck.weaknesses} tone="bad" />
      </div>
    </section>
  );
}
