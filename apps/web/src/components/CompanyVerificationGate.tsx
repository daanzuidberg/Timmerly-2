import Link from 'next/link';
import type { VerificationStatus } from '@timmerly/core';
import { Card } from './ui';

/**
 * Getoond op "Project plaatsen" zolang company.verifiedAt niet gezet is. Een
 * project aanmaken kan pas na verificatie — daarvoor blokkeert deze pagina
 * i.p.v. de aanmaakflow te tonen en pas bij publiceren te beoordelen.
 */
export function CompanyVerificationGate({ status, note }: { status: VerificationStatus; note?: string | null }) {
  const rejected = status === 'rejected' || status === 'expired';
  const step = 1;
  const steps = ['Gegevens ingevuld', rejected ? 'Afgekeurd' : 'Wordt gecontroleerd', 'Projecten plaatsen'];

  return (
    <div className="max-w-2xl">
      <Card>
        <ol className="mb-7 flex items-center gap-2">
          {steps.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <div className="flex flex-col items-center gap-2 text-center">
                <span
                  className={
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ' +
                    (i < step
                      ? 'bg-ok text-white'
                      : i === step
                        ? rejected
                          ? 'bg-bad text-white'
                          : 'bg-orange text-white shadow-button'
                        : 'bg-ground text-faint')
                  }
                >
                  {i < step ? '✓' : i + 1}
                </span>
                <span className={'w-20 text-xs font-semibold ' + (i <= step ? 'text-navy' : 'text-faint')}>{label}</span>
              </div>
              {i < steps.length - 1 && <span className={'-mt-6 h-0.5 flex-1 rounded ' + (i < step ? 'bg-ok' : 'bg-line')} />}
            </li>
          ))}
        </ol>

        {rejected ? (
          <>
            <h2 className="h3 mb-1.5">Je verificatie is afgekeurd</h2>
            <p className="text-sm leading-relaxed text-muted">
              We konden je bedrijfsgegevens niet bevestigen. Controleer je KvK-nummer en bedrijfsnaam en dien ze opnieuw in — je krijgt vervolgens weer bericht zodra ze zijn beoordeeld.
            </p>
            {note && <p className="mt-3 rounded-control border border-bad/30 bg-bad-100 px-3.5 py-2.5 text-sm text-bad-800"><strong>Toelichting:</strong> {note}</p>}
            <Link href="/bedrijf" className="btn-primary mt-5">Gegevens aanpassen</Link>
          </>
        ) : (
          <>
            <h2 className="h3 mb-1.5">Je gegevens worden geverifieerd</h2>
            <p className="text-sm leading-relaxed text-muted">
              We controleren je bedrijfsgegevens bij de Kamer van Koophandel. Dit duurt meestal binnen twee werkdagen. Zodra dit is gecontroleerd, kun je meteen projecten plaatsen — je hoeft hier verder niets te doen.
            </p>
            <div className="mt-5 flex gap-3">
              <Link href="/bedrijf" className="btn-secondary">Gegevens bekijken</Link>
              <Link href="/dashboard" className="btn-ghost">Naar dashboard</Link>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
