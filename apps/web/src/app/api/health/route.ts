import { sql } from '@timmerly/db';
import { db } from '@/lib/db';

// Zonder dit zou Next.js de respons bij `next build` één keer vastleggen en
// daarna altijd diezelfde (dan verouderde) uitkomst serveren.
export const dynamic = 'force-dynamic';

/** Voor load balancer en monitoring: applicatie én database bereikbaar. */
export async function GET() {
  try {
    await db().execute(sql`select 1`);
    return Response.json({ ok: true, db: 'up', time: new Date().toISOString() });
  } catch (err) {
    return Response.json({ ok: false, db: 'down', error: err instanceof Error ? err.message : 'unknown' }, { status: 503 });
  }
}
