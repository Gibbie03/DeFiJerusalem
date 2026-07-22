#!/usr/bin/env bash
# check-db-schema.sh
#
# Validates that shared/schema.ts is compatible with the currently installed
# drizzle-orm / drizzle-kit versions by asking drizzle-kit to generate the
# SQL diff into a temporary directory.  The script exits non-zero if:
#
#   • schema.ts has a TypeScript or drizzle-orm API error
#   • drizzle-kit itself fails (e.g. after an ORM major-version upgrade)
#   • Zero tables are detected (configuration or import problem)
#
# It does NOT require a live database connection for the validation step.
# To also check for drift against the live database, run `npm run db:push`
# (it will report what it would change and prompt before applying anything).
#
# Usage:
#   npm run db:check                   # via package.json script
#   bash scripts/check-db-schema.sh   # directly

set -euo pipefail

TMPDIR_OUT="/tmp/drizzle-schema-check"

# Clean up temp output on exit (success or failure)
cleanup() {
  rm -rf "$TMPDIR_OUT"
}
trap cleanup EXIT

# drizzle.config.ts throws if DATABASE_URL is missing; supply a placeholder
# when the env var is absent so the schema-generation step can run without
# an actual database connection.
export DATABASE_URL="${DATABASE_URL:-postgresql://placeholder/placeholder}"

ORM_VERSION=$(node -e "console.log(require('./node_modules/drizzle-orm/package.json').version)" 2>/dev/null || echo "unknown")
KIT_VERSION=$(node -e "console.log(require('./node_modules/drizzle-kit/package.json').version)" 2>/dev/null || echo "unknown")

echo "==> Validating shared/schema.ts (drizzle-orm $ORM_VERSION, drizzle-kit $KIT_VERSION)..."

# drizzle.check.config.ts is identical to drizzle.config.ts except it writes
# to /tmp/drizzle-schema-check so the project migrations/ folder stays clean.
if ! output=$(npx drizzle-kit generate --config drizzle.check.config.ts 2>&1); then
  echo ""
  echo "FAIL: drizzle-kit schema validation failed."
  echo "      This means shared/schema.ts is incompatible with the installed"
  echo "      drizzle-orm / drizzle-kit versions, or the config is broken."
  echo ""
  echo "--- drizzle-kit output ---"
  echo "$output"
  echo "--------------------------"
  exit 1
fi

# Count tables detected (sanity check — 0 tables = config or import issue)
TABLE_COUNT=$(echo "$output" | grep -c ' columns ' || true)
if [ "$TABLE_COUNT" -eq 0 ]; then
  echo ""
  echo "FAIL: drizzle-kit reported 0 tables. Check drizzle.check.config.ts and"
  echo "      shared/schema.ts for configuration or import errors."
  echo ""
  echo "--- drizzle-kit output ---"
  echo "$output"
  echo "--------------------------"
  exit 1
fi

echo "OK: schema.ts is valid — $TABLE_COUNT tables detected, no drizzle-orm API errors."
echo ""
echo "Note: To check for drift against the live database, run: npm run db:push"
exit 0
