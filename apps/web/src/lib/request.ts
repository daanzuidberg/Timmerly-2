import 'server-only';
import { headers } from 'next/headers';

/** IP en user-agent van het huidige verzoek, achter een proxy (X-Forwarded-For). */
export async function requestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0]!.trim() : h.get('x-real-ip');
  return { ip: ip && /^[\d.a-f:]+$/i.test(ip) ? ip : null, userAgent: h.get('user-agent')?.slice(0, 300) ?? null };
}
