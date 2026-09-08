import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { Logo } from './ui';

export async function PublicNav() {
  const user = await getSession();
  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
        <Logo />
        <div className="hidden items-center gap-6 text-[15px] font-semibold text-navy md:flex">
          <Link href="/projecten" className="text-navy hover:text-orange-700">Projecten</Link>
          <Link href="/hoe-het-werkt" className="text-navy hover:text-orange-700">Hoe het werkt</Link>
          <Link href="/voor-opdrachtgevers" className="text-navy hover:text-orange-700">Voor opdrachtgevers</Link>
          <Link href="/zzp-check" className="text-navy hover:text-orange-700">ZZP-check</Link>
        </div>
        <div className="flex gap-2.5">
          {user ? (
            <Link href="/dashboard" className="btn-dark btn-sm">Naar dashboard</Link>
          ) : (
            <>
              <Link href="/inloggen" className="btn-secondary btn-sm">Inloggen</Link>
              <Link href="/registreren" className="btn-primary btn-sm">Aanmelden</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
