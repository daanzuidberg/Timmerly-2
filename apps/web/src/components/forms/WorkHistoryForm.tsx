'use client';

import { useActionState } from 'react';
import { addWorkHistory } from '@/lib/actions/profile';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function WorkHistoryForm() {
  const [state, action] = useActionState(addWorkHistory, null);
  return (
    <form action={action} className="flex flex-col gap-4" key={state?.ok ? Date.now() : 'form'}>
      {state?.ok && <Alert tone="ok">Project toegevoegd aan je werkhistorie.</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Project" name="title" error={state?.fieldErrors?.title}><input id="title" name="title" className="input" required placeholder="Nieuwbouw 120 woningen" /></Field>
        <Field label="Functie" name="role"><input id="role" name="role" className="input" placeholder="Allround timmerman" /></Field>
        <Field label="Opdrachtgever" name="client"><input id="client" name="client" className="input" /></Field>
        <Field label="Plaats" name="city"><input id="city" name="city" className="input" /></Field>
        <Field label="Van" name="startDate"><input id="startDate" name="startDate" type="date" className="input" /></Field>
        <Field label="Tot" name="endDate"><input id="endDate" name="endDate" type="date" className="input" /></Field>
      </div>
      <Field label="Werkzaamheden" name="description"><textarea id="description" name="description" rows={2} className="input" placeholder="Ruwbouw en aftimmering, team van 6" /></Field>
      <div><SubmitButton className="btn-secondary">Toevoegen</SubmitButton></div>
    </form>
  );
}
