import 'server-only';
import { env } from './env';

export interface Mail { to: string; subject: string; text: string; html?: string }

/**
 * Mailtransport. `console` (ontwikkeling) logt de mail; een SMTP- of
 * API-transport (Postmark, SES) implementeert dezelfde functie. Mails worden
 * in productie via de jobs-tabel verstuurd zodat een storing bij de provider
 * een registratie niet blokkeert.
 */
export async function sendMail(mail: Mail): Promise<void> {
  if (env.MAIL_TRANSPORT === 'console') {
    console.info(`\n──── MAIL naar ${mail.to} ────\n${mail.subject}\n\n${mail.text}\n───────────────────────────\n`);
    return;
  }
  throw new Error(`Mailtransport "${env.MAIL_TRANSPORT}" is nog niet geconfigureerd`);
}

export function verificationMail(to: string, token: string): Mail {
  const url = `${env.APP_URL}/verifieer/${token}`;
  return {
    to,
    subject: 'Bevestig je e-mailadres voor Timmerly',
    text: `Welkom bij Timmerly.\n\nBevestig je e-mailadres via deze link (24 uur geldig):\n${url}\n\nHeb je geen account aangemaakt? Negeer deze mail dan.`
  };
}

export function passwordResetMail(to: string, token: string): Mail {
  const url = `${env.APP_URL}/wachtwoord-herstellen/${token}`;
  return {
    to,
    subject: 'Nieuw wachtwoord instellen',
    text: `Je hebt een nieuw wachtwoord aangevraagd. Stel het in via deze link (1 uur geldig):\n${url}\n\nNiet aangevraagd? Negeer deze mail; je wachtwoord blijft ongewijzigd.`
  };
}
