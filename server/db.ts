import * as schema from "@shared/schema";

const DATABASE_URL = process.env.DATABASE_URL;
const useNeon = DATABASE_URL?.includes('neon.tech');

let db: any;
let pool: any = null;

if (useNeon) {
  const { Pool, neonConfig } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-serverless');
  const ws = (await import('ws')).default;
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: DATABASE_URL });
  db = drizzle({ client: pool, schema });
  console.log('[DB] Connected to Neon PostgreSQL');
} else {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const path = await import('path');
  const { fileURLToPath } = await import('url');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = path.resolve(__dirname, '../migrations');

  const pglite = new PGlite('./local-dev.db');
  db = drizzle(pglite, { schema });

  // Create all tables on first run
  try {
    await migrate(db, { migrationsFolder });
    console.log('[DB] Local PGlite database ready (local-dev.db)');
  } catch (err: any) {
    // Already migrated — fine
    if (!err?.message?.includes('already exists')) {
      console.warn('[DB] Migration warning:', err?.message);
    } else {
      console.log('[DB] Local PGlite database ready (local-dev.db)');
    }
  }
}

export { pool, db };
