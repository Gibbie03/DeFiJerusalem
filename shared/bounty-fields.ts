/**
 * Single source of truth for enrichable protocol fields used by both
 * the bounty-audit routes (server) and the gap-generation CLI script.
 */

export interface EnrichableField {
  /** DB column / field key */
  col: string;
  /** Human-readable label shown to contributors */
  label: string;
  /** Bounty points awarded on acceptance */
  points: number;
  /** Value type expected from a contributor */
  dataType: 'url' | 'url_list' | 'boolean' | 'text';
}

export const ENRICHABLE_FIELDS: Record<string, EnrichableField> = {
  audit_links:       { col: 'audit_links',       label: 'Audit report URL',   points: 50, dataType: 'url_list' },
  github:            { col: 'github',             label: 'GitHub repo URL',    points: 30, dataType: 'url'      },
  website:           { col: 'website',            label: 'Official website',   points: 10, dataType: 'url'      },
  twitter:           { col: 'twitter',            label: 'Twitter / X handle', points: 15, dataType: 'url'      },
  defi_has_multisig: { col: 'defi_has_multisig',  label: 'Multisig confirmed', points: 40, dataType: 'boolean'  },
  defi_has_timelock: { col: 'defi_has_timelock',  label: 'Timelock confirmed', points: 40, dataType: 'boolean'  },
  bug_bounty_url:    { col: 'audit_links',        label: 'Bug bounty URL',     points: 35, dataType: 'url_list' },
};
