import Link from 'next/link';
import { redirect } from 'next/navigation';
import { eq, schema } from '@timmerly/db';
import { CERTIFICATE_LABELS, formatDateNl, type CertificateType } from '@timmerly/core';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { getProfessionalProfile } from '@/lib/auth/profiles';
import { completeOnboarding } from '@/lib/actions/profile';
import { ProfessionalProfileForm } from '@/components/forms/ProfessionalProfileForm';
import { ZzpForm } from '@/components/forms/ZzpForm';
import { CertificateForm } from '@/components/forms/CertificateForm';
import { Logo, Progress, StatusPill } from '@/components/ui';

const STEPS = ['Vakervaring', 'Persoonlijk', 'Onderneming', 'Certificaten', 'Beschikbaarheid', 'Verificatie'];

/** Onboarding in zes korte stappen (iedereen op Timmerly is zzp'er). Alles is later aan te vullen; na de laatste stap is het profiel actief. */
export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ stap?: string; next?: string }> }) {
  const user = await requireRole('professional');
  const { stap, next } = await searchParams;
  const profile = await getProfessionalProfile(user.id);
  if (profile?.onboardingCompletedAt) redirect(next ?? '/dashboard');
  const step = Math.min(STEPS.length, Math.max(1, Number(stap) || (profile ? 2 : 1)));
  const url = (s: number) => `/onboarding?stap=${s}${next ? `&next=${encodeURIComponent(next)}` : ''}`;
  const certs = profile ? await db().query.certificates.findMany({ where: eq(schema.certificates.profileId, profile.id) }) : [];

  return (
    <div className="min-h-screen bg-ground px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between"><Logo /><Link href="/dashboard" className="text-sm">Later afmaken</Link></div>
        <div className="mb-2 flex justify-between text-sm font-bold"><span>Stap {step} van {STEPS.length} · {STEPS[step - 1]}</span><span className="text-muted">{Math.round((step / STEPS.length) * 100)}%</span></div>
        <Progress value={(step / STEPS.length) * 100} />
        <div className="card mt-6">
          {step === 1 && (<><h1 className="h2 mb-1">Wat voor werk doe je?</h1><p className="mb-5 text-muted">Hoe preciezer, hoe beter de matches. Je kunt dit altijd aanpassen.</p><ProfessionalProfileForm profile={profile} section="work" next={url(2)} submitLabel="Volgende" /></>)}
          {step === 2 && profile && (<><h1 className="h2 mb-1">Waar werk je en hoe reis je?</h1><p className="mb-5 text-muted">We gebruiken je woonplaats alleen om afstanden te berekenen. Je adres wordt nooit getoond.</p><ProfessionalProfileForm profile={profile} phone={null} section="person" next={url(3)} submitLabel="Volgende" /></>)}
          {step === 3 && profile && (<><h1 className="h2 mb-1">Je onderneming</h1><p className="mb-5 text-muted">Nodig om als zzp’er via Timmerly te werken. We controleren het KvK-nummer.</p><ZzpForm zzp={profile.zzp} next={url(4)} /></>)}
          {step === 4 && profile && (<>
            <h1 className="h2 mb-1">Certificaten</h1><p className="mb-5 text-muted">Voeg toe wat je hebt; verificatie volgt. Geen certificaten? Ga gewoon door.</p>
            {certs.length > 0 && <ul className="mb-5 flex flex-col gap-2">{certs.map((c) => <li key={c.id} className="flex items-center justify-between rounded-card border border-line px-3 py-2 text-sm"><span className="font-semibold">{CERTIFICATE_LABELS[c.type as CertificateType]}{c.expiresAt ? ` · geldig tot ${formatDateNl(c.expiresAt)}` : ''}</span><StatusPill status={c.status} /></li>)}</ul>}
            <CertificateForm />
            <div className="mt-6 flex justify-between border-t border-line pt-4"><Link href={url(3)} className="btn-ghost">Terug</Link><Link href={url(5)} className="btn-dark">Volgende</Link></div>
          </>)}
          {step === 5 && profile && (<><h1 className="h2 mb-1">Wanneer kun je beginnen?</h1><p className="mb-5 text-muted">Dit pas je later aan in je dashboard, ook per dag in de kalender.</p><ProfessionalProfileForm profile={profile} section="availability" next={url(6)} submitLabel="Volgende" /></>)}
          {step === 6 && profile && (<>
            <h1 className="h2 mb-1">Verificatie</h1>
            <p className="mb-5 text-muted">Na registratie beoordeelt het Timmerly-team je profiel en documenten binnen twee werkdagen. Intussen kun je projecten bekijken en opslaan; interesse tonen kan zodra je e-mailadres bevestigd is.</p>
            <ul className="mb-6 flex flex-col gap-2 text-sm">
              {[['E-mailadres', user.emailVerified ? 'verified' : 'pending'], ['Identiteit', 'pending'], ['ZZP-gegevens', profile.zzp ? 'pending' : 'unverified'], ['Certificaten', certs.length ? 'pending' : 'unverified']].map(([k, v]) => <li key={k} className="flex items-center justify-between rounded-card border border-line px-3 py-2"><span className="font-semibold">{k}</span><StatusPill status={v!} /></li>)}
            </ul>
            <form action={completeOnboarding} className="flex justify-between"><Link href={url(5)} className="btn-ghost">Terug</Link><button type="submit" className="btn-primary">Profiel activeren</button></form>
          </>)}
          {step > 1 && !profile && <p>Begin bij <Link href={url(1)}>stap 1</Link>.</p>}
        </div>
      </div>
    </div>
  );
}
