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
  role: string;
  site: string;
  status: 'Active' | 'Inactive';
  standardRate: string;
  enhancedRate: string;
  nightRate: string;
  rates: string;
  pension: string;
  deductions: string;
  tax: string;
  weeklyHours?: number;
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
  
  // TODO: Enable backend API when deployed
  // For now, using local cache only
  console.log('Using local data cache (backend API disabled)');
  dataLoaded = true;
  notifyDataChanged();
  
  // Uncomment below when backend is deployed:
  /*
  try {
    const [backendSites, backendStaff, backendShifts] = await Promise.all([
      sitesAPI.getAll().catch(() => []),
      staffAPI.getAll().catch(() => []),
      shiftsAPI.getAll().catch(() => [])
    ]);

    if (backendSites.length > 0) sites = backendSites;
    if (backendStaff.length > 0) staff = backendStaff;
    if (backendShifts.length > 0) shifts = backendShifts;

    dataLoaded = true;
    notifyDataChanged();
  } catch (error) {
    console.warn('Failed to load data from backend, using local cache:', error);
    dataLoaded = true;
  }
  */
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

export const addStaff = async (staffMember: StaffMember): Promise<void> => {
  // TODO: Enable backend API when deployed
  staff.push(staffMember);
  notifyDataChanged();
};

export const updateStaff = async (id: string | number, updates: Partial<StaffMember>): Promise<void> => {
  // TODO: Enable backend API when deployed
  staff = staff.map(s => String(s.id) === String(id) ? { ...s, ...updates } : s);
  notifyDataChanged();
};

export const deleteStaff = async (id: string | number): Promise<void> => {
  // TODO: Enable backend API when deployed
  staff = staff.filter(s => String(s.id) !== String(id));
  notifyDataChanged();
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

