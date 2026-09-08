import type { ZodError } from 'zod';

/** Uniform resultaat van server actions voor formulieren (useActionState). */
export type ActionState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> } | null;

export function fieldErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** FormData → plat object; meervoudige velden (checkboxes) worden arrays. */
export function formToObject(form: FormData): Record<string, string | string[]> {
  const obj: Record<string, string | string[]> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value !== 'string') continue;
    const k = key.endsWith('[]') ? key.slice(0, -2) : key;
    if (!key.endsWith('[]')) { obj[k] = value; continue; }
    const list = obj[k];
    if (Array.isArray(list)) list.push(value);
    else obj[k] = [value];
  }
  return obj;
}
