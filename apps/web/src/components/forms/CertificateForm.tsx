'use client';

import { useActionState } from 'react';
import { CERTIFICATE_LABELS, CERTIFICATE_TYPES } from '@timmerly/core';
import { addCertificate } from '@/lib/actions/profile';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function CertificateForm() {
  const [state, action] = useActionState(addCertificate, null);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4" key={state?.ok ? Date.now() : 'form'}>
      {state?.ok && <Alert tone="ok">Certificaat toegevoegd. Na verificatie telt het volledig mee in je matches.</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Certificaat" name="type" error={e.type}><select id="type" name="type" className="input">{CERTIFICATE_TYPES.map((t) => <option key={t} value={t}>{CERTIFICATE_LABELS[t]}</option>)}</select></Field>
        <Field label="Omschrijving (bij “Overig”)" name="label"><input id="label" name="label" className="input" /></Field>
        <Field label="Afgegeven op" name="issuedAt" error={e.issuedAt}><input id="issuedAt" name="issuedAt" type="date" className="input" /></Field>
        <Field label="Geldig tot" name="expiresAt" error={e.expiresAt} help="30 dagen voor het verlopen krijg je een melding."><input id="expiresAt" name="expiresAt" type="date" className="input" /></Field>
        <Field label="Certificaatnummer" name="documentNumber"><input id="documentNumber" name="documentNumber" className="input" /></Field>
      </div>
      <p className="text-sm text-muted">Uploaden van een kopie komt in een volgende versie; tot die tijd vraagt het verificatieteam de kopie via je e-mail op.</p>
      <div><SubmitButton>Certificaat toevoegen</SubmitButton></div>
    </form>
  );
}
