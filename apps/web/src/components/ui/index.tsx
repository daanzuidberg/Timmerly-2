import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

/** Kleine set bouwstenen; opmaak zit in globals.css zodat server- en clientcomponenten hetzelfde gebruiken. */

export function Field({ label, name, error, help, children, className = '' }: { label: string; name?: string; error?: string; help?: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      {children}
      {error ? <p className="error" role="alert">{error}</p> : help ? <p className="help">{help}</p> : null}
    </div>
  );
}

export function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'orange' | 'navy' | 'info'; children: ReactNode }) {
  const tones = {
    neutral: 'bg-[#EDEFF2] text-navy-500', ok: 'bg-ok-100 text-ok-800', warn: 'bg-warn-100 text-warn-800', bad: 'bg-bad-100 text-bad-800',
    orange: 'bg-orange/12 text-orange-700', navy: 'bg-navy text-white', info: 'bg-[#E8EDF7] text-navy-500'
  };
  return <span className={`pill ${tones[tone]}`}>{children}</span>;
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { tone: Parameters<typeof Pill>[0]['tone']; label: string }> = {
    verified: { tone: 'ok', label: 'Geverifieerd' }, pending: { tone: 'warn', label: 'In behandeling' }, unverified: { tone: 'neutral', label: 'Niet geverifieerd' },
    rejected: { tone: 'bad', label: 'Afgekeurd' }, expired: { tone: 'bad', label: 'Verlopen' },
    draft: { tone: 'neutral', label: 'Concept' }, in_review: { tone: 'warn', label: 'In beoordeling' }, published: { tone: 'ok', label: 'Gepubliceerd' }, matching: { tone: 'orange', label: 'Matching' },
    filled: { tone: 'info', label: 'Ingevuld' }, completed: { tone: 'neutral', label: 'Afgerond' }, cancelled: { tone: 'neutral', label: 'Geannuleerd' }, removed: { tone: 'bad', label: 'Verwijderd' },
    interest: { tone: 'info', label: 'Interesse' }, contact: { tone: 'orange', label: 'In gesprek' }, proposal: { tone: 'orange', label: 'Voorstel' }, agreed: { tone: 'ok', label: 'Akkoord' },
    active: { tone: 'ok', label: 'Opdracht loopt' }, reviewed: { tone: 'neutral', label: 'Beoordeeld' }, declined: { tone: 'neutral', label: 'Niet geselecteerd' }, withdrawn: { tone: 'neutral', label: 'Ingetrokken' },
    submitted: { tone: 'info', label: 'Ingediend' }, approved: { tone: 'ok', label: 'Goedgekeurd' },
    available: { tone: 'ok', label: 'Beschikbaar' }, limited: { tone: 'warn', label: 'Beperkt' }, unavailable: { tone: 'bad', label: 'Niet beschikbaar' }, booked: { tone: 'navy', label: 'Geboekt' },
    open: { tone: 'warn', label: 'Open' }, resolved: { tone: 'ok', label: 'Afgehandeld' }, dismissed: { tone: 'neutral', label: 'Afgewezen' },
    suspended: { tone: 'bad', label: 'Geblokkeerd' }, deleted: { tone: 'neutral', label: 'Verwijderd' }
  };
  const m = map[status] ?? { tone: 'neutral' as const, label: status };
  return <Pill tone={m.tone}>{m.label}</Pill>;
}

export function Card({ children, className = '', title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="-mx-6 -mt-6 mb-5 flex items-center justify-between gap-3 border-b border-line-soft px-6 py-4">
          {title && <h2 className="h3">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-card border border-dashed border-line bg-ground/50 px-6 py-10 text-center text-sm text-muted">{children}</div>;
}

export function Score({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-xl';
  const color = value >= 85 ? 'text-ok-800' : value >= 65 ? 'text-orange-700' : 'text-muted';
  return (
    <div className="text-center">
      <div className={`font-bold ${sz} ${color}`}>{value}%</div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-faint">match</div>
    </div>
  );
}

export function Reasons({ reasons, max = 6 }: { reasons: Array<{ label: string; positive: boolean }>; max?: number }) {
  return (
    <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
      {reasons.slice(0, max).map((r, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className={`mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full ${r.positive ? 'bg-ok' : 'bg-warn'}`} />
          <span className={r.positive ? 'text-navy' : 'text-muted'}>{r.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function Alert({ tone = 'info', children }: { tone?: 'info' | 'ok' | 'warn' | 'bad'; children: ReactNode }) {
  const tones = { info: 'border-line bg-white', ok: 'border-ok/40 bg-ok-100 text-ok-800', warn: 'border-warn/40 bg-warn-100 text-warn-800', bad: 'border-bad/40 bg-bad-100 text-bad-800' };
  return <div className={`rounded-card border px-4 py-3 text-sm ${tones[tone]}`} role={tone === 'bad' ? 'alert' : undefined}>{children}</div>;
}

// Beeldmerk: 512×491px bronbestand, dus breedte volgt de hoogte in diezelfde verhouding.
const LOGO_MARK_RATIO = 512 / 491;

export function Logo({ light = false, size = 32 }: { light?: boolean; size?: number }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
      <Image src="/images/logo-mark.png" alt="" width={Math.round(size * LOGO_MARK_RATIO)} height={size} priority />
      <span className={`text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-navy'}`}>Timmerly</span>
    </Link>
  );
}

export function Avatar({ name, color, size = 40 }: { name: string; color?: string; size?: number }) {
  const initials = name.split(' ').filter(Boolean).map((w) => w[0]!.toUpperCase()).slice(0, 2).join('');
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const palette = ['#F26522', '#3A5298', '#7C3AED', '#059669', '#0C1A2A', '#B45309'];
  return (
    <span className="inline-flex flex-shrink-0 items-center justify-center rounded-full font-bold text-white" style={{ width: size, height: size, background: color ?? palette[hash % palette.length], fontSize: size * 0.38 }} aria-hidden="true">
      {initials}
    </span>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card relative overflow-hidden p-5">
      <span className="absolute inset-y-0 left-0 w-1 bg-orange" aria-hidden="true" />
      <div className="eyebrow">{label}</div>
      <div className="tabular mt-1 text-3xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-sm text-muted">{hint}</div>}
    </div>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ground" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-orange transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
