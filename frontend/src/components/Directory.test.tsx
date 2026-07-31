import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Directory from './Directory';
import { AuthProvider } from '../context/AuthContext';

const safeStaff = [
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

function mockFetchForSearch(results: unknown, status = 200) {
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
    if (String(url).includes('/api/staff') && String(url).includes('q=')) {
      return Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(results),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });
  });
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="current-location">{location.pathname}</div>;
}

function renderDirectory() {
  localStorage.setItem(
    'auth',
    JSON.stringify({
      user: { id: 'u1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
      token: 'session-token',
    })
  );
  render(
    <MemoryRouter initialEntries={['/admin/directory']}>
      <AuthProvider>
        <Directory />
      </AuthProvider>
      <LocationProbe />
    </MemoryRouter>
  );
}

describe('Directory staff search', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  test('searches staff via the protected endpoint with the bearer token', async () => {
    mockFetchForSearch(safeStaff);
    renderDirectory();

    await screen.findByText('Search Staff');

    await userEvent.type(
      screen.getByPlaceholderText('Search by name, username, role, site, status or email...'),
      'alice'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    const resultsContainer = await screen.findByTestId('staff-search-results');
    expect(within(resultsContainer).getByText('Alice Johnson')).toBeInTheDocument();
    expect(within(resultsContainer).getByText('alice')).toBeInTheDocument();
    expect(within(resultsContainer).getByText('Worker')).toBeInTheDocument();
    expect(within(resultsContainer).getByText('Thamesmead')).toBeInTheDocument();
    expect(within(resultsContainer).getByText('Active')).toBeInTheDocument();
    expect(within(resultsContainer).getByText('alice@example.com')).toBeInTheDocument();

    const calls = (global.fetch as jest.Mock).mock.calls;
    const searchCall = calls.find((call) => String(call[0]).includes('q=alice'));
    expect(searchCall).toBeTruthy();
    expect(searchCall[1].headers.Authorization).toBe('Bearer session-token');
  });

  test('shows an authentication-expired message when the session is rejected and clears the token', async () => {
    mockFetchForSearch({ error: 'Authentication required' }, 401);
    renderDirectory();

    await screen.findByText('Search Staff');

    await userEvent.type(
      screen.getByPlaceholderText('Search by name, username, role, site, status or email...'),
      'alice'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('staff-search-results')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(localStorage.getItem('auth')).toBeNull();
    });
  });

  test('shows a no-results message when nothing matches', async () => {
    mockFetchForSearch([]);
    renderDirectory();

    await screen.findByText('Search Staff');

    await userEvent.type(
      screen.getByPlaceholderText('Search by name, username, role, site, status or email...'),
      'nonexistent'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByText(/No staff found matching/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('staff-search-results')).not.toBeInTheDocument();
  });

  test('view profile navigates to the staff profile page', async () => {
    mockFetchForSearch(safeStaff);
    renderDirectory();

    await screen.findByText('Search Staff');

    await userEvent.type(
      screen.getByPlaceholderText('Search by name, username, role, site, status or email...'),
      'alice'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    const resultsContainer = await screen.findByTestId('staff-search-results');
    fireEvent.click(within(resultsContainer).getByRole('button', { name: 'View Profile' }));

    await waitFor(() => {
      expect(screen.getByTestId('current-location').textContent).toBe('/admin/directory/staff/staff-1');
    });
  });
});
