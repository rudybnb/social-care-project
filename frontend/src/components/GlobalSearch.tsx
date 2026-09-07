import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, sitesAPI, staffAPI, SafeStaff } from '../services/api';
import { Site, StaffMember, getSites, getStaff } from '../data/sharedData';
import { useAuth } from '../context/AuthContext';

interface StaffResult {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  role: string;
  site: string;
  status: string;
  startDate: string | null;
  createdAt: string;
  rates: string;
  link: string;
}

interface LeaveResult {
  id: string;
  staffId: string;
  staffName: string;
  category: 'balance' | 'request';
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  totalHours?: number;
  hoursRemaining?: number;
  hoursAccrued?: number;
  totalEntitlement?: number;
  reason?: string | null;
  status?: string;
  link: string;
}

interface ShiftResult {
  id: string;
  staffId: string;
  staffName: string;
  siteId: string;
  siteName: string;
  date: string;
  type: string;
  startTime: string;
  endTime: string;
  duration: number;
  clockedIn: boolean | null;
  clockedOut: boolean | null;
  staffStatus: string | null;
  isBank: boolean | null;
  link: string;
}

interface AttendanceResult {
  id: string;
  shiftId: string;
  staffId: string;
  staffName: string;
  siteName: string;
  date: string;
  type: string;
  issue: 'absent' | 'late' | 'missing_clock_out';
  clockInTime: string | null;
  clockOutTime: string | null;
  startTime: string;
  endTime: string;
  details: string;
  link: string;
}

interface SwapsResult {
  id: string;
  shiftId: string;
  requesterId: string;
  requesterName: string;
  takerId: string;
  takerName: string;
  siteName: string;
  date: string;
  type: string;
  startTime: string;
  endTime: string;
  swapStatus: 'pending' | 'completed';
  approvedBy: string | null;
  approvedAt: string | null;
  link: string;
}

interface ApprovalsResult {
  id: string;
  staffId: string;
  staffName: string;
  siteId: string;
  siteName: string;
  date: string;
  requestTime: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string | null;
  link: string;
}

interface QuotesResult {
  id: string;
  childInitials: string;
  quoteStatus: string | null;
  providerName: string | null;
  placementType: string | null;
  createdDate: string | null;
  createdAt: string;
  link: string;
}

interface RemittancesResult {
  id: string;
  paymentNo: string;
  paymentDate: string;
  siteName: string | null;
  payeeName: string;
  description: string;
  datesCovered: string;
  hoursWorked: string;
  hourlyRate: string;
  paymentTotal: string;
  status: string;
  createdAt: string;
  link: string;
}

interface RoomScansResult {
  id: string;
  roomId: string;
  roomName: string | null;
  siteName: string | null;
  userId: string;
  staffName: string | null;
  shiftId: string | null;
  scannedAt: string;
  taskCompleted: boolean | null;
  notes: string | null;
  link: string;
}

interface SitesResult {
  id: string;
  name: string;
  location: string | null;
  postcode: string | null;
  address: string | null;
  status: string;
  color: string | null;
  link: string;
}

interface UnscheduledResult {
  id: string;
  staffId: string;
  staffName: string;
  siteId: string;
  siteName: string;
  date: string;
  requestTime: string;
  status: string;
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string | null;
  link: string;
}

interface PayrollResult {
  id: string;
  staffId: string;
  staffName: string;
  siteName: string;
  date: string;
  type: string;
  startTime: string;
  endTime: string;
  duration: number;
  clockedIn: boolean | null;
  clockedOut: boolean | null;
  hourlyRate: string | null;
  link: string;
}

interface ReportsResult {
  id: string;
  siteId: string;
  userId: string;
  category: string | null;
  status: string;
  createdAt: string;
  link: string;
}

interface QueriesResult {
  id: string;
  siteId: string;
  userId: string;
  category: string | null;
  status: string;
  messageCount: number;
  lastMessage: string | null;
  createdAt: string;
  link: string;
}

interface SearchResponse {
  query: string;
  counts: {
    staff: number;
    leave: number;
    shifts: number;
    attendance: number;
    swaps: number;
    approvals: number;
    quotes: number;
    remittances: number;
    roomScans: number;
    sites: number;
    unscheduled: number;
    payroll: number;
    reports: number;
    queries: number;
  };
  results: {
    staff: StaffResult[];
    leave: LeaveResult[];
    shifts: ShiftResult[];
    attendance: AttendanceResult[];
    swaps: SwapsResult[];
    approvals: ApprovalsResult[];
    quotes: QuotesResult[];
    remittances: RemittancesResult[];
    roomScans: RoomScansResult[];
    sites: SitesResult[];
    unscheduled: UnscheduledResult[];
    payroll: PayrollResult[];
    reports: ReportsResult[];
    queries: QueriesResult[];
  };
}

const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Filters State
  const [section, setSection] = useState<string>('all');
  const [site, setSite] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('any');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [query, setQuery] = useState<string>('');

  // Dynamic Lists loaded from Database
  const [dynamicSites, setDynamicSites] = useState<Site[]>([]);
  const [sitesLoading, setSitesLoading] = useState<boolean>(false);

  const [dynamicStaff, setDynamicStaff] = useState<(StaffMember | SafeStaff)[]>([]);
  const [staffLoading, setStaffLoading] = useState<boolean>(false);

  // Search Results State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Load sites dynamically from database
  useEffect(() => {
    let isMounted = true;
    const loadSites = async () => {
      setSitesLoading(true);
      try {
        const fetchedSites = await sitesAPI.getAll().catch(() => []);
        if (isMounted) {
          const sitesList = fetchedSites.length > 0 ? fetchedSites : (getSites() as any[]);
          const siteMap = new Map();
          for (const s of sitesList) {
            const key = s.name ? s.name.trim().toLowerCase() : s.id;
            if (key && !siteMap.has(key)) siteMap.set(key, s);
          }
          const sorted = Array.from(siteMap.values()).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
          setDynamicSites(sorted);
        }
      } catch (err) {
        console.warn('Failed to load dynamic sites for filter dropdown:', err);
        const fallback = getSites() as any[];
        setDynamicSites(fallback);
      } finally {
        if (isMounted) setSitesLoading(false);
      }
    };
    loadSites();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load staff dynamically from database using GET /api/staff
  useEffect(() => {
    let isMounted = true;
    const loadStaff = async () => {
      setStaffLoading(true);
      try {
        const fetchedStaff = await staffAPI.getAll(token).catch(() => []);
        if (isMounted) {
          const staffList = fetchedStaff.length > 0 ? fetchedStaff : (getStaff() as any[]);
          const staffMap = new Map<string, any>();
          for (const st of staffList) {
            const key = st.id ? String(st.id).trim() : (st.name ? st.name.trim().toLowerCase() : '');
            if (key && !staffMap.has(key)) staffMap.set(key, st);
          }
          const sorted = Array.from(staffMap.values()).sort((a: any, b: any) =>
            (a.name || '').localeCompare(b.name || '')
          );
          setDynamicStaff(sorted);
        }
      } catch (err) {
        console.warn('Failed to load dynamic staff for filter dropdown:', err);
        const fallback = getStaff() as any[];
        const staffMap = new Map<string, any>();
        for (const st of fallback) {
          const key = st.id ? String(st.id).trim() : (st.name ? st.name.trim().toLowerCase() : '');
          if (key && !staffMap.has(key)) staffMap.set(key, st);
        }
        const sorted = Array.from(staffMap.values()).sort((a: any, b: any) =>
          (a.name || '').localeCompare(b.name || '')
        );
        setDynamicStaff(sorted);
      } finally {
        if (isMounted) setStaffLoading(false);
      }
    };
    loadStaff();
    return () => {
      isMounted = false;
    };
  }, [token]);

  // Fetch search results from backend API
  const executeSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const queryParams = new URLSearchParams();
      if (query.trim()) queryParams.set('q', query.trim());
      if (section && section !== 'all') queryParams.set('section', section);
      if (site && site !== 'all') queryParams.set('site', site);
      if (selectedStaff && selectedStaff !== 'all') queryParams.set('staffId', selectedStaff);
      if (dateFilter && dateFilter !== 'any') queryParams.set('dateFilter', dateFilter);
      if (dateFilter === 'custom') {
        if (startDate) queryParams.set('startDate', startDate);
        if (endDate) queryParams.set('endDate', endDate);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        const savedAuth = localStorage.getItem('auth');
        if (savedAuth) {
          try {
            const parsed = JSON.parse(savedAuth);
            if (parsed?.token) headers['Authorization'] = `Bearer ${parsed.token}`;
          } catch (e) {}
        }
      }

      const endpoint = `${API_URL}/api/admin/global-search?${queryParams.toString()}`;
      const res = await fetch(endpoint, { headers });

      if (!res.ok) {
        throw new Error(`Search failed (${res.status} ${res.statusText})`);
      }

      const data: SearchResponse = await res.json();

      // Deduplicate results in each category
      const uniqueStaffMap = new Map();
      for (const s of data.results?.staff || []) {
        const key = s.name ? s.name.trim().toLowerCase() : s.id;
        if (key && !uniqueStaffMap.has(key)) uniqueStaffMap.set(key, s);
      }
      const uniqueStaffResults = Array.from(uniqueStaffMap.values());

      const uniqueLeaveMap = new Map();
      for (const l of data.results?.leave || []) {
        const key = l.id || `${l.staffId}_${l.startDate}_${l.endDate}`;
        if (key && !uniqueLeaveMap.has(key)) uniqueLeaveMap.set(key, l);
      }
      const uniqueLeaveResults = Array.from(uniqueLeaveMap.values());

      const uniqueShiftsMap = new Map();
      for (const sh of data.results?.shifts || []) {
        const key = sh.id || `${sh.staffId}_${sh.date}_${sh.type}`;
        if (key && !uniqueShiftsMap.has(key)) uniqueShiftsMap.set(key, sh);
      }
      const uniqueShiftsResults = Array.from(uniqueShiftsMap.values());

      const uniqueAttendanceMap = new Map();
      for (const a of data.results?.attendance || []) {
        const key = a.id || `${a.shiftId}_${a.issue}`;
        if (key && !uniqueAttendanceMap.has(key)) uniqueAttendanceMap.set(key, a);
      }
      const uniqueAttendanceResults = Array.from(uniqueAttendanceMap.values());

      const uniqueSwapsMap = new Map();
      for (const sw of data.results?.swaps || []) {
        const key = sw.id || `${sw.shiftId}_${sw.requesterId}`;
        if (key && !uniqueSwapsMap.has(key)) uniqueSwapsMap.set(key, sw);
      }
      const uniqueSwapsResults = Array.from(uniqueSwapsMap.values());

      const uniqueApprovalsMap = new Map();
      for (const a of data.results?.approvals || []) {
        const key = a.id || `${a.staffId}_${a.date}`;
        if (key && !uniqueApprovalsMap.has(key)) uniqueApprovalsMap.set(key, a);
      }
      const uniqueApprovalsResults = Array.from(uniqueApprovalsMap.values());

      const uniqueQuotesMap = new Map();
      for (const q of data.results?.quotes || []) {
        const key = q.id || q.childInitials;
        if (key && !uniqueQuotesMap.has(key)) uniqueQuotesMap.set(key, q);
      }
      const uniqueQuotesResults = Array.from(uniqueQuotesMap.values());

      const uniqueRemittancesMap = new Map();
      for (const r of data.results?.remittances || []) {
        const key = r.id || r.paymentNo;
        if (key && !uniqueRemittancesMap.has(key)) uniqueRemittancesMap.set(key, r);
      }
      const uniqueRemittancesResults = Array.from(uniqueRemittancesMap.values());

      const uniqueRoomScansMap = new Map();
      for (const rs of data.results?.roomScans || []) {
        const key = rs.id;
        if (key && !uniqueRoomScansMap.has(key)) uniqueRoomScansMap.set(key, rs);
      }
      const uniqueRoomScansResults = Array.from(uniqueRoomScansMap.values());

      const uniqueSitesMap = new Map();
      for (const s of data.results?.sites || []) {
        const key = s.id;
        if (key && !uniqueSitesMap.has(key)) uniqueSitesMap.set(key, s);
      }
      const uniqueSitesResults = Array.from(uniqueSitesMap.values());

      const uniqueUnscheduledMap = new Map();
      for (const u of data.results?.unscheduled || []) {
        const key = u.id;
        if (key && !uniqueUnscheduledMap.has(key)) uniqueUnscheduledMap.set(key, u);
      }
      const uniqueUnscheduledResults = Array.from(uniqueUnscheduledMap.values());

      const uniquePayrollMap = new Map();
      for (const p of data.results?.payroll || []) {
        const key = p.id;
        if (key && !uniquePayrollMap.has(key)) uniquePayrollMap.set(key, p);
      }
      const uniquePayrollResults = Array.from(uniquePayrollMap.values());

      const uniqueReportsMap = new Map();
      for (const r of data.results?.reports || []) {
        const key = r.id;
        if (key && !uniqueReportsMap.has(key)) uniqueReportsMap.set(key, r);
      }
      const uniqueReportsResults = Array.from(uniqueReportsMap.values());

      const uniqueQueriesMap = new Map();
      for (const q of data.results?.queries || []) {
        const key = q.id;
        if (key && !uniqueQueriesMap.has(key)) uniqueQueriesMap.set(key, q);
      }
      const uniqueQueriesResults = Array.from(uniqueQueriesMap.values());

      const cleanData: SearchResponse = {
        ...data,
        counts: {
          staff: uniqueStaffResults.length,
          leave: uniqueLeaveResults.length,
          shifts: uniqueShiftsResults.length,
          attendance: uniqueAttendanceResults.length,
          swaps: uniqueSwapsResults.length,
          approvals: uniqueApprovalsResults.length,
          quotes: uniqueQuotesResults.length,
          remittances: uniqueRemittancesResults.length,
          roomScans: uniqueRoomScansResults.length,
          sites: uniqueSitesResults.length,
          unscheduled: uniqueUnscheduledResults.length,
          payroll: uniquePayrollResults.length,
          reports: uniqueReportsResults.length,
          queries: uniqueQueriesResults.length
        },
        results: {
          staff: uniqueStaffResults,
          leave: uniqueLeaveResults,
          shifts: uniqueShiftsResults,
          attendance: uniqueAttendanceResults,
          swaps: uniqueSwapsResults,
          approvals: uniqueApprovalsResults,
          quotes: uniqueQuotesResults,
          remittances: uniqueRemittancesResults,
          roomScans: uniqueRoomScansResults,
          sites: uniqueSitesResults,
          unscheduled: uniqueUnscheduledResults,
          payroll: uniquePayrollResults,
          reports: uniqueReportsResults,
          queries: uniqueQueriesResults
        }
      };

      setSearchData(cleanData);
    } catch (err: any) {
      console.error('Global search error:', err);
      setError(err.message || 'An error occurred while executing global search');
    } finally {
      setLoading(false);
    }
  }, [query, section, site, selectedStaff, dateFilter, startDate, endDate, token]);

  const handleToggleStatus = async (id: string, name: string, currentStatus: string) => {
    const isSuspending = currentStatus === 'Active';
    const newStatus = isSuspending ? 'Inactive' : 'Active';
    const action = isSuspending ? 'suspend' : 'reactivate';
    if (window.confirm(`${isSuspending ? 'Suspend' : 'Reactivate'} staff member "${name}"?`)) {
      try {
        await staffAPI.setStatus(id, newStatus, token);
        setDynamicStaff(prev =>
          prev.map(st => String(st.id) === String(id) ? { ...st, status: newStatus } : st)
        );
        if (hasSearched) {
          executeSearch();
        }
      } catch (err: any) {
        alert(err.message || `Failed to ${action} staff member`);
      }
    }
  };

  const handleQuickChip = (text: string) => {
    setQuery(text);
  };

  const handleResetFilters = () => {
    setSection('all');
    setSite('all');
    setSelectedStaff('all');
    setDateFilter('any');
    setStartDate('');
    setEndDate('');
    setQuery('');
    setSearchData(null);
    setHasSearched(false);
  };

  const totalResultsCount = searchData ? (
    searchData.counts.staff + searchData.counts.leave + searchData.counts.shifts + searchData.counts.attendance +
    searchData.counts.swaps + searchData.counts.approvals + searchData.counts.quotes + searchData.counts.remittances +
    searchData.counts.roomScans + searchData.counts.sites + searchData.counts.unscheduled +
    searchData.counts.payroll + searchData.counts.reports + searchData.counts.queries
  ) : 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: 'white' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        borderRadius: '16px',
        padding: '28px 24px',
        marginBottom: '24px',
        boxShadow: '0 8px 32px rgba(124, 58, 237, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '28px' }}>🔍</span>
          <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: 'white', letterSpacing: '-0.5px' }}>
            Operational Global Search
          </h1>
        </div>
        <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', maxWidth: '800px', lineHeight: '1.5' }}>
          Search across all operational sections: Staff, Shifts, Unscheduled, Attendance, Approvals, Room Scans, Annual Leave, Payroll, Reports, Queries, Swaps, Sites, Quotes, and Remittances.
        </p>
      </div>

      {/* Main Search Bar Card */}
      <div style={{
        backgroundColor: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Search Input Box */}
        <form onSubmit={(e) => { e.preventDefault(); executeSearch(); }} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                id="global-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search e.g. 'Lauren leave', 'missed shifts yesterday', 'unfilled shifts next week', 'active workers at Thamesmead'..."
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  paddingLeft: '48px',
                  backgroundColor: '#27272a',
                  border: '1px solid #3f3f46',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', color: '#a1a1aa' }}>
                🔍
              </span>
            </div>
            <button
              id="global-search-submit-btn"
              type="submit"
              disabled={loading}
              style={{
                padding: '0 28px',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>



        {/* Structured Filters Controls */}
        <div style={{
          backgroundColor: '#09090b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '16px 20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#e4e4e7', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
              ⚙️ Structured Filters
            </span>
            <button
              onClick={handleResetFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#a1a1aa',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Reset Filters
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {/* 1. Category / Section Filter */}
            <div>
              <label style={{ display: 'block', color: '#a1a1aa', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                Category / Section
              </label>
              <select
                id="global-search-section-filter"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#262626',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Sections</option>
                <option value="directory">Directory / Staff</option>
                <option value="rota">Rota / Shifts</option>
                <option value="unscheduled">Unscheduled</option>
                <option value="attendance">Attendance</option>
                <option value="approvals">Approvals</option>
                <option value="room-scans">Room Scans</option>
                <option value="annual-leave">Annual Leave</option>
                <option value="payroll">Payroll</option>
                <option value="reports">Reports</option>
                <option value="queries">Queries</option>
                <option value="swaps">Swaps</option>
                <option value="sites">Sites</option>
                <option value="quotes">Quotes</option>
                <option value="remittances">Remittances</option>
              </select>
            </div>

            {/* 2. Site Location Filter */}
            <div>
              <label style={{ display: 'block', color: '#a1a1aa', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                Site Location {sitesLoading && <span style={{ fontSize: '10px', color: '#9333ea' }}>(Loading...)</span>}
              </label>
              <select
                id="global-search-site-filter"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#262626',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Sites</option>
                {dynamicSites.map((s) => (
                  <option key={s.id} value={s.name || s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Staff Member Dropdown Filter */}
            <div>
              <label style={{ display: 'block', color: '#a1a1aa', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                Staff Member {staffLoading && <span style={{ fontSize: '10px', color: '#9333ea' }}>(Loading...)</span>}
              </label>
              <select
                id="global-search-staff-filter"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#262626',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All Staff</option>
                {dynamicStaff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Date Period Filter */}
            <div>
              <label style={{ display: 'block', color: '#a1a1aa', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                Date Range / Period
              </label>
              <select
                id="global-search-date-filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#262626',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="any">Any Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>

          {/* Custom Date Inputs if 'custom' selected */}
          {dateFilter === 'custom' && (
            <div style={{ display: 'flex', gap: '16px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #27272a' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#a1a1aa', fontSize: '11px', marginBottom: '4px' }}>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#262626',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px'
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', color: '#a1a1aa', fontSize: '11px', marginBottom: '4px' }}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#262626',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#7f1d1d',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          color: '#fecaca',
          marginBottom: '24px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Results Container */}
      {!hasSearched ? (
        <div style={{
          backgroundColor: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
          color: '#a1a1aa'
        }}>
          <div style={{ fontSize: '42px', marginBottom: '16px' }}>🔎</div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
            Ready to Search Operational Records
          </h3>
          <p style={{ fontSize: '14px', maxWidth: '500px', margin: '0 auto 20px auto', lineHeight: '1.5', color: '#71717a' }}>
            Type a query or choose structured filters above, then click <strong>Search</strong> to query production records.
          </p>
        </div>
      ) : searchData && (
        <div>
          {/* Results Summary Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '14px', color: '#a1a1aa' }}>
              Found <strong style={{ color: 'white' }}>{totalResultsCount}</strong> operational result{totalResultsCount === 1 ? '' : 's'}
              {searchData.query && <span> for &quot;<strong style={{ color: '#c084fc' }}>{searchData.query}</strong>&quot;</span>}
            </div>

            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', flexWrap: 'wrap' }}>
              <span style={{ color: '#60a5fa' }}>👥 Staff ({searchData.counts.staff})</span>
              <span style={{ color: '#facc15' }}>📅 Shifts ({searchData.counts.shifts})</span>
              <span style={{ color: '#f87171' }}>⏱️ Attendance ({searchData.counts.attendance})</span>
              <span style={{ color: '#c084fc' }}>🔄 Swaps ({searchData.counts.swaps})</span>
              <span style={{ color: '#fb923c' }}>✅ Approvals ({searchData.counts.approvals})</span>
              <span style={{ color: '#34d399' }}>📷 Room Scans ({searchData.counts.roomScans})</span>
              <span style={{ color: '#4ade80' }}>🏖️ Leave ({searchData.counts.leave})</span>
              <span style={{ color: '#a78bfa' }}>💰 Payroll ({searchData.counts.payroll})</span>
              <span style={{ color: '#38bdf8' }}>💬 Quotes ({searchData.counts.quotes})</span>
              <span style={{ color: '#fbbf24' }}>🏢 Sites ({searchData.counts.sites})</span>
              <span style={{ color: '#f472b6' }}>🚨 Unscheduled ({searchData.counts.unscheduled})</span>
              <span style={{ color: '#94a3b8' }}>📋 Reports ({searchData.counts.reports})</span>
              <span style={{ color: '#818cf8' }}>📩 Queries ({searchData.counts.queries})</span>
              <span style={{ color: '#e879f9' }}>💸 Remittances ({searchData.counts.remittances})</span>
            </div>
          </div>

          {totalResultsCount === 0 ? (
            <div style={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: '48px 24px',
              textAlign: 'center',
              color: '#a1a1aa'
            }}>
              <div style={{ fontSize: '42px', marginBottom: '16px' }}>📭</div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                No matching records found
              </h3>
              <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
                Try adjusting your search query, clearing filters, or searching for a different keyword.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

              {/* Section 1: Staff Directory */}
              {searchData.results.staff.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#60a5fa' }}>
                    👥 Staff Directory ({searchData.results.staff.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.staff.map((st) => (
                      <div
                        key={st.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{st.name}</div>
                              <div style={{ fontSize: '12px', color: '#9333ea' }}>@{st.username || 'n/a'}</div>
                            </div>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: st.status === 'Active' ? '#15803d' : '#3f3f46',
                              color: 'white'
                            }}>
                              {st.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Role: <strong style={{ color: 'white' }}>{st.role}</strong></div>
                            <div>Site: <strong style={{ color: 'white' }}>{st.site}</strong></div>
                            <div>Email: <span style={{ color: '#d4d4d8' }}>{st.email || 'None'}</span></div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                          <button
                            onClick={() => navigate(st.link)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              backgroundColor: '#3f3f46',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              textAlign: 'center'
                            }}
                          >
                            View in Directory →
                          </button>
                          <button
                            onClick={() => handleToggleStatus(st.id, st.name, st.status || 'Active')}
                            title={st.status === 'Inactive' ? 'Reactivate staff member' : 'Suspend staff member'}
                            style={{
                              padding: '8px 12px',
                              backgroundColor: st.status === 'Inactive' ? '#15803d' : '#92400e',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              textAlign: 'center',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {st.status === 'Inactive' ? '▶ Reactivate' : '⏸ Suspend'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Annual Leave */}
              {searchData.results.leave.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#4ade80' }}>
                    🏖️ Annual Leave ({searchData.results.leave.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.leave.map((l) => (
                      <div
                        key={l.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{l.staffName}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: l.category === 'balance' ? '#1d4ed8' : l.status === 'approved' ? '#15803d' : '#b45309',
                              color: 'white'
                            }}>
                              {l.category === 'balance' ? 'Balance Record' : `Request: ${l.status}`}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {l.category === 'balance' ? (
                              <>
                                <div>Hours Remaining: <strong style={{ color: '#4ade80' }}>{l.hoursRemaining}h</strong></div>
                                <div>Accrued: <span style={{ color: 'white' }}>{l.hoursAccrued}h</span> / Entitlement: <span style={{ color: 'white' }}>{l.totalEntitlement}h</span></div>
                              </>
                            ) : (
                              <>
                                <div>Dates: <strong style={{ color: 'white' }}>{l.startDate} to {l.endDate}</strong> ({l.totalDays} days / {l.totalHours}h)</div>
                                {l.reason && <div>Reason: <span style={{ color: '#d4d4d8' }}>{l.reason}</span></div>}
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(l.link)}
                          style={{
                            marginTop: '14px',
                            padding: '8px 12px',
                            backgroundColor: '#3f3f46',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          Manage Annual Leave →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: Shifts */}
              {searchData.results.shifts.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#facc15' }}>
                    📅 Rota / Shifts ({searchData.results.shifts.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.shifts.map((sh) => (
                      <div
                        key={sh.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{sh.staffName}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: sh.isBank ? '#b45309' : '#047857',
                              color: 'white'
                            }}>
                              {sh.isBank ? 'Unfilled / Bank' : (sh.staffStatus || 'Assigned')}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Site: <strong style={{ color: 'white' }}>{sh.siteName}</strong></div>
                            <div>Date: <strong style={{ color: 'white' }}>{sh.date}</strong> ({sh.type} Shift)</div>
                            <div>Hours: <span style={{ color: '#d4d4d8' }}>{sh.startTime} - {sh.endTime} ({sh.duration}h)</span></div>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(sh.link)}
                          style={{
                            marginTop: '14px',
                            padding: '8px 12px',
                            backgroundColor: '#3f3f46',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          View in Rota →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: Attendance */}
              {searchData.results.attendance.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#f87171' }}>
                    ⏱️ Attendance ({searchData.results.attendance.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.attendance.map((att) => (
                      <div
                        key={att.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{att.staffName}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: att.issue === 'absent' ? '#991b1b' : att.issue === 'late' ? '#b45309' : '#1d4ed8',
                              color: 'white',
                              textTransform: 'uppercase'
                            }}>
                              {att.issue.replace('_', ' ')}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Site: <strong style={{ color: 'white' }}>{att.siteName}</strong></div>
                            <div>Date: <strong style={{ color: 'white' }}>{att.date}</strong></div>
                            <div>Details: <span style={{ color: '#fca5a5' }}>{att.details}</span></div>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(att.link)}
                          style={{
                            marginTop: '14px',
                            padding: '8px 12px',
                            backgroundColor: '#3f3f46',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          View Attendance →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 5: Swaps */}
              {searchData.results.swaps.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#c084fc' }}>
                    🔄 Shift Swaps ({searchData.results.swaps.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.swaps.map((sw) => (
                      <div
                        key={sw.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{sw.requesterName}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: sw.swapStatus === 'completed' ? '#15803d' : '#b45309',
                              color: 'white'
                            }}>
                              {sw.swapStatus === 'completed' ? 'Completed' : 'Pending'}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Swapped from: <strong style={{ color: 'white' }}>{sw.requesterName}</strong></div>
                            <div>Swapped to: <strong style={{ color: sw.takerName === 'Not yet accepted' ? '#facc15' : 'white' }}>{sw.takerName}</strong></div>
                            <div>Site: <strong style={{ color: 'white' }}>{sw.siteName}</strong></div>
                            <div>Shift: <strong style={{ color: 'white' }}>{sw.date}</strong> ({sw.type}, {sw.startTime} - {sw.endTime})</div>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(sw.link)}
                          style={{
                            marginTop: '14px',
                            padding: '8px 12px',
                            backgroundColor: '#3f3f46',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          View in Rota →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 6: Approvals */}
              {searchData.results.approvals.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#fb923c' }}>
                    ✅ Approval Requests ({searchData.results.approvals.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.approvals.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{a.staffName}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: a.status === 'approved' ? '#15803d' : a.status === 'rejected' ? '#991b1b' : '#b45309',
                              color: 'white'
                            }}>
                              {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Site: <strong style={{ color: 'white' }}>{a.siteName}</strong></div>
                            <div>Date: <strong style={{ color: 'white' }}>{a.date}</strong></div>
                            {a.approvedBy && <div>Approved by: <span style={{ color: '#d4d4d8' }}>{a.approvedBy}</span></div>}
                            {a.notes && <div>Notes: <span style={{ color: '#d4d4d8' }}>{a.notes}</span></div>}
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(a.link)}
                          style={{
                            marginTop: '14px',
                            padding: '8px 12px',
                            backgroundColor: '#3f3f46',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          View Approvals →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 7: Social Care Quotes */}
              {searchData.results.quotes.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#38bdf8' }}>
                    💬 Social Care Quotes ({searchData.results.quotes.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.quotes.map((q) => (
                      <div
                        key={q.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{q.childInitials}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: q.quoteStatus === 'Final Quote' ? '#15803d' : '#b45309',
                              color: 'white'
                            }}>
                              {q.quoteStatus || 'Unknown'}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {q.providerName && <div>Provider: <strong style={{ color: 'white' }}>{q.providerName}</strong></div>}
                            {q.placementType && <div>Placement: <span style={{ color: '#d4d4d8' }}>{q.placementType}</span></div>}
                            {q.createdDate && <div>Created: <span style={{ color: '#d4d4d8' }}>{q.createdDate}</span></div>}
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(q.link)}
                          style={{
                            marginTop: '14px',
                            padding: '8px 12px',
                            backgroundColor: '#3f3f46',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          View Quotes →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 8: Remittances */}
              {searchData.results.remittances.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#a78bfa' }}>
                    💰 Payroll / Remittances ({searchData.results.remittances.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.remittances.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{r.payeeName}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: r.status === 'sent' ? '#15803d' : '#b45309',
                              color: 'white'
                            }}>
                              {r.status === 'sent' ? 'Sent' : 'Saved'}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Payment: <strong style={{ color: 'white' }}>#{r.paymentNo}</strong> — <span style={{ color: '#4ade80' }}>£{r.paymentTotal}</span></div>
                            {r.siteName && <div>Site: <strong style={{ color: 'white' }}>{r.siteName}</strong></div>}
                            <div>Dates: <span style={{ color: '#d4d4d8' }}>{r.datesCovered}</span></div>
                            <div>Hours: <span style={{ color: '#d4d4d8' }}>{r.hoursWorked}h @ £{r.hourlyRate}/hr</span></div>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(r.link)}
                          style={{
                            marginTop: '14px',
                            padding: '8px 12px',
                            backgroundColor: '#3f3f46',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          View Payroll →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 9: Room Scans */}
              {searchData.results.roomScans.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#34d399' }}>
                    📷 Room Scans ({searchData.results.roomScans.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.roomScans.map((rs) => (
                      <div
                        key={rs.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{rs.roomName || 'Unknown Room'}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: rs.taskCompleted ? '#15803d' : '#b45309',
                              color: 'white'
                            }}>
                              {rs.taskCompleted ? 'Completed' : 'Pending'}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {rs.siteName && <div>Site: <strong style={{ color: 'white' }}>{rs.siteName}</strong></div>}
                            {rs.staffName && <div>Scanned by: <span style={{ color: '#d4d4d8' }}>{rs.staffName}</span></div>}
                            <div>Time: <span style={{ color: '#d4d4d8' }}>{new Date(rs.scannedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>
                            {rs.notes && <div>Notes: <span style={{ color: '#d4d4d8' }}>{rs.notes}</span></div>}
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(rs.link)}
                          style={{
                            marginTop: '14px',
                            padding: '8px 12px',
                            backgroundColor: '#3f3f46',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          View Room Scans →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 10: Sites */}
              {searchData.results.sites.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#fbbf24' }}>
                    🏢 Sites ({searchData.results.sites.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.sites.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{s.name}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: s.status === 'Active' ? '#15803d' : '#3f3f46',
                              color: 'white'
                            }}>
                              {s.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {s.location && <div>Location: <strong style={{ color: 'white' }}>{s.location}</strong></div>}
                            {s.address && <div>Address: <span style={{ color: '#d4d4d8' }}>{s.address}</span></div>}
                            {s.postcode && <div>Postcode: <span style={{ color: '#d4d4d8' }}>{s.postcode}</span></div>}
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(s.link)}
                          style={{
                            marginTop: '14px',
                            padding: '8px 12px',
                            backgroundColor: '#3f3f46',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          View Sites →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 11: Unscheduled */}
              {searchData.results.unscheduled.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#f472b6' }}>
                    🚨 Unscheduled Clock-Ins ({searchData.results.unscheduled.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.unscheduled.map((u) => (
                      <div
                        key={u.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{u.staffName}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: '#b45309',
                              color: 'white'
                            }}>
                              Pending Approval
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Site: <strong style={{ color: 'white' }}>{u.siteName}</strong></div>
                            <div>Date: <strong style={{ color: 'white' }}>{u.date}</strong></div>
                            <div>Requested: <span style={{ color: '#d4d4d8' }}>{new Date(u.requestTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span></div>
                            {u.notes && <div>Notes: <span style={{ color: '#d4d4d8' }}>{u.notes}</span></div>}
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(u.link)}
                          style={{
                            marginTop: '14px',
                            padding: '8px 12px',
                            backgroundColor: '#3f3f46',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          Review Unscheduled →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 12: Payroll */}
              {searchData.results.payroll.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#a78bfa' }}>
                    💰 Payroll - Clocked Shifts ({searchData.results.payroll.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.payroll.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{p.staffName}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: p.clockedOut ? '#15803d' : '#b45309',
                              color: 'white'
                            }}>
                              {p.clockedOut ? 'Completed' : 'Clocked In'}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Site: <strong style={{ color: 'white' }}>{p.siteName}</strong></div>
                            <div>Date: <strong style={{ color: 'white' }}>{p.date}</strong> ({p.type})</div>
                            <div>Hours: <span style={{ color: '#d4d4d8' }}>{p.startTime} - {p.endTime} ({p.duration}h)</span></div>
                            {p.hourlyRate && <div>Rate: <span style={{ color: '#4ade80' }}>£{p.hourlyRate}/hr</span></div>}
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(p.link)}
                          style={{
                            marginTop: '14px',
                            padding: '8px 12px',
                            backgroundColor: '#3f3f46',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          View Payroll →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 13: Reports */}
              {searchData.results.reports.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#94a3b8' }}>
                    📋 Reports ({searchData.results.reports.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.reports.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{r.category || 'General'}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: r.status === 'open' ? '#15803d' : '#3f3f46',
                              color: 'white'
                            }}>
                              {r.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Created: <span style={{ color: '#d4d4d8' }}>{new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(r.link)}
                          style={{
                            marginTop: '14px',
                            padding: '8px 12px',
                            backgroundColor: '#3f3f46',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          View Reports →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 14: Queries */}
              {searchData.results.queries.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#818cf8' }}>
                    📩 Queries ({searchData.results.queries.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.queries.map((q) => (
                      <div
                        key={q.id}
                        style={{
                          backgroundColor: '#262626',
                          border: '1px solid #3f3f46',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{q.category || 'General Query'}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              backgroundColor: q.status === 'open' ? '#15803d' : '#3f3f46',
                              color: 'white'
                            }}>
                              {q.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Messages: <strong style={{ color: 'white' }}>{q.messageCount}</strong></div>
                            {q.lastMessage && <div>Last: <span style={{ color: '#d4d4d8' }}>{q.lastMessage.slice(0, 80)}{q.lastMessage.length > 80 ? '...' : ''}</span></div>}
                            <div>Created: <span style={{ color: '#d4d4d8' }}>{new Date(q.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(q.link)}
                          style={{
                            marginTop: '14px',
                            padding: '8px 12px',
                            backgroundColor: '#3f3f46',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textAlign: 'center'
                          }}
                        >
                          View Queries →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
