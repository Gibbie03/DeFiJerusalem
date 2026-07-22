/**
 * Bounty System & Audit Firm Pipeline Routes
 * Mounted in server/routes.ts
 */

import type { Express, Request, Response } from 'express';
import { db } from '../db';
import {
  communityUsers, bountyTasks, bountySubmissions, pointsLedger,
  protocols,
  auditFirms, auditFirmClaims, auditFirmReviews,
  insertCommunityUserSchema, insertBountyTaskSchema, insertBountySubmissionSchema,
  insertAuditFirmSchema, insertAuditFirmClaimSchema, insertAuditFirmReviewSchema,
} from '@shared/schema';
import { eq, desc, asc, sql, and, isNull, gt, or } from 'drizzle-orm';
import { z } from 'zod';
import { auditLogger } from '../lib/audit-logger';
import { apiLimiter } from '../index';

import { ENRICHABLE_FIELDS } from '@shared/bounty-fields';

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Data-enrichment write-back ───────────────────────────────────────────────
// Called when an admin approves a data-enrichment submission.
// Writes the submitted value into the protocol record then triggers a rescore.

async function applyEnrichmentValue(
  protocolId: string,
  targetField: string,
  dataType: string,
  rawValue: string,
): Promise<boolean> {
  try {
    const meta = ENRICHABLE_FIELDS[targetField];
    if (!meta) return false;

    const [existing] = await db.select().from(protocols).where(eq(protocols.id, protocolId)).limit(1);
    if (!existing) return false;

    const update: Record<string, any> = {};

    if (dataType === 'url_list' || targetField === 'audit_links' || targetField === 'bug_bounty_url') {
      // Append to array, deduplicate
      const current: string[] = (existing.auditLinks as string[]) ?? [];
      const newVal = rawValue.trim();
      if (!current.includes(newVal)) {
        update.auditLinks = [...current, newVal];
        if (targetField === 'audit_links' || targetField === 'bug_bounty_url') {
          update.audited = true;
          update.auditCount = (existing.auditCount ?? 0) + 1;
        }
      }
    } else if (dataType === 'boolean') {
      const val = rawValue === 'true' || rawValue === '1';
      if (targetField === 'defi_has_multisig') update.defiHasMultisig = val;
      else if (targetField === 'defi_has_timelock') update.defiHasTimelock = val;
    } else {
      // text / url — set directly
      if (targetField === 'github')   update.github  = rawValue.trim();
      if (targetField === 'website')  update.website = rawValue.trim();
      if (targetField === 'twitter')  update.twitter = rawValue.trim();
    }

    if (Object.keys(update).length === 0) return false;

    await db.update(protocols).set(update).where(eq(protocols.id, protocolId));

    // Rescore this single protocol and flush cache
    const { batchRescore, flushServerCache } = await import('../lib/protocol-enrichment');
    await batchRescore(); // recalculates all (fast ~1s) so relative ranks stay consistent
    await flushServerCache();

    console.log(`[ENRICHMENT] Applied ${targetField}="${rawValue}" to protocol ${protocolId}`);
    return true;
  } catch (err) {
    console.error('[ENRICHMENT] write-back failed:', err);
    return false;
  }
}

async function recalcFirmReputation(firmId: string) {
  const claims = await db.select().from(auditFirmClaims).where(eq(auditFirmClaims.firmId, firmId));
  const verified = claims.filter(c => c.verificationStatus === 'verified');
  const postExploit = verified.filter(c => c.protocolWasExploited).length;

  const reviews = await db.select().from(auditFirmReviews).where(eq(auditFirmReviews.firmId, firmId));
  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null;

  const scopeScores = verified.filter(c => c.deployedCodeMatchesAudit !== null);
  const scopeCoverage = scopeScores.length > 0
    ? (scopeScores.filter(c => c.deployedCodeMatchesAudit).length / scopeScores.length) * 100
    : null;

  const responseTimes = verified.filter(c => c.bountyResponseDays !== null);
  const avgResponse = responseTimes.length > 0
    ? responseTimes.reduce((sum, c) => sum + (c.bountyResponseDays ?? 0), 0) / responseTimes.length
    : null;

  await db.update(auditFirms).set({
    totalClaims: claims.length,
    verifiedClaims: verified.length,
    postExploitCount: postExploit,
    communityRating: avgRating,
    totalReviews: reviews.length,
    avgBountyResponseDays: avgResponse,
    scopeCoverageScore: scopeCoverage,
    updatedAt: new Date(),
  }).where(eq(auditFirms.id, firmId));
}

export function registerBountyAuditRoutes(app: Express) {

  // ==========================================
  // COMMUNITY USERS
  // ==========================================

  app.post('/api/community/register', apiLimiter, async (req: Request, res: Response) => {
    try {
      const { email, walletAddress, displayName, bio, twitterHandle, githubHandle } = req.body;
      if (!displayName) return res.status(400).json({ error: 'displayName is required' });
      if (!email && !walletAddress) return res.status(400).json({ error: 'Provide email or walletAddress' });

      // Check for existing
      if (email) {
        const existing = await db.select().from(communityUsers).where(eq(communityUsers.email, email.toLowerCase())).limit(1);
        if (existing.length > 0) return res.json({ user: existing[0], existing: true });
      }
      if (walletAddress) {
        const existing = await db.select().from(communityUsers).where(eq(communityUsers.walletAddress, walletAddress.toLowerCase())).limit(1);
        if (existing.length > 0) return res.json({ user: existing[0], existing: true });
      }

      const id = uid('user');
      const [user] = await db.insert(communityUsers).values({
        id, displayName, bio,
        email: email ? email.toLowerCase() : null,
        walletAddress: walletAddress ? walletAddress.toLowerCase() : null,
        twitterHandle, githubHandle,
      }).returning();

      res.status(201).json({ user, existing: false });
    } catch (err: any) {
      console.error('[community/register]', err);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  app.get('/api/community/user', async (req: Request, res: Response) => {
    try {
      const { email, wallet } = req.query;
      if (!email && !wallet) return res.status(400).json({ error: 'Provide email or wallet query param' });

      let user = null;
      if (email) {
        const rows = await db.select().from(communityUsers).where(eq(communityUsers.email, (email as string).toLowerCase())).limit(1);
        user = rows[0] ?? null;
      } else {
        const rows = await db.select().from(communityUsers).where(eq(communityUsers.walletAddress, (wallet as string).toLowerCase())).limit(1);
        user = rows[0] ?? null;
      }
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  app.get('/api/leaderboard', async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const users = await db.select().from(communityUsers)
        .orderBy(desc(communityUsers.totalPoints))
        .limit(limit);
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  // ==========================================
  // BOUNTY TASKS
  // ==========================================

  app.get('/api/bounties', async (req: Request, res: Response) => {
    try {
      const { status = 'open', category } = req.query;
      let query = db.select().from(bountyTasks).orderBy(desc(bountyTasks.createdAt)) as any;
      // Apply filters manually since drizzle chaining is tricky
      const tasks = await db.select().from(bountyTasks)
        .where(status !== 'all' ? eq(bountyTasks.status, status as string) : undefined as any)
        .orderBy(desc(bountyTasks.createdAt));
      const filtered = category ? tasks.filter(t => t.category === category) : tasks;
      res.json(filtered);
    } catch (err) {
      console.error('[bounties GET]', err);
      res.status(500).json({ error: 'Failed to fetch bounties' });
    }
  });

  // GET /api/bounties/data-enrichment — must be before /:id to avoid being swallowed
  app.get('/api/bounties/data-enrichment', async (req: Request, res: Response) => {
    try {
      const tasks = await db.select().from(bountyTasks)
        .where(and(eq(bountyTasks.category, 'DataEnrichment'), eq(bountyTasks.status, 'open')))
        .orderBy(desc(bountyTasks.pointReward))
        .limit(100);
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch enrichment bounties' });
    }
  });

  app.get('/api/bounties/:id', async (req: Request, res: Response) => {
    try {
      const [task] = await db.select().from(bountyTasks).where(eq(bountyTasks.id, req.params.id)).limit(1);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      const subs = await db.select().from(bountySubmissions)
        .where(and(eq(bountySubmissions.taskId, task.id), eq(bountySubmissions.status, 'approved')))
        .orderBy(desc(bountySubmissions.createdAt)).limit(10);
      res.json({ task, recentSubmissions: subs });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  });

  // Admin: create task
  app.post('/api/bounties', async (req: Request, res: Response) => {
    try {
      if (!req.session?.adminId) return res.status(401).json({ error: 'Admin required' });
      const data = insertBountyTaskSchema.parse({ ...req.body, createdBy: req.session.adminUsername || 'admin' });
      const { id: _ignored, ...rest } = data as any;
      const id = uid('task');
      const [task] = await db.insert(bountyTasks).values({ id, ...rest }).returning();
      res.status(201).json(task);
    } catch (err: any) {
      if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  // Admin: update task status
  app.patch('/api/bounties/:id', async (req: Request, res: Response) => {
    try {
      if (!req.session?.adminId) return res.status(401).json({ error: 'Admin required' });
      await db.update(bountyTasks).set({ ...req.body, updatedAt: new Date() }).where(eq(bountyTasks.id, req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // ==========================================
  // SUBMISSIONS (task completions + self-submissions)
  // ==========================================

  app.post('/api/submissions', apiLimiter, async (req: Request, res: Response) => {
    try {
      const { userId, taskId, type, title, description, evidence, evidenceLinks, protocolId, protocolName } = req.body;
      if (!userId || !type || !title || !description) {
        return res.status(400).json({ error: 'userId, type, title, description required' });
      }
      // Verify user exists
      const [user] = await db.select().from(communityUsers).where(eq(communityUsers.id, userId)).limit(1);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const { submittedValue } = req.body;

      const id = uid('sub');
      const [sub] = await db.insert(bountySubmissions).values({
        id, userId, taskId: taskId || null, type, title, description,
        evidence: evidence || null,
        evidenceLinks: evidenceLinks || [],
        protocolId: protocolId || null,
        protocolName: protocolName || null,
        submittedValue: submittedValue ?? null,
        status: 'pending',
      }).returning();

      // If task-linked, increment submission count
      if (taskId) {
        await db.update(bountyTasks).set({
          submissionCount: sql`${bountyTasks.submissionCount} + 1`,
          updatedAt: new Date(),
        }).where(eq(bountyTasks.id, taskId));
      }

      res.status(201).json(sub);
    } catch (err: any) {
      console.error('[submissions POST]', err);
      res.status(500).json({ error: 'Failed to submit' });
    }
  });

  // Get user's submissions
  app.get('/api/submissions', async (req: Request, res: Response) => {
    try {
      const { userId, status, limit: lim } = req.query;
      const limit = Math.min(parseInt(lim as string) || 20, 100);

      // Admin sees all; user sees own
      const isAdmin = req.session?.adminId;
      if (!isAdmin && !userId) return res.status(400).json({ error: 'userId required' });

      let results = await db.select().from(bountySubmissions)
        .orderBy(desc(bountySubmissions.createdAt))
        .limit(limit);

      if (!isAdmin && userId) results = results.filter(s => s.userId === userId);
      if (status) results = results.filter(s => s.status === status);

      res.json(results);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  // Admin: review submission
  app.patch('/api/submissions/:id', async (req: Request, res: Response) => {
    try {
      if (!req.session?.adminId) return res.status(401).json({ error: 'Admin required' });
      const { status, pointsAwarded, reviewNote } = req.body;
      if (!['approved', 'rejected', 'duplicate'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      // Fetch submission + linked task (for targetField / dataType)
      const [sub] = await db.select().from(bountySubmissions).where(eq(bountySubmissions.id, req.params.id)).limit(1);
      if (!sub) return res.status(404).json({ error: 'Submission not found' });

      let task: typeof bountyTasks.$inferSelect | undefined;
      if (sub.taskId) {
        const rows = await db.select().from(bountyTasks).where(eq(bountyTasks.id, sub.taskId)).limit(1);
        task = rows[0];
      }

      await db.update(bountySubmissions).set({
        status, pointsAwarded: pointsAwarded || null,
        reviewNote: reviewNote || null,
        reviewedBy: req.session.adminUsername || 'admin',
        reviewedAt: new Date(),
      }).where(eq(bountySubmissions.id, req.params.id));

      // ── Data-enrichment write-back ──────────────────────────────────────
      // If this is a data-enrichment bounty and it's being approved, write the
      // submitted value directly into the protocols table then rescore.
      let protocolUpdated = false;
      if (status === 'approved' && task?.targetField && sub.submittedValue && sub.protocolId) {
        protocolUpdated = await applyEnrichmentValue(
          sub.protocolId, task.targetField, task.dataType ?? 'text', sub.submittedValue
        );
      }

      // Award points if approved
      if (status === 'approved' && pointsAwarded && pointsAwarded > 0) {
        const ledgerId = uid('ledger');
        await db.insert(pointsLedger).values({
          id: ledgerId,
          userId: sub.userId,
          amount: pointsAwarded,
          reason: sub.taskId ? `Task completion: ${sub.title}` : `Submission approved: ${sub.title}`,
          submissionId: sub.id,
          awardedBy: req.session.adminUsername || 'admin',
        });
        await db.update(communityUsers).set({
          totalPoints: sql`${communityUsers.totalPoints} + ${pointsAwarded}`,
          lastActive: new Date(),
        }).where(eq(communityUsers.id, sub.userId));
      }

      auditLogger.log({
        action: 'SUBMISSION_REVIEWED',
        username: req.session.adminUsername || 'admin',
        ip: req.ip || '',
        userAgent: req.get('user-agent') || '',
        success: true,
        details: { submissionId: req.params.id, status, pointsAwarded, protocolUpdated },
      });

      res.json({ success: true, protocolUpdated });
    } catch (err) {
      console.error('[submissions PATCH]', err);
      res.status(500).json({ error: 'Failed to review submission' });
    }
  });

  // User's points ledger
  app.get('/api/community/:userId/points', async (req: Request, res: Response) => {
    try {
      const entries = await db.select().from(pointsLedger)
        .where(eq(pointsLedger.userId, req.params.userId))
        .orderBy(desc(pointsLedger.createdAt))
        .limit(50);
      res.json(entries);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch points history' });
    }
  });

  // ==========================================
  // AUDIT FIRMS
  // ==========================================

  app.get('/api/audit-firms', async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const filterStatus = status as string || 'verified';
      const isAdmin = req.session?.adminId;

      const firms = await db.select().from(auditFirms)
        .where(isAdmin && filterStatus === 'all' ? undefined as any : eq(auditFirms.verificationStatus, filterStatus))
        .orderBy(desc(auditFirms.verifiedClaims), desc(auditFirms.communityRating))
        .limit(100);

      res.json(firms);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch audit firms' });
    }
  });

  app.get('/api/audit-firms/:id', async (req: Request, res: Response) => {
    try {
      const [firm] = await db.select().from(auditFirms).where(eq(auditFirms.id, req.params.id)).limit(1);
      if (!firm) return res.status(404).json({ error: 'Firm not found' });

      const claims = await db.select().from(auditFirmClaims)
        .where(eq(auditFirmClaims.firmId, firm.id))
        .orderBy(desc(auditFirmClaims.submittedAt));

      const reviews = await db.select().from(auditFirmReviews)
        .where(eq(auditFirmReviews.firmId, firm.id))
        .orderBy(desc(auditFirmReviews.createdAt))
        .limit(20);

      res.json({ firm, claims, reviews });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch firm' });
    }
  });

  // Register a new audit firm
  app.post('/api/audit-firms', apiLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = insertAuditFirmSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

      const id = uid('firm');
      const [firm] = await db.insert(auditFirms).values({
        id,
        ...parsed.data,
        verificationStatus: 'pending',
        totalClaims: 0, verifiedClaims: 0, postExploitCount: 0, totalReviews: 0,
      } as any).returning();

      res.status(201).json(firm);
    } catch (err: any) {
      console.error('[audit-firms POST]', err);
      res.status(500).json({ error: 'Failed to register firm' });
    }
  });

  // Admin: verify / reject firm
  app.patch('/api/audit-firms/:id/status', async (req: Request, res: Response) => {
    try {
      if (!req.session?.adminId) return res.status(401).json({ error: 'Admin required' });
      const { status, rejectionReason } = req.body;
      if (!['verified', 'rejected', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

      await db.update(auditFirms).set({
        verificationStatus: status,
        verifiedAt: status === 'verified' ? new Date() : null,
        verifiedBy: status === 'verified' ? (req.session.adminUsername || 'admin') : null,
        rejectionReason: rejectionReason || null,
        updatedAt: new Date(),
      }).where(eq(auditFirms.id, req.params.id));

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update firm status' });
    }
  });

  // ==========================================
  // AUDIT FIRM CLAIMS
  // ==========================================

  app.post('/api/audit-firms/:id/claims', apiLimiter, async (req: Request, res: Response) => {
    try {
      const [firm] = await db.select().from(auditFirms).where(eq(auditFirms.id, req.params.id)).limit(1);
      if (!firm) return res.status(404).json({ error: 'Firm not found' });

      const parsed = insertAuditFirmClaimSchema.safeParse({ ...req.body, firmId: req.params.id });
      if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

      const id = uid('claim');
      const [claim] = await db.insert(auditFirmClaims).values({
        id, ...parsed.data, verificationStatus: 'pending',
      } as any).returning();

      await recalcFirmReputation(req.params.id);
      res.status(201).json(claim);
    } catch (err: any) {
      console.error('[claims POST]', err);
      res.status(500).json({ error: 'Failed to submit claim' });
    }
  });

  app.get('/api/audit-firms/:id/claims', async (req: Request, res: Response) => {
    try {
      const claims = await db.select().from(auditFirmClaims)
        .where(eq(auditFirmClaims.firmId, req.params.id))
        .orderBy(desc(auditFirmClaims.submittedAt));
      res.json(claims);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch claims' });
    }
  });

  // Admin: verify / reject claim
  app.patch('/api/audit-firms/:firmId/claims/:claimId', async (req: Request, res: Response) => {
    try {
      if (!req.session?.adminId) return res.status(401).json({ error: 'Admin required' });
      const { status, rejectionReason, protocolWasExploited, exploitDate, exploitDescription } = req.body;
      if (!['verified', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

      await db.update(auditFirmClaims).set({
        verificationStatus: status,
        verifiedAt: status === 'verified' ? new Date() : null,
        verifiedBy: req.session.adminUsername || 'admin',
        rejectionReason: rejectionReason || null,
        protocolWasExploited: protocolWasExploited ?? false,
        exploitDate: exploitDate || null,
        exploitDescription: exploitDescription || null,
      }).where(eq(auditFirmClaims.id, req.params.claimId));

      await recalcFirmReputation(req.params.firmId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update claim' });
    }
  });

  // ==========================================
  // AUDIT FIRM REVIEWS
  // ==========================================

  app.post('/api/audit-firms/:id/reviews', apiLimiter, async (req: Request, res: Response) => {
    try {
      const { reviewerUserId, rating, reviewText, claimId } = req.body;
      if (!reviewerUserId || !rating || !reviewText) {
        return res.status(400).json({ error: 'reviewerUserId, rating, reviewText required' });
      }
      if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

      const [user] = await db.select().from(communityUsers).where(eq(communityUsers.id, reviewerUserId)).limit(1);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const id = uid('review');
      const [review] = await db.insert(auditFirmReviews).values({
        id, firmId: req.params.id, reviewerUserId, rating, reviewText,
        claimId: claimId || null,
      }).returning();

      await recalcFirmReputation(req.params.id);
      res.status(201).json(review);
    } catch (err: any) {
      console.error('[reviews POST]', err);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  });

  // ==========================================
  // DATA-ENRICHMENT BOUNTIES
  // ==========================================

  // POST /api/admin/bounties/generate-gaps
  // Scans protocols with TVL > 0 for missing fields and auto-creates bounties.
  // ?limit=N controls how many protocols to scan (default 500, sorted by TVL desc).
  // ?fields=audit_links,github,... limits which fields to target (default: all).
  app.post('/api/admin/bounties/generate-gaps', async (req: Request, res: Response) => {
    try {
      if (!req.session?.adminId) return res.status(401).json({ error: 'Admin required' });

      const scanLimit  = Math.min(parseInt(req.query.limit as string)  || 500, 2000);
      const fieldParam = req.query.fields as string | undefined;
      const targetFields = fieldParam
        ? fieldParam.split(',').filter(f => f in ENRICHABLE_FIELDS)
        : Object.keys(ENRICHABLE_FIELDS);

      // Fetch top protocols by TVL with a positive score (active protocols)
      const rows = await db.select({
        id: protocols.id, name: protocols.name, tvl: protocols.tvl,
        auditLinks: protocols.auditLinks, github: protocols.github,
        website: protocols.website, twitter: protocols.twitter,
        defiHasMultisig: protocols.defiHasMultisig,
        defiHasTimelock: protocols.defiHasTimelock,
      }).from(protocols)
        .where(gt(protocols.tvl, 0))
        .orderBy(desc(protocols.tvl))
        .limit(scanLimit);

      // Find which fields are missing per protocol
      const gaps: { protocolId: string; protocolName: string; field: string }[] = [];
      for (const p of rows) {
        const links = (p.auditLinks as string[] | null) ?? [];
        const missing: Record<string, boolean> = {
          audit_links:       links.length === 0,
          github:            !p.github,
          website:           !p.website,
          twitter:           !p.twitter,
          defi_has_multisig: p.defiHasMultisig === null || p.defiHasMultisig === undefined,
          defi_has_timelock: p.defiHasTimelock === null || p.defiHasTimelock === undefined,
          bug_bounty_url:    !links.some((l: string) => l.includes('immunefi.com') || l.includes('hackerone.com')),
        };
        for (const field of targetFields) {
          if (missing[field]) gaps.push({ protocolId: p.id, protocolName: p.name, field });
        }
      }

      // Check which bounties already exist so we don't duplicate
      const existingTasks = await db.select({
        protocolId: bountyTasks.protocolId,
        targetField: bountyTasks.targetField,
      }).from(bountyTasks)
        .where(and(eq(bountyTasks.category, 'DataEnrichment'), eq(bountyTasks.status, 'open')));

      const existingSet = new Set(existingTasks.map(t => `${t.protocolId}::${t.targetField}`));
      const newGaps = gaps.filter(g => !existingSet.has(`${g.protocolId}::${g.field}`));

      // Create bounties for new gaps (batch)
      let created = 0;
      const CHUNK = 50;
      for (let i = 0; i < newGaps.length; i += CHUNK) {
        const chunk = newGaps.slice(i, i + CHUNK);
        const values = chunk.map(g => {
          const meta = ENRICHABLE_FIELDS[g.field]!;
          return {
            id: uid('task'),
            title: `Verify ${meta.label} for ${g.protocolName}`,
            description:
              `Help fill a security data gap for **${g.protocolName}**.\n\n` +
              `Submit the verified **${meta.label}** for this protocol. ` +
              `Your submission will be reviewed and, if approved, applied directly to the protocol record and trigger a rescore. ` +
              `Include a source link as evidence.`,
            category: 'DataEnrichment',
            pointReward: meta.points,
            status: 'open',
            protocolId: g.protocolId,
            targetField: g.field,
            dataType: g.field === 'defi_has_multisig' || g.field === 'defi_has_timelock'
              ? 'boolean'
              : g.field === 'audit_links' || g.field === 'bug_bounty_url' ? 'url' : 'url',
            requirements: [`Provide a working URL or verifiable source`, `Source must be official or widely recognised`],
            createdBy: req.session.adminUsername || 'admin',
            maxSubmissions: 3, // accept up to 3 before closing
          };
        });
        await db.insert(bountyTasks).values(values as any);
        created += chunk.length;
      }

      res.json({
        ok: true,
        protocolsScanned: rows.length,
        totalGaps: gaps.length,
        alreadyHadBounty: gaps.length - newGaps.length,
        created,
        byField: targetFields.reduce((acc, f) => {
          acc[f] = newGaps.filter(g => g.field === f).length;
          return acc;
        }, {} as Record<string, number>),
      });
    } catch (err) {
      console.error('[generate-gaps]', err);
      res.status(500).json({ error: 'Failed to generate gap bounties', detail: String(err) });
    }
  });

  // ==========================================
  // ADMIN REVIEW QUEUE
  // ==========================================

  app.get('/api/admin/review-queue', async (req: Request, res: Response) => {
    try {
      if (!req.session?.adminId) return res.status(401).json({ error: 'Admin required' });
      const [pendingSubs, pendingFirms, pendingClaims] = await Promise.all([
        db.select().from(bountySubmissions).where(eq(bountySubmissions.status, 'pending')).orderBy(asc(bountySubmissions.createdAt)).limit(50),
        db.select().from(auditFirms).where(eq(auditFirms.verificationStatus, 'pending')).orderBy(asc(auditFirms.createdAt)).limit(20),
        db.select().from(auditFirmClaims).where(eq(auditFirmClaims.verificationStatus, 'pending')).orderBy(asc(auditFirmClaims.submittedAt)).limit(50),
      ]);
      res.json({ pendingSubmissions: pendingSubs, pendingFirms, pendingClaims });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch review queue' });
    }
  });
}
