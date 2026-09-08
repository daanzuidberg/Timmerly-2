'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { register } from '@/lib/actions/auth';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function RegisterForm({ initialRole }: { initialRole: 'professional' | 'company' }) {
  const [state, action] = useActionState(register, null);
  const [role, setRole] = useState<'professional' | 'company'>((state?.values?.role as 'professional' | 'company') ?? initialRole);
  const opt = (value: 'professional' | 'company', title: string, sub: string) => (
    <button type="button" onClick={() => setRole(value)} aria-pressed={role === value}
      className={`flex-1 rounded-card border-2 p-4 text-left transition ${role === value ? 'border-orange bg-orange/5' : 'border-line bg-white hover:border-navy'}`}>
      <div className="font-bold">{title}</div>
      <div className="text-sm text-muted">{sub}</div>
    </button>
  );
  return (
    <form action={action} className="card flex flex-col gap-4">
      <h1 className="h2">Account aanmaken</h1>
      <div className="flex gap-3">
        {opt('professional', 'Ik zoek werk', 'Timmerman of andere bouwprofessional')}
        {opt('company', 'Ik zoek vakmensen', 'Aannemer, bouwbedrijf of onderaannemer')}
      </div>
      <input type="hidden" name="role" value={role} />
      {state?.error && <Alert tone="bad">{state.error}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Voornaam" name="firstName" error={state?.fieldErrors?.firstName}><input id="firstName" name="firstName" required className="input" autoComplete="given-name" defaultValue={state?.values?.firstName} /></Field>
        <Field label="Achternaam" name="lastName" error={state?.fieldErrors?.lastName}><input id="lastName" name="lastName" required className="input" autoComplete="family-name" defaultValue={state?.values?.lastName} /></Field>
      </div>
      <Field label="E-mail" name="email" error={state?.fieldErrors?.email}><input id="email" name="email" type="email" required className="input" autoComplete="email" defaultValue={state?.values?.email} /></Field>
      <Field label="Wachtwoord" name="password" error={state?.fieldErrors?.password} help="Minimaal 12 tekens, met letters en cijfers."><input id="password" name="password" type="password" required className="input" autoComplete="new-password" minLength={12} /></Field>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="acceptTerms" className="mt-1" required />
        <span>Ik ga akkoord met de <Link href="/voorwaarden" target="_blank">algemene voorwaarden</Link> en heb het <Link href="/privacy" target="_blank">privacybeleid</Link> gelezen.</span>
      </label>
      {state?.fieldErrors?.acceptTerms && <p className="error">{state.fieldErrors.acceptTerms}</p>}
      <SubmitButton>{role === 'company' ? 'Bedrijfsaccount aanmaken' : 'Profiel aanmaken'}</SubmitButton>
      <p className="text-center text-sm">Al een account? <Link href="/inloggen">Inloggen</Link></p>
    </form>
  );
}
