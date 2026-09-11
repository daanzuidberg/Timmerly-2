import 'server-only';
import { env } from './env';

export { namesRoughlyMatch } from './kvk-match';

export type KvkMatch = { kvkNummer: string; naam: string; plaats?: string; postcode?: string; straatnaam?: string; huisnummer?: string };

/**
 * Slaat de Zoeken-API van de KvK op om het opgegeven KvK-nummer en de
 * bedrijfsnaam te controleren. Dit vervangt de handmatige beoordeling niet —
 * het admin-team beslist nog altijd zelf — maar zet de officiële naam en het
 * vestigingsadres naast de opgave van het bedrijf, zodat die beoordeling
 * sneller en betrouwbaarder gaat. Zonder KVK_API_KEY (of bij een fout of
 * timeout) geeft deze functie stil null terug: dan werkt alles zoals nu,
 * volledig handmatig.
 */
export async function lookupKvk(kvkNumber: string): Promise<KvkMatch | null> {
  if (!env.KVK_API_KEY) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${env.KVK_API_BASE}/v2/zoeken?kvkNummer=${encodeURIComponent(kvkNumber)}`, {
      headers: { apikey: env.KVK_API_KEY },
      signal: controller.signal
    }).finally(() => clearTimeout(timeout));
    if (!res.ok) return null;
    const data = (await res.json()) as { resultaten?: Array<{ kvkNummer?: string; naam?: string; adres?: { binnenlandsAdres?: { postcode?: string; plaats?: string; straatnaam?: string; huisnummer?: string } } }> };
    const hit = data.resultaten?.[0];
    if (!hit?.naam) return null;
    const adres = hit.adres?.binnenlandsAdres;
    return { kvkNummer: hit.kvkNummer ?? kvkNumber, naam: hit.naam, plaats: adres?.plaats, postcode: adres?.postcode, straatnaam: adres?.straatnaam, huisnummer: adres?.huisnummer };
  } catch {
    // Netwerkfout, timeout of onverwachte respons: nooit de profielopslag blokkeren op een externe API.
    return null;
  }
}
