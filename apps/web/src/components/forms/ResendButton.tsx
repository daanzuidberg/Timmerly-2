'use client';

import { useState, useTransition } from 'react';
import { resendVerification } from '@/lib/actions/auth';

export function ResendButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-3">
      <button type="button" className="btn-secondary" disabled={pending} onClick={() => start(async () => { const r = await resendVerification(); setMsg(r?.error ?? 'Nieuwe mail verstuurd.'); })}>Mail opnieuw sturen</button>
      {msg && <span className="text-sm text-muted">{msg}</span>}
    </span>
  );
}
