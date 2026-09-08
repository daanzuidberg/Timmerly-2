'use client';

import { useActionState, useState } from 'react';
import { ACTIVE_TRADES, CERTIFICATE_LABELS, CERTIFICATE_TYPES, CONTRACT_TYPES, CONTRACT_TYPE_LABELS, PROVINCES, SPECIALISMS, SPECIALISM_LABELS, TRADE_LABELS } from '@timmerly/core';
import { parseBrief, type ParsedBrief } from '@/lib/brief';
import { Alert, Field } from '@/components/ui';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { SubmitButton } from '@/components/ui/SubmitButton';
import type { ActionState } from '@/lib/actions/types';

type Project = Partial<{ title: string; description: string; trade: string; specialisms: string[]; city: string; province: string | null; startDate: string; endDate: string | null; headcount: number; hoursPerWeek: number; workingHours: string; minYearsExperience: number; requiredCertificates: string[]; requiresOwnTransport: boolean; requiresOwnTools: boolean; contractType: string; rateMin: number | null; rateMax: number | null; housingAvailable: boolean; travelAllowance: string; notes: string }>;

/** Project plaatsen in drie stappen: één zin → gegevens → controleren. De stappen zijn secties van één formulier, dus niets gaat verloren. */
export function ProjectForm({ action, project, templates = [], submitLabel = 'Project opslaan' }: { action: (prev: ActionState, form: FormData) => Promise<ActionState>; project?: Project; templates?: Array<{ id: string; name: string; data: Project }>; submitLabel?: string }) {
  const [state, formAction] = useActionState(action, null);
  const [brief, setBrief] = useState('');
  const [parsed, setParsed] = useState<ParsedBrief | null>(null);
  const [base, setBase] = useState<Project>(project ?? {});
  const [formKey, setFormKey] = useState(0);
  const e = state?.fieldErrors ?? {};
  const p = { ...base, ...(parsed ?? {}) } as Project;

  const applyBrief = () => { setParsed(parseBrief(brief)); setFormKey((k) => k + 1); };
  const applyTemplate = (id: string) => { const t = templates.find((x) => x.id === id); if (t) { setBase(t.data); setParsed(null); setFormKey((k) => k + 1); } };

  return (
    <div className="flex flex-col gap-5">
      {!project && (
        <section className="card border-orange/40 bg-orange/5">
          <div className="mb-1 font-bold">Stap 1 · Beschrijf in één zin wat je zoekt</div>
          <p className="mb-3 text-sm text-muted">Bijvoorbeeld: “Ik zoek 4 timmermannen in Almere voor 12 weken, minimaal 3 jaar ervaring, start 21 september.” Timmerly vult het formulier alvast in.</p>
          <div className="flex flex-col gap-2 sm:flex-row"><input className="input" value={brief} onChange={(ev) => setBrief(ev.target.value)} placeholder="Ik zoek…" /><button type="button" className="btn-dark whitespace-nowrap" onClick={applyBrief} disabled={!brief.trim()}>Invullen</button></div>
          {templates.length > 0 && <div className="mt-3 text-sm">Of start vanuit een sjabloon: <select className="input mt-1 sm:inline-block sm:w-auto" onChange={(ev) => applyTemplate(ev.target.value)} defaultValue=""><option value="">Kies sjabloon</option>{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>}
          {parsed && <p className="mt-2 text-sm text-ok-800">Ingevuld uit je beschrijving: {Object.keys(parsed).length} velden. Controleer en vul aan.</p>}
        </section>
      )}

      <form key={formKey} action={formAction} className="flex flex-col gap-5">
        {state?.error && <Alert tone="bad">{state.error}</Alert>}
        <section className="card flex flex-col gap-4">
          <div className="font-bold">{project ? 'Project' : 'Stap 2 · Gegevens'}</div>
          <Field label="Projectnaam" name="title" error={e.title}><input id="title" name="title" className="input" required defaultValue={p.title ?? ''} placeholder="Timmerman nieuwbouw – 84 woningen Almere" /></Field>
          <Field label="Omschrijving" name="description" error={e.description} help="Wat is het werk, hoe is het team, wat verwacht je? Minimaal een paar zinnen."><textarea id="description" name="description" rows={5} className="input" required defaultValue={p.description ?? ''} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Functie" name="trade" error={e.trade}><select id="trade" name="trade" className="input" defaultValue={p.trade ?? 'timmerman'}>{ACTIVE_TRADES.map((t) => <option key={t} value={t}>{TRADE_LABELS[t]}</option>)}</select></Field>
            <Field label="Aantal personen" name="headcount" error={e.headcount}><input id="headcount" name="headcount" type="number" min={1} max={200} className="input" required defaultValue={p.headcount ?? 1} /></Field>
          </div>
          <Field label="Werkzaamheden" error={e.specialisms}><ChipGroup name="specialisms" options={SPECIALISMS.map((s) => ({ value: s, label: SPECIALISM_LABELS[s] }))} defaultValue={p.specialisms ?? []} max={8} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Plaats" name="city" error={e.city}><input id="city" name="city" className="input" required defaultValue={p.city ?? ''} /></Field>
            <Field label="Provincie" name="province"><select id="province" name="province" className="input" defaultValue={p.province ?? ''}><option value="">Automatisch</option>{PROVINCES.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Startdatum" name="startDate" error={e.startDate}><input id="startDate" name="startDate" type="date" className="input" required defaultValue={p.startDate ?? ''} /></Field>
            <Field label="Verwachte einddatum" name="endDate" error={e.endDate} help="Leeg = doorlopend."><input id="endDate" name="endDate" type="date" className="input" defaultValue={p.endDate ?? ''} /></Field>
            <Field label="Uren per week" name="hoursPerWeek" error={e.hoursPerWeek}><input id="hoursPerWeek" name="hoursPerWeek" type="number" min={4} max={60} className="input" required defaultValue={p.hoursPerWeek ?? 40} /></Field>
            <Field label="Werktijden" name="workingHours"><input id="workingHours" name="workingHours" className="input" defaultValue={p.workingHours ?? '07:00 – 16:00'} /></Field>
          </div>
        </section>

        <section className="card flex flex-col gap-4">
          <div className="font-bold">Eisen</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Minimale ervaring (jaren)" name="minYearsExperience" error={e.minYearsExperience}><input id="minYearsExperience" name="minYearsExperience" type="number" min={0} max={40} className="input" defaultValue={p.minYearsExperience ?? 0} /></Field>
            <Field label="Contractvorm" name="contractType" error={e.contractType}><select id="contractType" name="contractType" className="input" defaultValue={p.contractType ?? 'either'}>{CONTRACT_TYPES.map((c) => <option key={c} value={c}>{CONTRACT_TYPE_LABELS[c]}</option>)}</select></Field>
          </div>
          <Field label="Vereiste certificaten"><ChipGroup name="requiredCertificates" options={CERTIFICATE_TYPES.filter((c) => c !== 'other').map((c) => ({ value: c, label: CERTIFICATE_LABELS[c] }))} defaultValue={p.requiredCertificates ?? []} /></Field>
          <div className="grid gap-2 sm:grid-cols-3">
            <label className="flex items-center gap-2 rounded-card border border-line px-3 py-2.5 text-sm font-semibold"><input type="checkbox" name="requiresOwnTransport" defaultChecked={p.requiresOwnTransport} />Eigen vervoer vereist</label>
            <label className="flex items-center gap-2 rounded-card border border-line px-3 py-2.5 text-sm font-semibold"><input type="checkbox" name="requiresOwnTools" defaultChecked={p.requiresOwnTools} />Eigen gereedschap</label>
            <label className="flex items-center gap-2 rounded-card border border-line px-3 py-2.5 text-sm font-semibold"><input type="checkbox" name="housingAvailable" defaultChecked={p.housingAvailable} />Huisvesting beschikbaar</label>
          </div>
        </section>

        <section className="card flex flex-col gap-4">
          <div className="font-bold">Tarief en voorwaarden</div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Uurtarief van (€)" name="rateMin" error={e.rateMin}><input id="rateMin" name="rateMin" type="number" min={0} max={500} className="input" defaultValue={p.rateMin ?? ''} /></Field>
            <Field label="Uurtarief tot (€)" name="rateMax" error={e.rateMax}><input id="rateMax" name="rateMax" type="number" min={0} max={500} className="input" defaultValue={p.rateMax ?? ''} /></Field>
            <Field label="Reiskosten" name="travelAllowance"><input id="travelAllowance" name="travelAllowance" className="input" placeholder="€0,23 per km" defaultValue={p.travelAllowance ?? ''} /></Field>
          </div>
          <Field label="Bijzonderheden" name="notes"><textarea id="notes" name="notes" rows={2} className="input" defaultValue={p.notes ?? ''} /></Field>
          {!project && <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="saveAsTemplate" /> Bewaar als sjabloon voor volgende projecten</label>}
        </section>
        <div className="flex items-center gap-3"><SubmitButton>{submitLabel}</SubmitButton><span className="text-sm text-muted">{project ? '' : 'Stap 3 · Je controleert het project daarna en dient het in.'}</span></div>
      </form>
    </div>
  );
}
