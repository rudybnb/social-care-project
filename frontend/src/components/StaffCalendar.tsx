import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronBack, chevronForward } from 'ionicons/icons';
import { Shift } from '../data/sharedData';

interface StaffCalendarProps {
  staffId: string;
  shifts: Shift[];
  onDayClick?: (date: Date, dayShifts: Shift[]) => void;
}


const StaffCalendar: React.FC<StaffCalendarProps> = ({ staffId, shifts, onDayClick }) => {
  const [selectedMonth, setSelectedMonth] = useState(0);

  // Get month dates
  const getMonthDates = (monthOffset: number = 0) => {
    const today = new Date();
    const targetMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);

    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();

    // Get first day of month and adjust to Monday
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0

    // Get last day of month
    const lastDay = new Date(year, month + 1, 0).getDate();

    const dates = [];

    // Add previous month days to fill the week
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      dates.push({ date, isCurrentMonth: false });
    }

    // Add current month days
    for (let i = 1; i <= lastDay; i++) {
      const date = new Date(year, month, i);
      dates.push({ date, isCurrentMonth: true });
    }

    // Add next month days to complete the grid
    const remainingDays = 42 - dates.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      dates.push({ date, isCurrentMonth: false });
    }

    return { dates, month: targetMonth };
  };

  const { dates: monthDates, month } = getMonthDates(selectedMonth);
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Get my shifts for a specific date
  const getMyShiftsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return shifts.filter(s => s.date === dateStr && !s.isBank);
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div style={{ padding: '16px' }}>
      {/* Month Navigator */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '12px',
        background: '#2a2a2a',
        borderRadius: '12px'
      }}>
        <button
          onClick={() => setSelectedMonth(selectedMonth - 1)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9333ea',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px 12px'
          }}
        >
          <IonIcon icon={chevronBack} />
        </button>

        <div style={{
          color: 'white',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          {formatMonth(month)}
        </div>

        <button
          onClick={() => setSelectedMonth(selectedMonth + 1)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9333ea',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '4px 12px'
          }}
        >
          <IonIcon icon={chevronForward} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Week Day Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          marginBottom: '8px'
        }}>
          {weekDays.map((day, index) => (
            <div
              key={index}
              style={{
                textAlign: 'center',
                color: '#999',
                fontSize: '12px',
                fontWeight: '600',
                padding: '8px 0'
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px'
        }}>
          {monthDates.map(({ date, isCurrentMonth }, index) => {
            const myShifts = getMyShiftsForDate(date);
            const dateStr = date.toISOString().split('T')[0];
            const isToday = dateStr === today;
            const hasShifts = myShifts.length > 0;

            return (
              <div
                key={index}
                onClick={() => {
                  if (hasShifts && onDayClick) {
                    onDayClick(date, myShifts);
                  }
                }}
                style={{
                  background: isCurrentMonth ? '#2a2a2a' : '#1a1a1a',
                  borderRadius: '8px',
                  padding: '8px 4px',
                  minHeight: '70px',
                  border: isToday ? '2px solid #9333ea' : '1px solid #3a3a3a',
                  cursor: hasShifts ? 'pointer' : 'default',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (hasShifts) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Date Number */}
                <div style={{
                  color: isCurrentMonth ? 'white' : '#666',
                  fontSize: '14px',
                  fontWeight: isToday ? 'bold' : '500',
                  marginBottom: '6px',
                  textAlign: 'center'
                }}>
                  {date.getDate()}
                </div>

                {/* Shift Indicators - Simple colored dots like admin */}
                {hasShifts && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    alignItems: 'center'
                  }}>
                    {myShifts.map((shift, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '32px',
                          height: '6px',
                          background: shift.siteColor || '#9333ea',
                          borderRadius: '3px',
                          opacity: shift.clockedOut ? 0.5 : 1
                        }}
                        title={`${shift.type} shift at ${shift.siteName}\n${shift.startTime} - ${shift.endTime}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: '#2a2a2a',
        borderRadius: '8px',
        fontSize: '11px',
        color: '#999'
      }}>
        <div style={{ marginBottom: '4px' }}>
          <span style={{
            display: 'inline-block',
            width: '20px',
            height: '4px',
            background: '#9333ea',
            borderRadius: '2px',
            marginRight: '8px',
            verticalAlign: 'middle'
          }}></span>
          Shift assigned (color = site)
        </div>
        <div>
          <span style={{ color: '#9333ea', fontWeight: '600', marginRight: '8px' }}>Purple border</span>
          Today
        </div>
      </div>
    </div>
  );
};

export default StaffCalendar;

