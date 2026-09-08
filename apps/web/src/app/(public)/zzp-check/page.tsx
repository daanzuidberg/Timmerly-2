import { getRuleset } from '@timmerly/compliance';
import { ComplianceCheck } from '@/components/ComplianceCheck';

export const metadata = { title: 'ZZP-check: schijnzelfstandigheid signaleren', description: 'Controleer in vijf minuten of een zzp-opdracht in de bouw kenmerken van een dienstverband heeft (Wet DBA). Risicosignalering, geen juridisch advies.' };

export default function ZzpCheckPage() {
  const ruleset = getRuleset();
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="eyebrow mb-2 text-orange-700">ZZP Compliance Check</div>
      <h1 className="h1">Is deze opdracht een echte zzp-opdracht?</h1>
      <p className="mt-2 max-w-2xl text-muted">Beantwoord de vragen samen met de opdrachtgever. Je krijgt direct een risicoclassificatie met de punten die je moet vastleggen of aanpassen. Ingelogd? Dan bewaren we de uitkomst bij je dossier.</p>
      <div className="mt-8"><ComplianceCheck ruleset={ruleset} /></div>
    </div>
  );
}
