import ManaColorLink from './ManaColorLink';
import SectionHeading from './SectionHeading';

const manaColorsData = [
  { symbol: 'W', name: 'Branco', color: 'var(--mana-w)', href: '/search?colors=W' },
  { symbol: 'U', name: 'Azul', color: 'var(--mana-u)', href: '/search?colors=U' },
  { symbol: 'B', name: 'Preto', color: 'var(--mana-b)', href: '/search?colors=B' },
  { symbol: 'R', name: 'Vermelho', color: 'var(--mana-r)', href: '/search?colors=R' },
  { symbol: 'G', name: 'Verde', color: 'var(--mana-g)', href: '/search?colors=G' },
  { symbol: 'C', name: 'Incolor', color: 'oklch(0.75 0 0)', href: '/search?colors=C' },
  { symbol: 'M', name: 'Multicolor', color: 'var(--primary)', href: '/search?colors=M' },
];

export default function ManaColorNavigationSection() {
  return (
    <section>
      <SectionHeading
        index="02"
        kicker="Identidade de cor"
        title="Navegue por cor"
        description="Explore as cartas pela identidade de cor e descubra novas sinergias para os seus decks."
        className="reveal"
      />
      <div className="reveal mt-10 grid grid-cols-4 gap-3 sm:grid-cols-7 sm:gap-4">
        {manaColorsData.map((mana) => (
          <ManaColorLink key={mana.symbol} {...mana} />
        ))}
      </div>
    </section>
  );
}
