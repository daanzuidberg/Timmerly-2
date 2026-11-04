import Link from 'next/link';
import { and, count, eq, gte, inArray, schema, sql } from '@timmerly/db';
import { APPLICATION_STAGE_LABELS, TRADE_LABELS, isoWeek, todayIso, type Trade } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { Card, Stat } from '@/components/ui';

export const dynamic = 'force-dynamic';

/** De funnel in volgorde; declined/withdrawn tellen als uitval, niet als stap. */
const FUNNEL_STAGES = ['interest', 'contact', 'proposal', 'agreed', 'active', 'completed', 'reviewed'] as const;

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 flex-shrink-0 text-sm text-navy-500">{label}</span>
      <div className="h-6 flex-1 overflow-hidden rounded-control bg-ground">
        <div className="h-full rounded-control bg-orange transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular w-10 flex-shrink-0 text-right text-sm font-bold">{value}</span>
    </div>
  );
}

/** Kerncijfers voor het team. Privacyvriendelijk: alleen tellingen, geen individuele profielen. */
export default async function AdminHome() {
  const user = await requireRole('admin', 'moderator');
  const d = db();
  const since30 = new Date(Date.now() - 30 * 86_400_000);
  const since8weeks = new Date(Date.now() - 56 * 86_400_000);
  const n = async (q: Promise<Array<{ n: number }>>) => (await q)[0]?.n ?? 0;
  const [users, newUsers, pros, companies, projects, openProjects, apps, contacts, active, pendingVerif, pendingCerts, projectsToReview, openReports] = await Promise.all([
    n(d.select({ n: count() }).from(schema.users).where(eq(schema.users.status, 'active'))),
    n(d.select({ n: count() }).from(schema.users).where(gte(schema.users.createdAt, since30))),
    n(d.select({ n: count() }).from(schema.users).where(and(eq(schema.users.role, 'professional'), eq(schema.users.status, 'active')))),
    n(d.select({ n: count() }).from(schema.users).where(and(eq(schema.users.role, 'company'), eq(schema.users.status, 'active')))),
    n(d.select({ n: count() }).from(schema.projects).where(eq(schema.projects.isTemplate, false))),
    n(d.select({ n: count() }).from(schema.projects).where(inArray(schema.projects.status, ['published', 'matching']))),
    n(d.select({ n: count() }).from(schema.applications)),
    n(d.select({ n: count() }).from(schema.applications).where(inArray(schema.applications.stage, ['contact', 'proposal', 'agreed', 'active', 'completed', 'reviewed']))),
    n(d.select({ n: count() }).from(schema.applications).where(inArray(schema.applications.stage, ['active', 'completed', 'reviewed']))),
    n(d.select({ n: count() }).from(schema.verifications).where(eq(schema.verifications.status, 'pending'))),
    n(d.select({ n: count() }).from(schema.certificates).where(eq(schema.certificates.status, 'pending'))),
    n(d.select({ n: count() }).from(schema.projects).where(eq(schema.projects.status, 'in_review'))),
    n(d.select({ n: count() }).from(schema.reports).where(eq(schema.reports.status, 'open')))
  ]);
  const regions = await d.select({ province: schema.projects.province, n: count() }).from(schema.projects).where(inArray(schema.projects.status, ['published', 'matching'])).groupBy(schema.projects.province).orderBy(sql`count(*) desc`).limit(6);
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + '%' : '—');

  // Funnel: cumulatief per stap (hoeveel aanmeldingen hebben deze stap minstens gehaald). Uitval apart.
  const stageRows = await d.select({ stage: schema.applications.stage, n: count() }).from(schema.applications).groupBy(schema.applications.stage);
  const stageCounts = Object.fromEntries(stageRows.map((r) => [r.stage, r.n])) as Record<string, number>;
  const dropouts = (stageCounts.declined ?? 0) + (stageCounts.withdrawn ?? 0);
  const funnel = FUNNEL_STAGES.map((stage, i) => ({
    stage,
    label: APPLICATION_STAGE_LABELS[stage],
    value: FUNNEL_STAGES.slice(i).reduce((s, st) => s + (stageCounts[st] ?? 0), 0)
  }));
  const funnelMax = funnel[0]?.value ?? 0;

  // Vakverdeling: waar zit het aanbod van actieve vakmensen.
  const trades = await d
    .select({ trade: schema.professionalProfiles.trade, n: count() })
    .from(schema.professionalProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.professionalProfiles.userId))
    .where(eq(schema.users.status, 'active'))
    .groupBy(schema.professionalProfiles.trade)
    .orderBy(sql`count(*) desc`)
    .limit(6);
  const tradesMax = trades[0]?.n ?? 0;

  // Groei per week, laatste 8 weken — in JS gebundeld (dataset is klein; geen date_trunc nodig).
  const recentUsers = await d.select({ role: schema.users.role, createdAt: schema.users.createdAt }).from(schema.users).where(gte(schema.users.createdAt, since8weeks));
  const weekKey = (dt: Date) => { const { year, week } = isoWeek(todayIso(dt)); return `${year}-W${String(week).padStart(2, '0')}`; };
  const weekKeys: string[] = [];
  for (let i = 7; i >= 0; i--) { const k = weekKey(new Date(Date.now() - i * 7 * 86_400_000)); if (!weekKeys.includes(k)) weekKeys.push(k); }
  const growth = weekKeys.map((key) => ({
    key,
    pros: recentUsers.filter((u) => u.role === 'professional' && weekKey(u.createdAt) === key).length,
    companies: recentUsers.filter((u) => u.role === 'company' && weekKey(u.createdAt) === key).length
  }));

  return (
    <AppShell user={user} title="Beheer" subtitle={`Rol: ${user.role === 'admin' ? 'Admin · volledige toegang' : 'Moderator'}`}>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Actieve gebruikers" value={users} hint={`${pros} vakmensen · ${companies} bedrijven · ${newUsers} nieuw in 30 dagen`} />
        <Stat label="Projecten" value={projects} hint={`${openProjects} open`} />
        <Stat label="Match → contact" value={pct(contacts, apps)} hint={`${contacts} van ${apps} aanmeldingen`} />
        <Stat label="Contact → opdracht" value={pct(active, contacts)} hint={`${active} opdrachten`} />
      </div>
      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Card title="Werkvoorraad"><ul className="flex flex-col gap-2 text-sm">
          <li className="flex justify-between"><Link href="/admin/verificaties">Verificaties in behandeling</Link><strong>{pendingVerif}</strong></li>
          <li className="flex justify-between"><Link href="/admin/verificaties">Certificaten te controleren</Link><strong>{pendingCerts}</strong></li>
          <li className="flex justify-between"><Link href="/admin/projecten">Projecten te beoordelen</Link><strong>{projectsToReview}</strong></li>
          <li className="flex justify-between"><Link href="/admin/meldingen">Open meldingen</Link><strong>{openReports}</strong></li>
        </ul></Card>
        <Card title="Open projecten per provincie"><ul className="text-sm">{regions.map((r) => <li key={r.province ?? '-'} className="flex justify-between border-b border-line py-1.5 last:border-0"><span>{r.province ?? 'Onbekend'}</span><strong>{r.n}</strong></li>)}</ul></Card>
      </div>
      <div className="mb-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Funnel: interesse tot afgerond" action={dropouts > 0 ? <span className="text-xs text-faint">{dropouts} uitgevallen (niet geselecteerd / ingetrokken)</span> : undefined}>
          <div className="flex flex-col gap-2.5">{funnel.map((f) => <FunnelRow key={f.stage} label={f.label} value={f.value} max={funnelMax} />)}</div>
        </Card>
        <Card title="Vakverdeling actieve vakmensen">
          {trades.length ? <div className="flex flex-col gap-2.5">{trades.map((t) => <FunnelRow key={t.trade} label={TRADE_LABELS[t.trade as Trade] ?? t.trade} value={t.n} max={tradesMax} />)}</div> : <p className="text-sm text-muted">Nog geen actieve vakmensen.</p>}
        </Card>
      </div>
      <Card title="Nieuwe gebruikers per week" action={<span className="text-xs text-faint">laatste 8 weken</span>}>
        <div className="grid grid-cols-8 gap-3 text-center text-sm">
          {growth.map((g) => (
            <div key={g.key} className="flex flex-col gap-1">
              <div className="text-xs text-faint">{g.key.split('-W')[1]}</div>
              <div className="tabular font-bold text-navy">{g.pros}</div>
              <div className="tabular text-xs text-muted">{g.companies}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-faint">Boven: nieuwe vakmensen per weeknummer · onder: nieuwe bedrijven.</p>
      </Card>
    </AppShell>
  );
}
