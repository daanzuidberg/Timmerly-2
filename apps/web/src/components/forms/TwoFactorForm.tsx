'use client';

import { useActionState } from 'react';
import { verifyTwoFactor } from '@/lib/actions/auth';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function TwoFactorForm() {
  const [state, action] = useActionState(verifyTwoFactor, null);
  return (
    <form action={action} className="card flex flex-col gap-4">
      <h1 className="h2">Tweestapsverificatie</h1>
      <p className="text-sm text-muted">Vul de 6-cijferige code uit je authenticator-app in.</p>
      {state?.error && <Alert tone="bad">{state.error}</Alert>}
      <Field label="Code" name="code">
        <input id="code" name="code" inputMode="numeric" pattern="[0-9]{6}" autoComplete="one-time-code" required className="input text-center text-2xl tracking-[.4em]" autoFocus />
      </Field>
      <SubmitButton>Bevestigen</SubmitButton>
    </form>
  );
}
