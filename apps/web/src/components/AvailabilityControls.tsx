'use client';

import { useTransition } from 'react';
import { AVAILABILITY_LABELS, type AvailabilityStatus } from '@timmerly/core';
import { setAvailability, setAvailabilityDay } from '@/lib/actions/profile';

export function AvailabilityToggle({ current }: { current: AvailabilityStatus }) {
  const [pending, start] = useTransition();
  const opts: AvailabilityStatus[] = ['available', 'limited', 'unavailable'];
  const tone: Record<string, string> = { available: 'bg-ok-100 text-ok-800 border-ok', limited: 'bg-warn-100 text-warn-800 border-warn', unavailable: 'bg-bad-100 text-bad-800 border-bad' };
  return (
    <div className="flex flex-wrap gap-2" aria-busy={pending}>
      {opts.map((o) => (
        <button key={o} type="button" disabled={pending} aria-pressed={current === o} className={`chip ${current === o ? tone[o] : ''}`} onClick={() => start(() => setAvailability(o))}>{AVAILABILITY_LABELS[o]}</button>
      ))}
    </div>
  );
}

const CYCLE: Array<AvailabilityStatus | 'default'> = ['available', 'limited', 'unavailable', 'default'];

/** Maandkalender: klikken wisselt beschikbaar → beperkt → niet → standaard. Geboekte dagen (lopende opdracht) zijn vast. */
export function AvailabilityCalendar({ year, month, days, booked }: { year: number; month: number; days: Record<string, AvailabilityStatus>; booked: string[] }) {
  const [pending, start] = useTransition();
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const colors: Record<string, string> = { available: 'bg-ok-100 text-ok-800', limited: 'bg-warn-100 text-warn-800', unavailable: 'bg-bad-100 text-bad-800', booked: 'bg-navy text-white', default: 'bg-white border border-line text-navy' };
  return (
    <div aria-busy={pending}>
      <div className="mb-1 grid grid-cols-7 text-center text-xs font-bold text-faint">{['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((d) => <div key={d}>{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((n, i) => {
          if (!n) return <div key={`b${i}`} />;
          const iso = `${year}-${String(month).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
          const isBooked = booked.includes(iso);
          const status = isBooked ? 'booked' : (days[iso] ?? 'default');
          const next = CYCLE[(CYCLE.indexOf(status === 'default' ? 'default' : (status as AvailabilityStatus)) + 1) % CYCLE.length]!;
          return (
            <button key={iso} type="button" disabled={pending || isBooked} title={isBooked ? 'Geboekt' : status === 'default' ? 'Standaard' : AVAILABILITY_LABELS[status as AvailabilityStatus]}
              className={`aspect-square rounded-[4px] text-sm font-bold ${colors[status]} ${isBooked ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
              onClick={() => start(() => setAvailabilityDay(iso, next))}>{n}</button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
        {[['available', 'Beschikbaar'], ['limited', 'Beperkt'], ['unavailable', 'Niet beschikbaar'], ['booked', 'Geboekt'], ['default', 'Standaard (profiel)']].map(([k, l]) => <span key={k} className="inline-flex items-center gap-1.5"><span className={`inline-block h-3 w-3 rounded-[2px] ${colors[k!]}`} />{l}</span>)}
      </div>
    </div>
  );
}
