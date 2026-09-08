'use client';

import { useActionState } from 'react';
import { ACTIVE_TRADES, EXPERIENCE_BANDS, PROVINCES, SPECIALISMS, SPECIALISM_LABELS, TRADE_LABELS, WORK_ARRANGEMENTS, CONTRACT_TYPE_LABELS } from '@timmerly/core';
import { saveProfessionalProfile } from '@/lib/actions/profile';
import { Alert, Field } from '@/components/ui';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { SubmitButton } from '@/components/ui/SubmitButton';

type Profile = {
  trade: string; specialisms: string[]; experienceBand: string; yearsExperience: number; bio: string; city: string; province: string | null; maxTravelKm: number;
  hasDriversLicense: boolean; hasOwnTransport: boolean; hasOwnTools: boolean; workArrangement: string; hourlyRateMin: number | null; hoursPerWeek: number; availableFrom: string | null;
} | null;

/** Eén formulier voor onboarding (in delen) en voor later bewerken (alles). `section` bepaalt welke velden zichtbaar zijn. */
export function ProfessionalProfileForm({ profile, phone, section = 'all', next, submitLabel = 'Opslaan' }: { profile: Profile; phone?: string | null; section?: 'person' | 'work' | 'availability' | 'all'; next?: string; submitLabel?: string }) {
  const [state, action] = useActionState(saveProfessionalProfile, null);
  const show = (s: string) => section === 'all' || section === s;
  const e = state?.fieldErrors ?? {};
  const p = profile;
  return (
    <form action={action} className="flex flex-col gap-5">
      {next && <input type="hidden" name="next" value={next} />}
      {state?.error && <Alert tone="bad">{state.error}</Alert>}
      {state?.ok && !next && <Alert tone="ok">Opgeslagen.</Alert>}

      <input type="hidden" name="section" value={section} />

      {show('person') && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Woonplaats" name="city" error={e.city} help="Alleen je plaats is zichtbaar, nooit je adres."><input id="city" name="city" className="input" required defaultValue={p?.city ?? ''} /></Field>
            <Field label="Provincie" name="province"><select id="province" name="province" className="input" defaultValue={p?.province ?? ''}><option value="">Automatisch</option>{PROVINCES.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Telefoon" name="phone" error={e.phone}><input id="phone" name="phone" className="input" defaultValue={phone ?? ''} placeholder="06 12345678" /></Field>
            <Field label="Maximale reisafstand (km)" name="maxTravelKm" error={e.maxTravelKm}><input id="maxTravelKm" name="maxTravelKm" type="number" min={5} max={300} className="input" required defaultValue={p?.maxTravelKm ?? 50} /></Field>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {[['hasDriversLicense', 'Rijbewijs B', p?.hasDriversLicense], ['hasOwnTransport', 'Eigen vervoer', p?.hasOwnTransport], ['hasOwnTools', 'Eigen gereedschap', p?.hasOwnTools]].map(([n, l, v]) => (
              <label key={String(n)} className="flex items-center gap-2 rounded-card border border-line bg-white px-3 py-2.5 text-sm font-semibold"><input type="checkbox" name={String(n)} defaultChecked={!!v} />{l}</label>
            ))}
          </div>
        </>
      )}

      {show('work') && (
        <>
          <Field label="Functie" name="trade" error={e.trade}><select id="trade" name="trade" className="input" defaultValue={p?.trade ?? 'timmerman'}>{ACTIVE_TRADES.map((t) => <option key={t} value={t}>{TRADE_LABELS[t]}</option>)}</select></Field>
          <Field label="Specialisaties" error={e.specialisms} help="Kies alles wat op jou van toepassing is (max. 8)."><ChipGroup name="specialisms" options={SPECIALISMS.map((s) => ({ value: s, label: SPECIALISM_LABELS[s] }))} defaultValue={p?.specialisms ?? []} max={8} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ervaring" name="experienceBand"><select id="experienceBand" name="experienceBand" className="input" defaultValue={p?.experienceBand ?? '0-2'}>{EXPERIENCE_BANDS.map((b) => <option key={b} value={b}>{b} jaar</option>)}</select></Field>
            <Field label="Aantal jaren" name="yearsExperience" error={e.yearsExperience}><input id="yearsExperience" name="yearsExperience" type="number" min={0} max={60} className="input" required defaultValue={p?.yearsExperience ?? 0} /></Field>
            <Field label="Contractvorm" name="workArrangement"><select id="workArrangement" name="workArrangement" className="input" defaultValue={p?.workArrangement ?? 'either'}>{WORK_ARRANGEMENTS.map((w) => <option key={w} value={w}>{CONTRACT_TYPE_LABELS[w]}</option>)}</select></Field>
            <Field label="Minimaal uurtarief (€, zzp)" name="hourlyRateMin" error={e.hourlyRateMin} help="Alleen zichtbaar als je dat toestaat."><input id="hourlyRateMin" name="hourlyRateMin" type="number" min={0} max={500} className="input" defaultValue={p?.hourlyRateMin ?? ''} /></Field>
          </div>
          <Field label="Over jou" name="bio" error={e.bio} help="Wat voor werk doe je het liefst, waar ben je goed in? Aannemers lezen dit als eerste."><textarea id="bio" name="bio" rows={4} className="input" defaultValue={p?.bio ?? ''} /></Field>
        </>
      )}

      {show('availability') && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Beschikbaar vanaf" name="availableFrom" error={e.availableFrom} help="Leeg = per direct."><input id="availableFrom" name="availableFrom" type="date" className="input" defaultValue={p?.availableFrom ?? ''} /></Field>
          <Field label="Uren per week" name="hoursPerWeek" error={e.hoursPerWeek}><input id="hoursPerWeek" name="hoursPerWeek" type="number" min={4} max={60} className="input" defaultValue={p?.hoursPerWeek ?? 40} /></Field>
        </div>
      )}
      <div><SubmitButton>{submitLabel}</SubmitButton></div>
    </form>
  );
}
