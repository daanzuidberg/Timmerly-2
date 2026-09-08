import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { ResendButton } from '@/components/forms/ResendButton';

export const metadata = { title: 'Bevestig je e-mail' };

export default async function ConfirmPage() {
  const s = await getSession();
  return (
    <div className="card flex flex-col gap-4">
      <h1 className="h2">Controleer je e-mail</h1>
      <p className="text-muted">We hebben een bevestigingslink gestuurd{s ? <> naar <strong className="text-navy">{s.email}</strong></> : null}. De link is 24 uur geldig.</p>
      <p className="text-sm text-muted">Je kunt intussen je profiel al invullen; interesse tonen in projecten kan zodra je e-mailadres bevestigd is.</p>
      <div className="flex flex-wrap gap-3">
        {s && <Link href="/dashboard" className="btn-primary">Naar mijn dashboard</Link>}
        {s && !s.emailVerified && <ResendButton />}
      </div>
    </div>
  );
}
