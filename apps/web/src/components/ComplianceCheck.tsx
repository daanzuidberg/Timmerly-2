'use client';

import { useState, useTransition } from 'react';
import type { ComplianceResult, Ruleset } from '@timmerly/compliance';
import { runComplianceCheck } from '@/lib/actions/compliance';
import { Alert } from './ui';

/** De ZZP-check als interactieve vragenlijst; de beoordeling gebeurt server-side met de actieve regelset. */
export function ComplianceCheck({ ruleset, applicationId }: { ruleset: Ruleset; applicationId?: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [pending, start] = useTransition();
  const answered = ruleset.factors.filter((f) => answers[f.id]).length;
  const tone = result?.riskLevel === 'low' ? 'bg-ok-800' : result?.riskLevel === 'attention' ? 'bg-warn-800' : 'bg-bad-800';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-5">
        {ruleset.factors.map((f, i) => (
          <fieldset key={f.id} className="card">
            <legend className="sr-only">{f.label}</legend>
            <div className="mb-1 flex items-baseline gap-2"><span className="text-xs font-bold text-faint">{i + 1}/{ruleset.factors.length}</span><span className="font-bold">{f.question}</span></div>
            <p className="mb-3 text-sm text-muted">{f.help}</p>
            <div className="flex flex-wrap gap-2">
              {f.options.map((o) => (
                <button key={o.value} type="button" aria-pressed={answers[f.id] === o.value} className={`chip ${answers[f.id] === o.value ? 'chip-on' : ''}`} onClick={() => { setAnswers({ ...answers, [f.id]: o.value }); setResult(null); }}>{o.label}</button>
              ))}
            </div>
          </fieldset>
        ))}
        <button type="button" className="btn-primary self-start" disabled={pending || answered === 0} onClick={() => start(async () => setResult(await runComplianceCheck(answers, applicationId)))}>
          {pending ? 'Beoordelen…' : answered < ruleset.factors.length ? `Voorlopige uitkomst (${answered}/${ruleset.factors.length} beantwoord)` : 'Uitkomst bekijken'}
        </button>
      </div>

      <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-24">
        {result ? (
          <>
            <div className={`rounded-card p-6 text-white ${tone}`}>
              <div className="text-xs font-bold uppercase tracking-wider text-white/70">Risicosignalering</div>
              <div className="mt-1 text-2xl font-bold">{result.riskLabel}</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25"><div className="h-full bg-white" style={{ width: `${result.percentage}%` }} /></div>
              <p className="mt-3 text-sm text-white/90">{result.explanation}</p>
            </div>
            <div className="card">
              <div className="mb-2 font-bold">Signalen</div>
              <ul className="flex flex-col gap-2 text-sm">
                {result.signals.map((s) => (
                  <li key={s.factor} className="flex gap-2"><span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${s.level === 'positive' ? 'bg-ok' : s.level === 'attention' ? 'bg-warn' : 'bg-bad'}`} /><span>{s.text}</span></li>
                ))}
              </ul>
            </div>
            <Alert tone="info"><strong>Let op.</strong> {result.disclaimer}</Alert>
            <div className="text-xs text-faint">Regelset {result.rulesetVersion}. Bronnen: {ruleset.sources.join(' · ')}</div>
          </>
        ) : (
          <div className="card text-sm text-muted">
            <div className="mb-1 font-bold text-navy">Wat deze check doet</div>
            Op basis van {ruleset.factors.length} factoren die de Belastingdienst en de rechter meewegen, signaleert Timmerly of een zzp-inzet kenmerken van een dienstverband heeft. Geen juridisch advies: partijen blijven zelf verantwoordelijk voor de kwalificatie.
          </div>
        )}
      </aside>
    </div>
  );
}
