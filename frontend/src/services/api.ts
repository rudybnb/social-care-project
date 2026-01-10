// API service for communicating with backend
import { StaffMember, Site } from '../data/sharedData';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com';
export const API_URL = API_BASE_URL;

// ==================== STAFF API ====================

export const staffAPI = {
  // Get all staff
  async getAll(): Promise<StaffMember[]> {
    const response = await fetch(`${API_BASE_URL}/api/staff`);
    if (!response.ok) throw new Error('Failed to fetch staff');
    return response.json();
  },

  // Get staff by ID
  async getById(id: string | number): Promise<StaffMember> {
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}`);
    if (!response.ok) throw new Error('Failed to fetch staff member');
    return response.json();
  },

  // Create new staff member
  async create(staff: Omit<StaffMember, 'id'>): Promise<StaffMember> {
    const response = await fetch(`${API_BASE_URL}/api/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staff),
    });
    if (!response.ok) throw new Error('Failed to create staff member');
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
  async delete(id: string | number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/staff/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete staff member');
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
};

