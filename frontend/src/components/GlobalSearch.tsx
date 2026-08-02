import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  parsed: {
    cleanText: string;
    dateLabel: string;
    dateRange: { start: string; end: string } | null;
  };
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

const PRESET_QUERIES = [
  'staff absent last week',
  'missed shifts yesterday',
  'new staff this month',
  'Lauren leave available',
  'unfilled shifts next week',
  'active workers at Thamesmead'
];

const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'staff' | 'leave' | 'shifts' | 'attendance'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchData, setSearchData] = useState<SearchResponse | null>(null);

  const fetchSearchResults = async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const authObj = JSON.parse(localStorage.getItem('social_care_auth') || '{}');
      const token = authObj.token || authObj.user?.token || '';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`https://social-care-backend.onrender.com/api/admin/global-search?q=${encodeURIComponent(searchTerm)}`, {
        headers,
      });

      if (!res.ok) {
        throw new Error(`Search request failed with status ${res.status}`);
      }

      const data: SearchResponse = await res.json();
      setSearchData(data);
    } catch (err: any) {
      console.error('Global search error:', err);
      setError(err.message || 'Failed to fetch search results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearchResults(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSearchResults(query);
  };

  const handlePresetClick = (preset: string) => {
    setQuery(preset);
    fetchSearchResults(preset);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const counts = searchData?.counts || { staff: 0, leave: 0, shifts: 0, attendance: 0 };
  const totalCount = counts.staff + counts.leave + counts.shifts + counts.attendance;

  return (
    <div style={{ padding: '24px 20px', maxWidth: '1400px', margin: '0 auto', color: 'white' }}>
      {/* Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0', color: 'white' }}>
          Admin Global Search
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
          Search operational records across Staff, Leave, Shifts, and Attendance.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearchSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search e.g. 'staff absent last week', 'Lauren leave available', 'active workers at Thamesmead'..."
              style={{
                width: '100%',
                padding: '14px 18px',
                backgroundColor: '#262626',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: 'white',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  fetchSearchResults('');
                }}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            style={{
              padding: '14px 28px',
              backgroundColor: '#9333ea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Quick Search Preset Pills */}
      <div style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', marginRight: '4px' }}>
          Quick Searches:
        </span>
        {PRESET_QUERIES.map((preset) => (
          <button
            key={preset}
            onClick={() => handlePresetClick(preset)}
            style={{
              padding: '6px 14px',
              backgroundColor: query === preset ? '#9333ea' : '#262626',
              color: query === preset ? 'white' : '#d4d4d8',
              border: '1px solid #3f3f46',
              borderRadius: '20px',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #2a2a2a', paddingBottom: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'all' ? '#9333ea' : '#262626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          All Results ({totalCount})
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'staff' ? '#9333ea' : '#262626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Staff ({counts.staff})
        </button>
        <button
          onClick={() => setActiveTab('leave')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'leave' ? '#9333ea' : '#262626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Leave ({counts.leave})
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'shifts' ? '#9333ea' : '#262626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Shifts ({counts.shifts})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          style={{
            padding: '8px 16px',
            backgroundColor: activeTab === 'attendance' ? '#9333ea' : '#262626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Attendance ({counts.attendance})
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          Searching operational records...
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ padding: '16px', backgroundColor: '#7f1d1d', color: '#fca5a5', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Search Output Results */}
      {!loading && searchData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Section 1: Staff */}
          {(activeTab === 'all' || activeTab === 'staff') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#c084fc' }}>
                  👥 Staff ({searchData.results.staff.length})
                </h2>
              </div>

              {searchData.results.staff.length === 0 ? (
                <p style={{ color: '#71717a', fontSize: '14px' }}>No matching staff records found.</p>
              ) : (
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
                        onClick={() => handleNavigate(s.link)}
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
              )}
            </div>
          )}

          {/* Section 2: Leave */}
          {(activeTab === 'all' || activeTab === 'leave') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#60a5fa' }}>
                  🌴 Leave Records ({searchData.results.leave.length})
                </h2>
              </div>

              {searchData.results.leave.length === 0 ? (
                <p style={{ color: '#71717a', fontSize: '14px' }}>No matching leave records found.</p>
              ) : (
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
                        onClick={() => handleNavigate(l.link)}
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
              )}
            </div>
          )}

          {/* Section 3: Shifts */}
          {(activeTab === 'all' || activeTab === 'shifts') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#facc15' }}>
                  📅 Shifts ({searchData.results.shifts.length})
                </h2>
              </div>

              {searchData.results.shifts.length === 0 ? (
                <p style={{ color: '#71717a', fontSize: '14px' }}>No matching shift records found.</p>
              ) : (
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
                        onClick={() => handleNavigate(sh.link)}
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
              )}
            </div>
          )}

          {/* Section 4: Attendance */}
          {(activeTab === 'all' || activeTab === 'attendance') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#f87171' }}>
                  ⏱️ Attendance & Clocking ({searchData.results.attendance.length})
                </h2>
              </div>

              {searchData.results.attendance.length === 0 ? (
                <p style={{ color: '#71717a', fontSize: '14px' }}>No matching attendance alerts found.</p>
              ) : (
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
                        onClick={() => handleNavigate(att.link)}
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
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
