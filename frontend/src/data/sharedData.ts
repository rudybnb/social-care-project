// Shared data store with backend API integration
import { staffAPI, sitesAPI, shiftsAPI, Shift as APIShift } from '../services/api';

export interface Site {
  id: string;
  name: string;
  location: string;
  postcode: string;
  address: string;
  status: 'Active' | 'Inactive';
  qrGenerated: boolean;
  color: string;
}

export interface Agency {
  id: string | number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
}

export interface AgencyWorker {
  id: string | number;
  name: string;
  agencyId: string | number;
  agencyName: string;
  role: string;
  hourlyRate: string;
  availability: string;
  startDate: string;
  endDate?: string;
  status: 'Active' | 'Inactive';
  notes?: string;
}

export interface StaffMember {
  id: string | number;
  name: string;
  email?: string;
  username?: string;
  password?: string;
  role: string;
  site: string;
  status: 'Active' | 'Inactive';
  phone?: string;
  standardRate: string;
  enhancedRate: string;
  nightRate: string;
  rates: string;
  pension: string;
  deductions: string;
  tax: string;
  weeklyHours?: number;
  startDate?: string;
}

// Local cache
let sites: Site[] = [
  {
    id: 'SITE_001',
    name: 'Thamesmead Care Home',
    location: 'Thamesmead',
    postcode: 'SE28 8LY',
    address: '65 Nickelby Close',
    status: 'Active',
    qrGenerated: false,
    color: '#8b7ab8'
  },
  {
    id: 'SITE_002',
    name: 'Rochester Care Home',
    location: 'Rochester',
    postcode: 'ME1 2JH',
    address: 'Breton Road',
    status: 'Active',
    qrGenerated: false,
    color: '#7ab8a8'
  },
  {
    id: 'SITE_003',
    name: 'Erith Care Home',
    location: 'Erith',
    postcode: 'DA8 1PE',
    address: '31 St Johns Road',
    status: 'Active',
    qrGenerated: false,
    color: '#f59e0b'
  }
];

let staff: StaffMember[] = [
  {
    id: 1,
    name: 'Admin User',
    role: 'Admin',
    site: 'All Sites',
    status: 'Active',
    standardRate: '12.50',
    enhancedRate: '—',
    nightRate: '—',
    rates: '£/h — • Night — • OT —',
    pension: '—',
    deductions: '£0.00',
    tax: '—',
    weeklyHours: 0
  },
  {
    id: 2,
    name: 'Site Manager',
    role: 'Site Manager',
    site: 'London Care Home',
    status: 'Active',
    standardRate: '12.50',
    enhancedRate: '—',
    nightRate: '—',
    rates: '£/h — • Night — • OT —',
    pension: '—',
    deductions: '£0.00',
    tax: '—',
    weeklyHours: 0
  }
];

let shifts: any[] = [];
let agencies: Agency[] = [];
let agencyWorkers: AgencyWorker[] = [];
let dataLoaded = false;

// ==================== INITIALIZATION ====================

// Load data from backend on first access
const initializeData = async () => {
  if (dataLoaded) return;
  
  try {
    console.log('Loading data from backend API...');
    const [backendSites, backendStaff, backendShifts] = await Promise.all([
      sitesAPI.getAll().catch(() => []),
      staffAPI.getAll().catch(() => []),
      shiftsAPI.getAll().catch(() => [])
    ]);

    if (backendSites.length > 0) sites = backendSites;
    if (backendStaff.length > 0) staff = backendStaff;
    if (backendShifts.length > 0) shifts = backendShifts;

    console.log('Backend data loaded:', { sites: sites.length, staff: staff.length, shifts: shifts.length });
    dataLoaded = true;
    notifyDataChanged();
  } catch (error) {
    console.warn('Failed to load data from backend, using local cache:', error);
    dataLoaded = true;
    notifyDataChanged();
  }
};

// ==================== SITE MANAGEMENT ====================

export const getSites = (): Site[] => {
  if (!dataLoaded) {
    initializeData();
  }
  return [...sites];
};

export const addSite = async (site: Site): Promise<void> => {
  // TODO: Enable backend API when deployed
  sites.push(site);
  notifyDataChanged();
};

export const updateSite = async (id: string, updates: Partial<Site>): Promise<void> => {
  // TODO: Enable backend API when deployed
  sites = sites.map(site => site.id === id ? { ...site, ...updates } : site);
  notifyDataChanged();
};

export const deleteSite = async (id: string): Promise<void> => {
  // TODO: Enable backend API when deployed
  sites = sites.filter(site => site.id !== id);
  notifyDataChanged();
};

// ==================== STAFF MANAGEMENT ====================

export const getStaff = (): StaffMember[] => {
  if (!dataLoaded) {
    initializeData();
  }
  return [...staff];
};

export const addStaff = async (staffMember: Partial<StaffMember>): Promise<void> => {
  try {
    console.log('Adding staff member:', staffMember);
    const response = await fetch('https://social-care-backend.onrender.com/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffMember)
    });
    
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Backend error:', errorData);
      throw new Error(errorData.error || errorData.details || 'Failed to add staff member');
    }
    
    const newStaff = await response.json();
    console.log('Staff added successfully:', newStaff);
    staff.push(newStaff);
    notifyDataChanged();
  } catch (error: any) {
    console.error('Error adding staff:', error);
    console.error('Error message:', error.message);
    throw error;
  }
};

export const updateStaff = async (id: string | number, updates: Partial<StaffMember>): Promise<void> => {
  try {
    console.log('Updating staff member:', id, updates);
    const response = await fetch(`https://social-care-backend.onrender.com/api/staff/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Backend error:', errorData);
      throw new Error(errorData.error || 'Failed to update staff member');
    }
    
    const updatedStaff = await response.json();
    console.log('Staff updated successfully:', updatedStaff);
    
    // Update local cache
    staff = staff.map(s => String(s.id) === String(id) ? { ...s, ...updatedStaff } : s);
    notifyDataChanged();
  } catch (error: any) {
    console.error('Error updating staff:', error);
    console.error('Error message:', error.message);
    throw error;
  }
};

export const deleteStaff = async (id: string | number): Promise<void> => {
  try {
    console.log('Deleting staff member:', id);
    const response = await fetch(`https://social-care-backend.onrender.com/api/staff/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Backend error:', errorData);
      throw new Error(errorData.error || 'Failed to delete staff member');
    }
    
    console.log('Staff deleted successfully from backend');
    staff = staff.filter(s => String(s.id) !== String(id));
    notifyDataChanged();
  } catch (error: any) {
    console.error('Error deleting staff:', error);
    throw error;
  }
};

// ==================== SHIFTS MANAGEMENT ====================

export const getShifts = (): any[] => {
  if (!dataLoaded) {
    initializeData();
  }
  return [...shifts];
};

export const setShifts = async (newShifts: any[]): Promise<void> => {
  shifts = newShifts;
  notifyDataChanged();
};

export const addShift = async (shift: any): Promise<void> => {
  try {
    // Save to backend database
    const createdShift = await shiftsAPI.create(shift);
    // Update local cache with the shift from backend (which has the correct ID)
    shifts.push(createdShift);
    notifyDataChanged();
  } catch (error) {
    console.error('Failed to create shift:', error);
    // Fallback: save to local cache only
    shifts.push(shift);
    notifyDataChanged();
  }
};

export const updateShift = async (id: string, updates: Partial<Shift>): Promise<void> => {
  try {
    console.log('Updating shift:', id, updates);
    // Update in backend database
    const updatedShift = await shiftsAPI.update(id, updates);
    console.log('Shift updated successfully:', updatedShift);
    // Update local cache
    shifts = shifts.map(s => s.id === id ? updatedShift : s);
    notifyDataChanged();
  } catch (error) {
    console.error('Failed to update shift:', error);
    // Re-throw the error so the caller knows it failed
    throw error;
  }
};

export const removeShift = async (id: string): Promise<void> => {
  try {
    // Delete from backend database
    await shiftsAPI.delete(id);
    // Update local cache
    shifts = shifts.filter(s => s.id !== id);
    notifyDataChanged();
  } catch (error) {
    console.error('Failed to delete shift:', error);
    // Fallback: delete from local cache only
    shifts = shifts.filter(s => s.id !== id);
    notifyDataChanged();
  }
};

// ==================== AGENCY MANAGEMENT ====================

export const getAgencies = (): Agency[] => {
  if (!dataLoaded) {
    initializeData();
  }
  return [...agencies];
};

export const addAgency = (agency: Agency): void => {
  agencies.push(agency);
  notifyDataChanged();
};

export const updateAgency = (id: string | number, updates: Partial<Agency>): void => {
  agencies = agencies.map(a => String(a.id) === String(id) ? { ...a, ...updates } : a);
  notifyDataChanged();
};

export const deleteAgency = (id: string | number): void => {
  agencies = agencies.filter(a => String(a.id) !== String(id));
  // Also delete all workers from this agency
  agencyWorkers = agencyWorkers.filter(w => String(w.agencyId) !== String(id));
  notifyDataChanged();
};

export const getAgencyWorkers = (): AgencyWorker[] => {
  if (!dataLoaded) {
    initializeData();
  }
  return [...agencyWorkers];
};

export const addAgencyWorker = (worker: AgencyWorker): void => {
  agencyWorkers.push(worker);
  notifyDataChanged();
};

export const updateAgencyWorker = (id: string | number, updates: Partial<AgencyWorker>): void => {
  agencyWorkers = agencyWorkers.map(w => String(w.id) === String(id) ? { ...w, ...updates } : w);
  notifyDataChanged();
};

export const deleteAgencyWorker = (id: string | number): void => {
  agencyWorkers = agencyWorkers.filter(w => String(w.id) !== String(id));
  notifyDataChanged();
};

// Get all workers (permanent staff + agency workers) for shift assignment
export const getAllWorkers = (): Array<StaffMember | AgencyWorker> => {
  const permanentStaff = getStaff();
  const tempWorkers = getAgencyWorkers();
  return [...permanentStaff, ...tempWorkers];
};

// ==================== LEGACY EXPORTS ====================

export const sharedSites: [Site[], (sites: Site[]) => void] = [
  sites,
  (newSites: Site[]) => {
    sites = newSites;
    notifyDataChanged();
  }
];

export const sharedShifts: [any[], (shifts: any[]) => void] = [
  shifts,
  (newShifts: any[]) => {
    shifts = newShifts;
    notifyDataChanged();
  }
];

// ==================== EVENT SYSTEM ====================

type EventCallback = () => void;
const listeners: EventCallback[] = [];

export const subscribeToDataChange = (callback: EventCallback): (() => void) => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

export const notifyDataChanged = (): void => {
  listeners.forEach(callback => callback());
};

// Legacy compatibility
export const subscribeToSitesChange = subscribeToDataChange;
export const notifySitesChanged = notifyDataChanged;

