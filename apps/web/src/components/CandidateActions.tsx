'use client';

import { useActionState, useState, useTransition } from 'react';
import type { ApplicationStage } from '@timmerly/core';
import { advanceApplication, inviteCandidate, sendProposal } from '@/lib/actions/applications';
import { setProjectStatus, submitProject } from '@/lib/actions/projects';
import { Alert, Field } from './ui';
import { SubmitButton } from './ui/SubmitButton';

export function InviteButton({ projectId, profileId, invited }: { projectId: string; profileId: string; invited: boolean }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(invited);
  return <button type="button" className={done ? 'btn btn-sm bg-ok-100 text-ok-800' : 'btn-dark btn-sm'} disabled={pending || done} onClick={() => start(async () => { await inviteCandidate(projectId, profileId); setDone(true); })}>{done ? 'Benaderd ✓' : pending ? '…' : 'Benaderen'}</button>;
}

/** Knoppen voor de funnel; welke er verschijnen hangt af van fase en rol. */
export function StageActions({ applicationId, stage, role }: { applicationId: string; stage: string; role: 'pro' | 'company' }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const go = (to: ApplicationStage, withReason = false) => start(async () => { const r = await advanceApplication(applicationId, to, withReason ? { reason } : undefined); setError(r.error ?? null); });
  const btn = (label: string, to: ApplicationStage, cls = 'btn-dark btn-sm', withReason = false) => <button key={to} type="button" className={cls} disabled={pending} onClick={() => go(to, withReason)}>{label}</button>;
  const actions: React.ReactNode[] = [];
  if (role === 'company') {
    if (stage === 'interest') actions.push(btn('Gesprek openen', 'contact'), btn('Niet selecteren', 'declined', 'btn-ghost btn-sm', true));
    if (stage === 'contact') actions.push(btn('Niet selecteren', 'declined', 'btn-ghost btn-sm', true));
    if (stage === 'proposal') actions.push(btn('Voorstel intrekken', 'declined', 'btn-ghost btn-sm', true));
    if (stage === 'agreed') actions.push(btn('Opdracht starten', 'active', 'btn-primary btn-sm'));
    if (stage === 'active') actions.push(btn('Opdracht afronden', 'completed', 'btn-primary btn-sm'));
  } else {
    if (stage === 'proposal') actions.push(btn('Voorstel accepteren', 'agreed', 'btn-primary btn-sm'), btn('Nog vragen', 'contact', 'btn-secondary btn-sm'));
    if (['interest', 'contact', 'proposal', 'agreed'].includes(stage)) actions.push(btn('Terugtrekken', 'withdrawn', 'btn-ghost btn-sm', true));
  }
  if (!actions.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">{actions}</div>
      {(role === 'company' ? ['interest', 'contact', 'proposal'].includes(stage) : true) && <input className="input text-sm" placeholder="Reden (optioneel, bij afwijzen of terugtrekken)" value={reason} onChange={(e) => setReason(e.target.value)} />}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export function ProposalForm({ applicationId, defaults }: { applicationId: string; defaults: { hourlyRate: number | null; hoursPerWeek: number; startDate: string; endDate: string | null; contractType: string } }) {
  const [state, action] = useActionState(sendProposal.bind(null, applicationId), null);
  if (state?.ok) return <Alert tone="ok">Voorstel verstuurd. De vakman ziet het in het gesprek en kan accepteren.</Alert>;
  return (
    <form action={action} className="flex flex-col gap-3">
      {state?.error && <Alert tone="bad">{state.error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Uurtarief (€)" name="hourlyRate" error={state?.fieldErrors?.hourlyRate}><input id="hourlyRate" name="hourlyRate" type="number" step="0.5" min={1} className="input" required defaultValue={defaults.hourlyRate ?? ''} /></Field>
        <Field label="Uren per week" name="hoursPerWeek"><input id="hoursPerWeek" name="hoursPerWeek" type="number" className="input" defaultValue={defaults.hoursPerWeek} /></Field>
        <Field label="Start" name="startDate" error={state?.fieldErrors?.startDate}><input id="startDate" name="startDate" type="date" className="input" required defaultValue={defaults.startDate} /></Field>
        <Field label="Einde" name="endDate"><input id="endDate" name="endDate" type="date" className="input" defaultValue={defaults.endDate ?? ''} /></Field>
        <Field label="Contractvorm" name="contractType"><select id="contractType" name="contractType" className="input" defaultValue={defaults.contractType === 'either' ? 'zzp' : defaults.contractType}><option value="zzp">ZZP (overeenkomst van opdracht)</option><option value="employment">Loondienst</option></select></Field>
      </div>
      <Field label="Toelichting" name="notes"><input id="notes" name="notes" className="input" placeholder="Werktijden, opzegtermijn, bijzonderheden" /></Field>
      <div><SubmitButton className="btn-primary btn-sm">Voorstel versturen</SubmitButton></div>
    </form>
  );
}

export function ProjectStatusActions({ projectId, status, verified }: { projectId: string; status: string; verified: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2" aria-busy={pending}>
      {['draft', 'in_review'].includes(status) && status === 'draft' && <button type="button" className="btn-primary btn-sm" disabled={pending} onClick={() => start(() => submitProject(projectId))}>{verified ? 'Publiceren' : 'Indienen ter beoordeling'}</button>}
      {['published', 'matching'].includes(status) && <button type="button" className="btn-secondary btn-sm" disabled={pending} onClick={() => start(() => setProjectStatus(projectId, 'filled'))}>Markeren als ingevuld</button>}
      {['published', 'matching', 'filled'].includes(status) && <button type="button" className="btn-secondary btn-sm" disabled={pending} onClick={() => start(() => setProjectStatus(projectId, 'completed'))}>Afronden</button>}
      {!['completed', 'cancelled', 'removed'].includes(status) && <button type="button" className="btn-ghost btn-sm" disabled={pending} onClick={() => { if (confirm('Project annuleren?')) start(() => setProjectStatus(projectId, 'cancelled')); }}>Annuleren</button>}
    </div>
  );
}
