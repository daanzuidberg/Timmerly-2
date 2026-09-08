import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { LoginForm } from '@/components/forms/LoginForm';

export const metadata = { title: 'Inloggen' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  if (await getSession()) redirect('/dashboard');
  const { reset } = await searchParams;
  return <LoginForm notice={reset === 'ok' ? 'Je wachtwoord is gewijzigd. Log in met je nieuwe wachtwoord.' : undefined} />;
}
