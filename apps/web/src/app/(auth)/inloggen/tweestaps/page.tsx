import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { TwoFactorForm } from '@/components/forms/TwoFactorForm';

export const metadata = { title: 'Tweestapsverificatie' };

export default async function TwoFactorPage() {
  const s = await getSession();
  if (!s) redirect('/inloggen');
  if (!s.totpEnabled || s.mfaPassed) redirect('/dashboard');
  return <TwoFactorForm />;
}
