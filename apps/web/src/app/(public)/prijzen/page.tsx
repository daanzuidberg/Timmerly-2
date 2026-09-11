import { ContentPage } from '@/components/ContentPage';
import { db } from '@/lib/db';

export const metadata = { title: 'Prijzen' };
export const dynamic = 'force-dynamic';

/** Herkenbare namen voor de losse aan/uit-features; een kale sleutel als "insights: true" zegt een bezoeker niets. */
const FEATURE_LABELS: Record<string, string> = {
  matches: 'Matches met passende projecten',
  chat: 'Chatten met opdrachtgevers',
  priorityMatches: 'Voorrang bij nieuwe matches',
  insights: 'Inzicht in wie je profiel bekeek',
  badgeHighlight: 'Uitgelicht profiel in zoekresultaten',
  talentpool: 'Eigen talentpool bijhouden',
  api: 'Toegang tot de Timmerly-API',
  sla: 'Vaste reactietijd (SLA)'
};

function featureRows(features: Record<string, unknown>): string[] {
  const rows: string[] = [];
  if (typeof features.openProjects === 'number') {
    rows.push(features.openProjects === -1 ? 'Onbeperkt aantal actieve projecten' : `${features.openProjects} actieve ${features.openProjects === 1 ? 'project' : 'projecten'} tegelijk`);
  }
  if (typeof features.featuredProjects === 'number') rows.push(`${features.featuredProjects} uitgelichte ${features.featuredProjects === 1 ? 'projectplaatsing' : 'projectplaatsingen'} per maand`);
  for (const [key, value] of Object.entries(features)) {
    if (key === 'openProjects' || key === 'featuredProjects' || value !== true) continue;
    rows.push(FEATURE_LABELS[key] ?? key);
  }
  return rows;
}

export default async function Page() {
  const plans = await db().query.plans.findMany();
  const group = (audience: string) => plans.filter((p) => p.audience === audience);
  const card = (p: (typeof plans)[number]) => (
    <div key={p.slug} className="card">
      <div className="font-bold">{p.label}</div>
      <div className="mt-1 text-2xl font-bold">
        {p.priceCentsMonthly ? `€${(p.priceCentsMonthly / 100).toFixed(0)}` : p.slug.includes('enterprise') ? 'Op maat' : 'Gratis'}
        <span className="text-sm font-normal text-muted">{p.priceCentsMonthly ? ' / maand' : ''}</span>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 text-sm">
        {featureRows(p.features).map((row) => (
          <li key={row} className="flex items-start gap-2 text-navy-500">
            <span className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-ok-100 text-[10px] font-bold text-ok-800">✓</span>
            {row}
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <ContentPage eyebrow="Prijzen" title="Gratis voor vakmensen. Eerlijk voor bedrijven." intro="Vakmensen betalen nooit voor een profiel of een match. Bedrijven kiezen een abonnement dat past bij het aantal projecten.">
      {/* Deze twee secties hebben zelf al kaarten per abonnement; de generieke sectie-kaart van ContentPage zou daar dubbelop overheen komen. */}
      <section className="!border-none !bg-transparent !p-0 !shadow-none"><h2>Vakmensen</h2><div className="grid gap-4 sm:grid-cols-2">{group('professional').map(card)}</div></section>
      <section className="!border-none !bg-transparent !p-0 !shadow-none"><h2>Bedrijven</h2><div className="grid gap-4 sm:grid-cols-3">{group('company').map(card)}</div></section>
      <p className="text-sm text-faint">Prijzen zijn indicatief en worden centraal beheerd; wijzigingen gelden vanaf de volgende factuurperiode.</p>
    </ContentPage>
  );
}
