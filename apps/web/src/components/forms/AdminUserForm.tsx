'use client';

import { useActionState } from 'react';
import { adminUpdateUser } from '@/lib/actions/admin';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/ui/SubmitButton';

type User = { id: string; firstName: string; lastName: string; email: string; phone: string | null };

/** Basisgegevens van een account; alleen voor admin — wijzigt naam, e-mail en telefoon van zzp'er of klant. */
export function AdminUserForm({ user }: { user: User }) {
  const [state, action] = useActionState(adminUpdateUser, null);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="userId" value={user.id} />
      {state?.error && <Alert tone="bad">{state.error}</Alert>}
      {state?.ok && <Alert tone="ok">Opgeslagen.</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Voornaam" name="firstName" error={e.firstName}><input id="firstName" name="firstName" className="input" required defaultValue={user.firstName} /></Field>
        <Field label="Achternaam" name="lastName" error={e.lastName}><input id="lastName" name="lastName" className="input" required defaultValue={user.lastName} /></Field>
        <Field label="E-mail" name="email" error={e.email} help="Wijzigen zonder dat de gebruiker dit zelf deed, kan voor verwarring zorgen."><input id="email" name="email" type="email" className="input" required defaultValue={user.email} /></Field>
        <Field label="Telefoon" name="phone" error={e.phone}><input id="phone" name="phone" className="input" defaultValue={user.phone ?? ''} placeholder="06 12345678" /></Field>
      </div>
      <div><SubmitButton>Opslaan</SubmitButton></div>
    </form>
  );
}
