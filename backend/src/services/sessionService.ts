import crypto from 'crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { authSessions, staff } from '../schema.js';
import { sanitizeStaffForAuth, SafeAuthUser } from './authSanitizer.js';

const SESSION_TOKEN_BYTES = 32; // 256 bits → 43 base64url chars
export const EXPECTED_TOKEN_LENGTH = 43;
const BASE64URL_REGEX = /^[A-Za-z0-9\-_]+$/;
const DEFAULT_ADMIN_SESSION_HOURS = 8;
export const MIN_ADMIN_SESSION_HOURS = 1;
export const MAX_ADMIN_SESSION_HOURS = 24;

type DbLike = any;

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

export interface AuthenticatedSession {
  session: {
    id: string;
    staffId: string;
    expiresAt: Date;
    revokedAt: Date | null;
  };
  user: SafeAuthUser;
}

export function isAuthEnforcementEnabled(): boolean {
  return process.env.AUTH_ENFORCEMENT === 'true';
}

export function getAdminSessionDurationHours(): number {
  const configuredValue = process.env.ADMIN_SESSION_HOURS;
  if (configuredValue === undefined || configuredValue.trim() === '') {
    return DEFAULT_ADMIN_SESSION_HOURS;
  }

  const configuredHours = Number(configuredValue);
  if (Number.isInteger(configuredHours) && configuredHours >= MIN_ADMIN_SESSION_HOURS && configuredHours <= MAX_ADMIN_SESSION_HOURS) {
    return configuredHours;
  }

  throw new Error(`ADMIN_SESSION_HOURS must be an integer from ${MIN_ADMIN_SESSION_HOURS} to ${MAX_ADMIN_SESSION_HOURS}.`);
}

export function assertSafeAdminSessionDurationHours(durationHours: number): number {
  if (Number.isInteger(durationHours) && durationHours >= MIN_ADMIN_SESSION_HOURS && durationHours <= MAX_ADMIN_SESSION_HOURS) {
    return durationHours;
  }

  throw new Error(`Admin session duration must be an integer from ${MIN_ADMIN_SESSION_HOURS} to ${MAX_ADMIN_SESSION_HOURS} hours.`);
}

export function isValidTokenFormat(token: string): boolean {
  if (!token || token.length !== EXPECTED_TOKEN_LENGTH) return false;
  return BASE64URL_REGEX.test(token);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(SESSION_TOKEN_BYTES).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

export function getSessionExpiry(now = new Date(), durationHours = getAdminSessionDurationHours()): Date {
  return new Date(now.getTime() + assertSafeAdminSessionDurationHours(durationHours) * 60 * 60 * 1000);
}

export async function createSession(
  db: DbLike,
  staffId: string,
  options: { userAgent?: string; ipAddress?: string; now?: Date; durationHours?: number } = {}
): Promise<CreatedSession> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const now = options.now ?? new Date();
  const expiresAt = getSessionExpiry(now, options.durationHours);

  await db.insert(authSessions).values({
    staffId,
    tokenHash,
    userAgent: options.userAgent ?? null,
    ipAddress: options.ipAddress ?? null,
    createdAt: now,
    expiresAt,
    revokedAt: null,
  });

  return { token, expiresAt };
}

export async function validateSessionToken(db: DbLike, token: string, now = new Date()): Promise<AuthenticatedSession | null> {
  if (!token) return null;
  if (!isValidTokenFormat(token)) return null;

  const tokenHash = hashSessionToken(token);
  const sessions = await db
    .select({
      id: authSessions.id,
      staffId: authSessions.staffId,
      expiresAt: authSessions.expiresAt,
      revokedAt: authSessions.revokedAt,
    })
    .from(authSessions)
    .where(eq(authSessions.tokenHash, tokenHash))
    .limit(1);

  const session = sessions[0];
  if (!session) return null;

  if (session.revokedAt) return null;
  if (new Date(session.expiresAt).getTime() <= now.getTime()) return null;

  const users = await db
    .select({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      username: staff.username,
      role: staff.role,
      site: staff.site,
      status: staff.status,
    })
    .from(staff)
    .where(eq(staff.id, session.staffId))
    .limit(1);

  const user = users[0];
  if (!user || user.status !== 'Active' || user.role !== 'Admin') return null;

  return {
    session: {
      id: session.id,
      staffId: session.staffId,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
    },
    user: sanitizeStaffForAuth(user),
  };
}

export async function revokeSessionById(db: DbLike, sessionId: string, now = new Date()): Promise<void> {
  await db
    .update(authSessions)
    .set({ revokedAt: now })
    .where(and(eq(authSessions.id, sessionId), isNull(authSessions.revokedAt)));
}

export async function revokeAllSessionsForStaff(db: DbLike, staffId: string, now = new Date()): Promise<void> {
  await db
    .update(authSessions)
    .set({ revokedAt: now })
    .where(and(eq(authSessions.staffId, staffId), isNull(authSessions.revokedAt)));
}
