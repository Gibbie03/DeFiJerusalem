/**
 * Bootstrap secret validation helpers.
 *
 * Exported so the logic can be unit-tested independently of the server
 * startup sequence.
 */

export const BOOTSTRAP_MIN_LENGTH = 32;
export const BOOTSTRAP_PLACEHOLDER =
  'CHANGE_THIS_IN_PRODUCTION_OR_ADMIN_CREATION_DISABLED';

export type BootstrapSecretStatus =
  | { ok: true }
  | { ok: false; fatal: false; reason: string }   // endpoints disabled, server may still start
  | { ok: false; fatal: true;  reason: string };  // too short — server MUST NOT start

/**
 * Validate the ADMIN_BOOTSTRAP_SECRET value.
 *
 * Returns one of three outcomes:
 *  - ok          – secret is present and long enough; endpoints are active
 *  - fatal:false – secret is absent or is the placeholder; endpoints are
 *                  disabled but the server can still start
 *  - fatal:true  – secret is set but is shorter than BOOTSTRAP_MIN_LENGTH;
 *                  the server must refuse to start because a short secret can
 *                  be brute-forced against the 403/200 status difference on
 *                  the reset-password endpoint
 */
export function checkBootstrapSecret(
  secret: string | undefined,
): BootstrapSecretStatus {
  if (!secret || secret === BOOTSTRAP_PLACEHOLDER) {
    return {
      ok: false,
      fatal: false,
      reason:
        'ADMIN_BOOTSTRAP_SECRET is not set (or is the placeholder value). ' +
        'The /api/admin/reset-password and /api/admin/init endpoints are DISABLED.',
    };
  }

  if (secret.length < BOOTSTRAP_MIN_LENGTH) {
    return {
      ok: false,
      fatal: true,
      reason:
        `ADMIN_BOOTSTRAP_SECRET is only ${secret.length} characters — ` +
        `minimum is ${BOOTSTRAP_MIN_LENGTH}. ` +
        'A short secret can be brute-forced. Server will not start. ' +
        'Set a secret of at least 32 characters.',
    };
  }

  return { ok: true };
}
