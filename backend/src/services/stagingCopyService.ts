import bcrypt from 'bcrypt';
import { staff } from '../schema.js';
import { notInArray, sql } from 'drizzle-orm';

type DbLike = any;

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Inventory fields scope: id, username, name, role, site, status.
 * Strictly excludes email, passwords, rates, sessions, or bank details.
 */
export const STAGING_INVENTORY_FIELDS = [
  'id',
  'username',
  'name',
  'role',
  'site',
  'status',
] as const;

export const STAGING_COPY_ALLOWED_FIELDS = STAGING_INVENTORY_FIELDS;

/**
 * Approved staging copy fields scope: id, name, email, username, role, site, status.
 * Strictly excludes passwords, rates, sessions, or bank details.
 */
export const STAGING_COPY_APPROVED_FIELDS = [
  'id',
  'name',
  'email',
  'username',
  'role',
  'site',
  'status',
] as const;

export interface StagingCopyOptions {
  sourceDatabaseUrl: string;
  destinationDatabaseUrl: string;
  isStagingDestinationConfirmed: boolean;
  confirmedDemoUuidExclusions: string[];
}

export function isValidUuid(id: string): boolean {
  if (typeof id !== 'string') return false;
  return UUID_REGEX.test(id.trim());
}

function extractDatabaseName(connectionString: string): string | null {
  try {
    const url = new URL(connectionString);
    const pathname = url.pathname.replace(/^\//, '');
    return pathname || null;
  } catch (e) {
    return null;
  }
}

function extractHostname(connectionString: string): string | null {
  try {
    const url = new URL(connectionString);
    return url.hostname || null;
  } catch (e) {
    return null;
  }
}

/**
 * Validates execution guards prior to any staging data copy operation.
 */
export function validateStagingCopyGuards(options: StagingCopyOptions): void {
  const {
    sourceDatabaseUrl,
    destinationDatabaseUrl,
    isStagingDestinationConfirmed,
    confirmedDemoUuidExclusions,
  } = options;

  // Rule 3: Explicit execution switch requirement
  if (process.env.ALLOW_STAGING_DATA_COPY !== 'true') {
    throw new Error('EXECUTION GUARD REJECTED: Environment variable ALLOW_STAGING_DATA_COPY=true is required to execute staging copy operations.');
  }

  if (!sourceDatabaseUrl || !destinationDatabaseUrl) {
    throw new Error('EXECUTION GUARD REJECTED: Both sourceDatabaseUrl and destinationDatabaseUrl are required.');
  }

  if (sourceDatabaseUrl.trim() === destinationDatabaseUrl.trim()) {
    throw new Error('EXECUTION GUARD REJECTED: Source and destination database connection strings match. Aborting to prevent data overwrite.');
  }

  const sourceHost = extractHostname(sourceDatabaseUrl);
  const destHost = extractHostname(destinationDatabaseUrl);
  const sourceDbName = extractDatabaseName(sourceDatabaseUrl);
  const destDbName = extractDatabaseName(destinationDatabaseUrl);

  // Rule 5: Refuse localhost / test DB as source
  const isLocalhostSource =
    (sourceHost && (sourceHost === 'localhost' || sourceHost === '127.0.0.1' || sourceHost === '::1')) ||
    sourceDatabaseUrl.includes('localhost') ||
    sourceDatabaseUrl.includes('127.0.0.1');

  if (isLocalhostSource) {
    throw new Error('EXECUTION GUARD REJECTED: Localhost test database cannot be used as the real-data production source.');
  }

  // Rule 5: Refuse destination if hostname or database name matches production
  if (sourceHost && destHost && sourceHost === destHost && sourceDbName && destDbName && sourceDbName === destDbName) {
    throw new Error('EXECUTION GUARD REJECTED: Destination hostname and database name match production.');
  }

  if (destDbName && sourceDbName && destDbName === sourceDbName) {
    throw new Error('EXECUTION GUARD REJECTED: Destination database name matches production database name.');
  }

  // Rule 5: Refuse test DB or localhost as destination
  const isForbiddenDestName =
    destDbName === 'social_care_auth_test' ||
    (destHost && (destHost === 'localhost' || destHost === '127.0.0.1' || destHost === '::1'));

  if (isForbiddenDestName) {
    throw new Error('EXECUTION GUARD REJECTED: Destination cannot be localhost or test database social_care_auth_test.');
  }

  // Rule 5: Destination must be explicitly configured as staging
  if (!isStagingDestinationConfirmed) {
    throw new Error('EXECUTION GUARD REJECTED: Destination must be explicitly confirmed as a staging environment.');
  }

  // Rule 2 & 6: Validate confirmedDemoUuidExclusions as valid UUIDs
  if (!Array.isArray(confirmedDemoUuidExclusions) || confirmedDemoUuidExclusions.length === 0) {
    throw new Error('EXECUTION GUARD REJECTED: Confirmed production demo UUID list is empty or missing.');
  }

  for (const id of confirmedDemoUuidExclusions) {
    if (!isValidUuid(id)) {
      throw new Error(`EXECUTION GUARD REJECTED: Confirmed demo ID "${id}" is not a valid UUID.`);
    }
  }
}

/**
 * Returns the safe production inventory SQL query.
 * Scoped strictly to: id, username, name, role, site, status (no email).
 */
export function getProductionInventoryQuery(): { sql: string; fields: readonly string[] } {
  const fields = STAGING_INVENTORY_FIELDS.join(', ');
  return {
    sql: `SELECT ${fields} FROM staff ORDER BY id;`,
    fields: STAGING_INVENTORY_FIELDS,
  };
}

/**
 * Returns the safe production staging-copy SQL query with bound parameterised UUID exclusions.
 * Scoped to: id, name, email, username, role, site, status.
 */
export function getProductionStagingCopyQuery(confirmedDemoIds: string[]): {
  sql: string;
  params: string[];
  fields: readonly string[];
  excludedCount: number;
} {
  if (!Array.isArray(confirmedDemoIds) || confirmedDemoIds.length === 0) {
    throw new Error('EXECUTION GUARD REJECTED: Staging data-copy query requires a non-empty array of confirmed demo UUIDs.');
  }

  for (const id of confirmedDemoIds) {
    if (!isValidUuid(id)) {
      throw new Error(`EXECUTION GUARD REJECTED: Invalid UUID "${id}" in confirmedDemoIds parameter.`);
    }
  }

  const fields = STAGING_COPY_APPROVED_FIELDS.join(', ');
  // Parameterized query placeholders $1, $2, ...
  const placeholders = confirmedDemoIds.map((_, index) => `$${index + 1}`).join(', ');

  return {
    sql: `SELECT ${fields} FROM staff WHERE id NOT IN (${placeholders});`,
    params: confirmedDemoIds.map((id) => id.trim()),
    fields: STAGING_COPY_APPROVED_FIELDS,
    excludedCount: confirmedDemoIds.length,
  };
}

/**
 * Provisions a fresh staging admin user directly into the staging database.
 * No password hashes or sessions are copied from production.
 */
export async function provisionStagingAdmin(
  db: DbLike,
  options: {
    name: string;
    username: string;
    email: string;
    password: string;
    site?: string;
  }
): Promise<{ id: string; name: string; username: string; email: string; role: string }> {
  const normalizedUsername = options.username.trim().toLowerCase();
  const normalizedEmail = options.email.trim().toLowerCase();

  if (!normalizedUsername || !normalizedEmail || !options.password) {
    throw new Error('Username, email, and password are required to provision a staging admin.');
  }

  const existing = await db
    .select()
    .from(staff)
    .where(
      sql`TRIM(LOWER(${staff.username})) = ${normalizedUsername} OR TRIM(LOWER(${staff.email})) = ${normalizedEmail}`
    );

  if (existing.length > 0) {
    throw new Error('Admin with username or email already exists.');
  }

  const hashedPassword = await bcrypt.hash(options.password, 10);

  const inserted = await db
    .insert(staff)
    .values({
      name: options.name.trim(),
      username: options.username.trim(),
      email: options.email.trim(),
      password: hashedPassword,
      role: 'Admin',
      site: options.site || 'All Sites',
      status: 'Active',
    })
    .returning();

  const newAdmin = inserted[0];
  return {
    id: newAdmin.id,
    name: newAdmin.name,
    username: newAdmin.username,
    email: newAdmin.email,
    role: newAdmin.role,
  };
}
