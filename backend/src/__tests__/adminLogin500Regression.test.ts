import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';

// Ensure unit tests do not attempt real DB pool connections via db.ts
delete process.env.DATABASE_URL;

import { createAuthRouter } from '../routes/auth.js';
import { authSessions, staff } from '../schema.js';

class FakeDb {
  public sessions: any[] = [];
  public staffRows: any[] = [];
  public selectCalls: any[] = [];
  public inserts: any[] = [];

  select(selection?: any) {
    const db = this;
    const call: any = { selection };
    db.selectCalls.push(call);
    return {
      from(table: any) {
        call.table = table;
        return {
          where(cond: any) {
            call.cond = cond;
            return {
              limit(_n: number) {
                return Promise.resolve(db.staffRows.shift() ?? []);
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
}

function makeReq(overrides: Record<string, any> = {}): any {
  return {
    ip: '127.0.0.1',
    headers: {},
    body: {},
    params: {},
    query: {},
    get: (): any => undefined,
    ...overrides,
  };
}

function makeRes(): any {
  let resolveFn!: () => void;
  const donePromise = new Promise<void>((resolve) => {
    resolveFn = resolve;
  });

  const res: any = {
    statusCode: 200,
    _json: null,
    _donePromise: donePromise,
    status(code: number): any {
      res.statusCode = code;
      return res;
    },
    json(body: any): any {
      res._json = body;
      resolveFn();
      return res;
    },
  };
  return res;
}

async function invokeLogin(router: any, req: any, res: any): Promise<void> {
  return new Promise<void>((resolve) => {
    let finished = false;
    const onDone = () => {
      if (!finished) {
        finished = true;
        resolve();
      }
    };

    if (res._donePromise) {
      res._donePromise.then(onDone);
    }

    (router as any).handle(
      { ...req, method: 'POST', url: '/admin/login', path: '/admin/login' },
      res,
      onDone
    );
  });
}

const VALID_PASSWORD = 'RudyPassword123!';

await test('adminLogin: router with null database returns 500 (reproduces root cause)', async () => {
  const router = createAuthRouter(null);
  const req = makeReq({ body: { username: 'rudy', password: VALID_PASSWORD } });
  const res = makeRes();

  await invokeLogin(router, req, res);

  assert.equal(res.statusCode, 500);
  assert.equal(res._json?.error, 'Database not configured');
});

await test('adminLogin: valid rudy Admin credentials return 200 with session token', async () => {
  const passwordHash = await bcrypt.hash(VALID_PASSWORD, 10);
  const db = new FakeDb();
  db.staffRows.push([
    {
      id: '6878971a-66f3-4760-aab9-354ede5605c9',
      name: 'Rudy Admin',
      email: 'rudy@example.com',
      username: 'rudy',
      password: passwordHash,
      role: 'Admin',
      site: 'HQ',
      status: 'Active',
    },
  ]);

  const router = createAuthRouter(db);
  const req = makeReq({ body: { username: 'rudy', password: VALID_PASSWORD } });
  const res = makeRes();

  await invokeLogin(router, req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res._json?.success, true);
  assert.ok(typeof res._json?.token === 'string' && res._json.token.length === 43, 'session token must be a 43-char base64url string');
  assert.equal(res._json?.user?.username, 'rudy');
  assert.equal(res._json?.user?.role, 'Admin');
  assert.equal(res._json?.user?.staffId, '6878971a-66f3-4760-aab9-354ede5605c9');

  const bodyStr = JSON.stringify(res._json);
  assert.ok(!bodyStr.includes('password'), 'response must not leak password field');
  assert.ok(!bodyStr.includes('$2b$'), 'response must not leak bcrypt hash');
});

await test('adminLogin: wrong password returns 401 (never 500)', async () => {
  const passwordHash = await bcrypt.hash(VALID_PASSWORD, 10);
  const db = new FakeDb();
  db.staffRows.push([
    {
      id: '6878971a-66f3-4760-aab9-354ede5605c9',
      name: 'Rudy Admin',
      username: 'rudy',
      password: passwordHash,
      role: 'Admin',
      site: 'HQ',
      status: 'Active',
    },
  ]);

  const router = createAuthRouter(db);
  const req = makeReq({ body: { username: 'rudy', password: 'WrongPassword123!' } });
  const res = makeRes();

  await invokeLogin(router, req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res._json?.error, 'Invalid username or password');
});

await test('adminLogin: non-existent username returns 401 (never 500)', async () => {
  const db = new FakeDb();
  db.staffRows.push([]); // no matching staff found

  const router = createAuthRouter(db);
  const req = makeReq({ body: { username: 'nonexistent', password: VALID_PASSWORD } });
  const res = makeRes();

  await invokeLogin(router, req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res._json?.error, 'Invalid username or password');
});

await test('adminLogin: empty or missing credentials return 401 (never 500)', async () => {
  const db = new FakeDb();
  const router = createAuthRouter(db);

  const req1 = makeReq({ body: { username: '', password: '' } });
  const res1 = makeRes();
  await invokeLogin(router, req1, res1);
  assert.equal(res1.statusCode, 401);

  const req2 = makeReq({ body: {} });
  const res2 = makeRes();
  await invokeLogin(router, req2, res2);
  assert.equal(res2.statusCode, 401);
});
