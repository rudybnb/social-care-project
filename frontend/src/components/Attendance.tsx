import React, { useState, useEffect } from 'react';

interface Shift {
  id: string;
  date: string;
  staffId: string;
  staffName: string;
  siteName: string;
  siteId: string;
  startTime: string;
  endTime: string;
  clockedIn: boolean;
  clockedOut: boolean;
  clockInTime?: string;
  clockOutTime?: string;
  duration: number;
}

const Attendance: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSite, setSelectedSite] = useState('all');
  const [sites, setSites] = useState<any[]>([]);

  useEffect(() => {
    fetchShifts();
    fetchSites();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchShifts, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const fetchShifts = async () => {
    try {
      console.log('Fetching shifts from backend...');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com'}/api/shifts`);
      console.log('Shifts response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log(`Fetched ${data.length} shifts`);
        setShifts(data);
      } else {
        console.error('Failed to fetch shifts:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com'}/api/sites`);
      if (response.ok) {
        const data = await response.json();
        setSites(data);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  // Filter shifts for selected date
  const todayShifts = shifts.filter(s => s.date === selectedDate);
  const filteredShifts = selectedSite === 'all' 
    ? todayShifts 
    : todayShifts.filter(s => s.siteId === selectedSite);

  // Categorize shifts
  const currentlyClockedIn = filteredShifts.filter(s => s.clockedIn && !s.clockedOut);
  const completedShifts = filteredShifts.filter(s => s.clockedOut);
  const notStarted = filteredShifts.filter(s => !s.clockedIn);

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (clockIn?: string, clockOut?: string) => {
    if (!clockIn || !clockOut) return 'N/A';
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return `${diff.toFixed(2)}h`;
  };

  const handleAdminClockIn = async (shiftId: string) => {
    if (!window.confirm('Clock in this staff member now?')) return;
    
    try {
      const now = new Date().toISOString();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com'}/api/shifts/${shiftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clocked_in: true,
          clock_in_time: now
        })
      });
      
      if (response.ok) {
        alert('Staff clocked in successfully!');
        fetchShifts();
      } else {
        const errorText = await response.text();
        console.error('Clock in failed:', errorText);
        alert('Failed to clock in staff');
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Error clocking in staff');
    }
  };

  const handleAdminClockOut = async (shiftId: string) => {
    if (!window.confirm('Clock out this staff member now?')) return;
    
    try {
      const now = new Date().toISOString();
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com'}/api/shifts/${shiftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clocked_out: true,
          clock_out_time: now
        })
      });
      
      if (response.ok) {
        alert('Staff clocked out successfully!');
        fetchShifts();
      } else {
        const errorText = await response.text();
        console.error('Clock out failed:', errorText);
        alert('Failed to clock out staff');
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Error clocking out staff');
    }
  };

  const handleEditClockTime = async (shiftId: string, type: 'in' | 'out', currentTime?: string) => {
    const timeType = type === 'in' ? 'Clock In' : 'Clock Out';
    const currentTimeStr = currentTime ? new Date(currentTime).toLocaleString('en-GB') : 'Not set';
    const newTime = prompt(`Edit ${timeType} time\n\nCurrent: ${currentTimeStr}\n\nEnter new time (YYYY-MM-DD HH:MM format):\nExample: 2025-12-22 08:30`);
    
    if (!newTime) return;
    
    try {
      const timestamp = new Date(newTime).toISOString();
      const updates = type === 'in' 
        ? { clocked_in: true, clock_in_time: timestamp }
        : { clocked_out: true, clock_out_time: timestamp };
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com'}/api/shifts/${shiftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        alert(`${timeType} time updated successfully!`);
        fetchShifts();
      } else {
        const errorText = await response.text();
        console.error('Edit time failed:', errorText);
        alert(`Failed to update ${timeType} time`);
      }
    } catch (error) {
      console.error('Error updating time:', error);
      alert('Invalid time format. Please use YYYY-MM-DD HH:MM format');
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            📊 Attendance Monitoring
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            Real-time view of staff clock in/out status • Auto-refreshes every 30 seconds
          </p>
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ color: '#9ca3af', fontSize: '13px', display: 'block', marginBottom: '4px' }}>
              Site
            </label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                padding: '10px 14px',
                color: 'white',
                fontSize: '14px',
                minWidth: '200px'
              }}
            >
              <option value="all">All Sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              fetchShifts();
            }}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#6b7280' : '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              alignSelf: 'flex-end',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            backgroundColor: '#10b98120',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ color: '#10b981', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              ✅ Currently Clocked In
            </div>
            <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
              {currentlyClockedIn.length}
            </div>
          </div>

          <div style={{
            backgroundColor: '#3b82f620',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              ✓ Completed Shifts
            </div>
            <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
              {completedShifts.length}
            </div>
          </div>

          <div style={{
            backgroundColor: '#f59e0b20',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              ⏳ Not Started
            </div>
            <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
              {notStarted.length}
            </div>
          </div>

          <div style={{
            backgroundColor: '#8b5cf620',
            border: '2px solid #8b5cf6',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ color: '#8b5cf6', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              📋 Total Shifts
            </div>
            <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
              {filteredShifts.length}
            </div>
          </div>
        </div>

        {/* Currently Clocked In Section */}
        {currentlyClockedIn.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              🟢 Currently On Site
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {currentlyClockedIn.map(shift => (
                <div key={shift.id} style={{
                  backgroundColor: '#1a1a1a',
                  border: '2px solid #10b981',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                      {shift.staffName}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                      {shift.siteName} • {shift.startTime} - {shift.endTime}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#10b981', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      Clocked In
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                      {formatTime(shift.clockInTime)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Shifts Section */}
        {completedShifts.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              ✅ Completed Today
            </h2>
            <div style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: '12px', 
              overflow: 'hidden',
              border: '1px solid #3a3a3a'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#2a2a2a' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '13px', fontWeight: '600' }}>Staff</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '13px', fontWeight: '600' }}>Site</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '13px', fontWeight: '600' }}>Scheduled</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '13px', fontWeight: '600' }}>Clock In</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '13px', fontWeight: '600' }}>Clock Out</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '13px', fontWeight: '600' }}>Duration</th>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#9ca3af', fontSize: '13px', fontWeight: '600' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {completedShifts.map(shift => (
                    <tr key={shift.id} style={{ borderTop: '1px solid #3a3a3a' }}>
                      <td style={{ padding: '12px', color: 'white', fontSize: '14px' }}>{shift.staffName}</td>
                      <td style={{ padding: '12px', color: '#9ca3af', fontSize: '14px' }}>{shift.siteName}</td>
                      <td style={{ padding: '12px', color: '#9ca3af', fontSize: '14px' }}>{shift.startTime} - {shift.endTime}</td>
                      <td style={{ padding: '12px', color: '#10b981', fontSize: '14px' }}>{formatTime(shift.clockInTime)}</td>
                      <td style={{ padding: '12px', color: '#ef4444', fontSize: '14px' }}>{formatTime(shift.clockOutTime)}</td>
                      <td style={{ padding: '12px', color: 'white', fontSize: '14px', fontWeight: '600' }}>
                        {calculateDuration(shift.clockInTime, shift.clockOutTime)}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEditClockTime(shift.id, 'in', shift.clockInTime)}
                            style={{
                              backgroundColor: '#10b98120',
                              border: '1px solid #10b981',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              color: '#10b981',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            Edit In
                          </button>
                          <button
                            onClick={() => handleEditClockTime(shift.id, 'out', shift.clockOutTime)}
                            style={{
                              backgroundColor: '#ef444420',
                              border: '1px solid #ef4444',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              color: '#ef4444',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            Edit Out
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Not Started Section */}
        {notStarted.length > 0 && (
          <div>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              ⏳ Awaiting Clock In
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {notStarted.map(shift => (
                <div key={shift.id} style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                      {shift.staffName}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                      {shift.siteName} • {shift.startTime} - {shift.endTime}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      backgroundColor: '#f59e0b20',
                      border: '1px solid #f59e0b',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: '#f59e0b',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      Not Started
                    </div>
                    <button
                      onClick={() => handleAdminClockIn(shift.id)}
                      style={{
                        backgroundColor: '#10b98120',
                        border: '1px solid #10b981',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: '#10b981',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Clock In
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
            Loading attendance data...
          </div>
        )}

        {!loading && filteredShifts.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
            No shifts found for the selected date and site.
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
