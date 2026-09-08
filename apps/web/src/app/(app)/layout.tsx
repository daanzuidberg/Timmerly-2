import type { ReactNode } from 'react';
import { requireUser } from '@/lib/auth/session';

/** Alle routes hieronder vereisen een ingelogde (en, waar ingesteld, 2FA-geverifieerde) gebruiker. */
export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
