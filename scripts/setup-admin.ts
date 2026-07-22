/**
 * One-time admin setup script.
 * Creates the initial admin user if no admin account exists yet.
 *
 * Usage:
 *   npx tsx scripts/setup-admin.ts
 *
 * Override defaults via environment variables:
 *   ADMIN_USERNAME  (default: admin)
 *   ADMIN_PASSWORD  (default: generated)
 *   ADMIN_EMAIL     (default: admin@example.com)
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import { adminUsers } from '../shared/schema';
import { eq } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: pool });

async function checkDbConnectivity(): Promise<void> {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error('ERROR: Cannot connect to database — check DATABASE_URL');
    console.error(`  Detail: ${(err as Error).message}`);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}

async function main() {
  await checkDbConnectivity();

  // Check if any admin already exists
  const existing = await db.select().from(adminUsers).limit(1);

  if (existing.length > 0) {
    console.log('✓ Admin account already exists:');
    console.log(`  Username: ${existing[0].username}`);
    console.log(`  Email:    ${existing[0].email}`);
    console.log('  No action taken.');
    await pool.end();
    return;
  }

  // Determine credentials
  const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();

  // Generate a secure default password if not provided
  const password = process.env.ADMIN_PASSWORD ||
    crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) + '1!';

  // Validate username
  if (!/^[a-z0-9_]{3,50}$/.test(username)) {
    console.error('ERROR: ADMIN_USERNAME must be 3-50 characters, alphanumeric and underscores only.');
    process.exit(1);
  }

  // Validate password strength
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    console.error('ERROR: ADMIN_PASSWORD must be at least 8 characters with at least one letter and one number.');
    process.exit(1);
  }

  const passwordHash = await bcryptjs.hash(password, 10);

  const [created] = await db.insert(adminUsers).values({
    id: `admin-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    username,
    passwordHash,
    email,
    role: 'admin',
  }).returning();

  console.log('\n✓ Admin account created successfully!\n');
  console.log('  ┌─────────────────────────────────────┐');
  console.log(`  │  Username : ${username.padEnd(25)}│`);
  console.log(`  │  Password : ${password.padEnd(25)}│`);
  console.log(`  │  Email    : ${email.padEnd(25)}│`);
  console.log('  └─────────────────────────────────────┘');
  console.log('\n  ⚠  Save these credentials — the password is shown only once.\n');

  await pool.end();
}

main().catch(err => {
  console.error('Failed to create admin:', err);
  process.exit(1);
});
