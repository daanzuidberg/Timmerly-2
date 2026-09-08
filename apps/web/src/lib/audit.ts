import 'server-only';
import { schema } from '@timmerly/db';
import { db } from './db';
import { requestMeta } from './request';

/** Append-only auditregel. Aanroepen bij elke admin-actie en elke juridisch relevante gebruikersactie. */
export async function audit(entry: {
  actorId: string | null; actorRole?: string | null; action: string; objectType: string; objectId: string;
  before?: Record<string, unknown> | null; after?: Record<string, unknown> | null;
}): Promise<void> {
  const { ip } = await requestMeta();
  await db().insert(schema.auditLog).values({
    actorId: entry.actorId, actorRole: entry.actorRole ?? null, action: entry.action, objectType: entry.objectType, objectId: entry.objectId,
    before: entry.before ?? null, after: entry.after ?? null, ip
  });
}
