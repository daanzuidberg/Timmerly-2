import 'server-only';

/**
 * Omgevingsvariabelen gevalideerd bij eerste gebruik, niet bij het importeren
 * van deze module. Next.js evalueert tijdens `next build` (page data collection)
 * elke routemodule om zijn exports te lezen — ook routes met
 * `dynamic = 'force-dynamic'» — dus alles op het topniveau van deze module
 * draait dan mee, zonder dat er een request (of een .env) is. Vereiste
 * variabelen dus pas opeisen zodra iemand `env.DATABASE_URL` e.d. echt leest.
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Omgevingsvariabele ${name} ontbreekt (zie .env.example)`);
  return v;
}

export const env = {
  get DATABASE_URL(): string {
    return required('DATABASE_URL');
  },
  get SESSION_SECRET(): string {
    const v = required('SESSION_SECRET');
    if (v.length < 32) throw new Error('SESSION_SECRET moet minimaal 32 tekens zijn');
    return v;
  },
  APP_URL: process.env.APP_URL ?? 'http://localhost:3000',
  MAIL_TRANSPORT: process.env.MAIL_TRANSPORT ?? 'console',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
  isProd: process.env.NODE_ENV === 'production'
};
