import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import { createAuthRouter } from '../routes/auth.js';
import { createAuthenticateRequest, requireAdmin } from '../middleware/auth.js';
import { authenticateAdminCredentials } from '../services/adminAuthService.js';
import { sanitizeStaffForAuth } from '../services/authSanitizer.js';
import { authSessions } from '../schema.js';
import { provisionAdmin } from '../scripts/provision-admin.js';
import {
  createSession,
  generateSessionToken,
  getAdminSessionDurationHours,
  hashSessionToken,
  isAuthEnforcementEnabled,
  isValidTokenFormat,
  EXPECTED_TOKEN_LENGTH,
  revokeAllSessionsForStaff,
  revokeSessionById,
  validateSessionToken,
} from '../services/sessionService.js';

class FakeDb {
  public sessions: any[] = [];
  public selectQueue: any[][] = [];
  public executeRows: any[] = [];
  public selectCalls: any[] = [];
  public inserts: any[] = [];
  public updates: any[] = [];
  public transactionCalls = 0;
  public throwOnNextSessionsUpdate = false;

  constructor(options: { selectQueue?: any[][]; executeRows?: any[] } = {}) {
    this.selectQueue = options.selectQueue ?? [];
    this.executeRows = options.executeRows ?? [];
  }

  select(selection?: any) {
    const db = this;
    const call: any = { selection };
    db.selectCalls.push(call);
    return {
      from(table: any) {
        call.table = table;
        return {
          where(condition: any) {
            call.condition = condition;
            return {
              limit(limit: number) {
                call.limit = limit;
                return Promise.resolve(db.selectQueue.shift() ?? []);
              },
            };
          },
        };
      },
    };
  }

  insert(table: any) {
    const db = this;
    return {
      values(value: any) {
        db.inserts.push({ table, value });
        if (table === authSessions) {
          db.sessions.push({ id: `session-${db.sessions.length + 1}`, ...value });
        }
        return Promise.resolve();
      },
    };
  }

  update(table: any) {
    const db = this;
    return {
      set(value: any) {
        return {
          where(condition: any) {
            db.updates.push({ table, value, condition });
            if (table === authSessions) {
              if (db.throwOnNextSessionsUpdate) {
                db.throwOnNextSessionsUpdate = false;
                throw new Error('Simulated DB failure');
              }
              const targetSessions = db._filterSessions(condition);
              for (const session of targetSessions) {
                Object.assign(session, value);
              }
            }
            return Promise.resolve();
          },
        };
      },
    };
  }

  async transaction<T>(fn: (tx: this) => Promise<T>): Promise<T> {
    this.transactionCalls++;
    const sessionsSnapshot = this.sessions.map(s => ({ ...s }));
    const updatesSnapshot = [...this.updates];
    const insertsSnapshot = [...this.inserts];
    try {
      return await fn(this);
    } catch (error) {
      this.sessions = sessionsSnapshot;
      this.updates = updatesSnapshot;
      this.inserts = insertsSnapshot;
      throw error;
    }
  }

  execute() {
    return Promise.resolve({ rows: this.executeRows });
  }

  _filterSessions(condition: any): any[] {
    const staffId = this._extractEqColumn('staff_id', condition);
    const id = this._extractEqColumn('id', condition);
    const revokedIsNull = this._extractIsNullCondition('revoked_at', condition);
    return this.sessions.filter((session) => {
      if (staffId !== undefined && session.staffId !== staffId) return false;
      if (id !== undefined && session.id !== id) return false;
      if (revokedIsNull && session.revokedAt !== null) return false;
      return true;
    });
  }

  _extractEqColumn(columnName: string, condition: any): any | undefined {
    if (!condition || typeof condition !== 'object') return undefined;
    if (condition.queryChunks) {
      for (let i = 0; i < condition.queryChunks.length; i++) {
        const chunk = condition.queryChunks[i];
        if (chunk && typeof chunk.name === 'string' && chunk.name === columnName && chunk.table) {
          const valChunk = condition.queryChunks[i + 2];
          if (valChunk != null && typeof valChunk === 'string') {
            return valChunk;
          }
          if (valChunk != null && typeof valChunk === 'object' && 'value' in valChunk) {
            const arrVal = Array.isArray(valChunk.value) ? valChunk.value[0] : valChunk.value;
            if (arrVal != null && typeof arrVal === 'string' && !arrVal.toLowerCase().includes('is null')) {
              return arrVal;
            }
          }
        }
        if (chunk && chunk.queryChunks) {
          const nested = this._extractEqColumn(columnName, chunk);
          if (nested !== undefined) return nested;
        }
      }
    }
    return undefined;
  }

  _extractIsNullCondition(columnName: string, condition: any): boolean {
    if (!condition || typeof condition !== 'object') return false;
    if (condition.queryChunks) {
      for (let i = 0; i < condition.queryChunks.length; i++) {
        const chunk = condition.queryChunks[i];
        if (chunk && typeof chunk.name === 'string' && chunk.name === columnName && chunk.table) {
          for (let j = i + 1; j < Math.min(i + 3, condition.queryChunks.length); j++) {
            const next = condition.queryChunks[j];
            if (next && typeof next === 'object' && 'value' in next) {
              const text = Array.isArray(next.value) ? next.value.join('') : String(next.value);
              if (text.toLowerCase().includes('is null')) return true;
            }
          }
        }
        if (chunk && chunk.queryChunks) {
          if (this._extractIsNullCondition(columnName, chunk)) return true;
        }
      }
    }
    return false;
  }
}

function makeStaff(overrides: Partial<any> = {}) {
  return {
    id: 'staff-admin-1',
    name: 'Admin User',
    email: 'admin@example.com',
    username: 'admin',
    password: '$2b$10$placeholder',
    role: 'Admin',
    site: 'All Sites',
    status: 'Active',
    ...overrides,
  };
}

interface SessionTestRecord {
  id: string;
  staffId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

function makeSession(token = generateSessionToken(), overrides: Partial<SessionTestRecord> = {}): SessionTestRecord {
  return {
    id: 'session-1',
    staffId: 'staff-admin-1',
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    ...overrides,
  };
}

function makeResponse() {
  return {
    statusCode: 200,
    payload: undefined as any,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.payload = payload;
      return this;
    },
  };
}

async function invokeRoute(router: any, method: 'get' | 'post', routePath: string, req: any) {
  const layer = router.stack.find((item: any) => item.route?.path === routePath && item.route?.methods?.[method]);
  assert.ok(layer, `route ${method.toUpperCase()} ${routePath} not found`);

  const handlers = layer.route.stack.map((item: any) => item.handle);
  const res = makeResponse();
  let index = 0;
  const next = async () => {
    const handler = handlers[index++];
    if (handler) await handler(req, res, next);
  };

  await next();
  return res;
}

test('valid admin login succeeds', async () => {
  const password = 'correct-password';
  const db = new FakeDb({ selectQueue: [[makeStaff({ password: await bcrypt.hash(password, 10) })]] });
  const user = await authenticateAdminCredentials(db, ' admin ', password);

  assert.equal(db.selectCalls[0].limit, 2);
  assert.equal(user?.staffId, 'staff-admin-1');
  assert.equal(user?.role, 'Admin');
  assert.equal(Object.prototype.hasOwnProperty.call(user || {}, 'password'), false);
});

test('duplicate normalized usernames fail authentication closed', async () => {
  const password = 'correct-password';
  const hash = await bcrypt.hash(password, 10);
  const db = new FakeDb({ selectQueue: [[makeStaff({ id: 'one', password: hash }), makeStaff({ id: 'two', username: ' ADMIN ', password: hash })]] });
  const user = await authenticateAdminCredentials(db, 'admin', password);

  assert.equal(db.selectCalls[0].limit, 2);
  assert.equal(user, null);
});

test('wrong password and unknown username return no authenticated user', async () => {
  const db = new FakeDb({ selectQueue: [[makeStaff({ password: await bcrypt.hash('correct-password', 10) })], []] });

  assert.equal(await authenticateAdminCredentials(db, 'admin', 'wrong-password'), null);
  assert.equal(await authenticateAdminCredentials(db, 'missing-user', 'any-password'), null);
});

test('inactive and Site Manager accounts cannot log in as admin', async () => {
  const password = 'correct-password';
  const hash = await bcrypt.hash(password, 10);
  const db = new FakeDb({ selectQueue: [[makeStaff({ password: hash, status: 'Inactive' })], [makeStaff({ password: hash, role: 'Site Manager' })]] });

  assert.equal(await authenticateAdminCredentials(db, 'admin', password), null);
  assert.equal(await authenticateAdminCredentials(db, 'manager', password), null);
});

test('session token is stored hashed and createSession returns no token hash', async () => {
  const db = new FakeDb();
  const session = await createSession(db, 'staff-admin-1', { durationHours: 1 });

  assert.notEqual(db.sessions[0].tokenHash, session.token);
  assert.equal(db.sessions[0].tokenHash, hashSessionToken(session.token));
  assert.equal(Object.prototype.hasOwnProperty.call(session, 'tokenHash'), false);
  assert.equal(session.token.length, EXPECTED_TOKEN_LENGTH);
});

test('raw token works through authentication middleware without selecting password', async () => {
  const token = generateSessionToken();
  const db = new FakeDb({ selectQueue: [[makeSession(token)], [makeStaff()]] });
  const req: any = { headers: { authorization: `Bearer ${token}` }, body: { role: 'Worker', staffId: 'forged' } };
  const res = makeResponse();
  let nextCalled = false;

  await createAuthenticateRequest(db)(req, res as any, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.authUser.staffId, 'staff-admin-1');
  assert.equal(req.authUser.role, 'Admin');
  assert.equal(Object.prototype.hasOwnProperty.call(db.selectCalls[1].selection, 'password'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(req.authUser, 'password'), false);
});

test('invalid, expired and revoked sessions fail before trusting staff identity', async () => {
  const expiredToken = generateSessionToken();
  const revokedToken = generateSessionToken();
  const invalidToken = generateSessionToken();
  const expiredDb = new FakeDb({ selectQueue: [[makeSession(expiredToken, { expiresAt: new Date(Date.now() - 1_000) })]] });
  const revokedDb = new FakeDb({ selectQueue: [[makeSession(revokedToken, { revokedAt: new Date() })]] });
  const invalidDb = new FakeDb({ selectQueue: [[]] });

  assert.equal(await validateSessionToken(invalidDb, invalidToken), null);
  assert.equal(await validateSessionToken(expiredDb, expiredToken), null);
  assert.equal(await validateSessionToken(revokedDb, revokedToken), null);
  assert.equal(invalidDb.selectCalls.length, 1);
  assert.equal(expiredDb.selectCalls.length, 1);
  assert.equal(revokedDb.selectCalls.length, 1);
});

test('current account status and database role are checked on every request', async () => {
  const workerToken = generateSessionToken();
  const inactiveToken = generateSessionToken();
  const workerDb = new FakeDb({ selectQueue: [[makeSession(workerToken)], [makeStaff({ role: 'Worker' })]] });
  const inactiveDb = new FakeDb({ selectQueue: [[makeSession(inactiveToken)], [makeStaff({ status: 'Inactive' })]] });

  assert.equal(await validateSessionToken(workerDb, workerToken), null);
  assert.equal(await validateSessionToken(inactiveDb, inactiveToken), null);
  assert.equal(workerDb.selectCalls.length, 2);
  assert.equal(inactiveDb.selectCalls.length, 2);
});

test('Site Manager fails requireAdmin', () => {
  const req: any = { authUser: sanitizeStaffForAuth(makeStaff({ role: 'Site Manager' })) };
  const res = makeResponse();
  let nextCalled = false;

  requireAdmin(req, res as any, () => { nextCalled = true; });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test('Admin passes requireAdmin', () => {
  const req: any = { authUser: sanitizeStaffForAuth(makeStaff({ role: 'Admin' })) };
  const res = makeResponse();
  let nextCalled = false;

  requireAdmin(req, res as any, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});

test('request body, query parameters and custom headers cannot alter identity', async () => {
  const token = generateSessionToken();
  const db = new FakeDb({ selectQueue: [[makeSession(token)], [makeStaff({ id: 'real-admin-id' })]] });
  const req: any = {
    headers: { authorization: `Bearer ${token}`, 'x-staff-id': 'forged-header-id', 'x-role': 'Worker' },
    body: { role: 'Worker', staffId: 'forged-body-id' },
    query: { role: 'Worker', staffId: 'forged-query-id' },
  };
  const res = makeResponse();

  await createAuthenticateRequest(db)(req, res as any, () => undefined);

  assert.equal(req.authUser.staffId, 'real-admin-id');
  assert.equal(req.authUser.role, 'Admin');
});

test('provisioning refuses to promote a Worker', async () => {
  const db = new FakeDb({ selectQueue: [[makeStaff({ id: 'worker-1', role: 'Worker' })]] });

  await assert.rejects(
    () => provisionAdmin(db, { dryRun: false, mode: 'reset', staffId: 'worker-1', password: 'long-enough-password' }),
    /role is not exactly Admin/
  );
  assert.equal(db.updates.length, 0);
});

test('provisioning requires explicit mode and is dry-run by default', async () => {
  const previous = { ...process.env };
  const db = new FakeDb({ selectQueue: [[], []] });
  try {
    delete process.env.ADMIN_PROVISION_MODE;
    await assert.rejects(() => provisionAdmin(db), /ADMIN_PROVISION_MODE/);

    process.env.ADMIN_PROVISION_MODE = 'create';
    process.env.ADMIN_PROVISION_USERNAME = 'admin';
    process.env.ADMIN_PROVISION_PASSWORD = 'long-enough-password';
    process.env.ADMIN_PROVISION_NAME = 'Admin User';
    process.env.ADMIN_PROVISION_EMAIL = 'admin@example.com';
    process.env.ADMIN_PROVISION_SITE = 'All Sites';
    process.env.ADMIN_PROVISION_STATUS = 'Active';
    process.env.ADMIN_PROVISION_STANDARD_RATE = '0.00';
    process.env.ADMIN_PROVISION_RATES = 'explicit non-operational admin value';
    delete process.env.ADMIN_PROVISION_DRY_RUN;

    const message = await provisionAdmin(db);
    assert.match(message, /Dry run/);
    assert.equal(db.inserts.length, 0);
  } finally {
    process.env = previous;
  }
});

test('admin create fails when username or email already exists', async () => {
  await assert.rejects(
    () => provisionAdmin(new FakeDb({ selectQueue: [[makeStaff({ username: 'ADMIN' })]] }), {
      dryRun: false,
      mode: 'create',
      username: ' admin ',
      password: 'long-enough-password',
      name: 'Admin User',
      email: 'admin@example.com',
      site: 'All Sites',
      status: 'Active',
      standardRate: '0.00',
      rates: 'explicit non-operational admin value',
    }),
    /username already exists/
  );

  await assert.rejects(
    () => provisionAdmin(new FakeDb({ selectQueue: [[], [makeStaff({ email: 'ADMIN@example.com' })]] }), {
      dryRun: false,
      mode: 'create',
      username: 'admin',
      password: 'long-enough-password',
      name: 'Admin User',
      email: ' admin@example.com ',
      site: 'All Sites',
      status: 'Active',
      standardRate: '0.00',
      rates: 'explicit non-operational admin value',
    }),
    /email already exists/
  );
});

test('password reset revokes only sessions for the selected admin', async () => {
  const db = new FakeDb({ selectQueue: [[makeStaff({ id: 'staff-admin-1', role: 'Admin' })]] });
  db.sessions.push({ id: 's1', staffId: 'staff-admin-1', revokedAt: null });
  db.sessions.push({ id: 's2', staffId: 'staff-admin-1', revokedAt: null });
  db.sessions.push({ id: 's3', staffId: 'other-staff-2', revokedAt: null });
  db.sessions.push({ id: 's4', staffId: 'other-staff-2', revokedAt: null });

  await provisionAdmin(db, { dryRun: false, mode: 'reset', staffId: 'staff-admin-1', password: 'long-enough-password' });

  assert.ok(db.sessions.find(s => s.id === 's1').revokedAt instanceof Date, 's1 should be revoked');
  assert.ok(db.sessions.find(s => s.id === 's2').revokedAt instanceof Date, 's2 should be revoked');
  assert.equal(db.sessions.find(s => s.id === 's3').revokedAt, null, 's3 should NOT be revoked');
  assert.equal(db.sessions.find(s => s.id === 's4').revokedAt, null, 's4 should NOT be revoked');
});

test('password reset rolls back when session revocation fails', async () => {
  const db = new FakeDb({ selectQueue: [[makeStaff({ id: 'staff-admin-1', role: 'Admin' })]] });
  db.sessions.push({ id: 's1', staffId: 'staff-admin-1', revokedAt: null });
  db.throwOnNextSessionsUpdate = true;

  await assert.rejects(
    () => provisionAdmin(db, { dryRun: false, mode: 'reset', staffId: 'staff-admin-1', password: 'long-enough-password' }),
  );

  assert.equal(db.sessions[0].revokedAt, null, 'session should not be revoked after rollback');
  assert.equal(db.updates.length, 0, 'no updates should remain after rollback');
});

test('revokeAllSessionsForStaff respects staff ID', async () => {
  const db = new FakeDb();
  db.sessions.push({ id: 's1', staffId: 'staff-a', revokedAt: null });
  db.sessions.push({ id: 's2', staffId: 'staff-a', revokedAt: null });
  db.sessions.push({ id: 's3', staffId: 'staff-b', revokedAt: null });

  await revokeAllSessionsForStaff(db, 'staff-a');

  assert.ok(db.sessions.find(s => s.id === 's1').revokedAt instanceof Date);
  assert.ok(db.sessions.find(s => s.id === 's2').revokedAt instanceof Date);
  assert.equal(db.sessions.find(s => s.id === 's3').revokedAt, null);
});

test('revokeSessionById respects session ID', async () => {
  const db = new FakeDb();
  db.sessions.push({ id: 'session-A', staffId: 'staff-admin-1', revokedAt: null });
  db.sessions.push({ id: 'session-B', staffId: 'staff-admin-1', revokedAt: null });

  await revokeSessionById(db, 'session-A');

  assert.ok(db.sessions.find(s => s.id === 'session-A').revokedAt instanceof Date);
  assert.equal(db.sessions.find(s => s.id === 'session-B').revokedAt, null);
});

test('logout revokes only the current session', async () => {
  const token = generateSessionToken();
  const db = new FakeDb({ selectQueue: [[makeSession(token)], [makeStaff()]] });
  db.sessions.push({ id: 'one', staffId: 'staff-admin-1', revokedAt: null });
  db.sessions.push({ id: 'two', staffId: 'staff-admin-1', revokedAt: null });

  await revokeSessionById(db, 'one');

  assert.ok(db.sessions.find(s => s.id === 'one').revokedAt instanceof Date);
  assert.equal(db.sessions.find(s => s.id === 'two').revokedAt, null);
});

test('provisionAdmin normalises username and email in create mode', async () => {
  const db = new FakeDb({ selectQueue: [[], []] });

  const message = await provisionAdmin(db, {
    dryRun: false,
    mode: 'create',
    username: '  NewAdmin  ',
    password: 'long-enough-password',
    name: 'New Admin',
    email: '  NEW.ADMIN@EXAMPLE.COM  ',
    site: 'All Sites',
    status: 'Active',
    standardRate: '0.00',
    rates: 'explicit non-operational admin value',
  });

  assert.match(message, /Admin account created/);
  assert.equal(db.inserts.length, 1);
  assert.equal(db.inserts[0].value.username, 'NewAdmin');
  assert.equal(db.inserts[0].value.email, 'new.admin@example.com');
});

test('provisionAdmin rejects blank username after trimming', async () => {
  const db = new FakeDb({ selectQueue: [[], []] });

  await assert.rejects(
    () => provisionAdmin(db, {
      dryRun: false,
      mode: 'create',
      username: '   ',
      password: 'long-enough-password',
      name: 'Admin',
      email: 'admin@example.com',
      site: 'All Sites',
      status: 'Active',
      standardRate: '0.00',
      rates: 'explicit non-operational admin value',
    }),
    /Username cannot be blank/,
  );
});

test('provisionAdmin rejects blank email after trimming', async () => {
  const db = new FakeDb({ selectQueue: [[], []] });

  await assert.rejects(
    () => provisionAdmin(db, {
      dryRun: false,
      mode: 'create',
      username: 'admin',
      password: 'long-enough-password',
      name: 'Admin',
      email: '   ',
      site: 'All Sites',
      status: 'Active',
      standardRate: '0.00',
      rates: 'explicit non-operational admin value',
    }),
    /Email cannot be blank/,
  );
});

test('isValidTokenFormat rejects malformed tokens before hashing', () => {
  assert.equal(isValidTokenFormat(''), false);
  assert.equal(isValidTokenFormat('not-base64url-!!'), false);
  assert.equal(isValidTokenFormat('short'), false);
  assert.equal(isValidTokenFormat('a'.repeat(EXPECTED_TOKEN_LENGTH + 1)), false);
  assert.equal(isValidTokenFormat('a'.repeat(EXPECTED_TOKEN_LENGTH - 1)), false);
  assert.equal(isValidTokenFormat('a+b/c'), false);
  assert.equal(isValidTokenFormat('a b'), false);

  const valid = generateSessionToken();
  assert.equal(valid.length, EXPECTED_TOKEN_LENGTH);
  assert.equal(isValidTokenFormat(valid), true);
});

test('validateSessionToken rejects invalid token format without hashing or querying', async () => {
  const db = new FakeDb({ selectQueue: [[]] });

  const result = await validateSessionToken(db, 'short');
  assert.equal(result, null);
  assert.equal(db.selectCalls.length, 0, 'should not query DB for malformed token');

  const oversized = 'a'.repeat(EXPECTED_TOKEN_LENGTH + 1);
  const result2 = await validateSessionToken(db, oversized);
  assert.equal(result2, null);
  assert.equal(db.selectCalls.length, 0, 'should not query DB for oversized token');
});

test('session duration rejects unsafe configuration values', () => {
  const previous = process.env.ADMIN_SESSION_HOURS;
  try {
    process.env.ADMIN_SESSION_HOURS = '0';
    assert.throws(() => getAdminSessionDurationHours(), /1 to 24/);
    process.env.ADMIN_SESSION_HOURS = '25';
    assert.throws(() => getAdminSessionDurationHours(), /1 to 24/);
    process.env.ADMIN_SESSION_HOURS = '8.5';
    assert.throws(() => getAdminSessionDurationHours(), /1 to 24/);
    process.env.ADMIN_SESSION_HOURS = '24';
    assert.equal(getAdminSessionDurationHours(), 24);
  } finally {
    if (previous === undefined) delete process.env.ADMIN_SESSION_HOURS;
    else process.env.ADMIN_SESSION_HOURS = previous;
  }
});

test('AUTH_ENFORCEMENT defaults to false', () => {
  const previous = process.env.AUTH_ENFORCEMENT;
  delete process.env.AUTH_ENFORCEMENT;

  assert.equal(isAuthEnforcementEnabled(), false);

  if (previous === undefined) {
    delete process.env.AUTH_ENFORCEMENT;
  } else {
    process.env.AUTH_ENFORCEMENT = previous;
  }
});

test('route-level admin login, me and logout work with server-side sessions', async () => {
  const password = 'correct-password';
  const db = new FakeDb({ selectQueue: [[makeStaff({ password: await bcrypt.hash(password, 10) })]] });
  const router = createAuthRouter(db);
  const loginRes = await invokeRoute(router, 'post', '/admin/login', {
    body: { username: 'admin', password },
    ip: '127.0.0.1',
    headers: {},
    get: () => 'node-test',
  });

  assert.equal(loginRes.statusCode, 200);
  assert.equal(loginRes.payload.success, true);
  assert.equal(typeof loginRes.payload.token, 'string');
  assert.equal(Object.prototype.hasOwnProperty.call(loginRes.payload, 'tokenHash'), false);

  const token = loginRes.payload.token;
  db.selectQueue.push([makeSession(token, { id: db.sessions[0].id })], [makeStaff()]);
  const meRes = await invokeRoute(router, 'get', '/me', { headers: { authorization: `Bearer ${token}` } });

  assert.equal(meRes.statusCode, 200);
  assert.equal(meRes.payload.user.role, 'Admin');

  db.selectQueue.push([makeSession(token, { id: db.sessions[0].id })], [makeStaff()]);
  const logoutRes = await invokeRoute(router, 'post', '/logout', { headers: { authorization: `Bearer ${token}` } });

  assert.equal(logoutRes.statusCode, 200);
  assert.equal(logoutRes.payload.success, true);
});

test('route-level admin login returns same generic 401 for unknown username and wrong password', async () => {
  const db = new FakeDb({ selectQueue: [[], [makeStaff({ password: await bcrypt.hash('correct-password', 10) })]] });
  const router = createAuthRouter(db);
  const missing = await invokeRoute(router, 'post', '/admin/login', { body: { username: 'missing', password: 'any-password' }, headers: {}, get: (): undefined => undefined });
  const wrong = await invokeRoute(router, 'post', '/admin/login', { body: { username: 'admin', password: 'wrong-password' }, headers: {}, get: (): undefined => undefined });

  assert.equal(missing.statusCode, 401);
  assert.equal(wrong.statusCode, 401);
  assert.deepEqual(missing.payload, wrong.payload);
});

function parsePgConnectionString(url: string): { host: string; database: string } | null {
  try {
    const u = new URL(url);
    const host = u.hostname;
    const database = u.pathname.replace(/^\//, '');
    return { host, database };
  } catch {
    return null;
  }
}

function isSafeTestDatabase(url: string): boolean {
  const parsed = parsePgConnectionString(url);
  if (!parsed) return false;
  if (parsed.host !== 'localhost' && parsed.host !== '127.0.0.1') return false;
  if (parsed.database !== 'social_care_auth_test') return false;
  return true;
}

const pgUrl = process.env.AUTH_PHASE_1A_TEST_DATABASE_URL || '';
const runPostgresMigrationTests = process.env.AUTH_PHASE_1A_RUN_DB_TESTS === 'true' && isSafeTestDatabase(pgUrl);

test('PostgreSQL test database guard rejects remote hosts and wrong database name', () => {
  assert.equal(parsePgConnectionString('not-a-url'), null);
  assert.equal(isSafeTestDatabase('postgres://user:pass@render.com/social_care_auth_test'), false);
  assert.equal(isSafeTestDatabase('postgres://user:pass@prod.example.com/social_care_auth_test'), false);
  assert.equal(isSafeTestDatabase('postgres://user:pass@localhost/production_db'), false);
  assert.equal(isSafeTestDatabase('postgres://user:pass@localhost/'), false);
  assert.equal(isSafeTestDatabase('postgres://user:pass@127.0.0.1/social_care_auth_test'), true);
  assert.equal(isSafeTestDatabase('postgres://user:pass@localhost/social_care_auth_test'), true);
});

test('0007 migration applies to an opt-in clean PostgreSQL test schema and enforces foreign-key cascade', { skip: runPostgresMigrationTests ? false : 'set AUTH_PHASE_1A_RUN_DB_TESTS=true and AUTH_PHASE_1A_TEST_DATABASE_URL=postgres://...@localhost/social_care_auth_test' }, async () => {
  const { Client } = await import('pg');
  const client = new Client({ connectionString: process.env.AUTH_PHASE_1A_TEST_DATABASE_URL });
  const schemaName = `auth_phase_1a_${Date.now()}`;
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const migrationPath = path.resolve(__dirname, '../../drizzle/0007_auth_sessions.sql');

  await client.connect();
  await client.query(`CREATE SCHEMA "${schemaName}"`);
  try {
    await client.query(`SET search_path TO "${schemaName}"`);
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await client.query(`CREATE TABLE staff (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      name text NOT NULL,
      role text NOT NULL,
      site text NOT NULL,
      status text DEFAULT 'Active' NOT NULL,
      rates text NOT NULL
    )`);

    const migrationSql = await fs.readFile(migrationPath, 'utf8');
    await client.query(migrationSql);

    const staffResult = await client.query("INSERT INTO staff (name, role, site, rates) VALUES ('Admin', 'Admin', 'All Sites', 'explicit') RETURNING id");
    const staffId = staffResult.rows[0].id;
    await client.query('INSERT INTO auth_sessions (staff_id, token_hash, expires_at) VALUES ($1, $2, now() + interval \'1 hour\')', [staffId, 'hash-one']);
    await assert.rejects(
      () => client.query('INSERT INTO auth_sessions (staff_id, token_hash, expires_at) VALUES (gen_random_uuid(), $1, now() + interval \'1 hour\')', ['hash-two']),
      /violates foreign key constraint/
    );
    await client.query('DELETE FROM staff WHERE id = $1', [staffId]);
    const countResult = await client.query('SELECT COUNT(*)::int AS count FROM auth_sessions');
    assert.equal(countResult.rows[0].count, 0);
  } finally {
    await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await client.end();
  }
});

test('0007 migration: schema, constraints, indexes and cascade on a disposable schema (post-0000-0006 baseline)', { skip: runPostgresMigrationTests ? false : 'set AUTH_PHASE_1A_RUN_DB_TESTS=true and AUTH_PHASE_1A_TEST_DATABASE_URL=postgres://...@localhost/social_care_auth_test' }, async () => {
  // BLOCKER: A true full-chain migration (0000-0007) from scratch is not possible because
  // 0003_glossy_guardian.sql contains ALTER TABLE ADD COLUMN statements for "email" and
  // "start_date" that duplicate columns already added by 0003_add_staff_login_columns.sql.
  // This test applies 0007 on a staff table built to match the post-0000-0006 schema.
  // Until the migration chain is fixed, the full-chain test remains unimplemented.
  const { Client } = await import('pg');
  const client = new Client({ connectionString: process.env.AUTH_PHASE_1A_TEST_DATABASE_URL });
  const schemaName = `auth_phase_1a_full_${Date.now()}`;
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const drizzleDir = path.resolve(__dirname, '../../drizzle');
  const migrationPath = path.resolve(drizzleDir, '0007_auth_sessions.sql');

  await client.connect();
  await client.query(`CREATE SCHEMA "${schemaName}"`);
  try {
    await client.query(`SET search_path TO "${schemaName}"`);
    await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    // Build the staff table matching the current Drizzle schema (post 0000-0006)
    await client.query(`
      CREATE TABLE staff (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        name text NOT NULL,
        email text,
        phone text,
        username text,
        password text,
        telegram_chat_id text,
        role text NOT NULL,
        site text NOT NULL,
        status text DEFAULT 'Active' NOT NULL,
        standard_rate numeric(10, 2) DEFAULT '12.50' NOT NULL,
        enhanced_rate text DEFAULT '\u2014',
        night_rate text DEFAULT '\u2014',
        rates text NOT NULL,
        pension text DEFAULT '\u2014',
        deductions text DEFAULT '\u00a30.00',
        tax text DEFAULT '\u2014',
        weekly_hours integer DEFAULT 0,
        days_per_week integer DEFAULT 5,
        start_date text,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      )
    `);

    // Apply the 0007 migration (auth_sessions)
    const migrationSql = await fs.readFile(migrationPath, 'utf8');
    await client.query(migrationSql);

    // 1. Verify auth_sessions table exists
    const tableResult = await client.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'auth_sessions')`,
      [schemaName]
    );
    assert.ok(tableResult.rows[0].exists, 'auth_sessions table must exist');

    // 2. Verify foreign key exists
    const fkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
          AND tc.table_schema = ccu.table_schema
        WHERE tc.table_schema = $1
          AND tc.table_name = 'auth_sessions'
          AND tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'staff'
      )
    `, [schemaName]);
    assert.ok(fkResult.rows[0].exists, 'auth_sessions must have FK to staff');

    // 3. Verify token_hash unique constraint
    const uniqueResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = $1
          AND table_name = 'auth_sessions'
          AND constraint_type = 'UNIQUE'
      )
    `, [schemaName]);
    assert.ok(uniqueResult.rows[0].exists, 'auth_sessions must have a UNIQUE constraint');

    // 4. Verify timezone-aware columns
    for (const col of ['created_at', 'expires_at', 'revoked_at']) {
      const tzResult = await client.query(`
        SELECT data_type FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = 'auth_sessions' AND column_name = $2
      `, [schemaName, col]);
      assert.equal(tzResult.rows[0]?.data_type, 'timestamp with time zone', `${col} must be timestamptz`);
    }

    // 5. Verify indexes exist
    const indexNames = ['idx_auth_sessions_staff_id', 'idx_auth_sessions_expires_at'];
    for (const idxName of indexNames) {
      const idxResult = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE schemaname = $1 AND tablename = 'auth_sessions' AND indexname = $2
        )
      `, [schemaName, idxName]);
      assert.ok(idxResult.rows[0].exists, `index ${idxName} must exist`);
    }

    // 6. Test FK cascade delete
    const staffInsert = await client.query(
      "INSERT INTO staff (name, role, site, rates) VALUES ('Cascade', 'Worker', 'Site', 'test') RETURNING id"
    );
    const staffId = staffInsert.rows[0].id;
    await client.query(
      "INSERT INTO auth_sessions (staff_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '1 hour')",
      [staffId, 'comprehensive-cascade-hash']
    );
    const preCount = await client.query('SELECT COUNT(*)::int AS count FROM auth_sessions');
    assert.equal(preCount.rows[0].count, 1, 'must have one session before cascade');
    await client.query('DELETE FROM staff WHERE id = $1', [staffId]);
    const postCount = await client.query('SELECT COUNT(*)::int AS count FROM auth_sessions');
    assert.equal(postCount.rows[0].count, 0, 'sessions must cascade-delete with staff');

    // 7. Verify unique constraint blocks duplicate token_hash
    const staff2 = await client.query(
      "INSERT INTO staff (name, role, site, rates) VALUES ('Unique', 'Worker', 'Site', 'test') RETURNING id"
    );
    await client.query(
      "INSERT INTO auth_sessions (staff_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '1 hour')",
      [staff2.rows[0].id, 'duplicate-hash']
    );
    await assert.rejects(
      () => client.query(
        "INSERT INTO auth_sessions (staff_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '1 hour')",
        [staff2.rows[0].id, 'duplicate-hash']
      ),
      /unique/i
    );

    // 8. Verify Drizzle schema consistency: snapshot includes auth_sessions
    const snapshotPath = path.resolve(drizzleDir, 'meta/0007_snapshot.json');
    const snapshot = JSON.parse(await fs.readFile(snapshotPath, 'utf8'));
    assert.ok(snapshot.tables, 'snapshot must contain tables');
    const sessionTableKey = Object.keys(snapshot.tables).find(k => k.endsWith('.auth_sessions'));
    assert.ok(sessionTableKey, 'snapshot must include auth_sessions');
    const sessionMeta = snapshot.tables[sessionTableKey];
    assert.equal(sessionMeta.name, 'auth_sessions');
    assert.equal(sessionMeta.columns.staff_id.name, 'staff_id');
    assert.equal(sessionMeta.columns.token_hash.notNull, true);

    // 9. Verify journal entry for 0007 exists
    const journalPath = path.resolve(drizzleDir, 'meta/_journal.json');
    const journal = JSON.parse(await fs.readFile(journalPath, 'utf8'));
    const lastEntry = journal.entries[journal.entries.length - 1];
    assert.equal(lastEntry.tag, '0007_auth_sessions', 'last journal entry must be 0007');

  } finally {
    await client.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
    await client.end();
  }
});
