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
  public sessions: any[] = [];
  public selectQueue: any[][] = [];
  public selectCalls: any[] = [];
  public inserts: any[] = [];

  constructor(options: { selectQueue?: any[][] } = {}) {
    this.selectQueue = options.selectQueue ?? [];
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

async function invokeRoute(router: any, method: 'get' | 'post', routePath: string, req: any) {
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

  const allowedFields = ['email', 'id', 'name', 'role', 'site', 'status', 'username'];
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
    'phone',
    'weeklyHours',
    'daysPerWeek',
    'startDate',
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

  const allowedFields = ['email', 'id', 'name', 'role', 'site', 'status', 'username'];
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
    'phone',
    'weeklyHours',
    'daysPerWeek',
    'startDate',
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
