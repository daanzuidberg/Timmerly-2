'use client';

import { useState, useTransition } from 'react';
import { showInterest } from '@/lib/actions/applications';
import { toggleSavedProject } from '@/lib/actions/profile';

/** "Count me in": de vakman noemt zijn eigen tarief op het moment dat hij reageert, niet pas later. */
export function InterestButton({ projectId, applied, saved, canSave }: { projectId: string; applied: boolean; saved: boolean; canSave: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(applied);
  const [rate, setRate] = useState('');
  return (
    <div className="flex flex-col gap-3">
      {!done && (
        <div>
          <label className="label" htmlFor="requestedRate">Jouw tarief (€ per uur)</label>
          <input id="requestedRate" name="requestedRate" type="number" min={0} max={500} className="input" placeholder="bv. 45" value={rate} onChange={(ev) => setRate(ev.target.value)} />
        </div>
      )}
      <button type="button" disabled={pending || done || (!done && rate.trim() === '')} className={done ? 'btn bg-ok-100 text-ok-800' : 'btn-primary py-3.5 text-base'}
        onClick={() => start(async () => {
          const r = await showInterest(projectId, Number(rate));
          if (r.error) setError(r.error); else setDone(true);
        })}>
        {done ? 'Interesse geregistreerd ✓' : pending ? 'Bezig…' : 'Count me in'}
      </button>
      {canSave && (
        <button type="button" className="btn-secondary" onClick={() => start(() => toggleSavedProject(projectId))}>{saved ? 'Opgeslagen ✓' : 'Project opslaan'}</button>
      )}
      {error && <p className="error">{error}</p>}
      <p className="text-sm text-muted">{done ? 'Het bedrijf ziet je profiel, matchscore en tarief en neemt via Timmerly contact op.' : 'Nog geen profiel? Reageren start je aanmelding; je gegevens blijven bewaard.'}</p>
    </div>
  );
}
