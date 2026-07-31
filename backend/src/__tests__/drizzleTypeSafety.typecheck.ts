import { eq, SQL } from 'drizzle-orm';
import { staff } from '../schema.js';

/**
 * Compile-only type safety verification file included by tsconfig.json.
 * Proves Drizzle types remain strictly typed and are not fallback 'any'.
 */

// Helper utility to detect 'any' types at compile time
type IsAny<T> = 0 extends (1 & T) ? true : false;
type IsAssignable<T, U> = T extends U ? true : false;

// 1. Confirm 'eq' is not typed as 'any'
type EqIsAny = IsAny<typeof eq>;
export const _eqIsNotAny: EqIsAny = false;

// 2. Confirm 'SQL' is not typed as 'any'
type SqlIsAny = IsAny<SQL>;
export const _sqlIsNotAny: SqlIsAny = false;

// 3. Confirm 'staff.id' remains a typed Drizzle column (not 'any')
type StaffIdIsAny = IsAny<typeof staff.id>;
export const _staffIdIsNotAny: StaffIdIsAny = false;

// 4. Confirm assigning a Drizzle SQL expression to a string is rejected
type SqlToStringIsAllowed = IsAssignable<SQL, string>;
export const _sqlToStringIsRejected: SqlToStringIsAllowed = false;

// 5. Confirm assigning a plain string to a Drizzle column type is rejected
type StringToColumnIsAllowed = IsAssignable<string, typeof staff.id>;
export const _stringToColumnIsRejected: StringToColumnIsAllowed = false;

export function verifyDrizzleTypeSafety(): void {
  const sqlExpr = eq(staff.id, '00000000-0000-0000-0000-000000000000');
  const _isSql: SQL<unknown> = sqlExpr;
  void _isSql;
}
