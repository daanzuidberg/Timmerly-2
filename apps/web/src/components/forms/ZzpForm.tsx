'use client';

import { useActionState } from 'react';
import { saveZzpDetails } from '@/lib/actions/profile';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function ZzpForm({ zzp, next }: { zzp: { companyName: string; kvkNumber: string; btwNumber?: string; seat: string; hasLiabilityInsurance: boolean } | null; next?: string }) {
  const [state, action] = useActionState(saveZzpDetails, null);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      {state?.ok && !next && <Alert tone="ok">Opgeslagen. Je ZZP-gegevens worden geverifieerd.</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bedrijfsnaam" name="companyName" error={e.companyName}><input id="companyName" name="companyName" className="input" required defaultValue={zzp?.companyName ?? ''} /></Field>
        <Field label="KvK-nummer" name="kvkNumber" error={e.kvkNumber}><input id="kvkNumber" name="kvkNumber" className="input" required inputMode="numeric" defaultValue={zzp?.kvkNumber ?? ''} /></Field>
        <Field label="BTW-nummer (optioneel)" name="btwNumber" error={e.btwNumber}><input id="btwNumber" name="btwNumber" className="input" placeholder="NL123456789B01" defaultValue={zzp?.btwNumber ?? ''} /></Field>
        <Field label="Vestigingsplaats" name="seat" error={e.seat}><input id="seat" name="seat" className="input" required defaultValue={zzp?.seat ?? ''} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="hasLiabilityInsurance" defaultChecked={zzp?.hasLiabilityInsurance} /> Ik heb een bedrijfsaansprakelijkheidsverzekering</label>
      <p className="text-sm text-muted">We controleren je KvK-inschrijving. “ZZP geverifieerd” betekent dat je ondernemingsgegevens kloppen — niet dat elke opdracht automatisch als zelfstandige arbeid kwalificeert.</p>
      <div><SubmitButton>{next ? 'Volgende' : 'Opslaan'}</SubmitButton></div>
    </form>
  );
}
