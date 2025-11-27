import React, { useState, useEffect } from 'react';
import { shiftsAPI } from '../services/api';
import { leaveAPI } from '../services/leaveAPI';

interface StaffPayrollViewProps {
  staffId: string;
  staffName: string;
  standardRate: number;
}

const StaffPayrollView: React.FC<StaffPayrollViewProps> = ({ staffId, staffName, standardRate }) => {
  const [shifts, setShifts] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  // Load shifts and leave requests from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load shifts
        const allShifts = await shiftsAPI.getAll();
        setShifts(allShifts);
        
        // Load approved leave requests
        const requests = await leaveAPI.getAllRequests();
        const myApprovedLeave = requests.filter(r => 
          r.status === 'approved' && r.staffId === staffId
        );
        setLeaveRequests(myApprovedLeave);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [staffId]);

  // Get month dates (14th to 14th)
  const getMonthDates = (monthOffset: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    
    let periodStart: Date;
    if (currentDay >= 14) {
      periodStart = new Date(today.getFullYear(), today.getMonth() + monthOffset, 14);
    } else {
      periodStart = new Date(today.getFullYear(), today.getMonth() - 1 + monthOffset, 14);
    }
    
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(14);
    
    return {
      start: periodStart,
      end: periodEnd,
      label: `${periodStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${periodEnd.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    };
  };

  const currentMonth = getMonthDates(selectedMonth);

  // Calculate payroll
  const calculatePayroll = () => {
    const myShifts = shifts.filter(shift => 
      shift.staffName === staffName &&
      new Date(shift.date) >= currentMonth.start &&
      new Date(shift.date) <= currentMonth.end
    );

    let totalHours = 0;
    let dayHours = 0;
    let nightHours = 0;
    let regularHours = 0;
    let overtimeHours = 0;

    myShifts.forEach(shift => {
      const hours = shift.extended ? shift.duration + (shift.extensionHours || 0) : shift.duration;
      totalHours += hours;
      
      // Calculate regular vs overtime per shift (first 12 hours = regular, rest = overtime)
      if (hours <= 12) {
        regularHours += hours;
      } else {
        regularHours += 12;
        overtimeHours += (hours - 12);
      }
      
      if (shift.type === 'Day') {
        dayHours += hours;
      } else {
        nightHours += hours;
      }
    });

    // Calculate leave hours
    const myLeave = leaveRequests.filter(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      return ((leaveStart >= currentMonth.start && leaveStart <= currentMonth.end) ||
              (leaveEnd >= currentMonth.start && leaveEnd <= currentMonth.end) ||
              (leaveStart <= currentMonth.start && leaveEnd >= currentMonth.end));
    });

    let leaveHours = 0;
    myLeave.forEach(leave => {
      const leaveStart = new Date(Math.max(new Date(leave.startDate).getTime(), currentMonth.start.getTime()));
      const leaveEnd = new Date(Math.min(new Date(leave.endDate).getTime(), currentMonth.end.getTime()));
      const days = Math.ceil((leaveEnd.getTime() - leaveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      leaveHours += days * 8;
    });

    const regularPay = regularHours * standardRate;
    const overtimePay = overtimeHours * standardRate; // Same rate, just shown separately
    const shiftPay = regularPay + overtimePay;
    const leavePay = leaveHours * 12.50; // Fixed rate for all leave pay
    const totalPay = shiftPay + leavePay;

    return {
      shiftsWorked: myShifts.length,
      totalHours,
      dayHours,
      nightHours,
      regularHours,
      overtimeHours,
      regularPay,
      overtimePay,
      leaveHours,
      leaveDays: leaveHours / 8,
      shiftPay,
      leavePay,
      totalPay,
      deductions: 0,
      netPay: totalPay
    };
  };

  const payroll = calculatePayroll();

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>💰</span>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>My Payroll</h2>
        </div>
        <p style={{ margin: 0, opacity: 0.9 }}>View your earnings and payment details</p>
      </div>

      {/* Period Navigation */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #3a3a3a',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setSelectedMonth(selectedMonth - 1)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4b5563',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ← Previous Month
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
            {currentMonth.label}
          </div>
          {selectedMonth === 0 && (
            <div style={{ color: '#8b5cf6', fontSize: '12px', marginTop: '4px' }}>
              Current Period
            </div>
          )}
        </div>

        <button
          onClick={() => setSelectedMonth(selectedMonth + 1)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4b5563',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Next Month →
        </button>
      </div>

      {/* Payroll Summary */}
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        border: '1px solid #3a3a3a',
        padding: '24px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>
          Earnings Breakdown
        </h3>

        {/* Regular Pay (First 12 hours per shift) */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderBottom: '1px solid #2a2a2a'
        }}>
          <div>
            <div style={{ color: 'white', fontWeight: '600' }}>Regular Pay</div>
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>
              {payroll.regularHours.toFixed(1)}h (first 12h per shift)
            </div>
          </div>
          <div style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold' }}>
            £{payroll.regularPay.toFixed(2)}
          </div>
        </div>

        {/* Overtime Pay (Hours over 12 per shift) */}
        {payroll.overtimeHours > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderBottom: '1px solid #2a2a2a'
          }}>
            <div>
              <div style={{ color: 'white', fontWeight: '600' }}>Overtime Pay</div>
              <div style={{ color: '#9ca3af', fontSize: '13px' }}>
                {payroll.overtimeHours.toFixed(1)}h (over 12h per shift)
              </div>
            </div>
            <div style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 'bold' }}>
              £{payroll.overtimePay.toFixed(2)}
            </div>
          </div>
        )}

        {/* Leave Pay */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderBottom: '1px solid #2a2a2a'
        }}>
          <div>
            <div style={{ color: 'white', fontWeight: '600' }}>Leave Pay</div>
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>
              {payroll.leaveDays} day{payroll.leaveDays !== 1 ? 's' : ''} approved leave @ £12.50/day
            </div>
          </div>
          <div style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 'bold' }}>
            {payroll.leavePay > 0 ? `£${payroll.leavePay.toFixed(2)}` : '—'}
          </div>
        </div>

        {/* Total */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '16px 0 12px 0',
          borderBottom: '2px solid #3a3a3a'
        }}>
          <div style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>
            Total Pay
          </div>
          <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
            £{payroll.totalPay.toFixed(2)}
          </div>
        </div>

        {/* Deductions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '12px 0',
          borderBottom: '2px solid #3a3a3a'
        }}>
          <div style={{ color: '#ef4444', fontWeight: '600' }}>
            Deductions
          </div>
          <div style={{ color: '#ef4444', fontSize: '16px', fontWeight: 'bold' }}>
            -£{payroll.deductions.toFixed(2)}
          </div>
        </div>

        {/* Net Pay */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '16px 0 0 0'
        }}>
          <div style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>
            Net Pay
          </div>
          <div style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold' }}>
            £{payroll.netPay.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Hours Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginTop: '24px'
      }}>
        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Regular Hours
          </div>
          <div style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>
            {payroll.regularHours.toFixed(1)}h
          </div>
          <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '4px' }}>
            First 12h/shift
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Overtime Hours
          </div>
          <div style={{ color: '#f59e0b', fontSize: '24px', fontWeight: 'bold' }}>
            {payroll.overtimeHours.toFixed(1)}h
          </div>
          <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '4px' }}>
            Over 12h/shift
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Leave Hours
          </div>
          <div style={{ color: '#3b82f6', fontSize: '24px', fontWeight: 'bold' }}>
            {payroll.leaveHours.toFixed(1)}h
          </div>
        </div>

        <div style={{
          backgroundColor: '#1a1a1a',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #3a3a3a'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>
            Hourly Rate
          </div>
          <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
            £{standardRate.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPayrollView;

