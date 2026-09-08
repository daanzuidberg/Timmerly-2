'use client';

import { useState, useTransition } from 'react';
import { showInterest } from '@/lib/actions/applications';
import { toggleSavedProject } from '@/lib/actions/profile';

export function InterestButton({ projectId, applied, saved, canSave }: { projectId: string; applied: boolean; saved: boolean; canSave: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(applied);
  return (
    <div className="flex flex-col gap-3">
      <button type="button" disabled={pending || done} className={done ? 'btn bg-ok-100 text-ok-800' : 'btn-primary py-3.5 text-base'}
        onClick={() => start(async () => { const r = await showInterest(projectId); if (r.error) setError(r.error); else setDone(true); })}>
        {done ? 'Interesse geregistreerd ✓' : pending ? 'Bezig…' : 'Interesse in dit project'}
      </button>
      {canSave && (
        <button type="button" className="btn-secondary" onClick={() => start(() => toggleSavedProject(projectId))}>{saved ? 'Opgeslagen ✓' : 'Project opslaan'}</button>
      )}
      {error && <p className="error">{error}</p>}
      <p className="text-sm text-muted">{done ? 'Het bedrijf ziet je profiel en matchscore en neemt via Timmerly contact op.' : 'Nog geen profiel? Interesse tonen start je aanmelding; je gegevens blijven bewaard.'}</p>
    </div>
  );
}
