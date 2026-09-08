'use client';

import { useActionState, useState, useTransition } from 'react';
import { beginTotpSetup, changePassword, confirmTotp, disableTotp, revokeSession } from '@/lib/actions/auth';
import { deleteMyAccount, exportMyData, saveNotificationPrefs } from '@/lib/actions/settings';
import { saveVisibility } from '@/lib/actions/profile';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      {state?.ok && <Alert tone="ok">Wachtwoord gewijzigd. Andere sessies zijn uitgelogd.</Alert>}
      <Field label="Huidig wachtwoord" name="current" error={state?.fieldErrors?.current}><input id="current" name="current" type="password" className="input" required autoComplete="current-password" /></Field>
      <Field label="Nieuw wachtwoord" name="password" error={state?.fieldErrors?.password}><input id="password" name="password" type="password" className="input" required minLength={12} autoComplete="new-password" /></Field>
      <div><SubmitButton className="btn-dark btn-sm">Wachtwoord wijzigen</SubmitButton></div>
    </form>
  );
}

export function TotpSetup({ enabled }: { enabled: boolean }) {
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [pending, start] = useTransition();
  const [state, action] = useActionState(confirmTotp, null);
  const [off, offAction] = useActionState(disableTotp, null);
  if (enabled && !off?.ok) {
    return (
      <form action={offAction} className="flex flex-col gap-3">
        <Alert tone="ok">Tweestapsverificatie staat aan.</Alert>
        {off?.error && <Alert tone="bad">{off.error}</Alert>}
        <Field label="Wachtwoord om uit te schakelen" name="password"><input id="pw2" name="password" type="password" className="input" autoComplete="current-password" /></Field>
        <div><SubmitButton className="btn-secondary btn-sm">Uitschakelen</SubmitButton></div>
      </form>
    );
  }
  if (state?.ok) return <Alert tone="ok">Tweestapsverificatie is ingeschakeld.</Alert>;
  if (!setup) return <div><p className="mb-3 text-sm text-muted">Extra code uit een authenticator-app (Google Authenticator, Authy, 1Password) bij het inloggen. Sterk aanbevolen.</p><button type="button" className="btn-dark btn-sm" disabled={pending} onClick={() => start(async () => setSetup(await beginTotpSetup()))}>Instellen</button></div>;
  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm">Voeg dit geheim toe in je authenticator-app (of scan de link als QR-code):</p>
      <code className="block break-all rounded-card bg-ground p-3 text-sm">{setup.secret}</code>
      <a href={setup.uri} className="text-sm">Openen in authenticator-app</a>
      {state?.error && <Alert tone="bad">{state.error}</Alert>}
      <Field label="Code uit de app" name="code"><input id="code" name="code" inputMode="numeric" pattern="[0-9]{6}" className="input" required autoComplete="one-time-code" /></Field>
      <div><SubmitButton className="btn-primary btn-sm">Bevestigen en inschakelen</SubmitButton></div>
    </form>
  );
}

export function SessionList({ sessions, currentId }: { sessions: Array<{ id: string; userAgent: string | null; ip: string | null; lastSeenAt: string }>; currentId: string }) {
  const [pending, start] = useTransition();
  return (
    <ul className="divide-y divide-line text-sm">{sessions.map((s) => (
      <li key={s.id} className="flex items-center justify-between gap-3 py-2"><div><div className="font-semibold">{s.id === currentId ? 'Deze sessie' : (s.userAgent ?? 'Onbekend apparaat').slice(0, 60)}</div><div className="text-xs text-muted">{s.ip ?? ''} · laatst actief {s.lastSeenAt}</div></div>{s.id !== currentId && <button type="button" className="btn-ghost btn-sm" disabled={pending} onClick={() => start(() => revokeSession(s.id))}>Uitloggen</button>}</li>
    ))}</ul>
  );
}

export function NotificationPrefsForm({ prefs }: { prefs: { email: boolean; push: boolean; matchDigest: string } }) {
  const [state, action] = useActionState(saveNotificationPrefs, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      {state?.ok && <Alert tone="ok">Voorkeuren opgeslagen.</Alert>}
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="email" defaultChecked={prefs.email} /> E-mail bij aanmeldingen, berichten, uren en verificaties</label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="push" defaultChecked={prefs.push} /> Pushmeldingen (beschikbaar zodra de app er is)</label>
      <Field label="Nieuwe matches" name="matchDigest" help="Kwaliteit boven kwantiteit: we sturen alleen echt goede matches."><select id="matchDigest" name="matchDigest" className="input" defaultValue={prefs.matchDigest}><option value="instant">Direct</option><option value="daily">Dagelijks overzicht</option><option value="weekly">Wekelijks overzicht</option><option value="off">Niet per e-mail</option></select></Field>
      <div><SubmitButton className="btn-dark btn-sm">Opslaan</SubmitButton></div>
    </form>
  );
}

export function VisibilityForm({ visibility }: { visibility: { showCity: boolean; showRate: boolean; searchable: boolean } }) {
  const [state, action] = useActionState(saveVisibility, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      {state?.ok && <Alert tone="ok">Opgeslagen.</Alert>}
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="searchable" defaultChecked={visibility.searchable} /> Mijn profiel is vindbaar voor opdrachtgevers</label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="showCity" defaultChecked={visibility.showCity} /> Toon mijn woonplaats (nooit je adres)</label>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="showRate" defaultChecked={visibility.showRate} /> Toon mijn minimumtarief</label>
      <div><SubmitButton className="btn-dark btn-sm">Opslaan</SubmitButton></div>
    </form>
  );
}

export function PrivacyTools() {
  const [pending, start] = useTransition();
  const [state, action] = useActionState(deleteMyAccount, null);
  const download = () => start(async () => { const json = await exportMyData(); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'timmerly-gegevens.json'; a.click(); URL.revokeObjectURL(url); });
  return (
    <div className="flex flex-col gap-5">
      <div><button type="button" className="btn-secondary btn-sm" disabled={pending} onClick={download}>{pending ? 'Bezig…' : 'Al mijn gegevens downloaden (JSON)'}</button><p className="help">Inzage en overdraagbaarheid (AVG art. 15 en 20).</p></div>
      <details><summary className="cursor-pointer text-sm font-bold text-bad-800">Account verwijderen</summary>
        <form action={action} className="mt-3 flex flex-col gap-3">
          <p className="text-sm text-muted">Persoonsgegevens worden direct geanonimiseerd. Opdracht-, uren- en reviewgegevens blijven zonder naam bewaard vanwege de bewaarplicht. Dit kan niet ongedaan worden gemaakt.</p>
          {state?.error && <Alert tone="bad">{state.error}</Alert>}
          <Field label="Wachtwoord" name="password"><input id="delpw" name="password" type="password" className="input" autoComplete="current-password" /></Field>
          <Field label="Typ VERWIJDER" name="confirm"><input id="confirm" name="confirm" className="input" /></Field>
          <div><SubmitButton className="btn btn-sm bg-bad-800 text-white">Account definitief verwijderen</SubmitButton></div>
        </form>
      </details>
    </div>
  );
}
