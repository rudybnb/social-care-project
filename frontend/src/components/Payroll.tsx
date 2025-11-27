import React, { useState, useEffect } from 'react';
import { getShifts, getStaff, subscribeToDataChange, getAllWorkers } from '../data/sharedData';
import { calculateWeeklyHours } from '../utils/hoursCalculator';
import { leaveAPI } from '../services/leaveAPI';

const Payroll: React.FC = () => {
  const [shifts, setShifts] = useState(getShifts());
  const staff = getAllWorkers(); // Include both permanent staff and agency workers
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

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

  // Calculate payroll for each staff member
  const calculatePayroll = () => {
    return staff.map(staffMember => {
      const staffShifts = shifts.filter(shift => 
        shift.staffName === staffMember.name &&
        new Date(shift.date) >= currentPeriod.start &&
        new Date(shift.date) <= currentPeriod.end
      );

      let totalHours = 0;
      let dayHours = 0;
      let nightHours = 0;

      staffShifts.forEach(shift => {
        const hours = shift.extended ? shift.duration + (shift.extensionHours || 0) : shift.duration;
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
    }).filter(p => p.totalHours > 0); // Only show staff with hours
  };

  const payrollData = calculatePayroll();
  const totalPayroll = payrollData.reduce((sum, p) => sum + p.totalPay, 0);

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
    </div>
  );
};

export default Payroll;

