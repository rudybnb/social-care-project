import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

const VALID_SESSION = {
  success: true,
  user: {
    id: 'u1',
    staffId: 'u1',
    username: 'admin',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'Admin',
    site: 'All Sites',
    status: 'Active',
  },
  session: { expiresAt: new Date(Date.now() + 60_000).toISOString() },
};

function TestHarness() {
  const { user, token, expiresAt, isLoading, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="isLoading">{String(isLoading)}</div>
      <div data-testid="token">{token ?? 'null'}</div>
      <div data-testid="user">{user?.name ?? 'null'}</div>
      <div data-testid="expiresAt">{expiresAt ?? 'null'}</div>
      <button
        onClick={() =>
          login(
            { id: 'u1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
            'session-token',
            new Date(Date.now() + 60_000).toISOString()
          )
        }
      >
        login
      </button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

function mockFetchHandler(handler: (url: string) => { ok: boolean; status: number; json: () => Promise<unknown> }) {
  global.fetch = jest.fn().mockImplementation((url: string) => Promise.resolve(handler(String(url))));
}

const okJson = (body: unknown) => ({ ok: true, status: 200, json: () => Promise.resolve(body) });
const notOkJson = (status: number, body: unknown) => ({ ok: false, status, json: () => Promise.resolve(body) });

function seedLocalStorage(expiresAt?: string | null) {
  localStorage.setItem(
    'auth',
    JSON.stringify({
      user: { id: 'u1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
      token: 'session-token',
      expiresAt: expiresAt === undefined ? new Date(Date.now() + 60_000).toISOString() : expiresAt,
    })
  );
}

describe('AuthContext', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('restores and validates a stored session via /api/auth/me', async () => {
    seedLocalStorage();
    mockFetchHandler((url) => {
      if (String(url).includes('/api/auth/me')) return okJson(VALID_SESSION);
      return okJson({});
    });

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('session-token');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('Admin');

    const calls = (global.fetch as jest.Mock).mock.calls;
    const meCall = calls.find((call) => String(call[0]).includes('/api/auth/me'));
    expect(meCall).toBeTruthy();
    expect(meCall[1].headers.Authorization).toBe('Bearer session-token');
  });

  test('clears the stored session when the server rejects the token (401)', async () => {
    seedLocalStorage();
    mockFetchHandler((url) => {
      if (String(url).includes('/api/auth/me')) return notOkJson(401, { error: 'Authentication required' });
      return okJson({});
    });

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(localStorage.getItem('auth')).toBeNull();
  });

  test('does not restore a session that has already expired locally', async () => {
    seedLocalStorage(new Date(Date.now() - 1_000).toISOString());
    mockFetchHandler(() => okJson({}));

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });
    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(localStorage.getItem('auth')).toBeNull();
  });

  test('stores the real token on login and clears it on logout via the backend', async () => {
    mockFetchHandler((url) => {
      if (String(url).includes('/api/auth/me')) return okJson(VALID_SESSION);
      if (String(url).includes('/api/auth/logout')) return okJson({ success: true });
      return okJson({});
    });

    render(
      <AuthProvider>
        <TestHarness />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('isLoading')).toHaveTextContent('false');
    });

    await userEvent.click(screen.getByText('login'));
    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('session-token');
    });

    const saved = JSON.parse(localStorage.getItem('auth') || '{}');
    expect(saved.token).toBe('session-token');

    await userEvent.click(screen.getByText('logout'));

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('null');
    });
    expect(localStorage.getItem('auth')).toBeNull();

    const calls = (global.fetch as jest.Mock).mock.calls;
    const logoutCall = calls.find((call) => String(call[0]).includes('/api/auth/logout'));
    expect(logoutCall).toBeTruthy();
    expect(logoutCall[1].headers.Authorization).toBe('Bearer session-token');
  });
});
