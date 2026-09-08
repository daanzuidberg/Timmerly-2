import Link from 'next/link';
import { CONTRACT_TYPE_LABELS, CONTRACT_TYPES, PROVINCES, SPECIALISMS, SPECIALISM_LABELS, ACTIVE_TRADES, TRADE_LABELS } from '@timmerly/core';

/** Filters als gewoon GET-formulier: deelbaar, werkt zonder JS, en cachebaar per URL. */
export function ProjectFilters({ values, hasViewer }: { values: Record<string, string | undefined>; hasViewer: boolean }) {
  const sel = (name: string, label: string, opts: ReadonlyArray<[string, string]>, all = 'Alle') => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <select id={name} name={name} className="input" defaultValue={values[name] ?? ''}>
        <option value="">{all}</option>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
  return (
    <form method="get" className="card flex flex-col gap-4">
      <div className="flex items-center justify-between"><span className="font-bold">Filters</span><Link href="/projecten" className="text-sm font-bold">Wissen</Link></div>
      <div><label className="label" htmlFor="q">Zoeken</label><input id="q" name="q" className="input" placeholder="Plaats, werk, bedrijf" defaultValue={values.q ?? ''} /></div>
      {sel('trade', 'Vakgebied', ACTIVE_TRADES.map((t) => [t, TRADE_LABELS[t]]))}
      {sel('specialism', 'Soort werk', SPECIALISMS.map((s) => [s, SPECIALISM_LABELS[s]]))}
      {sel('province', 'Provincie', PROVINCES.map((p) => [p, p]))}
      {sel('contractType', 'Contractvorm', CONTRACT_TYPES.map((c) => [c, CONTRACT_TYPE_LABELS[c]]))}
      {sel('startWithinDays', 'Startdatum', [['7', 'Binnen een week'], ['30', 'Binnen een maand'], ['90', 'Binnen drie maanden']], 'Alle')}
      {hasViewer && sel('maxKm', 'Reisafstand vanaf je woonplaats', [['25', 'Tot 25 km'], ['50', 'Tot 50 km'], ['100', 'Tot 100 km']], 'Onbeperkt')}
      <div><label className="label" htmlFor="minRate">Minimaal uurtarief</label><input id="minRate" name="minRate" type="number" min={0} className="input" placeholder="€" defaultValue={values.minRate ?? ''} /></div>
      {sel('sort', 'Sorteren', hasViewer ? [['match', 'Beste match'], ['newest', 'Nieuwste'], ['start', 'Startdatum']] : [['newest', 'Nieuwste'], ['start', 'Startdatum']], hasViewer ? 'Beste match' : 'Nieuwste')}
      <button className="btn-dark" type="submit">Toepassen</button>
    </form>
  );
}
