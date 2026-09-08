import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Timmerly — de juiste vakman op het juiste project', template: '%s · Timmerly' },
  description: 'Timmerly koppelt aannemers en zzp-timmermannen op basis van vak, ervaring, afstand, beschikbaarheid en geverifieerde certificaten. Geen vacaturebank, maar matching.',
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  openGraph: { siteName: 'Timmerly', locale: 'nl_NL', type: 'website' }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
