import bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';
import { staff } from '../schema.js';
import { isAdminRole, sanitizeStaffForAuth, SafeAuthUser } from './authSanitizer.js';

const DUMMY_BCRYPT_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8yJXNC0e92ATfyNAvjUxp5GAtp7O5u';
type DbLike = any;

export async function authenticateAdminCredentials(
  db: DbLike,
  rawUsername: unknown,
  rawPassword: unknown
): Promise<SafeAuthUser | null> {
  const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';
  const password = typeof rawPassword === 'string' ? rawPassword : '';

  if (!username || !password) {
    await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
    return null;
  }

  const matchingStaff = await db
    .select({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      username: staff.username,
      password: staff.password,
      role: staff.role,
      site: staff.site,
      status: staff.status,
    })
    .from(staff)
    .where(sql`TRIM(LOWER(${staff.username})) = LOWER(${username})`)
    .limit(2);

  const user = matchingStaff.length === 1 ? matchingStaff[0] : null;
  const passwordHash = user?.password || DUMMY_BCRYPT_HASH;
  const passwordMatch = await bcrypt.compare(password, passwordHash);

  if (!user || !passwordMatch || user.status !== 'Active' || !isAdminRole(user.role)) {
    return null;
  }

  return sanitizeStaffForAuth(user);
}

export const DUPLICATE_NORMALIZED_USERNAME_AUDIT_SQL = `
SELECT TRIM(LOWER(username)) AS normalized_username, COUNT(*) AS account_count
FROM staff
WHERE username IS NOT NULL AND TRIM(username) <> ''
GROUP BY TRIM(LOWER(username))
HAVING COUNT(*) > 1
ORDER BY normalized_username;
`;

export async function findDuplicateNormalizedUsernames(db: DbLike): Promise<Array<{ normalizedUsername: string; accountCount: number }>> {
  const result = await db.execute(sql.raw(DUPLICATE_NORMALIZED_USERNAME_AUDIT_SQL));
  const rows = Array.isArray(result) ? result : result.rows ?? [];

  return rows.map((row: any) => ({
    normalizedUsername: row.normalized_username,
    accountCount: Number(row.account_count),
  }));
}
