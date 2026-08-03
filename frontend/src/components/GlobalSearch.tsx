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

interface SearchResponse {
  query: string;
  counts: {
    staff: number;
    leave: number;
    shifts: number;
    attendance: number;
  };
  results: {
    staff: StaffResult[];
    leave: LeaveResult[];
    shifts: ShiftResult[];
    attendance: AttendanceResult[];
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

      const cleanData: SearchResponse = {
        ...data,
        counts: {
          staff: uniqueStaffResults.length,
          leave: uniqueLeaveResults.length,
          shifts: uniqueShiftsResults.length,
          attendance: uniqueAttendanceResults.length
        },
        results: {
          staff: uniqueStaffResults,
          leave: uniqueLeaveResults,
          shifts: uniqueShiftsResults,
          attendance: uniqueAttendanceResults
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

  const handleDeleteStaff = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete staff member "${name}"? This action cannot be undone.`)) {
      try {
        await staffAPI.delete(id, token);
        setDynamicStaff(prev => prev.filter(st => String(st.id) !== String(id)));
        if (hasSearched) {
          executeSearch();
        }
      } catch (err: any) {
        alert(err.message || 'Failed to delete staff member');
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
    searchData.counts.staff + searchData.counts.leave + searchData.counts.shifts + searchData.counts.attendance
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
          Search across Staff Directory, Annual Leave, Rota / Shifts, and Attendance. Use plain English or quick filters.
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

        {/* Quick Suggestion Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: '600', marginRight: '4px' }}>Quick Searches:</span>
          {[
            'Lauren leave available',
            'missed shifts yesterday',
            'unfilled shifts next week',
            'active workers at Thamesmead',
            'staff absent last week'
          ].map((chipText) => (
            <button
              key={chipText}
              onClick={() => handleQuickChip(chipText)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '20px',
                color: '#d4d4d8',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {chipText}
            </button>
          ))}
        </div>

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
                <option value="all">All Categories</option>
                <option value="staff">Staff Directory</option>
                <option value="leave">Annual Leave</option>
                <option value="shifts">Rota / Shifts</option>
                <option value="attendance">Attendance</option>
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

            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              <span style={{ color: '#60a5fa' }}>👥 Staff ({searchData.counts.staff})</span>
              <span style={{ color: '#4ade80' }}>🏖️ Leave ({searchData.counts.leave})</span>
              <span style={{ color: '#facc15' }}>📅 Shifts ({searchData.counts.shifts})</span>
              <span style={{ color: '#f87171' }}>⏱️ Attendance ({searchData.counts.attendance})</span>
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
                            onClick={() => handleDeleteStaff(st.id, st.name)}
                            title="Delete staff member"
                            style={{
                              padding: '8px 12px',
                              backgroundColor: '#991b1b',
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
                            🗑️ Delete
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

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
