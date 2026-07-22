/**
 * CLI script to reset an admin password without needing the current password.
 * Use this when an admin is locked out and cannot log in.
 *
 * Usage:
 *   ADMIN_USERNAME=admin ADMIN_NEW_PASSWORD=NewPass1 npx tsx scripts/reset-admin-password.ts
 *
 * Required environment variables:
 *   DATABASE_URL        — PostgreSQL connection string
 *   ADMIN_USERNAME      — Username of the admin whose password should be reset
 *   ADMIN_NEW_PASSWORD  — New password (min 8 chars, must contain letters and numbers)
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import bcryptjs from 'bcryptjs';
import { adminUsers } from '../shared/schema';
import { eq } from 'drizzle-orm';

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const username = (process.env.ADMIN_USERNAME || '').trim().toLowerCase();
const newPassword = process.env.ADMIN_NEW_PASSWORD || '';

if (!username) {
  console.error('ERROR: ADMIN_USERNAME environment variable is required.');
  process.exit(1);
}

if (!newPassword) {
  console.error('ERROR: ADMIN_NEW_PASSWORD environment variable is required.');
  process.exit(1);
}

// Enforce minimum password strength
if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
  console.error('ERROR: ADMIN_NEW_PASSWORD must be at least 8 characters and contain letters and numbers.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: pool });

async function main() {
  // Look up the admin
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .limit(1);

  if (!admin) {
    console.error(`ERROR: No admin account found with username '${username}'.`);
    console.log('\nExisting admin accounts:');
    const all = await db.select({ username: adminUsers.username, email: adminUsers.email }).from(adminUsers);
    if (all.length === 0) {
      console.log('  (none — run scripts/setup-admin.ts first)');
    } else {
      all.forEach(a => console.log(`  - ${a.username} (${a.email})`));
    }
    await pool.end();
    process.exit(1);
  }

  const newPasswordHash = await bcryptjs.hash(newPassword, 12);

  await db
    .update(adminUsers)
    .set({ passwordHash: newPasswordHash })
    .where(eq(adminUsers.id, admin.id));

  console.log(`\n✓ Password reset successfully for admin '${admin.username}'.\n`);
  console.log('  You can now log in with the new password.\n');

  await pool.end();
}

main().catch(err => {
  console.error('Failed to reset admin password:', err);
  process.exit(1);
});
