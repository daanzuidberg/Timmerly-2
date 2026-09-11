'use client';

import { useActionState } from 'react';
import { PROVINCES, SPECIALISMS, SPECIALISM_LABELS } from '@timmerly/core';
import { saveCompanyProfile } from '@/lib/actions/profile';
import { Alert, Field } from '@/components/ui';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { SubmitButton } from '@/components/ui/SubmitButton';

type Company = { name: string; kvkNumber: string; website: string | null; phone: string | null; city: string; province: string | null; companyType: string; description: string; specialisms: string[]; employeeCount: number | null; workAreaKm: number; verifiedAt?: Date | null } | null;

export function CompanyProfileForm({ company, next }: { company: Company; next?: string }) {
  const [state, action] = useActionState(saveCompanyProfile, null);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      {state?.ok && <Alert tone="ok">Opgeslagen.</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bedrijfsnaam" name="name" error={e.name}><input id="name" name="name" className="input" required defaultValue={company?.name ?? ''} /></Field>
        <Field label="KvK-nummer" name="kvkNumber" error={e.kvkNumber} help={company?.verifiedAt ? 'Geverifieerd. Wijzig je het nummer, dan gaat dat opnieuw in controle.' : 'Wordt gecontroleerd bij de KvK; daarna kun je projecten plaatsen.'}><input id="kvkNumber" name="kvkNumber" className="input" required inputMode="numeric" defaultValue={company?.kvkNumber ?? ''} /></Field>
        <Field label="Telefoon" name="phone" error={e.phone}><input id="phone" name="phone" className="input" required defaultValue={company?.phone ?? ''} /></Field>
        <Field label="Website" name="website" error={e.website}><input id="website" name="website" className="input" placeholder="https://" defaultValue={company?.website ?? ''} /></Field>
        <Field label="Vestigingsplaats" name="city" error={e.city}><input id="city" name="city" className="input" required defaultValue={company?.city ?? ''} /></Field>
        <Field label="Provincie" name="province"><select id="province" name="province" className="input" defaultValue={company?.province ?? ''}><option value="">Automatisch</option>{PROVINCES.map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Type bedrijf" name="companyType"><input id="companyType" name="companyType" className="input" placeholder="Aannemer woningbouw" defaultValue={company?.companyType ?? ''} /></Field>
        <Field label="Aantal medewerkers" name="employeeCount" error={e.employeeCount}><input id="employeeCount" name="employeeCount" type="number" min={1} className="input" defaultValue={company?.employeeCount ?? ''} /></Field>
        <Field label="Werkgebied (km rond vestiging)" name="workAreaKm"><input id="workAreaKm" name="workAreaKm" type="number" min={10} max={500} className="input" defaultValue={company?.workAreaKm ?? 100} /></Field>
      </div>
      <Field label="Specialisaties" error={e.specialisms}><ChipGroup name="specialisms" options={SPECIALISMS.map((s) => ({ value: s, label: SPECIALISM_LABELS[s] }))} defaultValue={company?.specialisms ?? []} max={10} /></Field>
      <Field label="Over het bedrijf" name="description" help="Vakmensen lezen dit voordat ze reageren."><textarea id="description" name="description" rows={4} className="input" defaultValue={company?.description ?? ''} /></Field>
      <div><SubmitButton>{next ? 'Opslaan en verder' : 'Opslaan'}</SubmitButton></div>
    </form>
  );
}
