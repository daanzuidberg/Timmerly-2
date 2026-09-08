'use client';

import { useActionState, useState, useTransition } from 'react';
import { decideTimesheet, saveTimesheetEntry, submitTimesheet } from '@/lib/actions/applications';
import { Alert, Field } from './ui';
import { SubmitButton } from './ui/SubmitButton';

export function EntryForm({ applicationId }: { applicationId: string }) {
  const [state, action] = useActionState(saveTimesheetEntry.bind(null, applicationId), null);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-3" key={state?.ok ? Date.now() : 'f'}>
      {state?.error && <Alert tone="bad">{state.error}</Alert>}
      {state?.ok && <Alert tone="ok">Dag opgeslagen.</Alert>}
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Datum" name="date" error={e.date}><input id="date" name="date" type="date" className="input" required defaultValue={new Date().toISOString().slice(0, 10)} /></Field>
        <Field label="Begin" name="startTime" error={e.startTime}><input id="startTime" name="startTime" type="time" className="input" required defaultValue="07:00" /></Field>
        <Field label="Einde" name="endTime" error={e.endTime}><input id="endTime" name="endTime" type="time" className="input" required defaultValue="16:00" /></Field>
        <Field label="Pauze (min)" name="breakMinutes" error={e.breakMinutes}><input id="breakMinutes" name="breakMinutes" type="number" min={0} max={240} className="input" defaultValue={30} /></Field>
      </div>
      <Field label="Opmerking" name="note"><input id="note" name="note" className="input" placeholder="Bijv. kozijnen blok B, materiaal laat geleverd" /></Field>
      <div><SubmitButton className="btn-dark btn-sm">Dag opslaan</SubmitButton></div>
    </form>
  );
}

export function SubmitWeekButton({ timesheetId }: { timesheetId: string }) {
  const [pending, start] = useTransition();
  return <button type="button" className="btn-primary btn-sm" disabled={pending} onClick={() => start(() => submitTimesheet(timesheetId))}>{pending ? '…' : 'Week indienen'}</button>;
}

export function DecideWeek({ timesheetId }: { timesheetId: string }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState('');
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input className="input sm:max-w-xs" placeholder="Toelichting (verplicht bij afwijzen)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="button" className="btn-primary btn-sm" disabled={pending} onClick={() => start(() => decideTimesheet(timesheetId, 'approved', note))}>Goedkeuren</button>
      <button type="button" className="btn-secondary btn-sm" disabled={pending || note.trim().length < 5} onClick={() => start(() => decideTimesheet(timesheetId, 'rejected', note))}>Afwijzen</button>
    </div>
  );
}
