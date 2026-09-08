'use client';

import { useState, useTransition } from 'react';
import { decideCertificate, decideVerification, hideReview, resolveReport, reviewProject, saveSetting, setUserStatus } from '@/lib/actions/admin';

/** Beslissen met verplichte toelichting bij afkeuren; elke actie gaat de auditlog in. */
function Decide({ onDecide, positive, negative }: { onDecide: (ok: boolean, note: string) => Promise<void>; positive: string; negative: string }) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState('');
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input className="input sm:max-w-xs" placeholder="Toelichting (verplicht bij afkeuren)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="button" className="btn-primary btn-sm" disabled={pending} onClick={() => start(() => onDecide(true, note))}>{positive}</button>
      <button type="button" className="btn-secondary btn-sm" disabled={pending || note.trim().length < 3} onClick={() => start(() => onDecide(false, note))}>{negative}</button>
    </div>
  );
}

export const CertificateDecision = ({ id }: { id: string }) => <Decide positive="Verifiëren" negative="Afkeuren" onDecide={(ok, note) => decideCertificate(id, ok ? 'verified' : 'rejected', note)} />;
export const VerificationDecision = ({ id }: { id: string }) => <Decide positive="Verifiëren" negative="Afkeuren" onDecide={(ok, note) => decideVerification(id, ok ? 'verified' : 'rejected', note)} />;
export const ProjectDecision = ({ id }: { id: string }) => {
  const [pending, start] = useTransition();
  const [note, setNote] = useState('');
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input className="input sm:max-w-xs" placeholder="Opmerking voor het bedrijf" value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="button" className="btn-primary btn-sm" disabled={pending} onClick={() => start(() => reviewProject(id, 'published', note))}>Publiceren</button>
      <button type="button" className="btn-secondary btn-sm" disabled={pending || note.trim().length < 3} onClick={() => start(() => reviewProject(id, 'draft', note))}>Terug naar bedrijf</button>
      <button type="button" className="btn-ghost btn-sm" disabled={pending || note.trim().length < 3} onClick={() => start(() => reviewProject(id, 'removed', note))}>Verwijderen</button>
    </div>
  );
};
export const UserStatusButton = ({ id, status }: { id: string; status: string }) => {
  const [pending, start] = useTransition();
  const [reason, setReason] = useState('');
  const suspended = status === 'suspended';
  return (
    <div className="flex items-center gap-2"><input className="input max-w-[220px]" placeholder="Reden" value={reason} onChange={(e) => setReason(e.target.value)} /><button type="button" className={suspended ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'} disabled={pending || (!suspended && reason.trim().length < 3)} onClick={() => start(() => setUserStatus(id, suspended ? 'active' : 'suspended', reason))}>{suspended ? 'Deblokkeren' : 'Blokkeren'}</button></div>
  );
};
export const ReportDecision = ({ id }: { id: string }) => <Decide positive="Afgehandeld" negative="Afwijzen" onDecide={(ok, note) => resolveReport(id, ok ? 'resolved' : 'dismissed', note)} />;
export const ReviewHideButton = ({ id, hidden }: { id: string; hidden: boolean }) => {
  const [pending, start] = useTransition();
  const [reason, setReason] = useState('');
  return <div className="flex items-center gap-2">{!hidden && <input className="input max-w-[220px]" placeholder="Reden" value={reason} onChange={(e) => setReason(e.target.value)} />}<button type="button" className="btn-secondary btn-sm" disabled={pending || (!hidden && reason.trim().length < 3)} onClick={() => start(() => hideReview(id, reason))}>{hidden ? 'Weer tonen' : 'Verbergen'}</button></div>;
};
export const SettingEditor = ({ k, value }: { k: string; value: unknown }) => {
  const [pending, start] = useTransition();
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2"><textarea className="input font-mono text-xs" rows={6} value={text} onChange={(e) => setText(e.target.value)} /><div className="flex items-center gap-3"><button type="button" className="btn-dark btn-sm" disabled={pending} onClick={() => { try { const v = JSON.parse(text); setErr(null); start(() => saveSetting(k, v)); } catch { setErr('Ongeldige JSON'); } }}>Opslaan</button>{err && <span className="error">{err}</span>}</div></div>
  );
};
