/* eslint-disable no-undef */
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BrainCircuit, BookCopy, Dices, Hourglass, Swords, Gem, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface HowToPlayGuideProps {
  guideText: string | null;
}

const sectionIcons: Record<string, React.ReactElement> = {
  'Visão Geral da Estratégia': <BookCopy className="h-5 w-5 text-primary" />,
  'Postura de Mulligan': <Dices className="h-5 w-5 text-primary" />,
  'Jogo Inicial (Turnos 1-3)': <Hourglass className="h-5 w-5 text-primary" />,
  'Meio de Jogo (Turnos 4-6)': <Swords className="h-5 w-5 text-primary" />,
  'Fim de Jogo (Turnos 7+)': <Gem className="h-5 w-5 text-primary" />,
  'Dicas e Sinergias': <Sparkles className="h-5 w-5 text-primary" />,
};

const parseGuide = (text: string): { title: string; content: string }[] => {
  if (!text) return [];
  const sections = text.trim().split(/\n(?=###\s)/);
  return sections
    .map((section) => {
      const cleanSection = section.replace(/^###\s/, '').trim();
      const lines = cleanSection.split('\n');
      const title = lines.shift() || 'Seção';
      const content = lines.join('\n').trim();
      return { title, content };
    })
    .filter((section) => section.title && section.content);
};

export default function HowToPlayGuide({ guideText }: HowToPlayGuideProps) {
  if (!guideText) return null;

  const guideSections = parseGuide(guideText);
  const defaultValue = guideSections.length > 0 ? [guideSections[0].title] : [];

  return (
    <section id="guide" className="scroll-mt-32">
      <p className="kicker flex items-center gap-2">
        <BrainCircuit className="h-4 w-4" />
        Piloto
      </p>
      <h2 className="mt-2 font-display text-2xl font-bold uppercase tracking-tight">
        Guia de como jogar
      </h2>
      <Accordion type="multiple" defaultValue={defaultValue} className="mt-4">
        {guideSections.map((section) => (
          <AccordionItem key={section.title} value={section.title} className="border-white/10">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="flex items-center gap-3">
                {sectionIcons[section.title] || <BookCopy className="h-5 w-5 text-primary" />}
                <span className="font-medium">{section.title}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="max-w-3xl text-sm leading-relaxed text-muted-foreground [&_li]:mt-1 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
                <ReactMarkdown>{section.content}</ReactMarkdown>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
