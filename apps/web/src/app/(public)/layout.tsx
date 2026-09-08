import type { ReactNode } from 'react';
import { Footer } from '@/components/Footer';
import { PublicNav } from '@/components/PublicNav';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
