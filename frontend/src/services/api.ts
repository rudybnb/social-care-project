// API service for communicating with backend
import { StaffMember, Site } from '../data/sharedData';

// In development the fetch target must stay same-origin ('self') to satisfy the
// CSP in public/index.html, so requests use relative /api routes and the dev
// server proxies them to the local backend. Production keeps the full URL.
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development' ? '' : 'https://social-care-backend.onrender.com');
export const API_URL = API_BASE_URL;

// Safe (non-sensitive) staff fields returned by the protected staff endpoint.
export interface SafeStaff {
  id: string;
  name: string;
  username: string;
  role: string;
  site: string;
  status: string;
  email: string;
  phone?: string;
  startDate?: string;
  hourlyRate?: string;
  addressLine1?: string;
  addressLine2?: string;
  townCity?: string;
  staffPostcode?: string;
  nextOfKinName?: string;
  nextOfKinRelationship?: string;
  nextOfKinPhone?: string;
}

// Thrown when the staff endpoint rejects the bearer session token (401).
export class StaffAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'StaffAuthError';
    this.status = status;
  }
}

// ==================== AUTH API ====================

export interface AuthApiErrorBody {
  error?: string;
}

export class AuthApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
  }
}

export interface SessionUser {
  id: string;
  staffId: string;
  username: string | null;
  name: string;
  email: string | null;
  role: string;
  site: string;
  status: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token: string;
  expiresAt: string;
  user: SessionUser;
}

export const authAPI = {
  // Real Phase 1A admin login — returns a server-side session token.
  async adminLogin(username: string, password: string): Promise<AdminLoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const body: AuthApiErrorBody = await response.json().catch(() => ({}));
      throw new AuthApiError(body.error || 'Invalid username or password', response.status);
    }
    return response.json();
  },

  // Revoke the current server-side session. A 401 means the session is already gone.
  async logout(token?: string | null): Promise<void> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers,
    });
    if (response.status === 401) return;
    if (!response.ok) throw new Error('Failed to log out');
  },

  // Return the authenticated user for a token, or null when the session is invalid/expired.
  async me(token?: string | null): Promise<SessionUser | null> {
    if (!token) return null;
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) return null;
    if (!response.ok) throw new Error('Failed to fetch session');
    const data = await response.json();
    return data?.user ?? null;
  },
};

function getStoredToken(): string | null {
  try {
    const saved = localStorage.getItem('auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed?.token || null;
    }
  } catch (e) {}
  return null;
}

export function getStoredStaffBearerToken(): string | null {
  const staffToken = localStorage.getItem('staff-token');
  if (staffToken) return staffToken;
  return getStoredToken();
}

// ==================== STAFF API ====================

export const staffAPI = {
  // Get all staff
  async getAll(token?: string | null): Promise<StaffMember[]> {
    const authToken = token || getStoredToken();
    const headers: Record<string, string> = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const response = await fetch(`${API_BASE_URL}/api/staff`, { headers });
    if (!response.ok) throw new Error('Failed to fetch staff');
    return response.json();
  },

  // Search staff via the protected endpoint using the authenticated bearer session token
  async search(query: string = '', token?: string | null): Promise<SafeStaff[]> {
    const authToken = token || getStoredToken();
    const params = new URLSearchParams();
    params.set('q', query);
    const url = `${API_BASE_URL}/api/staff?${params.toString()}`;

    const headers: Record<string, string> = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const response = await fetch(url, { headers });
    if (response.status === 401) {
      throw new StaffAuthError('Your session has expired. Please log in again.', response.status);
    }
    if (!response.ok) throw new Error('Failed to search staff');
    return response.json();
  },

  // Create new staff member via the protected endpoint using the authenticated bearer session token
  async create(data: Partial<StaffMember> & { password?: string }, token?: string | null): Promise<SafeStaff> {
    const authToken = token || getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const response = await fetch(`${API_BASE_URL}/api/staff`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (response.status === 401) {
      throw new StaffAuthError('Your session has expired. Please log in again.', response.status);
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Failed to create staff member' }));
      throw new Error(err.error || err.details || 'Failed to create staff member');
    }
    return response.json();
  },

  // Get staff by ID via the protected endpoint using the authenticated bearer session token
  async getById(id: string | number, token?: string | null): Promise<SafeStaff> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, { headers });
    if (response.status === 401) {
      throw new StaffAuthError('Your session has expired. Please log in again.', response.status);
    }
    if (!response.ok) throw new Error('Failed to fetch staff member');
    return response.json();
  },

  // Update staff member
  async update(id: string | number, updates: Partial<StaffMember>): Promise<StaffMember> {
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update staff member');
    return response.json();
  },

  // Delete staff member
  async delete(id: string | number, token?: string | null): Promise<void> {
    const authToken = token || getStoredToken();
    const headers: Record<string, string> = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (response.status === 401) {
      throw new StaffAuthError('Your session has expired. Please log in again.', response.status);
    }
    if (!response.ok) throw new Error('Failed to delete staff member');
  },

  // Suspend or reactivate a staff member (sets status field)
  async setStatus(id: string | number, status: 'Active' | 'Inactive', token?: string | null): Promise<any> {
    const authToken = token || getStoredToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    if (response.status === 401) {
      throw new StaffAuthError('Your session has expired. Please log in again.', response.status);
    }
    if (!response.ok) throw new Error(`Failed to ${status === 'Inactive' ? 'suspend' : 'reactivate'} staff member`);
    return response.json();
  },
};

// ==================== SITES API ====================

export const sitesAPI = {
  // Get all sites
  async getAll(): Promise<Site[]> {
    const response = await fetch(`${API_BASE_URL}/api/sites`);
    if (!response.ok) throw new Error('Failed to fetch sites');
    return response.json();
  },

  // Get site by ID
  async getById(id: string): Promise<Site> {
    const response = await fetch(`${API_BASE_URL}/api/sites/${id}`);
    if (!response.ok) throw new Error('Failed to fetch site');
    return response.json();
  },

  // Create new site
  async create(site: Site): Promise<Site> {
    const response = await fetch(`${API_BASE_URL}/api/sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(site),
    });
    if (!response.ok) throw new Error('Failed to create site');
    return response.json();
  },

  // Update site
  async update(id: string, updates: Partial<Site>): Promise<Site> {
    const response = await fetch(`${API_BASE_URL}/api/sites/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update site');
    return response.json();
  },

  // Delete site
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/sites/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete site');
  },
};

// ==================== SHIFTS API ====================

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  siteId: string;
  siteName: string;
  siteColor: string;
  date: string;
  type: 'Day' | 'Night';
  startTime: string;
  endTime: string;
  duration: number;
  is24Hour: boolean;
  approved24HrBy?: string;
  notes?: string;
  extended?: boolean;
  extensionHours?: number;
  extensionReason?: string;
  extensionApprovedBy?: string;
  extensionApprovalRequired?: boolean;
  isBank?: boolean;
  staffStatus?: 'pending' | 'accepted' | 'declined';
  clockedIn?: boolean;
  clockInTime?: string;
  clockedOut?: boolean;
  clockOutTime?: string;
  duplicateShiftApprovedBy?: string;
  declineReason?: string;
  responseLocked?: boolean;
  autoAccepted?: boolean;
  weekDeadline?: string;
  published?: boolean;
  isOfferedForSwap?: boolean;
  isSwapped?: boolean;
  originalStaffId?: string;
}

export const shiftsAPI = {
  // Get all shifts
  async getAll(): Promise<Shift[]> {
    const response = await fetch(`${API_BASE_URL}/api/shifts`);
    if (!response.ok) throw new Error('Failed to fetch shifts');
    return response.json();
  },

  // Get shift by ID
  async getById(id: string): Promise<Shift> {
    const response = await fetch(`${API_BASE_URL}/api/shifts/${id}`);
    if (!response.ok) throw new Error('Failed to fetch shift');
    return response.json();
  },

  // Create new shift
  async create(shift: Shift): Promise<Shift> {
    const response = await fetch(`${API_BASE_URL}/api/shifts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shift),
    });
    if (!response.ok) throw new Error('Failed to create shift');
    return response.json();
  },

  // Update shift
  async update(id: string, updates: Partial<Shift>): Promise<Shift> {
    const response = await fetch(`${API_BASE_URL}/api/shifts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update shift');
    return response.json();
  },

  // Delete shift
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/shifts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete shift');
  },

  // Publish shifts (convert draft to published)
  async publish(data: { siteId?: string; startDate?: string; endDate?: string; shiftIds?: string[] }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/shifts/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to publish shifts');
    return response.json();
  },

  // Get available shift swaps
  async getAvailableSwaps(): Promise<Shift[]> {
    const response = await fetch(`${API_BASE_URL}/api/shifts/available-swaps`);
    if (!response.ok) throw new Error('Failed to fetch available swaps');
    return response.json();
  },

  // Offer a shift for swap
  async offerSwap(id: string): Promise<Shift> {
    const response = await fetch(`${API_BASE_URL}/api/shifts/${id}/offer-swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to offer shift for swap');
    return response.json();
  },

  // Accept a shift swap
  async acceptSwap(id: string, newStaffId: string, newStaffName: string): Promise<Shift> {
    const response = await fetch(`${API_BASE_URL}/api/shifts/${id}/accept-swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newStaffId, newStaffName })
    });
    if (!response.ok) throw new Error('Failed to accept shift swap');
    return response.json();
  },
};

// ==================== LEAVE API ====================

export const leaveAPI = {
  async getDays(startDate?: string, endDate?: string): Promise<any[]> {
    let url = `${API_BASE_URL}/api/leave/days`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch leave days');
    return response.json();
  }
};


