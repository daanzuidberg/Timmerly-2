import { notFound } from 'next/navigation';
import { desc, eq, schema } from '@timmerly/db';
import { formatDateNl } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { loadApplication } from '@/lib/actions/applications';
import { AppShell } from '@/components/AppShell';
import { DecideWeek, EntryForm, SubmitWeekButton } from '@/components/TimesheetForms';
import { Card, Empty, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function HoursPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const loaded = await loadApplication(id, user);
  if (!loaded) notFound();
  const { app, isPro, isCompany } = loaded;
  const sheets = await db().query.timesheets.findMany({ where: eq(schema.timesheets.applicationId, id), orderBy: [desc(schema.timesheets.isoYear), desc(schema.timesheets.isoWeek)], with: { entries: { orderBy: (e, { asc }) => asc(e.day) } } });
  const hrs = (m: number) => (m / 60).toFixed(1).replace('.', ',');
  const rate = app.proposal?.hourlyRate;
  return (
    <AppShell user={user} title="Uren" subtitle={`${app.project.title} · ${isCompany ? `${app.profile.user.firstName} ${app.profile.user.lastName}` : app.project.company.name}`} actions={<StatusPill status={app.stage} />}>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          {sheets.length ? sheets.map((s) => (
            <Card key={s.id} title={`Week ${s.isoWeek} · ${s.isoYear}`} action={<div className="flex items-center gap-3"><span className="font-bold">{hrs(s.totalMinutes)} uur{rate ? ` · €${(s.totalMinutes / 60 * rate).toLocaleString('nl-NL', { maximumFractionDigits: 2 })}` : ''}</span><StatusPill status={s.status} /></div>}>
              <table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-faint"><th className="py-1">Dag</th><th>Tijden</th><th>Pauze</th><th className="text-right">Uren</th></tr></thead><tbody>{s.entries.map((e) => <tr key={e.id} className="border-t border-line"><td className="py-2 font-semibold">{formatDateNl(e.day)}</td><td>{e.startTime} – {e.endTime}</td><td>{e.breakMinutes} min</td><td className="text-right font-bold">{hrs(e.minutes)}</td></tr>)}</tbody></table>
              {s.entries.some((e) => e.note) && <ul className="mt-2 text-xs text-muted">{s.entries.filter((e) => e.note).map((e) => <li key={e.id}>{formatDateNl(e.day)}: {e.note}</li>)}</ul>}
              {s.decisionNote && <p className="mt-2 text-sm"><strong>{s.status === 'approved' ? 'Goedgekeurd' : 'Afgewezen'}:</strong> {s.decisionNote}</p>}
              <div className="mt-3">
                {isPro && (s.status === 'draft' || s.status === 'rejected') && s.entries.length > 0 && <SubmitWeekButton timesheetId={s.id} />}
                {isCompany && s.status === 'submitted' && <DecideWeek timesheetId={s.id} />}
              </div>
            </Card>
          )) : <Empty>Nog geen uren geregistreerd{isPro ? ' — voeg hiernaast je eerste werkdag toe' : ''}.</Empty>}
        </div>
        <div>{isPro && app.stage === 'active' ? <Card title="Werkdag toevoegen"><EntryForm applicationId={id} /></Card> : <Card title="Werkwijze"><p className="text-sm text-muted">De vakman voert per dag begin- en eindtijd en pauze in en dient de week in. {isCompany ? 'Jij keurt goed of wijst af met reden; goedgekeurde uren zijn de basis voor facturatie.' : 'De opdrachtgever keurt goed of wijst af met reden.'}</p></Card>}</div>
      </div>
    </AppShell>
  );
}
