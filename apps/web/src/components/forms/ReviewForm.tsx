'use client';

import { useActionState } from 'react';
import { REVIEW_CATEGORY_LABELS } from '@timmerly/core';
import { submitReview } from '@/lib/actions/applications';
import { Alert, Field } from '@/components/ui';
import { SubmitButton } from '@/components/ui/SubmitButton';

export function ReviewForm({ applicationId, categories, subject }: { applicationId: string; categories: readonly string[]; subject: string }) {
  const [state, action] = useActionState(submitReview.bind(null, applicationId), null);
  if (state?.ok) return <Alert tone="ok">Bedankt voor je beoordeling van {subject}.</Alert>;
  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error && <Alert tone="bad">{state.error}</Alert>}
      {categories.map((c) => (
        <fieldset key={c} className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
          <legend className="sr-only">{REVIEW_CATEGORY_LABELS[c]}</legend>
          <span className="font-semibold">{REVIEW_CATEGORY_LABELS[c] ?? c}</span>
          <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <label key={n} className="cursor-pointer"><input type="radio" name={`score.${c}`} value={n} className="peer sr-only" required /><span className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-line text-sm font-bold peer-checked:border-orange peer-checked:bg-orange peer-checked:text-white">{n}</span></label>)}</div>
        </fieldset>
      ))}
      <Field label="Toelichting" name="comment" help="Wat ging goed, wat kan beter? Zichtbaar op het profiel."><textarea id="comment" name="comment" rows={3} className="input" maxLength={2000} /></Field>
      <div><SubmitButton>Beoordeling plaatsen</SubmitButton></div>
    </form>
  );
}
