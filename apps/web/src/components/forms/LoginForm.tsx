'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login } from '@/lib/actions/auth';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action] = useActionState(login, null);
  return (
    <form action={action} className="card flex flex-col gap-4">
      <h1 className="h2">Inloggen</h1>
      {notice && <Alert tone="ok">{notice}</Alert>}
      {state?.error && <Alert tone="bad">{state.error}</Alert>}
      <Field label="E-mail" name="email" error={state?.fieldErrors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" defaultValue={state?.values?.email} />
      </Field>
      <Field label="Wachtwoord" name="password" error={state?.fieldErrors?.password}>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </Field>
      <SubmitButton>Inloggen</SubmitButton>
      <div className="flex justify-between text-sm">
        <Link href="/wachtwoord-vergeten">Wachtwoord vergeten?</Link>
        <Link href="/registreren">Account aanmaken</Link>
      </div>
    </form>
  );
}
