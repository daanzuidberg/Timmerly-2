'use server';

import { revalidatePath } from 'next/cache';
import { schema } from '@timmerly/db';
import { evaluateCompliance, getRuleset, type ComplianceResult } from '@timmerly/compliance';
import { db } from '../db';
import { getSession } from '../auth/session';

/** Evalueert de antwoorden; slaat op als de gebruiker is ingelogd (voor het dossier bij een opdracht). */
export async function runComplianceCheck(answers: Record<string, string>, applicationId?: string): Promise<ComplianceResult> {
  const ruleset = getRuleset();
  const clean: Record<string, string> = {};
  for (const f of ruleset.factors) if (typeof answers[f.id] === 'string') clean[f.id] = answers[f.id]!;
  const result = evaluateCompliance(clean, ruleset.version);
  const session = await getSession();
  if (session && result.unanswered.length === 0) {
    await db().insert(schema.complianceChecks).values({ userId: session.id, applicationId: applicationId ?? null, rulesetVersion: result.rulesetVersion, answers: clean, riskLevel: result.riskLevel, score: result.score, signals: result.signals });
    revalidatePath('/zzp-check');
  }
  return result;
}
