import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import StaffProfile from './StaffProfile';
import { AuthProvider } from '../context/AuthContext';

const safeStaff = {
  id: 'staff-1',
  name: 'Alice Johnson',
  username: 'alice',
  role: 'Worker',
  site: 'Thamesmead',
  status: 'Active',
  email: 'alice@example.com',
};

function mockFetchForProfile(results: unknown, status = 200) {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (String(url).includes('/api/auth/me')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
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
          }),
      });
    }
    if (String(url).includes('/api/staff/staff-1')) {
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(results),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });
  });
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname}</div>;
}

function renderProfile() {
  localStorage.setItem(
    'auth',
    JSON.stringify({
      user: { id: 'u1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
      token: 'session-token',
    })
  );
  render(
    <MemoryRouter initialEntries={['/admin/directory/staff/staff-1']}>
      <AuthProvider>
        <Routes>
          <Route path="/admin/directory/staff/:staffId" element={<StaffProfile />} />
          <Route path="/admin/directory" element={<div>Directory Page</div>} />
        </Routes>
      </AuthProvider>
      <LocationProbe />
    </MemoryRouter>
  );
}

describe('StaffProfile', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('loads and displays the staff members safe fields', async () => {
    mockFetchForProfile(safeStaff);
    renderProfile();

    await screen.findByText('Alice Johnson');

    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('Worker')).toBeInTheDocument();
    expect(screen.getByText('Thamesmead')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('staff-1')).toBeInTheDocument();

    const calls = (global.fetch as jest.Mock).mock.calls;
    const profileCalls = calls.filter((call) => String(call[0]).includes('/api/staff/staff-1'));
    const authedCall = profileCalls.find((call) => call[1]?.headers?.Authorization);
    expect(authedCall).toBeTruthy();
    expect(authedCall[1].headers.Authorization).toBe('Bearer session-token');
  });

  test('shows an authentication-expired message when the session is rejected and clears the token', async () => {
    mockFetchForProfile({ error: 'Authentication required' }, 401);
    renderProfile();

    await waitFor(() => {
      expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
    });
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(localStorage.getItem('auth')).toBeNull();
    });
  });

  test('back button navigates to the directory', async () => {
    mockFetchForProfile(safeStaff);
    renderProfile();

    await screen.findByText('Alice Johnson');

    fireEvent.click(screen.getByRole('button', { name: /back to directory/i }));

    await waitFor(() => {
      expect(screen.getByTestId('current-location').textContent).toBe('/admin/directory');
    });
  });
});
