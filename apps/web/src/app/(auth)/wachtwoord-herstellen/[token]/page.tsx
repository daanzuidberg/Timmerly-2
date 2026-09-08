import { ResetForm } from '@/components/forms/PasswordForms';
export const metadata = { title: 'Nieuw wachtwoord' };
export default async function Page({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; return <ResetForm token={token} />; }
