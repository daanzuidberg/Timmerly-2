import 'server-only';

/** Omgevingsvariabelen één keer gevalideerd; een ontbrekende waarde faalt bij opstarten, niet midden in een request. */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Omgevingsvariabele ${name} ontbreekt (zie .env.example)`);
  return v;
}

export const env = {
  DATABASE_URL: required('DATABASE_URL'),
  SESSION_SECRET: (() => {
    const v = required('SESSION_SECRET');
    if (v.length < 32) throw new Error('SESSION_SECRET moet minimaal 32 tekens zijn');
    return v;
  })(),
  APP_URL: process.env.APP_URL ?? 'http://localhost:3000',
  MAIL_TRANSPORT: process.env.MAIL_TRANSPORT ?? 'console',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
  isProd: process.env.NODE_ENV === 'production'
};
