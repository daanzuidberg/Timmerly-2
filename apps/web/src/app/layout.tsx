import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import './globals.css';

/**
 * Inter, zelf gehost vanuit @fontsource-variable/inter (npm) in plaats van via
 * Google Fonts: de build heeft dan geen internet nodig, en er gaat geen enkel
 * verzoek van de bezoeker naar Google — dat past bij de AVG-uitgangspunten in
 * docs/06. Eén variabel bestand (latin-ext) dekt alle gewichten én de Poolse,
 * Roemeense en Tsjechische tekens die in Nederlandse bouwnamen voorkomen.
 */
const inter = localFont({
  src: '../../node_modules/@fontsource-variable/inter/files/inter-latin-ext-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-inter',
  fallback: ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif']
});

export const metadata: Metadata = {
  title: { default: 'Timmerly — de juiste vakman op het juiste project', template: '%s · Timmerly' },
  description: 'Timmerly koppelt aannemers en zzp-timmermannen op basis van vak, ervaring, afstand, beschikbaarheid en geverifieerde certificaten. Geen vacaturebank, maar matching.',
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  openGraph: { siteName: 'Timmerly', locale: 'nl_NL', type: 'website' }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
