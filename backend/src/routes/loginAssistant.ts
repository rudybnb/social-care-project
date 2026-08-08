import { Router, Request, Response } from 'express';
import { sql } from 'drizzle-orm';
import { staff, sites } from '../schema.js';
import { logActivity } from '../services/auditLogService.js';
import crypto from 'crypto';

// In-memory rate limiting per IP (10 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 10) {
    return false;
  }
  entry.count += 1;
  return true;
}

// In-memory short-lived verification token store (5-minute expiration, single-use)
interface VerificationTokenEntry {
  staffId: string;
  name: string;
  expiresAt: number;
}
const tokenStore = new Map<string, VerificationTokenEntry>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of tokenStore.entries()) {
    if (now > entry.expiresAt) {
      tokenStore.delete(token);
    }
  }
}, 60000);

export function createLoginAssistantRouter(database: any): Router {
  const router: Router = Router();

  const handleAssistantRequest = async (req: Request, res: Response) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: 'Too many assistance requests. Please try again in a minute.' });
      }

      if (!database) {
        return res.status(500).json({ error: 'Database not configured' });
      }

      const { action, phoneDigits, fullPhone, siteId, verificationToken } = req.body || {};
      const normDigits = typeof phoneDigits === 'string' ? phoneDigits.replace(/\D/g, '') : '';
      const normFullPhone = typeof fullPhone === 'string' ? fullPhone.replace(/\D/g, '') : '';
      const cleanSiteId = typeof siteId === 'string' ? siteId.trim() : '';

      // Action 1: Diagnose last-4 phone lookup
      if (action === 'diagnose') {
        if (!normDigits || normDigits.length < 4) {
          return res.status(400).json({ error: 'Valid 4 digits required' });
        }

        const last4 = normDigits.slice(-4);
        const allStaffResult = await database.select({
          id: staff.id,
          name: staff.name,
          phone: staff.phone,
          site: staff.site,
          status: staff.status
        }).from(staff);

        // Filter staff matching last 4 digits
        const matchingCandidates = allStaffResult.filter((s: any) => {
          if (!s.phone) return false;
          const norm = String(s.phone).replace(/\D/g, '');
          return norm.length >= 4 && norm.slice(-4) === last4;
        });

        if (matchingCandidates.length === 0) {
          return res.json({
            status: 'no_match',
            message: 'Phone number not found or unable to verify.'
          });
        }

        // Check for inactive / suspended staff among matches
        const inactiveMatches = matchingCandidates.filter((s: any) => s.status !== 'Active');
        if (inactiveMatches.length > 0 && matchingCandidates.length === inactiveMatches.length) {
          await logActivity(
            'LOGIN_SUPPORT_ASSISTANT',
            'WARNING',
            null,
            null,
            cleanSiteId,
            `Inactive account login assistance attempt for last4 digits`
          );
          return res.json({
            status: 'account_inactive',
            message: 'Account is currently inactive or under review. An alert has been flagged for Admin review.'
          });
        }

        const activeMatches = matchingCandidates.filter((s: any) => s.status === 'Active');

        if (activeMatches.length === 1) {
          // Unique match (normal flow handles this via /api/staff/lookup)
          return res.json({
            status: 'unique_match'
          });
        }

        // Multiple active staff match the last 4 digits (Duplicate last-4)
        // Check if current site disambiguates
        let siteMatches = activeMatches;
        if (cleanSiteId) {
          const siteRow = await database.select({ id: sites.id, name: sites.name })
            .from(sites)
            .where(sql`${sites.id} = ${cleanSiteId}`)
            .limit(1);

          const siteName = siteRow[0]?.name;
          if (siteName) {
            siteMatches = activeMatches.filter((s: any) =>
              s.site && s.site.toLowerCase().includes(siteName.toLowerCase())
            );
          }
        }

        if (siteMatches.length === 1) {
          return res.json({
            status: 'unique_match'
          });
        }

        // Duplicate exists at same site or site could not narrow down to 1
        return res.json({
          status: 'duplicate_last4',
          requiresFullPhone: true,
          message: 'Multiple accounts match these 4 digits. Full phone verification required.'
        });
      }

      // Action 2: Verify full phone number server-side (Anti-leak, returns ONLY opaque token)
      if (action === 'verify_full_phone') {
        if (!normFullPhone || normFullPhone.length < 10) {
          return res.status(400).json({ error: 'Valid full phone number required' });
        }

        const allStaffResult = await database.select({
          id: staff.id,
          name: staff.name,
          phone: staff.phone,
          status: staff.status
        }).from(staff);

        const exactMatch = allStaffResult.find((s: any) => {
          if (!s.phone || s.status !== 'Active') return false;
          const norm = String(s.phone).replace(/\D/g, '');
          return norm === normFullPhone;
        });

        if (exactMatch) {
          // Create short-lived opaque verification token (5-minute expiration)
          const token = `vtok_${crypto.randomBytes(16).toString('hex')}`;
          tokenStore.set(token, {
            staffId: exactMatch.id,
            name: exactMatch.name,
            expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
          });

          // Return ONLY opaque verification token — NEVER staffId or personal details
          return res.json({
            status: 'verified',
            verificationToken: token
          });
        } else {
          return res.json({
            status: 'no_match',
            message: 'Phone number not found or unable to verify.'
          });
        }
      }

      // Action 3: Single-use resolution of opaque verification token
      if (action === 'resolve_token') {
        if (!verificationToken || typeof verificationToken !== 'string') {
          return res.status(400).json({ error: 'Verification token required' });
        }

        const entry = tokenStore.get(verificationToken);
        if (!entry) {
          return res.status(400).json({ error: 'Verification token invalid or expired' });
        }

        if (Date.now() > entry.expiresAt) {
          tokenStore.delete(verificationToken);
          return res.status(400).json({ error: 'Verification token expired' });
        }

        // Consume single-use token
        tokenStore.delete(verificationToken);

        return res.json({
          status: 'resolved',
          staffId: entry.staffId,
          name: entry.name
        });
      }

      // Action 4: Flag for Admin Review (writes to activity_logs)
      if (action === 'flag_admin_review') {
        await logActivity(
          'LOGIN_SUPPORT_ASSISTANT',
          'WARNING',
          null,
          null,
          cleanSiteId || null,
          `Kiosk support assistance requested for manual review.`
        );

        return res.json({
          status: 'flagged',
          message: 'An internal Admin review alert has been recorded. An Admin will review your account.'
        });
      }

      return res.status(400).json({ error: 'Invalid assistant action' });
    } catch (error: any) {
      console.error('Login assistant error:', error);
      return res.status(500).json({ error: 'Assistant service error' });
    }
  };

  router.post('/', handleAssistantRequest);
  router.post('/login-assistant', handleAssistantRequest);

  return router;
}

export default createLoginAssistantRouter;
