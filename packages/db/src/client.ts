import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

let pool: Pool | undefined;
let db: Database | undefined;

/** Eén pool per proces; Next.js hot reload hergebruikt hem via globalThis. */
export function getDb(): Database {
  if (db) return db;
  const g = globalThis as unknown as { __timmerlyPool?: Pool };
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL ontbreekt; zie .env.example');
  pool = g.__timmerlyPool ?? new Pool({ connectionString: url, max: Number(process.env.DB_POOL_MAX ?? 10) });
  if (process.env.NODE_ENV !== 'production') g.__timmerlyPool = pool;
  db = drizzle(pool, { schema });
  return db;
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = undefined;
  db = undefined;
}

export { schema };
