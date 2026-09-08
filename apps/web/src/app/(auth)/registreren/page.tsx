import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { RegisterForm } from '@/components/forms/RegisterForm';

export const metadata = { title: 'Account aanmaken' };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ rol?: string }> }) {
  if (await getSession()) redirect('/dashboard');
  const { rol } = await searchParams;
  return <RegisterForm initialRole={rol === 'company' ? 'company' : 'professional'} />;
}
