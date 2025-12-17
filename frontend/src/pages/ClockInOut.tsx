import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

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
}

const ClockInOut: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const siteId = searchParams.get('site');
  
  const [staffId, setStaffId] = useState('');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const today = new Date().toISOString().split('T')[0];

  const fetchShifts = async () => {
    if (!staffId || !siteId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/staff/${staffId}/shifts`);
      if (response.ok) {
        const data = await response.json();
        // Filter for today's shifts at this site
        const todayShifts = data.filter((s: Shift) => 
          s.date === today && s.siteId === siteId
        );
        setShifts(todayShifts);
        
        if (todayShifts.length === 0) {
          setMessage('No shifts found for today at this site');
          setMessageType('error');
        }
      } else {
        setMessage('Staff ID not found');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleClockAction = async (shift: Shift, action: 'in' | 'out') => {
    setLoading(true);
    setMessage('');
    
    try {
      const endpoint = action === 'in' ? 'clock-in' : 'clock-out';
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/shifts/${shift.id}/${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            qrCode: `SITE_${siteId}`,
            staffId: shift.staffId 
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message || `Successfully clocked ${action}`);
        setMessageType('success');
        // Refresh shifts
        await fetchShifts();
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || `Failed to clock ${action}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '32px',
          paddingTop: '20px'
        }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '28px', 
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            🕐 Clock In/Out
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            {new Date().toLocaleDateString('en-GB', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div style={{
            backgroundColor: messageType === 'success' ? '#10b98120' : '#ef444420',
            border: `2px solid ${messageType === 'success' ? '#10b981' : '#ef4444'}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            color: messageType === 'success' ? '#10b981' : '#ef4444',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {message}
          </div>
        )}

        {/* Staff ID Input */}
        {shifts.length === 0 && (
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <label style={{ 
              color: '#9ca3af', 
              fontSize: '14px', 
              display: 'block',
              marginBottom: '8px'
            }}>
              Enter Your Staff ID
            </label>
            <input
              type="text"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g., STAFF_001"
              style={{
                width: '100%',
                backgroundColor: '#0a0a0a',
                border: '2px solid #3a3a3a',
                borderRadius: '12px',
                padding: '14px',
                color: 'white',
                fontSize: '16px',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') fetchShifts();
              }}
            />
            <button
              onClick={fetchShifts}
              disabled={!staffId || loading}
              style={{
                width: '100%',
                backgroundColor: staffId && !loading ? '#3b82f6' : '#3a3a3a',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: staffId && !loading ? 'pointer' : 'not-allowed',
                opacity: staffId && !loading ? 1 : 0.5
              }}
            >
              {loading ? 'Loading...' : 'Find My Shifts'}
            </button>
          </div>
        )}

        {/* Shifts Display */}
        {shifts.length > 0 && (
          <div>
            <div style={{ 
              color: 'white', 
              fontSize: '18px', 
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              Your Shifts Today
            </div>

            {shifts.map(shift => {
              const canClockIn = !shift.clockedIn;
              const canClockOut = shift.clockedIn && !shift.clockedOut;
              const isComplete = shift.clockedOut;

              return (
                <div key={shift.id} style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '16px',
                  border: '2px solid #3a3a3a'
                }}>
                  {/* Shift Info */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      color: 'white', 
                      fontSize: '18px', 
                      fontWeight: 'bold',
                      marginBottom: '4px'
                    }}>
                      {shift.siteName}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                      {shift.startTime} - {shift.endTime}
                    </div>
                  </div>

                  {/* Clock Times */}
                  {(shift.clockedIn || shift.clockedOut) && (
                    <div style={{
                      backgroundColor: '#0a0a0a',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px'
                    }}>
                      <div>
                        <div style={{ color: '#10b981', fontSize: '12px', marginBottom: '4px' }}>
                          Clock In
                        </div>
                        <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                          {shift.clockedIn ? formatTime(shift.clockInTime) : '-'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '4px' }}>
                          Clock Out
                        </div>
                        <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
                          {shift.clockedOut ? formatTime(shift.clockOutTime) : '-'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {isComplete ? (
                    <div style={{
                      backgroundColor: '#10b98120',
                      border: '2px solid #10b981',
                      borderRadius: '12px',
                      padding: '16px',
                      color: '#10b981',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      ✅ Shift Complete
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <button
                        onClick={() => handleClockAction(shift, 'in')}
                        disabled={!canClockIn || loading}
                        style={{
                          backgroundColor: canClockIn ? '#10b981' : '#3a3a3a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '16px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: canClockIn && !loading ? 'pointer' : 'not-allowed',
                          opacity: canClockIn && !loading ? 1 : 0.5
                        }}
                      >
                        {loading ? '...' : '✓ Clock In'}
                      </button>
                      <button
                        onClick={() => handleClockAction(shift, 'out')}
                        disabled={!canClockOut || loading}
                        style={{
                          backgroundColor: canClockOut ? '#ef4444' : '#3a3a3a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '16px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: canClockOut && !loading ? 'pointer' : 'not-allowed',
                          opacity: canClockOut && !loading ? 1 : 0.5
                        }}
                      >
                        {loading ? '...' : '✗ Clock Out'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Back Button */}
            <button
              onClick={() => {
                setStaffId('');
                setShifts([]);
                setMessage('');
              }}
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                color: '#9ca3af',
                border: '2px solid #3a3a3a',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '16px'
              }}
            >
              ← Back to Staff ID
            </button>
          </div>
        )}

        {/* Help Text */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.6' }}>
            <strong style={{ color: 'white', display: 'block', marginBottom: '8px' }}>
              Need Help?
            </strong>
            1. Enter your Staff ID (e.g., STAFF_001)<br />
            2. Your shifts for today will appear<br />
            3. Tap "Clock In" when you arrive<br />
            4. Tap "Clock Out" when you leave<br />
            <br />
            <strong style={{ color: 'white' }}>Don't know your Staff ID?</strong><br />
            Contact your supervisor or check your employee card.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClockInOut;
