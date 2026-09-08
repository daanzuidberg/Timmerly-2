'use client';

import { useActionState } from 'react';
import { REPORT_REASONS } from '@timmerly/core';
import { submitReport } from '@/lib/actions/settings';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/ui/SubmitButton';

const LABELS: Record<string, string> = { fraud: 'Fraude of oplichting', fake_account: 'Nepaccount of valse gegevens', harassment: 'Ongewenst gedrag', unsafe_work: 'Onveilige werksituatie', spam: 'Spam', other: 'Anders' };

export function ReportForm({ targetUserId, targetProjectId }: { targetUserId?: string; targetProjectId?: string }) {
  const [state, action] = useActionState(submitReport, null);
  if (state?.ok) return <Alert tone="ok">Bedankt. We beoordelen je melding binnen twee werkdagen en nemen contact op als we meer informatie nodig hebben.</Alert>;
  return (
    <form action={action} className="flex flex-col gap-4">
      {targetUserId && <input type="hidden" name="targetUserId" value={targetUserId} />}
      {targetProjectId && <input type="hidden" name="targetProjectId" value={targetProjectId} />}
      {state?.error && <Alert tone="bad">{state.error}</Alert>}
      <Field label="Wat is er aan de hand?" name="reason"><select id="reason" name="reason" className="input">{REPORT_REASONS.map((r) => <option key={r} value={r}>{LABELS[r]}</option>)}</select></Field>
      <Field label="Toelichting" name="description" error={state?.fieldErrors?.description}><textarea id="description" name="description" rows={4} className="input" required minLength={10} /></Field>
      <div><SubmitButton className="btn-dark">Melding versturen</SubmitButton></div>
    </form>
  );
}
