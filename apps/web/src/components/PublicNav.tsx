import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { Logo } from './ui';

export async function PublicNav() {
  const user = await getSession();
  return (
    <nav className="sticky top-0 z-40 bg-white/95 shadow-nav backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
        <Logo />
        <div className="hidden items-center gap-6 text-[15px] font-semibold text-navy md:flex">
          <Link href="/projecten" className="text-navy hover:text-orange-700">Projecten</Link>
          <Link href="/hoe-het-werkt" className="text-navy hover:text-orange-700">Hoe het werkt</Link>
          <Link href="/voor-opdrachtgevers" className="text-navy hover:text-orange-700">Voor opdrachtgevers</Link>
          <Link href="/zzp-check" className="text-navy hover:text-orange-700">ZZP-check</Link>
        </div>
        <div className="flex items-center gap-2.5">
          {user ? (
            <Link href="/dashboard" className="btn-dark btn-sm">Naar dashboard</Link>
          ) : (
            <>
              <Link href="/inloggen" className="btn-secondary btn-sm">Inloggen</Link>
              <Link href="/registreren" className="btn-primary btn-sm">Aanmelden</Link>
            </>
          )}
          {/* Native <details> geeft een werkend menu zonder client-JS: de vier
              hoofdlinks staan anders alleen achter md:flex en zijn op mobiel
              nergens anders te bereiken dan via de footer onderaan de pagina. */}
          <details className="relative md:hidden">
            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-control border border-line text-navy [&::-webkit-details-marker]:hidden" aria-label="Menu">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-card border border-line-soft bg-white p-2 shadow-card-hover">
              <Link href="/projecten" className="block rounded-control px-3 py-2 text-[15px] font-semibold text-navy no-underline hover:bg-ground">Projecten</Link>
              <Link href="/hoe-het-werkt" className="block rounded-control px-3 py-2 text-[15px] font-semibold text-navy no-underline hover:bg-ground">Hoe het werkt</Link>
              <Link href="/voor-opdrachtgevers" className="block rounded-control px-3 py-2 text-[15px] font-semibold text-navy no-underline hover:bg-ground">Voor opdrachtgevers</Link>
              <Link href="/zzp-check" className="block rounded-control px-3 py-2 text-[15px] font-semibold text-navy no-underline hover:bg-ground">ZZP-check</Link>
            </div>
          </details>
        </div>
      </div>
    </nav>
  );
}
