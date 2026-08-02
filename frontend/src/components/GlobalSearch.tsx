import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, sitesAPI } from '../services/api';
import { Site } from '../data/sharedData';
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
  const [dateFilter, setDateFilter] = useState<string>('any');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [query, setQuery] = useState<string>('');

  // Dynamic Sites List loaded from Database
  const [dynamicSites, setDynamicSites] = useState<Site[]>([]);
  const [sitesLoading, setSitesLoading] = useState<boolean>(false);

  // Search Results State
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);

  // Load sites dynamically from database
  useEffect(() => {
    let isMounted = true;
    const loadSites = async () => {
      setSitesLoading(true);
      try {
        const fetchedSites = await sitesAPI.getAll();
        if (isMounted) {
          setDynamicSites(fetchedSites);
        }
      } catch (err) {
        console.warn('Failed to load dynamic sites for filter dropdown:', err);
      } finally {
        if (isMounted) setSitesLoading(false);
      }
    };
    loadSites();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch search results from backend API
  const executeSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (query.trim()) queryParams.set('q', query.trim());
      if (section && section !== 'all') queryParams.set('section', section);
      if (site && site !== 'all') queryParams.set('site', site);
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
        // Fallback check from localStorage if context token is pending
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
      setSearchData(data);
    } catch (err: any) {
      console.error('Global Search Error:', err);
      setError(err.message || 'Failed to fetch search results');
    } finally {
      setLoading(false);
    }
  }, [query, section, site, dateFilter, startDate, endDate, token]);

  // Initial load
  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleResetFilters = () => {
    setSection('all');
    setSite('all');
    setDateFilter('any');
    setStartDate('');
    setEndDate('');
    setQuery('');
  };

  const counts = searchData?.counts || { staff: 0, leave: 0, shifts: 0, attendance: 0 };
  const totalResultsCount = counts.staff + counts.leave + counts.shifts + counts.attendance;

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1400px', margin: '0 auto', color: 'white' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0', color: 'white' }}>
          Admin Global Search
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
          Filter and search operational records across Staff, Annual Leave, Rota / Shifts, and Attendance.
        </p>
      </div>

      {/* Filter Card / Controls */}
      <div style={{
        backgroundColor: '#262626',
        border: '1px solid #3f3f46',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '28px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Top Row: Dropdowns */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '16px'
          }}>
            {/* 1. Section Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#d4d4d8', marginBottom: '6px' }}>
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="all">All Sections</option>
                <option value="staff">Directory / Staff</option>
                <option value="leave">Annual Leave</option>
                <option value="shifts">Rota / Shifts / Unscheduled Shifts</option>
                <option value="attendance">Attendance</option>
              </select>
            </div>

            {/* 2. Site Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#d4d4d8', marginBottom: '6px' }}>
                Site
              </label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="all">All Sites</option>
                {sitesLoading && <option disabled>Loading database sites...</option>}
                {dynamicSites.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.location || s.status})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Date Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#d4d4d8', marginBottom: '6px' }}>
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                <option value="any">Any Date</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this_week">This Week</option>
                <option value="last_week">Last Week</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
          </div>

          {/* Optional Custom Date Pickers */}
          {dateFilter === 'custom' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#18181b',
              borderRadius: '8px',
              border: '1px solid #3f3f46'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {/* Bottom Row: Search Input & Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search staff name, username, role, status or operational detail..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: '#9333ea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                padding: '12px 18px',
                backgroundColor: '#3f3f46',
                color: '#d4d4d8',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Reset Filters
            </button>
          </div>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '15px' }}>
          Searching operational database records...
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#7f1d1d',
          color: '#fca5a5',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          <strong>Search Request Error:</strong> {error}
        </div>
      )}

      {/* Results or Empty State */}
      {!loading && !error && searchData && (
        <div>
          {totalResultsCount === 0 ? (
            /* No Results Found Banner */
            <div style={{
              backgroundColor: '#262626',
              border: '1px dashed #3f3f46',
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', margin: '0 0 8px 0' }}>
                No results found
              </h3>
              <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0, maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
                No matching records were found for the selected filters. Try broadening your section, site, date, or search query.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

              {/* Section 1: Staff */}
              {searchData.results.staff.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#c084fc' }}>
                    👥 Directory / Staff ({searchData.results.staff.length})
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {searchData.results.staff.map((s) => (
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
                              backgroundColor: s.status === 'Active' ? '#15803d' : '#991b1b',
                              color: 'white'
                            }}>
                              {s.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div>Role: <strong style={{ color: 'white' }}>{s.role}</strong></div>
                            <div>Site: <strong style={{ color: 'white' }}>{s.site}</strong></div>
                            {s.username && <div>Username: <span style={{ color: '#d4d4d8' }}>{s.username}</span></div>}
                            {s.email && <div>Email: <span style={{ color: '#d4d4d8' }}>{s.email}</span></div>}
                            {s.startDate && <div>Started: <span style={{ color: '#d4d4d8' }}>{s.startDate}</span></div>}
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
                          View in Directory →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Leave */}
              {searchData.results.leave.length > 0 && (
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 14px 0', color: '#60a5fa' }}>
                    🌴 Annual Leave ({searchData.results.leave.length})
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
                            {l.category === 'request' ? (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                backgroundColor: l.status === 'approved' ? '#15803d' : l.status === 'pending' ? '#b45309' : '#991b1b',
                                color: 'white',
                                textTransform: 'capitalize'
                              }}>
                                {l.status}
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                backgroundColor: '#1d4ed8',
                                color: 'white'
                              }}>
                                Balance
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '13px', color: '#a1a1aa', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {l.category === 'balance' ? (
                              <>
                                <div>Remaining Available: <strong style={{ color: '#4ade80' }}>{l.hoursRemaining} hrs</strong></div>
                                <div>Accrued to Date: <span style={{ color: '#d4d4d8' }}>{l.hoursAccrued} hrs</span></div>
                                <div>Annual Entitlement: <span style={{ color: '#d4d4d8' }}>{l.totalEntitlement} hrs</span></div>
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
