import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import glossaryTerms from '@/app/(site)/data/glossaryTerms.json';
import PageHeader, { MetaChip } from '../components/page/PageHeader';
import GlossaryBrowser, { type GlossaryTerm } from './GlossaryBrowser';
import AdSlot from '../components/ads/AdSlot';

export const metadata: Metadata = {
  title: 'Glossário de Termos | MTG Translate',
  description:
    'Entenda os termos e palavras-chave do Magic: The Gathering com explicações detalhadas.',
};

const terms: GlossaryTerm[] = [...glossaryTerms.terms].sort((a, b) =>
  a.translated.localeCompare(b.translated, 'pt-BR'),
);

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'DefinedTermSet',
  name: 'Glossário do Magic: The Gathering',
  hasDefinedTerm: terms.map((t) => ({
    '@type': 'DefinedTerm',
    name: t.translated,
    alternateName: t.original,
    description: t.definition,
  })),
};

export default function GlossaryPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <PageHeader
        kicker="Referência de regras"
        title="Glossário"
        description="Palavras-chave e habilidades do Magic explicadas em português, com o termo original em inglês ao lado."
        meta={
          <MetaChip icon={BookOpen}>
            <span className="font-semibold text-foreground tabular-nums">{terms.length}</span>{' '}
            termos
          </MetaChip>
        }
        className="border-b-0"
      />
      <GlossaryBrowser terms={terms} ad={<AdSlot placement="glossary" />} />
    </>
  );
}
