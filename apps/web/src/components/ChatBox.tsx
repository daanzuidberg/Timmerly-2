'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { sendMessage } from '@/lib/actions/applications';
import { SubmitButton } from './ui/SubmitButton';

type Msg = { id: string; body: string; kind: string; mine: boolean; who: string; at: string };

/** Berichtenlijst met eenvoudige polling (10 s). WebSockets komen als het volume erom vraagt. */
export function ChatBox({ applicationId, messages, closed }: { applicationId: string; messages: Msg[]; closed: boolean }) {
  const [state, action] = useActionState(sendMessage.bind(null, applicationId), null);
  const router = useRouter();
  const end = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);
  useEffect(() => { const t = setInterval(() => router.refresh(), 10_000); return () => clearInterval(t); }, [router]);
  useEffect(() => { if (state?.ok) formRef.current?.reset(); }, [state]);
  return (
    <div className="flex h-[60vh] flex-col">
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-1">
        {messages.length === 0 && <p className="m-auto text-sm text-muted">Nog geen berichten. Stel je voor en bespreek werk, tijden en start.</p>}
        {messages.map((m) => m.kind === 'system' ? (
          <div key={m.id} className="mx-auto max-w-[90%] rounded-card border border-line bg-ground px-3 py-2 text-center text-xs text-muted">{m.body}<div className="mt-0.5 text-[10px] text-faint">{m.at}</div></div>
        ) : (
          <div key={m.id} className={`max-w-[85%] rounded-card px-3.5 py-2.5 ${m.mine ? 'self-end bg-navy text-white' : 'self-start border border-line bg-white'}`}>
            {!m.mine && <div className="text-xs font-bold text-orange-700">{m.who}</div>}
            <div className="whitespace-pre-line text-[15px]">{m.body}</div>
            <div className={`mt-1 text-[10px] ${m.mine ? 'text-white/60' : 'text-faint'}`}>{m.at}</div>
          </div>
        ))}
        <div ref={end} />
      </div>
      {closed ? <p className="border-t border-line pt-3 text-sm text-muted">Dit gesprek is gesloten.</p> : (
        <form ref={formRef} action={action} className="flex gap-2 border-t border-line pt-3">
          <input name="body" className="input" placeholder="Bericht typen…" autoComplete="off" required maxLength={4000} />
          <SubmitButton className="btn-dark" pendingText="…">Stuur</SubmitButton>
        </form>
      )}
      {state?.error && <p className="error">{state.error}</p>}
    </div>
  );
}
