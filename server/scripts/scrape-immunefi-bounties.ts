/**
 * Immunefi Bug Bounty Scraper
 *
 * Uses Playwright (headless Chromium) to scrape https://immunefi.com/explore/
 * and extract all active bug bounty programs with their payout amounts.
 *
 * Output: server/data/immunefi-bounties.json
 *
 * Usage:
 *   npx tsx server/scripts/scrape-immunefi-bounties.ts
 *   npx tsx server/scripts/scrape-immunefi-bounties.ts --dry-run
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '../data/immunefi-bounties.json');
const DRY_RUN = process.argv.includes('--dry-run');

export interface ImmunefiBountyEntry {
  slug: string;
  name: string;
  url: string;
  maxBounty: number;
  assets: string[];
  highestBountyLabel: string;
}

function parseBountyAmount(text: string): number {
  if (!text) return 0;
  const m = text.match(/\$([0-9,.]+)\s*(m(?:illion)?|k)?/i);
  if (!m) return 0;
  const num = parseFloat(m[1].replace(/,/g, ''));
  const suffix = (m[2] ?? '').toLowerCase();
  if (suffix.startsWith('m')) return Math.round(num * 1_000_000);
  if (suffix.startsWith('k')) return Math.round(num * 1_000);
  return Math.round(num);
}

function bountyLabel(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return n > 0 ? `$${n}` : 'Available';
}

export async function scrapeImmunefi(): Promise<ImmunefiBountyEntry[]> {
  console.log('[IMMUNEFI] Launching headless Chromium…');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('https://immunefi.com/explore/', {
      waitUntil: 'networkidle',
      timeout: 45_000,
    });

    // Wait for bounty cards to appear
    await page.waitForSelector('a[href*="/bounty/"], a[href*="/bug-bounty/"]', {
      timeout: 30_000,
    }).catch(() => console.warn('[IMMUNEFI] Timeout waiting for bounty cards — page may have changed'));

    // Scroll to load all cards (infinite scroll)
    let prevCount = 0;
    for (let i = 0; i < 20; i++) {
      const count = await page.locator('a[href*="/bounty/"], a[href*="/bug-bounty/"]').count();
      if (count === prevCount && i > 0) break;
      prevCount = count;
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1_500);
    }

    // Extract bounty data from each card link
    const bounties = await page.evaluate(() => {
      const seen = new Set<string>();
      const results: any[] = [];

      document.querySelectorAll<HTMLAnchorElement>('a[href*="/bounty/"], a[href*="/bug-bounty/"]').forEach(link => {
        const href = link.getAttribute('href') ?? '';
        const slug = href.split('/').filter(Boolean).pop() ?? '';
        if (!slug || seen.has(slug)) return;
        seen.add(slug);

        // Try to find project name
        const nameEl =
          link.querySelector('h2, h3, [class*="title"], [class*="name"], [class*="project"]') ??
          link.querySelector('p, span, div');
        const name = nameEl?.textContent?.trim() ?? slug;

        // Try to find bounty amount text
        const allText = link.textContent ?? '';
        const amountMatch = allText.match(/\$[\d,.]+\s*(?:m(?:illion)?|k)?/i);
        const amountText = amountMatch ? amountMatch[0] : '';

        results.push({ slug, name, amountText, url: 'https://immunefi.com' + href });
      });

      return results;
    });

    await browser.close();

    const entries: ImmunefiBountyEntry[] = bounties.map(b => {
      const maxBounty = parseBountyAmount(b.amountText);
      return {
        slug: b.slug,
        name: b.name,
        url: b.url,
        maxBounty,
        assets: [],
        highestBountyLabel: bountyLabel(maxBounty),
      };
    });

    console.log(`[IMMUNEFI] Scraped ${entries.length} bounty programs`);
    return entries;
  } catch (err) {
    await browser.close();
    throw err;
  }
}

async function main() {
  let entries: ImmunefiBountyEntry[];
  try {
    entries = await scrapeImmunefi();
  } catch (err) {
    console.error('[IMMUNEFI] Scrape failed:', err);
    console.log('[IMMUNEFI] Falling back to existing JSON file (if any)');
    process.exit(1);
  }

  if (entries.length === 0) {
    console.warn('[IMMUNEFI] No entries scraped — aborting write to avoid overwriting good data');
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('[IMMUNEFI] DRY RUN — sample output:');
    console.log(JSON.stringify(entries.slice(0, 5), null, 2));
    process.exit(0);
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(entries, null, 2), 'utf8');
  console.log(`[IMMUNEFI] Wrote ${entries.length} entries to ${OUTPUT_FILE}`);
  process.exit(0);
}

// Run if called directly
const isMain = process.argv[1]?.endsWith('scrape-immunefi-bounties.ts') ||
               process.argv[1]?.endsWith('scrape-immunefi-bounties.js');
if (isMain) {
  main().catch(err => { console.error(err); process.exit(1); });
}
