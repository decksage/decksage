import Link from 'next/link';
import Image from 'next/image';
import DeckSageLogo from '../../../../public/decksage.png';
import DiscordCta from './DiscordCta';

type FooterLink = { href: string; label: string; external?: boolean };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Navegação',
    links: [
      { href: '/', label: 'Página Inicial' },
      { href: '/collections', label: 'Coleções' },
      { href: '/glossary', label: 'Glossário' },
      { href: '/favorites', label: 'Favoritos' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { href: 'https://magic.wizards.com', label: 'Site Oficial do Magic', external: true },
      { href: 'https://scryfall.com', label: 'Scryfall', external: true },
      { href: '/feedback', label: 'Enviar Feedback' },
      { href: '/roadmap', label: 'Roadmap público' },
      { href: '/changelog', label: 'Changelog' },
    ],
  },
  {
    title: 'Comunidade',
    links: [
      { href: '/feed', label: 'Feed' },
      { href: '/explore', label: 'Explorar' },
      { href: '/community', label: 'Primers & tier lists' },
    ],
  },
];

const linkClass =
  'text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline decoration-primary';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-white/10 bg-background">
      <div className="mana-strip absolute inset-x-0 -top-px h-px opacity-70" aria-hidden />
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 md:grid-cols-12">
        <div className="md:col-span-4">
          <Image src={DeckSageLogo} alt="DeckSage" sizes="120px" className="h-auto w-[120px]" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Cartas traduzidas, decks analisados e uma comunidade que joga Magic em português.
          </p>
          <div className="mt-5">
            <DiscordCta />
          </div>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="md:col-span-2 lg:col-span-2">
            <h3 className="kicker mb-4">{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>&copy; {currentYear} DeckSage. Todos os direitos reservados.</p>
          <p className="max-w-xl md:text-right">
            Magic: The Gathering é propriedade da Wizards of the Coast. Este site não é afiliado à
            Wizards of the Coast.
          </p>
        </div>
      </div>
    </footer>
  );
}
