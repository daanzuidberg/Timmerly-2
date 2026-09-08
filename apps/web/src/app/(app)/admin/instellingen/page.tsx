import { getRuleset } from '@timmerly/compliance';
import { DEFAULT_WEIGHTS } from '@timmerly/matching';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth/session';
import { AppShell } from '@/components/AppShell';
import { SettingEditor } from '@/components/AdminActions';
import { Card } from '@/components/ui';

export const dynamic = 'force-dynamic';

/** Centrale configuratie: matchinggewichten, actieve DBA-regelset, feature flags. Zonder release aan te passen; elke wijziging in de auditlog. */
export default async function AdminSettings() {
  const user = await requireRole('admin');
  const rows = await db().query.settings.findMany();
  const get = (k: string, fallback: unknown) => rows.find((r) => r.key === k)?.value ?? fallback;
  const ruleset = getRuleset();
  return (
    <AppShell user={user} title="Instellingen" subtitle="Configuratie van matching, compliance en features">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Matchinggewichten"><p className="mb-2 text-sm text-muted">Som ≈ 100. Direct van kracht op nieuwe scores.</p><SettingEditor k="matching.weights" value={get('matching.weights', DEFAULT_WEIGHTS)} /></Card>
        <Card title="Compliance-regelset"><p className="mb-2 text-sm text-muted">Actieve versie: <strong>{String(get('compliance.rulesetVersion', ruleset.version))}</strong> · geldig vanaf {ruleset.effectiveFrom} · {ruleset.factors.length} factoren. Een nieuwe regelset wordt als code toegevoegd in @timmerly/compliance en hier geactiveerd.</p><SettingEditor k="compliance.rulesetVersion" value={get('compliance.rulesetVersion', ruleset.version)} /></Card>
        <Card title="Feature flags"><SettingEditor k="features" value={get('features', {})} /></Card>
      </div>
    </AppShell>
  );
}
