import React from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge } from '@ionic/react';

interface Shift {
  id: string;
  date: string;
  type: string;
  startTime: string;
  endTime: string;
  siteName: string;
  siteColor: string;
  duration: number;
  clockedIn: boolean;
  clockedOut: boolean;
  clockInTime?: string;
  clockOutTime?: string;
}

interface StaffProgressProps {
  shifts: Shift[];
  staffName: string;
}

const StaffProgress: React.FC<StaffProgressProps> = ({ shifts, staffName }) => {
  // Calculate statistics
  const completedShifts = shifts.filter(s => s.clockedOut);
  const totalHours = completedShifts.reduce((sum, s) => sum + s.duration, 0);
  
  // This week
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const thisWeekShifts = completedShifts.filter(s => {
    const shiftDate = new Date(s.date);
    return shiftDate >= weekStart;
  });
  const thisWeekHours = thisWeekShifts.reduce((sum, s) => sum + s.duration, 0);
  
  // This month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthShifts = completedShifts.filter(s => {
    const shiftDate = new Date(s.date);
    return shiftDate >= monthStart;
  });
  const thisMonthHours = thisMonthShifts.reduce((sum, s) => sum + s.duration, 0);
  
  // Group shifts by month for history
  const shiftsByMonth = completedShifts.reduce((acc, shift) => {
    const date = new Date(shift.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);
  
  const monthKeys = Object.keys(shiftsByMonth).sort().reverse();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#2563eb', '--color': 'white' }}>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/staff" />
          </IonButtons>
          <IonTitle>My Progress</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f3f4f6' }}>
        {/* Header */}
        <div style={{
          background: '#2563eb',
          padding: '24px',
          color: 'white'
        }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}>
            {staffName}
          </h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
            Work History & Statistics
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ padding: '16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px' }}>
                This Week
              </div>
              <div style={{ color: '#f59e0b', fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
                {thisWeekHours}
              </div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>
                {thisWeekShifts.length} shifts completed
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px' }}>
                This Month
              </div>
              <div style={{ color: '#10b981', fontSize: '32px', fontWeight: 'bold', marginBottom: '4px' }}>
                {thisMonthHours}
              </div>
              <div style={{ color: '#6b7280', fontSize: '13px' }}>
                {thisMonthShifts.length} shifts completed
              </div>
            </div>
          </div>

          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px' }}>
              Total Hours Worked
            </div>
            <div style={{ color: '#2563eb', fontSize: '48px', fontWeight: 'bold', marginBottom: '4px' }}>
              {totalHours}
            </div>
            <div style={{ color: '#6b7280', fontSize: '13px' }}>
              Across {completedShifts.length} completed shifts
            </div>
          </div>

          {/* Shift History */}
          <h3 style={{ color: '#111827', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
            Shift History
          </h3>

          {monthKeys.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                No completed shifts yet
              </div>
            </div>
          ) : (
            monthKeys.map(monthKey => {
              const [year, month] = monthKey.split('-');
              const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
              const monthShifts = shiftsByMonth[monthKey];
              const monthHours = monthShifts.reduce((sum, s) => sum + s.duration, 0);

              return (
                <div key={monthKey} style={{ marginBottom: '16px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{ color: '#111827', fontSize: '15px', fontWeight: 'bold' }}>
                      {monthName}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>
                      {monthHours} hours • {monthShifts.length} shifts
                    </div>
                  </div>

                  {monthShifts.sort((a, b) => b.date.localeCompare(a.date)).map(shift => (
                    <div key={shift.id} style={{
                      background: '#ffffff',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '8px',
                      border: `1px solid ${shift.siteColor}`,
                      borderLeft: `4px solid ${shift.siteColor}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ color: '#111827', fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                            {shift.siteName}
                          </div>
                          <div style={{ color: '#6b7280', fontSize: '13px' }}>
                            {new Date(shift.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                        <IonBadge color="success" style={{ fontSize: '11px' }}>
                          {shift.duration}h
                        </IonBadge>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#6b7280'
                      }}>
                        <div>
                          <div style={{ marginBottom: '2px' }}>Clock In:</div>
                          <div style={{ color: '#10b981' }}>
                            {shift.clockInTime ? new Date(shift.clockInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : shift.startTime}
                          </div>
                        </div>
                        <div>
                          <div style={{ marginBottom: '2px' }}>Clock Out:</div>
                          <div style={{ color: '#ef4444' }}>
                            {shift.clockOutTime ? new Date(shift.clockOutTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : shift.endTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default StaffProgress;

