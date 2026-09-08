import Link from 'next/link';
import type { ReactNode } from 'react';
import { and, eq, isNull, schema, count } from '@timmerly/db';
import { db } from '@/lib/db';
import { logout } from '@/lib/actions/auth';
import type { SessionUser } from '@/lib/auth/session';
import { Avatar, Logo } from './ui';

type NavItem = { href: string; label: string; short: string; badge?: number };

const NAV: Record<string, NavItem[]> = {
  professional: [
    { href: '/dashboard', label: 'Dashboard', short: 'Home' }, { href: '/projecten', label: 'Projecten', short: 'Werk' }, { href: '/aanmeldingen', label: 'Mijn aanmeldingen', short: 'Aanmeld.' },
    { href: '/berichten', label: 'Berichten', short: 'Chat' }, { href: '/uren', label: 'Uren', short: 'Uren' }, { href: '/profiel', label: 'Mijn profiel', short: 'Profiel' },
    { href: '/profiel/beschikbaarheid', label: 'Beschikbaarheid', short: '' }, { href: '/zzp-check', label: 'ZZP-check', short: '' }, { href: '/favorieten', label: 'Opgeslagen', short: '' }
  ],
  company: [
    { href: '/dashboard', label: 'Dashboard', short: 'Home' }, { href: '/mijn-projecten', label: 'Mijn projecten', short: 'Projecten' }, { href: '/projecten/nieuw', label: 'Project plaatsen', short: 'Nieuw' },
    { href: '/vakmensen', label: 'Vakmensen zoeken', short: 'Zoeken' }, { href: '/berichten', label: 'Berichten', short: 'Chat' }, { href: '/uren', label: 'Uren goedkeuren', short: 'Uren' },
    { href: '/favorieten', label: 'Talentpool', short: '' }, { href: '/bedrijf', label: 'Bedrijfsprofiel', short: '' }, { href: '/zzp-check', label: 'ZZP-check', short: '' }
  ],
  admin: [
    { href: '/admin', label: 'Overzicht', short: 'Home' }, { href: '/admin/verificaties', label: 'Verificaties', short: 'Verif.' }, { href: '/admin/projecten', label: 'Projecten', short: 'Proj.' },
    { href: '/admin/gebruikers', label: 'Gebruikers', short: 'Users' }, { href: '/admin/meldingen', label: 'Meldingen', short: 'Meld.' }, { href: '/admin/reviews', label: 'Reviews', short: '' },
    { href: '/admin/auditlog', label: 'Auditlog', short: '' }, { href: '/admin/instellingen', label: 'Instellingen', short: '' }
  ]
};
NAV.moderator = NAV.admin!.filter((n) => n.href !== '/admin/instellingen' && n.href !== '/admin/gebruikers');

export async function AppShell({ user, children, title, subtitle, actions }: { user: SessionUser; children: ReactNode; title?: string; subtitle?: string; actions?: ReactNode }) {
  const d = db();
  const [unread] = await d.select({ n: count() }).from(schema.notifications).where(and(eq(schema.notifications.userId, user.id), isNull(schema.notifications.readAt)));
  const items = NAV[user.role] ?? NAV.professional!;
  return (
    <div className="flex min-h-screen bg-ground">
      <aside className="sticky top-0 hidden h-screen w-60 flex-col bg-navy p-5 text-white lg:flex">
        <Logo light />
        <nav className="mt-8 flex flex-1 flex-col gap-0.5">
          {items.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-control px-3 py-2.5 text-[15px] font-semibold text-white/70 no-underline hover:bg-white/10 hover:text-white">{n.label}</Link>
          ))}
        </nav>
        <div className="border-t border-white/10 pt-4 text-xs text-white/50">
          {user.role === 'professional' ? 'Vakman' : user.role === 'company' ? 'Opdrachtgever' : 'Timmerly-team'}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-white/95 px-5 py-3 shadow-nav backdrop-blur">
          <div className="min-w-0">
            <div className="lg:hidden"><Logo size={24} /></div>
            {title && <h1 className="truncate text-lg font-bold lg:text-xl">{title}</h1>}
            {subtitle && <div className="truncate text-sm text-muted">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <Link href="/meldingen" className="relative rounded-control border border-line px-3 py-2 text-sm font-semibold text-navy no-underline hover:border-navy" aria-label="Meldingen">
              Meldingen{unread!.n > 0 && <span className="absolute -right-1.5 -top-1.5 rounded-full bg-orange px-1.5 text-[10px] font-bold text-white">{unread!.n}</span>}
            </Link>
            <Link href="/instellingen" className="flex items-center gap-2 rounded-control border border-line py-1 pl-1 pr-3 text-sm font-semibold text-navy no-underline hover:border-navy">
              <Avatar name={`${user.firstName} ${user.lastName}`} size={28} /><span className="hidden sm:inline">{user.firstName}</span>
            </Link>
            <form action={logout}><button className="btn-ghost btn-sm" type="submit">Uitloggen</button></form>
          </div>
        </header>
        <main className="flex-1 px-5 py-6 pb-24 lg:px-8 lg:pb-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-white lg:hidden" aria-label="Hoofdmenu">
          {items.filter((n) => n.short).slice(0, 5).map((n) => (
            <Link key={n.href} href={n.href} className="flex-1 py-3 text-center text-xs font-bold text-muted no-underline hover:text-orange-700">{n.short}</Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
