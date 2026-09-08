'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { requestPasswordReset, resetPassword } from '@/lib/actions/auth';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function ForgotForm() {
  const [state, action] = useActionState(requestPasswordReset, null);
  if (state?.ok) return <div className="card"><h1 className="h2 mb-2">Mail onderweg</h1><p className="text-muted">Als dit adres bij ons bekend is, ontvang je binnen enkele minuten een link om een nieuw wachtwoord in te stellen.</p></div>;
  return (
    <form action={action} className="card flex flex-col gap-4">
      <h1 className="h2">Wachtwoord vergeten</h1>
      {state?.error && <Alert tone="bad">{state.error}</Alert>}
      <Field label="E-mail" name="email" error={state?.fieldErrors?.email}><input id="email" name="email" type="email" required className="input" autoComplete="email" /></Field>
      <SubmitButton>Herstel-link sturen</SubmitButton>
      <Link href="/inloggen" className="text-center text-sm">Terug naar inloggen</Link>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, null);
  return (
    <form action={action} className="card flex flex-col gap-4">
      <h1 className="h2">Nieuw wachtwoord</h1>
      <input type="hidden" name="token" value={token} />
      {state?.error && <Alert tone="bad">{state.error}</Alert>}
      <Field label="Nieuw wachtwoord" name="password" error={state?.fieldErrors?.password} help="Minimaal 12 tekens, met letters en cijfers."><input id="password" name="password" type="password" required minLength={12} className="input" autoComplete="new-password" /></Field>
      <SubmitButton>Wachtwoord opslaan</SubmitButton>
    </form>
  );
}
