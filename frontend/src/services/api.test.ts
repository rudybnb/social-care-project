import { staffAPI, StaffAuthError, authAPI, AuthApiError } from './api';

describe('staffAPI.search', () => {
  const originalFetch = global.fetch;

  const mockFetchResponse = (status: number, body: unknown) => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    });
  };

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('calls GET /api/staff with the q param', async () => {
    mockFetchResponse(200, []);
    await staffAPI.search('alice', 'session-token');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/staff');
    expect(url).toContain('q=alice');
  });

  test('sends the authenticated bearer session token', async () => {
    mockFetchResponse(200, []);
    await staffAPI.search('alice', 'session-token');

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer session-token');
  });

  test('omits Authorization header when no token is available', async () => {
    mockFetchResponse(200, []);
    await staffAPI.search('bob', null);

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  test('omits q param when the query is empty', async () => {
    mockFetchResponse(200, []);
    await staffAPI.search('', 'session-token');

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/staff');
    expect(url).not.toContain('q=');
  });

  test('returns the safe staff fields from the response', async () => {
    const payload = [
      {
        id: 'staff-1',
        name: 'Alice Johnson',
        username: 'alice',
        role: 'Worker',
        site: 'Thamesmead',
        status: 'Active',
        email: 'alice@example.com',
      },
    ];
    mockFetchResponse(200, payload);

    const results = await staffAPI.search('alice', 'session-token');
    expect(results).toEqual(payload);
  });

  test('throws StaffAuthError on a 401 response', async () => {
    mockFetchResponse(401, { error: 'Authentication required' });

    await expect(staffAPI.search('alice', 'expired-token')).rejects.toBeInstanceOf(StaffAuthError);
    await expect(staffAPI.search('alice', 'expired-token')).rejects.toMatchObject({
      status: 401,
    });
  });
});

describe('authAPI', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('adminLogin posts credentials to the admin login endpoint', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          success: true,
          token: 'real-session-token',
          expiresAt: '2026-08-01T00:00:00.000Z',
          user: { id: 'admin-1', role: 'Admin' },
        }),
    });

    const data = await authAPI.adminLogin('admin', 'secret');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/auth/admin/login');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ username: 'admin', password: 'secret' });
    expect(data.token).toBe('real-session-token');
  });

  test('adminLogin throws AuthApiError with the server error message on 401', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Invalid username or password' }),
    });

    await expect(authAPI.adminLogin('admin', 'wrong')).rejects.toBeInstanceOf(AuthApiError);
    await expect(authAPI.adminLogin('admin', 'wrong')).rejects.toMatchObject({
      status: 401,
      message: 'Invalid username or password',
    });
  });

  test('logout sends the bearer session token and is tolerant of 401', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ success: true }) });

    await authAPI.logout('real-session-token');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/auth/logout');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer real-session-token');
  });

  test('logout does not send an Authorization header when no token exists', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ success: true }) });

    await authAPI.logout(null);

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  test('me returns the session user for a valid token', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          success: true,
          user: { id: 'admin-1', role: 'Admin' },
          session: { expiresAt: '2026-08-01T00:00:00.000Z' },
        }),
    });

    const user = await authAPI.me('real-session-token');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/auth/me');
    expect(init.headers.Authorization).toBe('Bearer real-session-token');
    expect(user?.role).toBe('Admin');
  });

  test('me returns null for an expired or revoked token (401)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({ error: 'Authentication required' }) });

    const user = await authAPI.me('expired-token');

    expect(user).toBeNull();
  });
});
