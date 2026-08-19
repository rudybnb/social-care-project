import React, { useState } from 'react';
import { Shift } from '../data/sharedData';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { approvalAPI } from '../services/approvalAPI';
import { formatUkTime, getUkDate } from '../utils/ukDateTime';


const ClockInOut: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const siteId = searchParams.get('site');

  const [phoneDigits, setPhoneDigits] = useState('');
  const [staffId, setStaffId] = useState('');
  const [staffName, setStaffName] = useState('');
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isUnscheduled, setIsUnscheduled] = useState(false);
  const [approvalRequested, setApprovalRequested] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [pendingStaffName, setPendingStaffName] = useState('');
  const [pendingStaffId, setPendingStaffId] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [showHelpPanel, setShowHelpPanel] = useState(false);
  const [helpStep, setHelpStep] = useState<'menu' | 'full_phone' | 'flagged'>('menu');
  const [fullPhoneInput, setFullPhoneInput] = useState('');
  const [assistantMessage, setAssistantMessage] = useState('');

  const handleFullPhoneVerify = async () => {
    if (!fullPhoneInput || fullPhoneInput.length < 10) {
      setAssistantMessage('Please enter your full 10 or 11 digit phone number.');
      return;
    }
    setIsFetching(true);
    setAssistantMessage('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com'}/api/auth/login-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_full_phone',
          fullPhone: fullPhoneInput,
          siteId
        })
      });

      const data = await response.json();
      if (response.ok && data.status === 'verified' && data.verificationToken) {
        // Resolve opaque verification token single-use on server
        const resolveRes = await fetch(`${process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com'}/api/auth/login-assistant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'resolve_token',
            verificationToken: data.verificationToken
          })
        });

        const resolveData = await resolveRes.json();
        if (resolveRes.ok && resolveData.status === 'resolved' && resolveData.staffId) {
          setPendingStaffId(resolveData.staffId);
          setPendingStaffName(resolveData.name);
          setNeedsConfirmation(true);
          setShowHelpPanel(false);
          setMessage(`Verified! Is this you: ${resolveData.name}? Confirm to see your shifts.`);
          setMessageType('success');
        } else {
          setAssistantMessage('Verification token expired or invalid. Please try again.');
        }
      } else {
        setAssistantMessage(data.message || 'Phone number not found or unable to verify.');
      }
    } catch (e) {
      setAssistantMessage('Network error during verification. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleFlagAdminReview = async () => {
    setIsFetching(true);
    try {
      await fetch(`${process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com'}/api/auth/login-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'flag_admin_review',
          phoneDigits,
          siteId
        })
      });
      setHelpStep('flagged');
    } catch (e) {
      setAssistantMessage('Failed to flag review. Please inform site management.');
    } finally {
      setIsFetching(false);
    }
  };

  const today = getUkDate();

  const fetchShifts = async () => {
    if (!phoneDigits || phoneDigits.length !== 4) {
      setMessage('Please enter exactly 4 digits');
      setMessageType('error');
      return;
    }

    setIsFetching(true);
    setMessage('');
    setMessageType('');
    setDuplicateWarning('');

    try {
      const staffResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com'}/api/staff/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneDigits, siteId })
      });

      if (!staffResponse.ok) {
        if (staffResponse.status === 404) {
          setMessage('Phone number not found. Please check the last 4 digits.');
        } else {
          setMessage('Error looking up staff details. Please try again.');
        }
        setMessageType('error');
        setIsFetching(false);
        return;
      }

      const staffMember = await staffResponse.json();

      // Handle duplicate match response from backend
      if (staffMember.duplicate && staffMember.candidates) {
        setMessage(staffMember.message || 'Multiple staff match these digits. Please verify with your full phone number.');
        setMessageType('error');
        setIsFetching(false);
        return;
      }

      // Show confirmation before proceeding
      setPendingStaffName(staffMember.name);
      setPendingStaffId(staffMember.id);
      setNeedsConfirmation(true);
      setMessage(`Is this you: ${staffMember.name}? Confirm to see your shifts.`);
      setMessageType('success');
    } catch (error) {
      console.error('Network error:', error);
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setIsFetching(false);
    }
  };

  const confirmStaff = async () => {
    setStaffId(pendingStaffId);
    setStaffName(pendingStaffName);
    setNeedsConfirmation(false);
    setMessage('');
    setMessageType('');

    try {
      const shiftsResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com'}/api/staff/${pendingStaffId}/shifts`);
      if (shiftsResponse.ok) {
        const data = await shiftsResponse.json();
        // Filter for today's shifts or previous-day night shifts at this site using UK local date
        const todayLocal = getUkDate();
        const yesterdayObj = new Date();
        yesterdayObj.setDate(yesterdayObj.getDate() - 1);
        const yesterdayLocal = yesterdayObj.toLocaleDateString('en-CA', { timeZone: 'Europe/London' });

        const matchSite = (shiftSiteId?: string, targetSiteId?: string | null) => {
          if (!shiftSiteId || !targetSiteId) return true; // Default match if site unconstrained
          if (shiftSiteId === targetSiteId) return true;
          // Normalize SITE_001 vs UUID fallback comparisons safely
          const cleanShift = shiftSiteId.replace(/^SITE_/i, '').trim();
          const cleanTarget = targetSiteId.replace(/^SITE_/i, '').trim();
          return cleanShift === cleanTarget || shiftSiteId.includes(targetSiteId) || targetSiteId.includes(shiftSiteId);
        };

        const todayShifts = data.filter((s: Shift) => {
          const isSiteMatch = matchSite(s.siteId, siteId);
          const isTodayShift = s.date === todayLocal;
          const isActiveShift = s.clockedIn && !s.clockedOut;
          // Only show shifts eligible for clock-in: accepted status or already active
          const isEligibleStatus = s.staffStatus === 'accepted' || s.staffStatus === undefined;
          // Previous-day night shift starting >= 18:00 (eligible past midnight until clocked out)
          const isEligibleNightShift =
            s.date === yesterdayLocal &&
            !s.clockedOut &&
            (s.startTime >= '18:00' || (s.type && s.type.toLowerCase().includes('night')));

          // Active open shifts (clockedIn && !clockedOut) must ALWAYS be returned regardless of kiosk site, so the worker can clock out
          return isActiveShift || (isSiteMatch && isEligibleStatus && (isTodayShift || isEligibleNightShift));
        });
        setShifts(todayShifts);

        if (todayShifts.length === 0) {
          // Check if shifts exist but are pending/declined (not yet eligible)
          const pendingOrDeclined = data.filter((s: Shift) => {
            const isSiteMatch = matchSite(s.siteId, siteId);
            const isTodayShift = s.date === todayLocal;
            return isSiteMatch && isTodayShift && (s.staffStatus === 'pending' || s.staffStatus === 'declined');
          });

          if (pendingOrDeclined.length > 0) {
            const statusMsg = pendingOrDeclined[0].staffStatus === 'declined'
              ? `Hello ${pendingStaffName}! Your shift today has been declined. Please contact your manager.`
              : `Hello ${pendingStaffName}! Your shift today is pending acceptance. Please accept it in your app before clocking in.`;
            setMessage(statusMsg);
            setMessageType('error');
          } else {
            setIsUnscheduled(true);

            try {
              const approvedRequest = await approvalAPI.checkApprovedRequest(pendingStaffId, siteId!, todayLocal);
              if (approvedRequest) {
                const refreshedShifts = await fetch(`${process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com'}/api/staff/${pendingStaffId}/shifts`);
                if (refreshedShifts.ok) {
                  const refreshedData = await refreshedShifts.json();
                  const refreshedTodayShifts = refreshedData.filter((s: Shift) =>
                    (s.clockedIn && !s.clockedOut) || (
                      matchSite(s.siteId, siteId) &&
                      (s.staffStatus === 'accepted' || s.staffStatus === undefined) &&
                      (s.date === todayLocal || (s.date === yesterdayLocal && !s.clockedOut && (s.startTime >= '18:00' || (s.type && s.type.toLowerCase().includes('night')))))
                    )
                  );

                  if (refreshedTodayShifts.length > 0) {
                    setShifts(refreshedTodayShifts);
                    setIsUnscheduled(false);
                    setMessage(`Welcome ${pendingStaffName}! Your unscheduled shift has been approved.`);
                    setMessageType('success');
                  } else {
                    setMessage(`Hello ${pendingStaffName}! Your unscheduled shift has been approved. You may clock in.`);
                    setMessageType('success');
                    setApprovalRequested(true);
                  }
                }
              } else {
                setMessage(`Hello ${pendingStaffName}! You are not scheduled to work today at this site.`);
                setMessageType('error');
              }
            } catch (err) {
              console.error('Error checking approval:', err);
              setMessage(`Hello ${pendingStaffName}! You are not scheduled to work today at this site.`);
              setMessageType('error');
            }
          }
        } else {
          setIsUnscheduled(false);
          setMessage(`Welcome ${pendingStaffName}!`);
          setMessageType('success');
        }
      } else {
        setMessage('Error loading shifts');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Network error:', error);
      setMessage('Network error. Please try again.');
      setMessageType('error');
    }
  };

  const handleClockAction = async (shift: Shift, action: 'in' | 'out') => {
    setLoadingId(shift.id);
    setMessage('');

    try {
      const endpoint = action === 'in' ? 'clock-in' : 'clock-out';
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com'}/api/shifts/${shift.id}/${endpoint}`,
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
      setLoadingId(null);
    }
  };

  const handleRequestApproval = async () => {
    if (!staffId || !staffName || !siteId) return;

    setLoadingId('approval');
    try {
      // Get site name
      const sitesResponse = await fetch(`${process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com'}/api/sites`);
      const sites = await sitesResponse.json();
      const site = sites.find((s: any) => s.id === siteId);
      const siteName = site?.name || 'Unknown Site';

      await approvalAPI.createRequest({
        staffId,
        staffName,
        siteId,
        siteName,
        date: today
      });

      setMessage('Approval request sent to admin. Please wait for approval before clocking in.');
      setMessageType('success');
      setApprovalRequested(true);
    } catch (error) {
      setMessage('Failed to send approval request. Please try again.');
      setMessageType('error');
    } finally {
      setLoadingId(null);
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    return formatUkTime(timestamp);
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
              year: 'numeric',
              timeZone: 'Europe/London'
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
        {shifts.length === 0 && !needsConfirmation && (
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
              Enter Last 4 Digits of Your Phone Number
            </label>
            <input
              type="tel"
              value={phoneDigits}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                setPhoneDigits(value);
              }}
              placeholder="e.g., 1234"
              maxLength={4}
              inputMode="numeric"
              pattern="[0-9]*"
              style={{
                width: '100%',
                backgroundColor: '#0a0a0a',
                border: '2px solid #3a3a3a',
                borderRadius: '12px',
                padding: '14px',
                color: 'white',
                fontSize: '24px',
                letterSpacing: '8px',
                textAlign: 'center',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && phoneDigits.length === 4) fetchShifts();
              }}
            />
            <button
              onClick={fetchShifts}
              disabled={phoneDigits.length !== 4 || isFetching}
              style={{
                width: '100%',
                backgroundColor: phoneDigits.length === 4 && !isFetching ? '#3b82f6' : '#3a3a3a',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: phoneDigits.length === 4 && !isFetching ? 'pointer' : 'not-allowed',
                opacity: phoneDigits.length === 4 && !isFetching ? 1 : 0.5,
                marginBottom: '16px'
              }}
            >
              {isFetching ? 'Loading...' : 'Find My Shifts'}
            </button>

            {/* Need Help Toggle */}
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setShowHelpPanel(!showHelpPanel);
                  setHelpStep('menu');
                  setAssistantMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {showHelpPanel ? 'Hide Support' : 'Need help logging in? 💬'}
              </button>
            </div>

            {/* Support Assistant Panel */}
            {showHelpPanel && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: '#262626',
                borderRadius: '12px',
                border: '1px solid #404040'
              }}>
                <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
                  💬 Clock-In Support Assistant
                </div>

                {assistantMessage && (
                  <div style={{
                    backgroundColor: '#ef444420',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    padding: '10px',
                    color: '#ef4444',
                    fontSize: '13px',
                    marginBottom: '12px'
                  }}>
                    {assistantMessage}
                  </div>
                )}

                {helpStep === 'menu' && (
                  <div>
                    <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
                      Having trouble with your 4-digit PIN? Choose an option below:
                    </div>

                    <button
                      onClick={() => setHelpStep('full_phone')}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginBottom: '8px'
                      }}
                    >
                      📱 Verify with Full Phone Number
                    </button>

                    <button
                      onClick={handleFlagAdminReview}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      ⚠️ Flag for Admin Review
                    </button>
                  </div>
                )}

                {helpStep === 'full_phone' && (
                  <div>
                    <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                      Enter your full phone number to verify identity (never displayed on screen):
                    </div>
                    <input
                      type="tel"
                      value={fullPhoneInput}
                      onChange={(e) => setFullPhoneInput(e.target.value)}
                      placeholder="e.g. 07123456789"
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#0a0a0a',
                        border: '1px solid #3a3a3a',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '16px',
                        marginBottom: '12px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleFullPhoneVerify}
                        disabled={isFetching}
                        style={{
                          flex: 1,
                          padding: '12px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        {isFetching ? 'Verifying...' : 'Verify'}
                      </button>
                      <button
                        onClick={() => setHelpStep('menu')}
                        style={{
                          padding: '12px',
                          backgroundColor: '#404040',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}

                {helpStep === 'flagged' && (
                  <div style={{
                    backgroundColor: '#10b98120',
                    border: '1px solid #10b981',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#10b981',
                    fontSize: '13px'
                  }}>
                    ✅ An internal Admin review alert has been recorded for your account. Please notify site management so they can review your profile.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Confirmation Dialog */}
        {needsConfirmation && (
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '2px solid #3b82f6'
          }}>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              Confirm Your Identity
            </div>
            <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
              Is this you: <strong style={{ color: 'white' }}>{pendingStaffName}</strong>?
            </div>
            {duplicateWarning && (
              <div style={{
                backgroundColor: '#f59e0b20',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                color: '#f59e0b',
                fontSize: '13px'
              }}>
                ⚠️ {duplicateWarning}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => {
                  setNeedsConfirmation(false);
                  setPendingStaffName('');
                  setPendingStaffId('');
                  setPhoneDigits('');
                  setMessage('');
                  setMessageType('');
                  setDuplicateWarning('');
                }}
                style={{
                  backgroundColor: '#3a3a3a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                No, Not Me
              </button>
              <button
                onClick={confirmStaff}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Yes, That's Me
              </button>
            </div>
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
                        disabled={!canClockIn || loadingId !== null}
                        style={{
                          backgroundColor: canClockIn ? '#10b981' : '#3a3a3a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '16px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: canClockIn && loadingId === null ? 'pointer' : 'not-allowed',
                          opacity: canClockIn && loadingId === null ? 1 : 0.5
                        }}
                      >
                        {loadingId === shift.id && canClockIn ? '...' : '✓ Clock In'}
                      </button>
                      <button
                        onClick={() => handleClockAction(shift, 'out')}
                        disabled={!canClockOut || loadingId !== null}
                        style={{
                          backgroundColor: canClockOut ? '#ef4444' : '#3a3a3a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          padding: '16px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: canClockOut && loadingId === null ? 'pointer' : 'not-allowed',
                          opacity: canClockOut && loadingId === null ? 1 : 0.5
                        }}
                      >
                        {loadingId === shift.id && canClockOut ? '...' : '✗ Clock Out'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Back Button */}
            <button
              onClick={() => {
                setPhoneDigits('');
                setStaffId('');
                setStaffName('');
                setShifts([]);
                setMessage('');
                setIsUnscheduled(false);
                setApprovalRequested(false);
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
              ← Back to Phone Number
            </button>
          </div>
        )}

        {/* Unscheduled - Request Approval */}
        {isUnscheduled && staffId && shifts.length === 0 && (
          <div>
            <div style={{
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '16px'
            }}>
              Request Approval to Clock In
            </div>

            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '16px',
              border: '2px solid #3a3a3a'
            }}>
              <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
                You are not scheduled to work today at this site. Click the button below to request admin approval for an unscheduled shift.
              </div>

              <button
                onClick={handleRequestApproval}
                disabled={loadingId === 'unscheduled' || approvalRequested}
                style={{
                  width: '100%',
                  backgroundColor: !approvalRequested && loadingId !== 'unscheduled' ? '#f59e0b' : '#3a3a3a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: !approvalRequested && loadingId !== 'unscheduled' ? 'pointer' : 'not-allowed',
                  opacity: !approvalRequested && loadingId !== 'unscheduled' ? 1 : 0.5
                }}
              >
                {loadingId === 'unscheduled' ? 'Sending Request...' : approvalRequested ? '✓ Request Sent' : '📋 Request Admin Approval'}
              </button>
            </div>

            {/* Back Button */}
            <button
              onClick={() => {
                setPhoneDigits('');
                setStaffId('');
                setStaffName('');
                setShifts([]);
                setMessage('');
                setIsUnscheduled(false);
                setApprovalRequested(false);
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
                cursor: 'pointer'
              }}
            >
              ← Back to Phone Number
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
