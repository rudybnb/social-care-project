import test from 'node:test';
import assert from 'node:assert/strict';
import { createStaffRouter } from '../routes/staff.js';
import { createAuthenticateRequest } from '../middleware/auth.js';
import { authSessions } from '../schema.js';
import {
  createSession,
  generateSessionToken,
  hashSessionToken,
  validateSessionToken,
} from '../services/sessionService.js';


class FakeDb {
  public selectQueue: any[][];
  public selectCalls: any[] = [];
  public inserts: any[] = [];
  public sessions: any[] = [];
  public insertResult: any[] = [];

  constructor(options: { selectQueue?: any[][]; insertResult?: any[] } = {}) {
    this.selectQueue = options.selectQueue ?? [];
    this.insertResult = options.insertResult ?? [];
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
            const result: any = {
              limit(limit: number) {
                call.limit = limit;
                return Promise.resolve(db.selectQueue.shift() ?? []);
              },
            };
            result.then = (onFulfilled?: any, onRejected?: any) =>
              Promise.resolve(db.selectQueue.shift() ?? []).then(onFulfilled, onRejected);
            return result;
          },
          limit(limit: number) {
            call.limit = limit;
            return Promise.resolve(db.selectQueue.shift() ?? []);
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
        const res = db.insertResult.length > 0 ? db.insertResult : [{ id: 'new-id-1', ...value }];
        return {
          returning() {
            return Promise.resolve(res);
          },
          then(onFulfilled?: any, onRejected?: any) {
            return Promise.resolve(res).then(onFulfilled, onRejected);
          }
        };
      },
    };
  }

  update(table: any) {
    const db = this;
    return {
      set(value: any) {
        return {
          where(condition: any) {
            return Promise.resolve();
          },
        };
      },
    };
  }
}

function makeStaff(overrides: Partial<any> = {}) {
  return {
    id: 'staff-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    username: 'alice',
    password: '$2b$10$placeholder',
    role: 'Worker',
    site: 'Thamesmead',
    status: 'Active',
    standardRate: '14.50',
    enhancedRate: '17.00',
    nightRate: '20.00',
    rates: 'Standard: £14.50/h',
    pension: '5%',
    deductions: '£10.00',
    tax: 'BR',
    telegramChatId: '123456',
    phone: '07700123456',
    weeklyHours: 40,
    daysPerWeek: 5,
    startDate: '2024-01-15',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-06-01'),
    ...overrides,
  };
}

function makeSession(overrides: Partial<any> = {}): any {
  return {
    id: 'session-1',
    staffId: 'staff-admin-1',
    tokenHash: 'test-token-hash',
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    ...overrides,
  };
}

function makeAuthSelectQueue(...routeResults: any[][]): any[][] {
  return [
    [makeSession()],
    [makeStaff({ id: 'staff-admin-1', role: 'Admin' })],
    ...routeResults,
  ];
}

function flattenSqlChunks(node: any, out: string[]): void {
  if (node === null || node === undefined) return;
  if (typeof node === 'string') {
    out.push(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) flattenSqlChunks(item, out);
    return;
  }
  if (typeof node === 'object') {
    if ('value' in node && Object.keys(node).length === 1) {
      const value = node.value;
      if (typeof value === 'string') out.push(value);
      else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') out.push(item);
        }
      }
      return;
    }
    if (Array.isArray(node.queryChunks)) flattenSqlChunks(node.queryChunks, out);
    if (Array.isArray(node.params)) {
      for (const param of node.params) {
        if (typeof param === 'string') out.push(param);
        else flattenSqlChunks(param, out);
      }
    }
  }
}

function findSearchCall(db: any) {
  return db.selectCalls.find((c: any) => c.condition && c.limit === 50);
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

async function withAuthEnforcement<T>(fn: () => Promise<T>): Promise<T> {
  const previous = process.env.AUTH_ENFORCEMENT;
  process.env.AUTH_ENFORCEMENT = 'true';
  try {
    return await fn();
  } finally {
    if (previous === undefined) delete process.env.AUTH_ENFORCEMENT;
    else process.env.AUTH_ENFORCEMENT = previous;
  }
}

async function invokeRoute(router: any, method: 'get' | 'post', routePath: string, req: any) {
  return withAuthEnforcement(async () => {
    const layer = router.stack.find((item: any) => item.route?.path === routePath && item.route?.methods?.[method]);
    if (!layer) return makeResponse(); // route not found
    const handlers = layer.route.stack.map((item: any) => item.handle);
    const res = makeResponse();
    let index = 0;
    const next = async () => {
      const handler = handlers[index++];
      if (handler) await handler(req, res, next);
    };
    await next();
    return res;
  });
}

// ---------- Tests ----------

test('unauthenticated search is rejected with 401', async () => {
  const db = new FakeDb({ selectQueue: [[], []] });
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/', {
    headers: {},
    query: {},
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.payload.error, 'Authentication required');
});

test('unauthenticated get-by-id is rejected with 401', async () => {
  const db = new FakeDb();
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/:id', {
    headers: {},
    params: { id: 'staff-1' },
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.payload.error, 'Authentication required');
});

test('authenticated list returns all staff up to 50', async () => {
  const db = new FakeDb({
    selectQueue: makeAuthSelectQueue([
      makeStaff({ id: 'staff-1' }),
      makeStaff({ id: 'staff-2', name: 'Bob Smith', username: 'bob' }),
    ]),
  });

  const token = await createSession(db, 'staff-admin-1');
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/', {
    headers: { authorization: `Bearer ${token.token}` },
    query: {},
  });

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.payload));
  assert.equal(res.payload.length, 2);
});

test('list returns exactly the allowed fields', async () => {
  const db = new FakeDb({
    selectQueue: makeAuthSelectQueue([makeStaff()]),
  });

  const token = await createSession(db, 'staff-admin-1');
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/', {
    headers: { authorization: `Bearer ${token.token}` },
    query: {},
  });

  assert.equal(res.statusCode, 200);
  const staffMember = res.payload[0];

  const allowedFields = ['addressLine1', 'addressLine2', 'email', 'hourlyRate', 'id', 'name', 'nextOfKinName', 'nextOfKinPhone', 'nextOfKinRelationship', 'phone', 'role', 'site', 'staffPostcode', 'startDate', 'status', 'townCity', 'username'];
  assert.deepEqual(Object.keys(staffMember).sort(), allowedFields);

  for (const absent of [
    'password',
    'standardRate',
    'enhancedRate',
    'nightRate',
    'rates',
    'pension',
    'deductions',
    'tax',
    'telegramChatId',
    'weeklyHours',
    'daysPerWeek',
    'createdAt',
    'updatedAt',
  ]) {
    assert.equal(staffMember[absent], undefined, `expected ${absent} to be absent`);
  }

  const listCall = db.selectCalls.find((c: any) => !c.condition && c.limit === 50);
  assert.ok(listCall, 'expected a plain list select call');
  assert.deepEqual(Object.keys(listCall.selection).sort(), allowedFields);
});

test('get-by-id returns exactly the allowed fields', async () => {
  const db = new FakeDb({
    selectQueue: makeAuthSelectQueue([makeStaff()]),
  });

  const token = await createSession(db, 'staff-admin-1');
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/:id', {
    headers: { authorization: `Bearer ${token.token}` },
    params: { id: 'staff-1' },
  });

  assert.equal(res.statusCode, 200);
  const staffMember = res.payload;

  const allowedFields = ['addressLine1', 'addressLine2', 'email', 'hourlyRate', 'id', 'name', 'nextOfKinName', 'nextOfKinPhone', 'nextOfKinRelationship', 'phone', 'role', 'site', 'staffPostcode', 'startDate', 'status', 'townCity', 'username'];
  assert.deepEqual(Object.keys(staffMember).sort(), allowedFields);

  for (const absent of [
    'password',
    'standardRate',
    'enhancedRate',
    'nightRate',
    'rates',
    'pension',
    'deductions',
    'tax',
    'telegramChatId',
    'weeklyHours',
    'daysPerWeek',
    'createdAt',
    'updatedAt',
  ]) {
    assert.equal(staffMember[absent], undefined, `expected ${absent} to be absent`);
  }

  const byIdCall = db.selectCalls.find((c: any) => c.condition && c.limit === undefined);
  assert.ok(byIdCall, 'expected a get-by-id select call');
  assert.deepEqual(Object.keys(byIdCall.selection).sort(), allowedFields);
});

test('search by name uses ILIKE partial matching (case-insensitive)', async () => {
  const db = new FakeDb({
    selectQueue: makeAuthSelectQueue([makeStaff({ id: 'staff-1', name: 'Alice Johnson' })]),
  });

  const token = await createSession(db, 'staff-admin-1');
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/', {
    headers: { authorization: `Bearer ${token.token}` },
    query: { q: 'alice' },
  });

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.payload));

  const searchCall = findSearchCall(db);
  assert.ok(searchCall, 'expected a select call with a where condition for search');

  const sqlStrings: string[] = [];
  flattenSqlChunks(searchCall.condition, sqlStrings);
  assert.ok(sqlStrings.some((s) => s.includes('ILIKE')), 'expected ILIKE operator for case-insensitive matching');
  assert.ok(sqlStrings.includes('%alice%'), 'expected partial-match pattern in search condition');
});

test('search by username works case-insensitively', async () => {
  const db = new FakeDb({
    selectQueue: makeAuthSelectQueue([makeStaff({ id: 'staff-2', username: 'bob' })]),
  });

  const token = await createSession(db, 'staff-admin-1');
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/', {
    headers: { authorization: `Bearer ${token.token}` },
    query: { q: 'BOB' },
  });

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.payload));
  const searchCall = findSearchCall(db);
  assert.ok(searchCall, 'expected a select call with a where condition');

  const sqlStrings: string[] = [];
  flattenSqlChunks(searchCall.condition, sqlStrings);
  assert.ok(sqlStrings.some((s) => s.includes('ILIKE')), 'expected ILIKE operator for case-insensitive matching');
  assert.ok(sqlStrings.includes('%BOB%'), 'expected partial-match pattern in search condition');
});

test('search with no match returns empty array', async () => {
  const db = new FakeDb({
    selectQueue: makeAuthSelectQueue([]),
  });

  const token = await createSession(db, 'staff-admin-1');
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/', {
    headers: { authorization: `Bearer ${token.token}` },
    query: { q: 'nonexistent' },
  });

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.payload));
  assert.equal(res.payload.length, 0);
});

test('get-by-id returns 404 when staff not found', async () => {
  const db = new FakeDb({
    selectQueue: makeAuthSelectQueue([]),
  });

  const token = await createSession(db, 'staff-admin-1');
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/:id', {
    headers: { authorization: `Bearer ${token.token}` },
    params: { id: 'nonexistent-id' },
  });

  assert.equal(res.statusCode, 404);
  assert.equal(res.payload.error, 'Staff member not found');
});

test('search with empty q string returns all results (no filter)', async () => {
  const db = new FakeDb({
    selectQueue: makeAuthSelectQueue([
      makeStaff({ id: 'staff-1' }),
      makeStaff({ id: 'staff-2', name: 'Bob Smith' }),
    ]),
  });

  const token = await createSession(db, 'staff-admin-1');
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/', {
    headers: { authorization: `Bearer ${token.token}` },
    query: { q: '' },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.length, 2);
});

test('malformed q values do not cause a server error', async () => {
  for (const q of [['a', 'b'], { nested: 'value' }, 42, null]) {
    const db = new FakeDb({
      selectQueue: makeAuthSelectQueue([
        makeStaff({ id: 'staff-1' }),
        makeStaff({ id: 'staff-2', name: 'Bob Smith' }),
      ]),
    });

    const token = await createSession(db, 'staff-admin-1');
    const router = createStaffRouter(db);

    const res = await invokeRoute(router, 'get', '/', {
      headers: { authorization: `Bearer ${token.token}` },
      query: { q },
    });

    assert.equal(res.statusCode, 200, `expected 200 for q=${JSON.stringify(q)}`);
    assert.ok(Array.isArray(res.payload));
    assert.equal(res.payload.length, 2);
  }
});

test('q is limited to 100 characters', async () => {
  const db = new FakeDb({
    selectQueue: makeAuthSelectQueue([makeStaff({ id: 'staff-1', name: 'Alice Johnson' })]),
  });

  const token = await createSession(db, 'staff-admin-1');
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/', {
    headers: { authorization: `Bearer ${token.token}` },
    query: { q: 'a'.repeat(200) },
  });

  assert.equal(res.statusCode, 200);

  const searchCall = findSearchCall(db);
  assert.ok(searchCall, 'expected a search select call');

  const sqlStrings: string[] = [];
  flattenSqlChunks(searchCall.condition, sqlStrings);
  const pattern = sqlStrings.find((s) => s.startsWith('%'));
  assert.ok(pattern, 'expected a pattern param in search condition');
  assert.equal(pattern.length, 102);
});

test('search condition covers every supported field', async () => {
  const db = new FakeDb({
    selectQueue: makeAuthSelectQueue([makeStaff({ id: 'staff-1' })]),
  });

  const token = await createSession(db, 'staff-admin-1');
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/', {
    headers: { authorization: `Bearer ${token.token}` },
    query: { q: 'thamesmead' },
  });

  assert.equal(res.statusCode, 200);

  const searchCall = findSearchCall(db);
  assert.ok(searchCall, 'expected a search select call');

  const sqlStrings: string[] = [];
  flattenSqlChunks(searchCall.condition, sqlStrings);
  const ilikeCount = sqlStrings.filter((s) => s.includes('ILIKE')).length;
  assert.equal(ilikeCount, 6, 'expected one ILIKE condition per supported field');
  assert.equal(sqlStrings.filter((s) => s.includes('%thamesmead%')).length, 6, 'expected the pattern to apply to every field');
});

test('search by role returns matching staff', async () => {
  const db = new FakeDb({
    selectQueue: makeAuthSelectQueue([makeStaff({ id: 'staff-1', role: 'Manager' })]),
  });

  const token = await createSession(db, 'staff-admin-1');
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/', {
    headers: { authorization: `Bearer ${token.token}` },
    query: { q: 'manager' },
  });

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.length, 1);
  assert.equal(res.payload[0].role, 'Manager');
});

test('search applies a 50-result limit at the database level', async () => {
  const db = new FakeDb({
    selectQueue: makeAuthSelectQueue([makeStaff({ id: 'staff-1' })]),
  });

  const token = await createSession(db, 'staff-admin-1');
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/', {
    headers: { authorization: `Bearer ${token.token}` },
    query: { q: 'alice' },
  });

  assert.equal(res.statusCode, 200);

  const searchCall = findSearchCall(db);
  assert.ok(searchCall, 'expected a search select call');
  assert.equal(searchCall.limit, 50);
});

test('expired session is rejected with 401 for search and get-by-id', async () => {
  const previousEnv = process.env.AUTH_ENFORCEMENT;
  process.env.AUTH_ENFORCEMENT = 'true';
  try {
    for (const routePath of ['/', '/:id']) {
      const db = new FakeDb({
        selectQueue: [[makeSession({ expiresAt: new Date(Date.now() - 1_000) })]],
      });

      const token = generateSessionToken();
      const router = createStaffRouter(db);

      const res = await invokeRoute(router, 'get', routePath, {
        headers: { authorization: `Bearer ${token}` },
        query: {},
        params: { id: 'staff-1' },
      });

      assert.equal(res.statusCode, 401, `expected 401 for ${routePath}`);
      assert.equal(res.payload.error, 'Authentication required');
    }
  } finally {
    if (previousEnv === undefined) delete process.env.AUTH_ENFORCEMENT;
    else process.env.AUTH_ENFORCEMENT = previousEnv;
  }
});

test('revoked session is rejected with 401 for protected staff routes', async () => {
  const previousEnv = process.env.AUTH_ENFORCEMENT;
  process.env.AUTH_ENFORCEMENT = 'true';
  try {
    const db = new FakeDb({
      selectQueue: [[makeSession({ revokedAt: new Date() })]],
    });

    const token = generateSessionToken();
    const router = createStaffRouter(db);

    const res = await invokeRoute(router, 'get', '/', {
      headers: { authorization: `Bearer ${token}` },
      query: {},
    });

    assert.equal(res.statusCode, 401);
    assert.equal(res.payload.error, 'Authentication required');
  } finally {
    if (previousEnv === undefined) delete process.env.AUTH_ENFORCEMENT;
    else process.env.AUTH_ENFORCEMENT = previousEnv;
  }
});

test('non-admin user cannot access admin staff search', async () => {
  const db = new FakeDb({
    selectQueue: [
      [makeSession()],
      [makeStaff({ id: 'staff-worker-1', role: 'Worker' })],
    ],
  });

  const token = await createSession(db, 'staff-worker-1');
  const router = createStaffRouter(db);

  const res = await invokeRoute(router, 'get', '/', {
    headers: { authorization: `Bearer ${token.token}` },
    query: {},
  });

  assert.ok(res.statusCode === 401 || res.statusCode === 403, `expected 401 or 403, got ${res.statusCode}`);
});

test('POST /api/staff security matrix: Admin 201, Worker 401/403, Unauth 401, Password Omitted', async () => {
  // 1. Unauthenticated request -> 401
  const dbUnauth = new FakeDb({});
  const routerUnauth = createStaffRouter(dbUnauth);
  const unauthRes = await invokeRoute(routerUnauth, 'post', '/', {
    headers: {},
    body: { name: 'Test Person', password: 'tempPassword123' },
  });
  assert.equal(unauthRes.statusCode, 401, 'unauthenticated POST /api/staff must return 401');

  // 2. Worker session -> 401 or 403
  const dbWorker = new FakeDb({
    selectQueue: [
      [makeSession()],
      [makeStaff({ id: 'staff-worker-1', role: 'Worker' })],
    ],
  });
  const workerToken = await createSession(dbWorker, 'staff-worker-1');
  const routerWorker = createStaffRouter(dbWorker);
  const workerRes = await invokeRoute(routerWorker, 'post', '/', {
    headers: { authorization: `Bearer ${workerToken.token}` },
    body: { name: 'Test Person', password: 'tempPassword123' },
  });
  assert.ok(workerRes.statusCode === 401 || workerRes.statusCode === 403, `expected 401/403 for worker creation, got ${workerRes.statusCode}`);

  // 3. Admin session -> 201 Created & safe payload returned
  const dbAdmin = new FakeDb({
    selectQueue: makeAuthSelectQueue([]),
    insertResult: [
      makeStaff({
        id: 'new-staff-101',
        name: 'Jane Doe',
        username: 'janedoe',
        role: 'Senior Care Worker',
        site: 'Thamesmead',
        status: 'Active',
        email: 'jane@example.com',
      }),
    ],
  });
  const adminToken = await createSession(dbAdmin, 'staff-admin-1');
  const routerAdmin = createStaffRouter(dbAdmin);

  const adminRes = await invokeRoute(routerAdmin, 'post', '/', {
    headers: { authorization: `Bearer ${adminToken.token}` },
    body: {
      name: 'Jane Doe',
      username: 'janedoe',
      email: 'jane@example.com',
      role: 'Senior Care Worker',
      site: 'Thamesmead',
      status: 'Active',
      password: 'secretPassword123',
    },
  });

  assert.equal(adminRes.statusCode, 201, 'admin POST /api/staff must return 201');
  assert.equal(adminRes.payload.name, 'Jane Doe');
  assert.equal(adminRes.payload.username, 'janedoe');
  assert.equal(adminRes.payload.role, 'Senior Care Worker');
  assert.equal(adminRes.payload.password, undefined, 'password must not be exposed in response payload');
});

test('admin/admin123 credentials and legacy fallback login do not exist', async () => {
  const db = new FakeDb({ selectQueue: [[]] }); // Database returns no staff for 'admin'
  const { createAuthRouter } = await import('../routes/auth.js');
  const authRouter = createAuthRouter(db);

  const adminLoginRes = await invokeRoute(authRouter, 'post', '/admin/login', {
    body: { username: 'admin', password: 'admin123' },
    ip: '127.0.0.1',
    headers: {},
  });

  assert.equal(adminLoginRes.statusCode, 401);
  assert.equal(adminLoginRes.payload.error, 'Invalid username or password');

  const legacyFallbackRes = await invokeRoute(authRouter, 'post', '/login', {
    body: { username: 'admin', password: 'admin123' },
    ip: '127.0.0.1',
    headers: {},
  });

  assert.equal(legacyFallbackRes.payload, undefined); // Route not found
});

test('production inventory query returns only non-sensitive staff fields', async () => {
  const { getProductionInventoryQuery, STAGING_INVENTORY_FIELDS } = await import('../services/stagingCopyService.js');
  const inventoryInfo = getProductionInventoryQuery();

  const expectedFields = ['id', 'username', 'name', 'role', 'site', 'status'];
  assert.deepEqual([...STAGING_INVENTORY_FIELDS], expectedFields);
  assert.equal(inventoryInfo.sql, 'SELECT id, username, name, role, site, status FROM staff ORDER BY id;');

  for (const forbidden of ['email', 'password', 'rates', 'standardRate', 'pension', 'tax', 'phone', 'auth_sessions']) {
    assert.equal(inventoryInfo.sql.includes(forbidden), false, `forbidden field ${forbidden} must not be in inventory query`);
  }
});

test('staging copy query uses parameterised UUID placeholders and approved fields', async () => {
  const { getProductionStagingCopyQuery, STAGING_COPY_APPROVED_FIELDS } = await import('../services/stagingCopyService.js');

  const validUuid1 = '12345678-1234-1234-1234-1234567890ab';
  const validUuid2 = '87654321-4321-4321-4321-ba0987654321';

  const approvedFields = ['id', 'name', 'email', 'username', 'role', 'site', 'status'];
  assert.deepEqual([...STAGING_COPY_APPROVED_FIELDS], approvedFields);

  const queryInfo = getProductionStagingCopyQuery([validUuid1, validUuid2]);
  assert.equal(queryInfo.sql, 'SELECT id, name, email, username, role, site, status FROM staff WHERE id NOT IN ($1, $2);');
  assert.deepEqual(queryInfo.params, [validUuid1, validUuid2]);
  assert.equal(queryInfo.excludedCount, 2);

  for (const malformed of ['admin', '12345', 'not-a-uuid-string', '']) {
    assert.throws(() => {
      getProductionStagingCopyQuery([malformed]);
    }, /Invalid UUID/);
  }
});

test('staging copy execution guards enforce ALLOW_STAGING_DATA_COPY=true and destination validation', async () => {
  const { validateStagingCopyGuards } = await import('../services/stagingCopyService.js');

  const validUuid = '12345678-1234-1234-1234-1234567890ab';
  const validOptions = {
    sourceDatabaseUrl: 'postgres://prod_user:secret@prod-db.render.com/prod_db',
    destinationDatabaseUrl: 'postgres://staging_user:secret@staging-db.render.com/staging_db',
    isStagingDestinationConfirmed: true,
    confirmedDemoUuidExclusions: [validUuid],
  };

  const prevEnv = process.env.ALLOW_STAGING_DATA_COPY;
  try {
    delete process.env.ALLOW_STAGING_DATA_COPY;

    assert.throws(() => {
      validateStagingCopyGuards(validOptions);
    }, /ALLOW_STAGING_DATA_COPY=true is required/);

    process.env.ALLOW_STAGING_DATA_COPY = 'true';

    assert.doesNotThrow(() => {
      validateStagingCopyGuards(validOptions);
    });

    assert.throws(() => {
      validateStagingCopyGuards({ ...validOptions, destinationDatabaseUrl: validOptions.sourceDatabaseUrl });
    }, /Source and destination database connection strings match/);

    assert.throws(() => {
      validateStagingCopyGuards({ ...validOptions, sourceDatabaseUrl: 'postgres://user:pass@localhost:5432/db' });
    }, /Localhost test database cannot be used/);

    assert.throws(() => {
      validateStagingCopyGuards({ ...validOptions, destinationDatabaseUrl: 'postgres://user:pass@staging-host:5432/social_care_auth_test' });
    }, /Destination cannot be localhost or test database/);

    assert.throws(() => {
      validateStagingCopyGuards({ ...validOptions, destinationDatabaseUrl: 'postgres://user:pass@staging-host:5432/prod_db' });
    }, /Destination database name matches production/);

    assert.throws(() => {
      validateStagingCopyGuards({ ...validOptions, isStagingDestinationConfirmed: false });
    }, /Destination must be explicitly confirmed as a staging environment/);

    assert.throws(() => {
      validateStagingCopyGuards({ ...validOptions, confirmedDemoUuidExclusions: ['admin'] });
    }, /not a valid UUID/);
  } finally {
    if (prevEnv === undefined) delete process.env.ALLOW_STAGING_DATA_COPY;
    else process.env.ALLOW_STAGING_DATA_COPY = prevEnv;
  }
});

test('standalone staging copy is isolated from backend startup and HTTP routes', async () => {
  const fs = await import('fs');
  const path = await import('path');
  const indexPath = path.join(process.cwd(), 'src', 'index.ts');
  const indexContent = fs.readFileSync(indexPath, 'utf8');

  assert.equal(indexContent.includes('stagingCopyService'), false, 'index.ts must not import stagingCopyService');
  assert.equal(indexContent.includes('copy-staging-data'), false, 'index.ts must not import copy-staging-data');
});
