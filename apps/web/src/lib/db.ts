import 'server-only';
import { getDb } from '@timmerly/db';

export const db = () => getDb();
export * as schema from '@timmerly/db/schema';
