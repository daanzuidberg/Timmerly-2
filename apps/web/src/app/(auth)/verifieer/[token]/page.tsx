import Link from 'next/link';
import { verifyEmail } from '@/lib/actions/auth';
import { getSession } from '@/lib/auth/session';

export const metadata = { title: 'E-mail bevestigen' };

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await verifyEmail(token);
  const s = await getSession();
  return (
    <div className="card flex flex-col gap-4">
      {result === 'ok' ? (
        <><h1 className="h2">E-mailadres bevestigd</h1><p className="text-muted">Bedankt. Je account is nu geverifieerd op e-mail.</p></>
      ) : (
        <><h1 className="h2">Link ongeldig of verlopen</h1><p className="text-muted">Vraag een nieuwe bevestigingsmail aan vanuit je dashboard.</p></>
      )}
      <Link href={s ? '/dashboard' : '/inloggen'} className="btn-primary self-start">{s ? 'Naar dashboard' : 'Inloggen'}</Link>
    </div>
  );
}
