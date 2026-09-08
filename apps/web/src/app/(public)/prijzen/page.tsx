import { ContentPage } from '@/components/ContentPage';
import { db } from '@/lib/db';
export const metadata = { title: 'Prijzen' };
export const dynamic = 'force-dynamic';
export default async function Page() {
  const plans = await db().query.plans.findMany();
  const group = (a: string) => plans.filter((p) => p.audience === a);
  const card = (p: (typeof plans)[number]) => (
    <div key={p.slug} className="card"><div className="font-bold">{p.label}</div><div className="mt-1 text-2xl font-bold">{p.priceCentsMonthly ? `€${(p.priceCentsMonthly / 100).toFixed(0)}` : p.slug.includes('enterprise') ? 'Op maat' : 'Gratis'}<span className="text-sm font-normal text-muted">{p.priceCentsMonthly ? ' / maand' : ''}</span></div><ul className="mt-3 text-sm text-muted">{Object.entries(p.features).map(([k, v]) => <li key={k}>{k}: {String(v)}</li>)}</ul></div>
  );
  return (
    <ContentPage eyebrow="Prijzen" title="Gratis voor vakmensen. Eerlijk voor bedrijven." intro="Vakmensen betalen nooit voor een profiel of een match. Bedrijven kiezen een abonnement dat past bij het aantal projecten.">
      <section><h2>Vakmensen</h2><div className="grid gap-4 sm:grid-cols-2">{group('professional').map(card)}</div></section>
      <section><h2>Bedrijven</h2><div className="grid gap-4 sm:grid-cols-3">{group('company').map(card)}</div></section>
      <p className="text-sm text-faint">Prijzen zijn indicatief en worden centraal beheerd; wijzigingen gelden vanaf de volgende factuurperiode.</p>
    </ContentPage>
  );
}
