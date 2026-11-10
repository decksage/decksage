/* eslint-disable no-undef */
// app/layout.tsx (O layout RAIZ, minimalista)

import './globals.css';
import 'mana-font/css/mana.css';
import { Toaster } from 'sonner';
import type { Metadata, Viewport } from 'next';
import { Chakra_Petch, Manrope } from 'next/font/google';
import GTM from './utils/analytics/GTM';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';

const display = Chakra_Petch({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display-face',
  display: 'swap',
});

const body = Manrope({
  subsets: ['latin'],
  variable: '--font-body-face',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MTG Brasil - Busque e Traduza Cartas de Magic',
  description: 'Uma plataforma para jogadores de Magic: The Gathering no Brasil.',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  themeColor: '#0b0a09',
  colorScheme: 'dark',
};

const GTM_ID = 'GTM-WBDZV8XS'; // Coloque seu GTM ID aqui

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`dark ${display.variable} ${body.variable}`}>
      <head>
        {/* Injeta o Script do GTM */}
        <GTM gtmId={GTM_ID} />
        <meta name="google-adsense-account" content="ca-pub-9935800504955016"></meta>
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        <PostHogProvider>
          {children}
          <Toaster richColors theme="dark" />
        </PostHogProvider>
      </body>
    </html>
  );
}
