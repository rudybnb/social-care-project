import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { getShifts, getStaff, subscribeToDataChange, getAllWorkers, forceRefreshShifts } from '../data/sharedData';
import { calculateWeeklyHours } from '../utils/hoursCalculator';
import { leaveAPI } from '../services/leaveAPI';
import RemittanceForm from './RemittanceForm';

const Payroll: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedRemittanceStaff, setSelectedRemittanceStaff] = useState<any>(null);
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
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateRange, setExportDateRange] = useState({
    start: new Date().toLocaleDateString('en-CA'),
    end: new Date().toLocaleDateString('en-CA')
  });

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

  // Get month dates (14th to 13th 23:59:59 to prevent double-counting 14th)
  const getMonthDates = (monthOffset: number) => {
    const today = new Date();
    const currentDay = today.getDate();

    // Determine the current pay period
    let periodStart: Date;
    if (currentDay >= 14) {
      // We're in the period that started on the 14th of this month
      periodStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 14, 0, 0, 0);
    } else {
      // We're in the period that started on the 14th of last month
      periodStart = new Date(today.getFullYear(), today.getMonth() - 1 + monthOffset, 14, 0, 0, 0);
    }

    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(13); // Ends on 13th 23:59:59 so 14th belongs exclusively to the next period
    periodEnd.setHours(23, 59, 59, 999);

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

  // Calculate payroll for each staff member according to rules 1-6
  const getPayrollData = (startDate: Date, endDate: Date) => {
    const todayStr = new Date().toISOString().split('T')[0];

    return staff.map(staffMember => {
      const staffShifts = shifts.filter(shift => {
        if (shift.staffName !== staffMember.name ||
            shift.staffName === 'Bank Management' ||
            shift.staffName === 'Agency' ||
            shift.staffName === 'BANK (Placeholder)') {
          return false;
        }

        const shiftDate = new Date(shift.date);
        if (shiftDate < startDate || shiftDate > endDate) return false;

        // Exclude declined/cancelled shifts entirely
        if (shift.staffStatus === 'declined' || shift.staffStatus === 'cancelled') return false;

        // Rule 1: Include future scheduled/pending shifts for FORECAST ONLY
        const isFutureShift = shift.date >= todayStr;
        if (isFutureShift) {
          return true;
        }

        // Rule 2 & 3: For past shifts, exclude past no-shows (accepted/pending with no clock-in)
        if (shift.date < todayStr && !shift.clockedIn) {
          return false;
        }

        return true;
      });

      let totalHours = 0;
      let dayHours = 0;
      let nightHours = 0;
      let verifiedHours = 0;
      let provisionalHours = 0;
      let forecastHours = 0;
      let flaggedShiftCount = 0;

      staffShifts.forEach(shift => {
        let hours = 0;
        const dateStr = shift.date; // YYYY-MM-DD
        const isFutureShift = dateStr >= todayStr && !shift.clockedIn;

        // Calculate scheduled hours baseline
        let scheduledHours = 0;
        if (shift.startTime && shift.endTime) {
          const start = new Date(`${dateStr}T${shift.startTime}:00`);
          let end = new Date(`${dateStr}T${shift.endTime}:00`);
          if (end < start) end.setDate(end.getDate() + 1);
          scheduledHours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
        } else {
          scheduledHours = shift.duration || 0;
        }

        if (isFutureShift) {
          // Rule 1: Future / Upcoming Rota Shift -> Forecast Only
          hours = scheduledHours;
          forecastHours += hours;
        } else if (shift.clockedIn && shift.clockedOut && shift.clockInTime && shift.clockOutTime) {
          // Check timestamp duration
          const start = new Date(shift.clockInTime);
          const end = new Date(shift.clockOutTime);
          const diffMs = end.getTime() - start.getTime();
          const actualHours = diffMs / (1000 * 60 * 60);

          if (actualHours > 0) {
            // Rule 2: Valid Completed Shift -> Verified actual worked hours
            hours = actualHours;
            verifiedHours += hours;
          } else {
            // Rule 3: Completed Shift with missing/zero/invalid timestamps -> Provisional expected hours + Flagged for Admin Review
            hours = scheduledHours;
            provisionalHours += hours;
            flaggedShiftCount += 1;
          }
        } else if (shift.clockedIn || shift.date < todayStr) {
          // Rule 3: Past / Incomplete shift missing valid timestamps -> Provisional expected hours + Flagged for Admin Review
          hours = scheduledHours;
          provisionalHours += hours;
          flaggedShiftCount += 1;
        } else {
          hours = scheduledHours;
          forecastHours += hours;
        }

        totalHours += hours;
        const isNightShift = shift.type?.toLowerCase().includes('night');
        if (isNightShift) {
          nightHours += hours;
        } else {
          dayHours += hours;
        }
      });

      // Add approved annual leave hours
      const staffLeave = leaveRequests.filter(leave => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        return leave.staffName === staffMember.name &&
          ((leaveStart >= startDate && leaveStart <= endDate) ||
            (leaveEnd >= startDate && leaveEnd <= endDate) ||
            (leaveStart <= startDate && leaveEnd >= endDate));
      });

      let leaveHours = 0;
      staffLeave.forEach(leave => {
        const leaveStart = new Date(Math.max(new Date(leave.startDate).getTime(), startDate.getTime()));
        const leaveEnd = new Date(Math.min(new Date(leave.endDate).getTime(), endDate.getTime()));
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
        // AGENCY WORKERS: Flat hourly rate
        const agencyRate = parseFloat(staffMember.hourlyRate) || 0;
        totalPay = (totalHours + leaveHours) * agencyRate;
        standardPay = dayHours * agencyRate;
        nightPay = nightHours * agencyRate;
        enhancedPay = 0;
      } else {
        // PERMANENT STAFF: Tiered rate calculation
        const standardRate = parseFloat(staffMember.standardRate) || 12.50;
        const nightRateRaw = (staffMember as any).nightRate;
        const nightRate = (nightRateRaw && nightRateRaw !== '—')
          ? parseFloat(nightRateRaw) || standardRate
          : standardRate;
        const enhancedRateRaw = (staffMember as any).enhancedRate;
        const enhancedRate = (enhancedRateRaw && enhancedRateRaw !== '—')
          ? parseFloat(enhancedRateRaw) || standardRate
          : standardRate;

        const first20 = Math.min(dayHours, 20);
        const after20 = Math.max(dayHours - 20, 0);
        const leavePay = leaveHours * standardRate;

        standardPay = first20 * standardRate;
        enhancedPay = after20 * enhancedRate;
        nightPay = nightHours * nightRate;
        totalPay = standardPay + enhancedPay + nightPay + leavePay;
      }

      return {
        name: staffMember.name,
        isAgency,
        agencyName: isAgency ? staffMember.agencyName : null,
        totalHours: totalHours + leaveHours,
        verifiedHours,
        provisionalHours,
        forecastHours,
        flaggedShiftCount,
        dayHours,
        nightHours,
        leaveHours,
        first20Hours: isAgency ? 0 : Math.min(dayHours, 20),
        remainingHours: isAgency ? 0 : Math.max(dayHours - 20, 0),
        standardPay,
        enhancedPay,
        nightPay,
        leavePay: isAgency ? 0 : leaveHours * ((staffMember as any).standardRate ? parseFloat((staffMember as any).standardRate) || 12.50 : 12.50),
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

  const payrollData = getPayrollData(currentPeriod.start, currentPeriod.end);

  // Calculate expected monthly/weekly bill based 100% on assigned shifts on the rota
  const getExpectedRotaData = (startDate: Date, endDate: Date) => {
    let totalExpectedPay = 0;
    let totalExpectedHours = 0;
    let totalExpectedShifts = 0;

    staff.forEach(staffMember => {
      const assignedShifts = shifts.filter(shift =>
        shift.staffName === staffMember.name &&
        shift.staffName !== 'Bank Management' &&
        shift.staffName !== 'Agency' &&
        shift.staffName !== 'BANK (Placeholder)' &&
        new Date(shift.date) >= startDate &&
        new Date(shift.date) <= endDate &&
        shift.staffStatus !== 'declined' &&
        shift.staffStatus !== 'cancelled'
      );

      let dayHours = 0;
      let nightHours = 0;

      assignedShifts.forEach(shift => {
        let hours = 0;
        if (shift.startTime && shift.endTime) {
          const start = new Date(`${shift.date}T${shift.startTime}:00`);
          let end = new Date(`${shift.date}T${shift.endTime}:00`);
          if (end < start) end.setDate(end.getDate() + 1);
          hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
        } else {
          hours = shift.duration || 0;
        }

        if (shift.type?.toLowerCase().includes('night')) {
          nightHours += hours;
        } else {
          dayHours += hours;
        }
      });

      const isAgency = 'agencyName' in staffMember;
      let staffPay = 0;

      if (isAgency) {
        const agencyRate = parseFloat(staffMember.hourlyRate) || 0;
        staffPay = (dayHours + nightHours) * agencyRate;
      } else {
        const standardRate = parseFloat(staffMember.standardRate) || 12.50;
        const nightRateRaw = (staffMember as any).nightRate;
        const nightRate = (nightRateRaw && nightRateRaw !== '—') ? parseFloat(nightRateRaw) || standardRate : standardRate;
        const enhancedRateRaw = (staffMember as any).enhancedRate;
        const enhancedRate = (enhancedRateRaw && enhancedRateRaw !== '—') ? parseFloat(enhancedRateRaw) || standardRate : standardRate;

        const first20 = Math.min(dayHours, 20);
        const after20 = Math.max(dayHours - 20, 0);
        staffPay = (first20 * standardRate) + (after20 * enhancedRate) + (nightHours * nightRate);
      }

      totalExpectedPay += staffPay;
      totalExpectedHours += (dayHours + nightHours);
      totalExpectedShifts += assignedShifts.length;
    });

    return { totalExpectedPay, totalExpectedHours, totalExpectedShifts };
  };

  const expectedRota = getExpectedRotaData(currentPeriod.start, currentPeriod.end);
  const incompleteShifts = calculateIncompleteShifts();
  const totalPayroll = payrollData.reduce((sum, p) => sum + p.totalPay, 0);
  const variancePay = totalPayroll - expectedRota.totalExpectedPay;

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
  const exportPayrollCSV = (data: any[], filename: string) => {
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
    const rows = data.map((staff: any) => [
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
      data.reduce((sum: number, p: any) => sum + p.totalHours, 0).toFixed(2),
      data.reduce((sum: number, p: any) => sum + p.dayHours, 0).toFixed(2),
      data.reduce((sum: number, p: any) => sum + p.nightHours, 0).toFixed(2),
      data.reduce((sum: number, p: any) => sum + p.leaveHours, 0).toFixed(2),
      data.reduce((sum: number, p: any) => sum + p.standardPay, 0).toFixed(2),
      data.reduce((sum: number, p: any) => sum + p.enhancedPay, 0).toFixed(2),
      data.reduce((sum: number, p: any) => sum + p.nightPay, 0).toFixed(2),
      data.reduce((sum: number, p: any) => sum + p.leavePay, 0).toFixed(2),
      data.reduce((sum: number, p: any) => sum + p.totalPay, 0).toFixed(2),
      data.reduce((sum: number, p: any) => sum + p.shifts, 0)
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
    // const filename = `Payroll_${currentPeriod.label.replace(/\s+/g, '_')}.csv`;

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

  const handleCustomExport = () => {
    if (!exportDateRange.start || !exportDateRange.end) {
      alert('Please select a start and end date');
      return;
    }

    const start = new Date(exportDateRange.start);
    const end = new Date(exportDateRange.end);

    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    const data = getPayrollData(start, end);
    const filename = `Payroll_Export_${exportDateRange.start}_to_${exportDateRange.end}.csv`;

    exportPayrollCSV(data, filename);
    setShowExportModal(false);
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
            onClick={() => {
              setExportDateRange({
                start: currentPeriod.start.toLocaleDateString('en-CA'),
                end: currentPeriod.end.toLocaleDateString('en-CA')
              });
              setShowExportModal(true);
            }}
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
          <button
            onClick={() => setSelectedRemittanceStaff({ custom: true, name: '', isAgency: false, totalHours: 0, totalPay: 0 })}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#8b5cf6',
              border: '1px solid #8b5cf6',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#8b5cf620'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontSize: '18px' }}>📝</span>
            Custom Remittance
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
        {/* Expected Rota Bill (Scheduled Forecast) */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #3b82f6'
        }}>
          <div style={{ color: '#60a5fa', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
            📊 Expected Rota Bill (Forecast)
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
            £{expectedRota.totalExpectedPay.toFixed(2)}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>
            If 100% of assigned shifts are worked ({expectedRota.totalExpectedHours.toFixed(1)}h)
          </div>
        </div>

        {/* Actual Wage Payout (Realized) */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: '2px solid #10b981'
        }}>
          <div style={{ color: '#34d399', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
            💰 Actual Wage Payout (Clocked-In)
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
            £{totalPayroll.toFixed(2)}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>
            Actual payout from verified clock-ins
          </div>
        </div>

        {/* Variance / Difference */}
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '20px',
          borderRadius: '12px',
          border: `2px solid ${variancePay <= 0 ? '#10b981' : '#ef4444'}`
        }}>
          <div style={{ color: variancePay <= 0 ? '#34d399' : '#f87171', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
            📈 Variance (Payout vs Budget)
          </div>
          <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
            {variancePay >= 0 ? '+' : ''}£{variancePay.toFixed(2)}
          </div>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>
            {variancePay <= 0 ? 'Under budget (savings from unworked shifts)' : 'Over budget'}
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
            Total Hours Worked
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
          gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1fr 1fr 1fr 1.2fr 1fr',
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
          <div style={{ textAlign: 'center' }}>Action</div>
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
                gridTemplateColumns: '2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr 1fr 1fr 1fr 1.2fr 1fr',
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
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setSelectedRemittanceStaff(staff)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #8b5cf6',
                    color: '#8b5cf6',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Remittance
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Export Button Removed (Moved to header) */}

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

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Payroll Data"
      >
        <div style={{ color: 'white' }}>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
            Select the date range for the payroll export.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Start Date</label>
              <input
                type="date"
                value={exportDateRange.start}
                onChange={(e) => setExportDateRange({ ...exportDateRange, start: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>End Date</label>
              <input
                type="date"
                value={exportDateRange.end}
                onChange={(e) => setExportDateRange({ ...exportDateRange, end: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  color: 'white',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={() => setShowExportModal(false)}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#9ca3af',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCustomExport}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Export CSV
            </button>
          </div>
        </div>
      </Modal>

      {/* Remittance Modal */}
      {selectedRemittanceStaff && (
        <Modal
          isOpen={!!selectedRemittanceStaff}
          onClose={() => setSelectedRemittanceStaff(null)}
          title="Send Remittance Advice"
        >
          <RemittanceForm
            staffData={selectedRemittanceStaff}
            periodLabel={currentPeriod.label}
            onClose={() => setSelectedRemittanceStaff(null)}
          />
        </Modal>
      )}
    </div>
  );
};

export default Payroll;

