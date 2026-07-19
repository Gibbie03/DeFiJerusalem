import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      messages JSONB NOT NULL,
      title TEXT NOT NULL DEFAULT 'AI Security Chat',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    );
    CREATE INDEX IF NOT EXISTS chat_sessions_expires_at_idx ON chat_sessions (expires_at);
  `);
  console.log('chat_sessions table created (or already exists)');
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
