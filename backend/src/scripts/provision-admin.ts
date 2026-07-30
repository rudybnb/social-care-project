import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { eq, sql } from 'drizzle-orm';
import { type NodePgTransaction } from 'drizzle-orm/node-postgres';
import { pathToFileURL } from 'url';
import { db } from '../db.js';
import { staff } from '../schema.js';
import { findDuplicateNormalizedUsernames } from '../services/adminAuthService.js';
import { revokeAllSessionsForStaff } from '../services/sessionService.js';

dotenv.config();

type DbLike = any;
type ProvisionMode = 'create' | 'reset';

interface ProvisionConfig {
  dryRun: boolean;
  mode: ProvisionMode;
  staffId?: string;
  username?: string;
  password: string;
  name?: string;
  email?: string;
  site?: string;
  status?: string;
  standardRate?: string;
  rates?: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function getConfig(): ProvisionConfig {
  const mode = process.env.ADMIN_PROVISION_MODE?.trim();
  if (mode !== 'create' && mode !== 'reset') {
    throw new Error('ADMIN_PROVISION_MODE must be set explicitly to create or reset. Dry-run is the default.');
  }

  const password = process.env.ADMIN_PROVISION_PASSWORD;
  if (!password || password.length < 12) {
    throw new Error('ADMIN_PROVISION_PASSWORD of at least 12 characters is required.');
  }

  const dryRun = process.env.ADMIN_PROVISION_DRY_RUN !== 'false';
  if (mode === 'reset') {
    return {
      dryRun,
      mode,
      staffId: requiredEnv('ADMIN_PROVISION_STAFF_ID'),
      password,
    };
  }

  return {
    dryRun,
    mode,
    username: requiredEnv('ADMIN_PROVISION_USERNAME'),
    password,
    name: requiredEnv('ADMIN_PROVISION_NAME'),
    email: requiredEnv('ADMIN_PROVISION_EMAIL'),
    site: requiredEnv('ADMIN_PROVISION_SITE'),
    status: requiredEnv('ADMIN_PROVISION_STATUS'),
    standardRate: requiredEnv('ADMIN_PROVISION_STANDARD_RATE'),
    rates: requiredEnv('ADMIN_PROVISION_RATES'),
  };
}

async function assertNoDuplicateNormalizedUsernames(database: DbLike): Promise<void> {
  const duplicates = await findDuplicateNormalizedUsernames(database);
  if (duplicates.length > 0) {
    throw new Error('Duplicate normalized usernames exist. Run the duplicate username audit query and resolve duplicates before provisioning.');
  }
}

async function findByNormalizedUsername(database: DbLike, username: string) {
  const matches = await database
    .select({ id: staff.id, username: staff.username, role: staff.role })
    .from(staff)
    .where(sql`TRIM(LOWER(${staff.username})) = LOWER(${username})`)
    .limit(2);

  return matches;
}

async function findByNormalizedEmail(database: DbLike, email: string) {
  const matches = await database
    .select({ id: staff.id, email: staff.email, role: staff.role })
    .from(staff)
    .where(sql`TRIM(LOWER(${staff.email})) = LOWER(${email})`)
    .limit(2);

  return matches;
}

export async function provisionAdmin(database: DbLike, config = getConfig()): Promise<string> {
  await assertNoDuplicateNormalizedUsernames(database);

  if (config.mode === 'reset') {
    const matches = await database
      .select({ id: staff.id, role: staff.role })
      .from(staff)
      .where(eq(staff.id, config.staffId))
      .limit(1);

    const existing = matches[0];
    if (!existing) {
      throw new Error('ADMIN_PROVISION_STAFF_ID does not match an existing staff account.');
    }
    if (existing.role !== 'Admin') {
      throw new Error('Refusing reset: existing account role is not exactly Admin. Worker and Site Manager accounts are never promoted or activated by this script.');
    }
    if (config.dryRun) {
      return `Dry run: would reset password and revoke all sessions for Admin staff ID ${existing.id}.`;
    }

    const passwordHash = await bcrypt.hash(config.password, 10);
    await database.transaction(async (tx: NodePgTransaction<Record<string, never>, Record<string, never>>) => {
      await tx
        .update(staff)
        .set({ password: passwordHash, updatedAt: new Date() })
        .where(eq(staff.id, existing.id));
      await revokeAllSessionsForStaff(tx, existing.id);
    });

    return `Admin password reset completed for staff ID ${existing.id}; existing sessions revoked.`;
  }

  const normalizedUsername = config.username.trim();
  const normalizedEmail = config.email.trim().toLowerCase();
  if (!normalizedUsername) {
    throw new Error('Username cannot be blank after trimming.');
  }
  if (!normalizedEmail) {
    throw new Error('Email cannot be blank after trimming.');
  }

  const usernameMatches = await findByNormalizedUsername(database, normalizedUsername);
  if (usernameMatches.length > 0) {
    throw new Error('Create refused: username already exists.');
  }

  const emailMatches = await findByNormalizedEmail(database, normalizedEmail);
  if (emailMatches.length > 0) {
    throw new Error('Create refused: email already exists.');
  }

  if (config.status !== 'Active' && config.status !== 'Inactive') {
    throw new Error('ADMIN_PROVISION_STATUS must be Active or Inactive.');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(config.standardRate)) {
    throw new Error('ADMIN_PROVISION_STANDARD_RATE must be an explicit decimal value required by the current staff schema.');
  }

  if (config.dryRun) {
    return `Dry run: would create Admin staff account for username '${normalizedUsername}'.`;
  }

  const passwordHash = await bcrypt.hash(config.password, 10);
  await database.insert(staff).values({
    name: config.name,
    email: normalizedEmail,
    username: normalizedUsername,
    password: passwordHash,
    role: 'Admin',
    site: config.site,
    status: config.status,
    standardRate: config.standardRate,
    rates: config.rates,
  });

  return `Admin account created for username '${config.username}'.`;
}

async function main() {
  if (!db) {
    throw new Error('Database not configured');
  }

  const message = await provisionAdmin(db);
  console.log(message);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
