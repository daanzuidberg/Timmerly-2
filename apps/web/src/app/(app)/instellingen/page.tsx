import { desc, eq, schema } from '@timmerly/db';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { getProfessionalProfile } from '@/lib/auth/profiles';
import { AppShell } from '@/components/AppShell';
import { NotificationPrefsForm, PasswordForm, PrivacyTools, SessionList, TotpSetup, VisibilityForm } from '@/components/forms/SettingsForms';
import { Card, StatusPill } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requireUser();
  const d = db();
  const [prefs, sessions, profile, events] = await Promise.all([
    d.query.notificationPreferences.findFirst({ where: eq(schema.notificationPreferences.userId, user.id) }),
    d.query.sessions.findMany({ where: eq(schema.sessions.userId, user.id), orderBy: desc(schema.sessions.lastSeenAt) }),
    user.role === 'professional' ? getProfessionalProfile(user.id) : null,
    d.query.securityEvents.findMany({ where: eq(schema.securityEvents.userId, user.id), orderBy: desc(schema.securityEvents.createdAt), limit: 8 })
  ]);
  return (
    <AppShell user={user} title="Instellingen" subtitle="Account, beveiliging, meldingen en privacy">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Account"><dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm"><dt className="text-muted">Naam</dt><dd className="font-semibold">{user.firstName} {user.lastName}</dd><dt className="text-muted">E-mail</dt><dd className="font-semibold">{user.email} <StatusPill status={user.emailVerified ? 'verified' : 'pending'} /></dd><dt className="text-muted">Rol</dt><dd className="font-semibold">{user.role === 'professional' ? 'Vakman' : user.role === 'company' ? 'Opdrachtgever' : 'Timmerly-team'}</dd></dl></Card>
        <Card title="Wachtwoord"><PasswordForm /></Card>
        <Card title="Tweestapsverificatie"><TotpSetup enabled={user.totpEnabled} /></Card>
        <Card title="Actieve sessies"><SessionList currentId={user.sessionId} sessions={sessions.map((s) => ({ id: s.id, userAgent: s.userAgent, ip: s.ip, lastSeenAt: s.lastSeenAt.toLocaleString('nl-NL') }))} /></Card>
        <Card title="Meldingen"><NotificationPrefsForm prefs={{ email: prefs?.email ?? true, push: prefs?.push ?? false, matchDigest: prefs?.matchDigest ?? 'daily' }} /></Card>
        {profile && <Card title="Zichtbaarheid"><VisibilityForm visibility={profile.visibility} /></Card>}
        <Card title="Privacy en gegevens"><PrivacyTools /></Card>
        <Card title="Recente beveiligingsgebeurtenissen"><ul className="text-sm">{events.map((e) => <li key={e.id} className="flex justify-between border-b border-line py-1.5 last:border-0"><span>{e.type}</span><span className="text-muted">{e.createdAt.toLocaleString('nl-NL')}{e.ip ? ` · ${e.ip}` : ''}</span></li>)}</ul></Card>
      </div>
    </AppShell>
  );
}
