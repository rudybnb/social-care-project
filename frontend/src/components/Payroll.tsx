import React, { useState, useEffect } from 'react';
import { getShifts, getStaff, subscribeToDataChange, getAllWorkers, forceRefreshShifts } from '../data/sharedData';
import { calculateWeeklyHours } from '../utils/hoursCalculator';
import { leaveAPI } from '../services/leaveAPI';

const Payroll: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [shifts, setShifts] = useState(getShifts());
  const staff = getAllWorkers().filter(s =>
    s.name !== 'Bank Management' &&
    s.name !== 'Agency' &&
    s.name !== 'BANK (Placeholder)'
  ); // Include both permanent staff and agency workers, excluding placeholders
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Subscribe to shift changes
  useEffect(() => {
    const unsubscribe = subscribeToDataChange(() => {
      setShifts(getShifts());
    });
    return unsubscribe;
  }, []);

  // Load approved leave requests
  useEffect(() => {
    const loadLeaveRequests = async () => {
      try {
        const requests = await leaveAPI.getAllRequests();
        const approved = requests.filter(r => r.status === 'approved');
        setLeaveRequests(approved);
      } catch (error) {
        console.error('Error loading leave requests:', error);
      }
    };
    loadLeaveRequests();
  }, []);

  // Get week dates
  const getWeekDates = (weekOffset: number) => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7));

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: monday,
      end: sunday,
      label: `${monday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${sunday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    };
  };

  const currentWeek = getWeekDates(selectedWeek);

  // Get month dates (14th to 14th)
  const getMonthDates = (monthOffset: number) => {
    const today = new Date();
    const currentDay = today.getDate();

    // Determine the current pay period
    let periodStart: Date;
    if (currentDay >= 14) {
      // We're in the period that started on the 14th of this month
      periodStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 14);
    } else {
      // We're in the period that started on the 14th of last month
      periodStart = new Date(today.getFullYear(), today.getMonth() - 1 + monthOffset, 14);
    }

    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(14); // Ends on 14th of next month

    return {
      start: periodStart,
      end: periodEnd,
      label: `${periodStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${periodEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    };
  };

  const currentMonth = getMonthDates(selectedMonth);
  const currentPeriod = viewMode === 'weekly' ? currentWeek : currentMonth;

  // Calculate actual hours worked from clock-in/out times
  const calculateActualHours = (clockInTime?: string, clockOutTime?: string): number => {
    if (!clockInTime || !clockOutTime) return 0;
    const start = new Date(clockInTime);
    const end = new Date(clockOutTime);
    const diffMs = end.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return Math.max(0, hours); // Ensure non-negative
  };

  // Calculate payroll for each staff member
  // IMPORTANT: Only counts shifts that have been clocked in AND clocked out
  const calculatePayroll = () => {
    return staff.map(staffMember => {
      // Filter to only include COMPLETED shifts (clocked in AND clocked out)
      const staffShifts = shifts.filter(shift =>
        shift.staffName === staffMember.name &&
        shift.staffName !== 'Bank Management' &&
        shift.staffName !== 'Agency' &&
        shift.staffName !== 'BANK (Placeholder)' &&
        new Date(shift.date) >= currentPeriod.start &&
        new Date(shift.date) >= currentPeriod.start &&
        new Date(shift.date) <= currentPeriod.end
        // shift.clockedIn === true &&
        // shift.clockedOut === true // REMOVED: Now including ALL scheduled shifts regardless of clock status
      );

      let totalHours = 0;
      let dayHours = 0;
      let nightHours = 0;

      staffShifts.forEach(shift => {
        // Use SCHEDULED times for payroll calculation as per new rules
        // Calculate duration from start/end time strings (HH:MM)
        let hours = 0;
        if (shift.startTime && shift.endTime) {
          const dateStr = shift.date; // YYYY-MM-DD
          const start = new Date(`${dateStr}T${shift.startTime}:00`);
          let end = new Date(`${dateStr}T${shift.endTime}:00`);

          // Handle overnight shifts
          if (end < start) {
            end.setDate(end.getDate() + 1);
          }

          const diffMs = end.getTime() - start.getTime();
          hours = diffMs / (1000 * 60 * 60);
          hours = Math.max(0, hours);
        } else {
          // Fallback to duration if times missing (shouldn't happen on valid shifts)
          hours = shift.duration || 0;
        }
        totalHours += hours;
        if (shift.type === 'Day') {
          dayHours += hours;
        } else {
          nightHours += hours;
        }
      });

      // Add approved annual leave hours
      const staffLeave = leaveRequests.filter(leave => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        return leave.staffName === staffMember.name &&
          ((leaveStart >= currentPeriod.start && leaveStart <= currentPeriod.end) ||
            (leaveEnd >= currentPeriod.start && leaveEnd <= currentPeriod.end) ||
            (leaveStart <= currentPeriod.start && leaveEnd >= currentPeriod.end));
      });

      let leaveHours = 0;
      staffLeave.forEach(leave => {
        // Calculate overlapping days
        const leaveStart = new Date(Math.max(new Date(leave.startDate).getTime(), currentPeriod.start.getTime()));
        const leaveEnd = new Date(Math.min(new Date(leave.endDate).getTime(), currentPeriod.end.getTime()));
        const days = Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        leaveHours += days * 8; // 8 hours per day
      });

      // Check if this is an agency worker
      const isAgency = 'agencyName' in staffMember;

      let standardPay = 0;
      let enhancedPay = 0;
      let nightPay = 0;
      let totalPay = 0;

      if (isAgency) {
        // AGENCY WORKERS: Flat hourly rate (no tier system)
        const agencyRate = parseFloat(staffMember.hourlyRate) || 0;
        console.log(`💰 Agency Worker Pay Calculation:`, {
          name: staffMember.name,
          hourlyRateString: staffMember.hourlyRate,
          hourlyRateParsed: agencyRate,
          totalHours,
          dayHours,
          nightHours,
          calculation: `${totalHours}h × £${agencyRate} = £${totalHours * agencyRate}`
        });

        totalPay = totalHours * agencyRate;

        // For display purposes, show day hours as "standard" and night hours as "night"
        standardPay = dayHours * agencyRate;
        nightPay = nightHours * agencyRate;
        enhancedPay = 0; // Agency workers don't have enhanced rate
      } else {
        // PERMANENT STAFF: Flat rate calculation
        // Irina Mitrovici: £14/hour for all hours
        // Everyone else: £12.50/hour for all hours
        const standardRate = parseFloat(staffMember.standardRate) || 12.50;

        // Simple flat rate: all hours at standard rate (day or night)
        const workPay = (dayHours + nightHours) * standardRate;
        const leavePay = leaveHours * 12.50; // Fixed rate for all leave pay

        totalPay = workPay + leavePay;
        standardPay = totalPay;
        enhancedPay = 0;
        nightPay = 0;
      }

      return {
        name: staffMember.name,
        isAgency,
        agencyName: isAgency ? staffMember.agencyName : null,
        totalHours: totalHours + leaveHours,
        dayHours,
        nightHours,
        leaveHours,
        first20Hours: isAgency ? 0 : (dayHours <= 20 ? dayHours : 20),
        remainingHours: isAgency ? 0 : (dayHours > 20 ? dayHours - 20 : 0),
        standardPay,
        enhancedPay,
        nightPay,
        leavePay: isAgency ? 0 : (leaveHours * 12.50), // Fixed £12.50 rate for all leave pay
        totalPay,
        shifts: staffShifts.length
      };
    }).filter(p => p.totalHours > 0);
  };

  const calculateIncompleteShifts = () => {
    return shifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      const inPeriod = shiftDate >= currentPeriod.start && shiftDate <= currentPeriod.end;
      const isComplete = shift.clockedIn === true && shift.clockedOut === true;
      return inPeriod && !isComplete;
    });
  };

  const payrollData = calculatePayroll();
  const incompleteShifts = calculateIncompleteShifts();
  const totalPayroll = payrollData.reduce((sum, p) => sum + p.totalPay, 0);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '123admin') {
      setIsUnlocked(true);
      setPasswordInput('');
    } else {
      alert('❌ Incorrect password');
      setPasswordInput('');
    }
  };

  // Export to Excel/CSV function
  const exportToExcel = () => {
    // Prepare CSV headers
    const headers = [
      'Staff Name',
      'Type',
      'Total Hours',
      'Day Hours',
      'Night Hours',
      'Leave Hours',
      'Standard Pay',
      'Enhanced Pay',
      'Night Pay',
      'Leave Pay',
      'Total Pay',
      'Shifts'
    ];

    // Prepare data rows
    const rows = payrollData.map(staff => [
      staff.name,
      staff.isAgency ? `Agency (${staff.agencyName})` : 'Permanent',
      staff.totalHours.toFixed(2),
      staff.dayHours.toFixed(2),
      staff.nightHours.toFixed(2),
      staff.leaveHours.toFixed(2),
      staff.standardPay.toFixed(2),
      staff.enhancedPay.toFixed(2),
      staff.nightPay.toFixed(2),
      staff.leavePay.toFixed(2),
      staff.totalPay.toFixed(2),
      staff.shifts
    ]);

    // Add summary row
    rows.push([
      'TOTAL',
      '',
      payrollData.reduce((sum, p) => sum + p.totalHours, 0).toFixed(2),
      payrollData.reduce((sum, p) => sum + p.dayHours, 0).toFixed(2),
      payrollData.reduce((sum, p) => sum + p.nightHours, 0).toFixed(2),
      payrollData.reduce((sum, p) => sum + p.leaveHours, 0).toFixed(2),
      payrollData.reduce((sum, p) => sum + p.standardPay, 0).toFixed(2),
      payrollData.reduce((sum, p) => sum + p.enhancedPay, 0).toFixed(2),
      payrollData.reduce((sum, p) => sum + p.nightPay, 0).toFixed(2),
      payrollData.reduce((sum, p) => sum + p.leavePay, 0).toFixed(2),
      totalPayroll.toFixed(2),
      payrollData.reduce((sum, p) => sum + p.shifts, 0)
    ]);

    // Convert to CSV format
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells containing commas or quotes
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Generate filename with period
    const filename = `Payroll_${currentPeriod.label.replace(/\s+/g, '_')}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Refresh shifts from backend (useful after Telegram bot updates)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await forceRefreshShifts();
      setShifts(getShifts());
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show password screen if not unlocked
  if (!isUnlocked) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #3a3a3a',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
            <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              Payroll Access
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              This page is password protected
            </p>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: '#9ca3af',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none'
                }}
                autoFocus
              />
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
            >
              🔓 Unlock Payroll
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: '#0f0f0f',
        paddingBottom: '20px',
        zIndex: 10,
        borderBottom: '2px solid #8b5cf6'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          💰 Payroll Calculator
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
          Calculate staff wages using two-tier rate system
        </p>

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          backgroundColor: '#1a1a1a',
          padding: '8px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a',
          width: 'fit-content'
        }}>
          <button
            onClick={() => setViewMode('weekly')}
            style={{
              padding: '10px 24px',
              backgroundColor: viewMode === 'weekly' ? '#8b5cf6' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📅 Weekly
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            style={{
              padding: '10px 24px',
              backgroundColor: viewMode === 'monthly' ? '#8b5cf6' : 'transparent',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📊 Monthly ({currentMonth.start.toLocaleDateString('en-GB', { month: 'short' })}-{currentMonth.end.toLocaleDateString('en-GB', { month: 'short' })})
          </button>
        </div>

        {/* Export and Refresh Buttons */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              padding: '12px 24px',
              backgroundColor: isRefreshing ? '#4b5563' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => !isRefreshing && (e.currentTarget.style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => !isRefreshing && (e.currentTarget.style.backgroundColor = '#3b82f6')}
          >
            <span style={{ fontSize: '18px' }}>{isRefreshing ? '⏳' : '🔄'}</span>
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button
            onClick={exportToExcel}
            style={{
              padding: '12px 24px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            <span style={{ fontSize: '18px' }}>📊</span>
            Export to Excel
          </button>
        </div>

        {/* Period Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1a1a1a',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <button
            onClick={() => viewMode === 'weekly' ? setSelectedWeek(selectedWeek - 1) : setSelectedMonth(selectedMonth - 1)}
            onTouchEnd={(e) => {
              e.preventDefault();
              viewMode === 'weekly' ? setSelectedWeek(selectedWeek - 1) : setSelectedMonth(selectedMonth - 1);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            ← Previous {viewMode === 'weekly' ? 'Week' : 'Month'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
              {currentPeriod.label}
            </div>
            {((viewMode === 'weekly' && selectedWeek === 0) || (viewMode === 'monthly' && selectedMonth === 0)) && (
              <div style={{ color: '#8b5cf6', fontSize: '12px', marginTop: '4px' }}>
                Current {viewMode === 'weekly' ? 'Week' : 'Period'}
              </div>
            )}
          </div>

          <button
            onClick={() => viewMode === 'weekly' ? setSelectedWeek(selectedWeek + 1) : setSelectedMonth(selectedMonth + 1)}
            onTouchEnd={(e) => {
              e.preventDefault();
              viewMode === 'weekly' ? setSelectedWeek(selectedWeek + 1) : setSelectedMonth(selectedMonth + 1);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            Next {viewMode === 'weekly' ? 'Week' : 'Month'} →
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginTop: '24px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #8b5cf6'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Total Payroll
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
            £{totalPayroll.toFixed(2)}
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Staff Working
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
            {payrollData.length}
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Total Hours
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
            {payrollData.reduce((sum, p) => sum + p.totalHours, 0).toFixed(1)}h
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Total Shifts
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
            {payrollData.reduce((sum, p) => sum + p.shifts, 0)}
          </div>
        </div>
      </div>

      {/* Rate Legend */}
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #3a3a3a',
        marginBottom: '24px'
      }}>
        <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
          💡 Pay Rate Structure
        </div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
          <div>
            <span style={{ color: '#10b981', fontWeight: '600' }}>Standard Rate:</span>
            <span style={{ color: '#9ca3af', marginLeft: '8px' }}>£12.50/h (First 20 hours/week)</span>
          </div>
          <div>
            <span style={{ color: '#f59e0b', fontWeight: '600' }}>Enhanced Rate:</span>
            <span style={{ color: '#9ca3af', marginLeft: '8px' }}>£14.00/h (After 20 hours/week)</span>
          </div>
          <div>
            <span style={{ color: '#8b5cf6', fontWeight: '600' }}>Night Rate:</span>
            <span style={{ color: '#9ca3af', marginLeft: '8px' }}>£15.00/h (All night shifts)</span>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #3a3a3a',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1fr 1fr 1fr 1.2fr',
          padding: '16px',
          backgroundColor: '#252525',
          borderBottom: '1px solid #3a3a3a',
          fontSize: '12px',
          fontWeight: '600',
          color: '#9ca3af'
        }}>
          <div>Staff Name</div>
          <div style={{ textAlign: 'center' }}>Total Hours</div>
          <div style={{ textAlign: 'center' }}>First 20h</div>
          <div style={{ textAlign: 'center' }}>After 20h</div>
          <div style={{ textAlign: 'center' }}>Night Hours</div>
          <div style={{ textAlign: 'right' }}>Standard Pay</div>
          <div style={{ textAlign: 'right' }}>Enhanced Pay</div>
          <div style={{ textAlign: 'right' }}>Night Pay</div>
          <div style={{ textAlign: 'right' }}>Leave Pay</div>
          <div style={{ textAlign: 'right' }}>Total Pay</div>
        </div>

        {payrollData.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              No Payroll Data
            </div>
            <div style={{ fontSize: '14px' }}>
              No shifts assigned for this week
            </div>
          </div>
        ) : (
          payrollData.map((staff, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1fr 1fr 1fr 1.2fr',
                padding: '16px',
                borderBottom: index < payrollData.length - 1 ? '1px solid #2a2a2a' : 'none',
                fontSize: '13px',
                alignItems: 'center'
              }}
            >
              <div style={{ color: 'white', fontWeight: '600' }}>
                {staff.name}
                {staff.isAgency && (
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    backgroundColor: '#10b98120',
                    color: '#10b981',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '700',
                    letterSpacing: '0.5px'
                  }}>
                    AGENCY
                  </span>
                )}
                <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>
                  {staff.shifts} shift{staff.shifts !== 1 ? 's' : ''}
                  {staff.isAgency && staff.agencyName && (
                    <> • {staff.agencyName}</>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'center', color: 'white', fontWeight: '600' }}>
                {staff.totalHours.toFixed(1)}h
              </div>
              <div style={{ textAlign: 'center', color: '#10b981', fontWeight: '600' }}>
                {staff.isAgency ? '—' : `${staff.first20Hours.toFixed(1)}h`}
              </div>
              <div style={{ textAlign: 'center', color: '#f59e0b', fontWeight: '600' }}>
                {staff.isAgency || staff.remainingHours === 0 ? '—' : `${staff.remainingHours.toFixed(1)}h`}
              </div>
              <div style={{ textAlign: 'center', color: '#8b5cf6', fontWeight: '600' }}>
                {staff.nightHours > 0 ? `${staff.nightHours.toFixed(1)}h` : '—'}
              </div>
              <div style={{ textAlign: 'right', color: '#10b981' }}>
                £{staff.standardPay.toFixed(2)}
              </div>
              <div style={{ textAlign: 'right', color: '#f59e0b' }}>
                {staff.enhancedPay > 0 ? `£${staff.enhancedPay.toFixed(2)}` : '—'}
              </div>
              <div style={{ textAlign: 'right', color: '#8b5cf6' }}>
                {staff.nightPay > 0 ? `£${staff.nightPay.toFixed(2)}` : '—'}
              </div>
              <div style={{ textAlign: 'right', color: '#3b82f6' }}>
                {staff.leavePay > 0 ? `£${staff.leavePay.toFixed(2)}` : '—'}
              </div>
              <div style={{ textAlign: 'right', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                £{staff.totalPay.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Export Button */}
      <div style={{ marginTop: '24px', textAlign: 'right' }}>
        <button
          onClick={() => alert('Export feature coming soon!')}
          onTouchEnd={(e) => {
            e.preventDefault();
            alert('Export feature coming soon!');
          }}
          style={{
            padding: '12px 24px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation'
          }}
        >
          📄 Export to CSV
        </button>
      </div>

      {/* Incomplete Shifts Warning */}
      {incompleteShifts.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            color: '#f59e0b'
          }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              Incomplete Shifts (Included but Unverified)
            </h2>
          </div>
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #f59e0b',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 2fr',
              padding: '16px',
              backgroundColor: '#2d1b06',
              borderBottom: '1px solid #78350f',
              fontSize: '12px',
              fontWeight: '600',
              color: '#fcd34d'
            }}>
              <div>Staff Name</div>
              <div>Date</div>
              <div>Type</div>
              <div>Issue (Still Paid)</div>
            </div>
            {incompleteShifts.map((shift, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 2fr',
                  padding: '16px',
                  borderBottom: index < incompleteShifts.length - 1 ? '1px solid #2a2a2a' : 'none',
                  fontSize: '13px',
                  color: '#d1d5db'
                }}
              >
                <div style={{ fontWeight: '600' }}>{shift.staffName}</div>
                <div>{new Date(shift.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                <div>{shift.type}</div>
                <div style={{ color: '#f59e0b' }}>
                  {!shift.clockedIn && !shift.clockedOut ? 'Missing Clock In & Out' :
                    !shift.clockedIn ? 'Missing Clock In' :
                      !shift.clockedOut ? 'Missing Clock Out' : 'Incomplete'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;

