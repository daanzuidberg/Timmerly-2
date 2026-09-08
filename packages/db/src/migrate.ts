import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { closeDb, getDb } from './client';

/** Voert alle migraties uit `migrations/` uit. Idempotent. */
async function main() {
  const db = getDb();
  await migrate(db, { migrationsFolder: new URL('../migrations', import.meta.url).pathname });
  console.info('Migraties uitgevoerd');
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
