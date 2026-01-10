import React, { useState, useEffect } from 'react';
import { Shift } from '../data/sharedData';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonButton, IonIcon, IonBadge } from '@ionic/react';
import { arrowBack, calendar, time, checkmarkCircle, closeCircle } from 'ionicons/icons';


interface StaffAttendanceProps {
  staffId: string;
  onBack: () => void;
}

const StaffAttendance: React.FC<StaffAttendanceProps> = ({ staffId, onBack }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    fetchShifts();
  }, [staffId]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/staff/${staffId}/shifts`);
      if (response.ok) {
        const data = await response.json();
        setShifts(data);
      }
    } catch (error) {
      console.error('Error fetching shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const calculateActualDuration = (clockIn?: string, clockOut?: string) => {
    if (!clockIn || !clockOut) return null;
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return diff.toFixed(2);
  };

  // Filter shifts based on selected period
  const filterShifts = () => {
    const now = new Date();
    const filtered = shifts.filter(s => {
      const shiftDate = new Date(s.date);
      if (selectedPeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return shiftDate >= weekAgo;
      } else if (selectedPeriod === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return shiftDate >= monthAgo;
      }
      return true; // 'all'
    });
    return filtered.sort((a, b) => b.date.localeCompare(a.date));
  };

  const filteredShifts = filterShifts();
  const completedShifts = filteredShifts.filter(s => s.clockedOut);
  const totalHours = completedShifts.reduce((sum, s) => {
    const duration = calculateActualDuration(s.clockInTime, s.clockOutTime);
    return sum + (duration ? parseFloat(duration) : 0);
  }, 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButton slot="start" fill="clear" onClick={onBack}>
            <IonIcon icon={arrowBack} />
          </IonButton>
          <IonTitle>My Attendance</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#0a0a0a' }}>
        <div style={{ padding: '16px' }}>
          {/* Period Selector */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            backgroundColor: '#1a1a1a',
            padding: '8px',
            borderRadius: '12px'
          }}>
            {(['week', 'month', 'all'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: selectedPeriod === period ? '#3b82f6' : 'transparent',
                  color: selectedPeriod === period ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {period === 'week' ? 'Last 7 Days' : period === 'month' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <IonCard style={{ margin: 0, backgroundColor: '#1a1a1a' }}>
              <IonCardContent>
                <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px' }}>
                  Total Shifts
                </div>
                <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
                  {completedShifts.length}
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard style={{ margin: 0, backgroundColor: '#1a1a1a' }}>
              <IonCardContent>
                <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px' }}>
                  Total Hours
                </div>
                <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>
                  {totalHours.toFixed(1)}h
                </div>
              </IonCardContent>
            </IonCard>
          </div>

          {/* Shift History */}
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
              Clock In/Out History
            </h2>

            {loading && (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                Loading...
              </div>
            )}

            {!loading && filteredShifts.length === 0 && (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                No shifts found for this period
              </div>
            )}

            {!loading && filteredShifts.map(shift => {
              const actualDuration = calculateActualDuration(shift.clockInTime, shift.clockOutTime);
              const isComplete = shift.clockedIn && shift.clockedOut;
              const isInProgress = shift.clockedIn && !shift.clockedOut;

              return (
                <IonCard key={shift.id} style={{ margin: '0 0 12px 0', backgroundColor: '#1a1a1a' }}>
                  <IonCardContent>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                          {shift.siteName}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '13px' }}>
                          {formatDate(shift.date)} • {shift.startTime} - {shift.endTime}
                        </div>
                      </div>
                      <IonBadge
                        color={isComplete ? 'success' : isInProgress ? 'warning' : 'medium'}
                        style={{ fontSize: '11px' }}
                      >
                        {isComplete ? 'Complete' : isInProgress ? 'In Progress' : 'Not Started'}
                      </IonBadge>
                    </div>

                    {/* Clock Times */}
                    {(shift.clockedIn || shift.clockedOut) && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        backgroundColor: '#0a0a0a',
                        padding: '12px',
                        borderRadius: '8px'
                      }}>
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#10b981',
                            fontSize: '12px',
                            marginBottom: '4px'
                          }}>
                            <IonIcon icon={checkmarkCircle} style={{ fontSize: '14px' }} />
                            Clock In
                          </div>
                          <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                            {shift.clockedIn ? formatTime(shift.clockInTime) : '-'}
                          </div>
                        </div>

                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: shift.clockedOut ? '#ef4444' : '#6b7280',
                            fontSize: '12px',
                            marginBottom: '4px'
                          }}>
                            <IonIcon icon={shift.clockedOut ? checkmarkCircle : closeCircle} style={{ fontSize: '14px' }} />
                            Clock Out
                          </div>
                          <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                            {shift.clockedOut ? formatTime(shift.clockOutTime) : '-'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actual Duration */}
                    {actualDuration && (
                      <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #3a3a3a',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ color: '#9ca3af', fontSize: '13px' }}>
                          Actual Duration
                        </span>
                        <span style={{ color: 'white', fontSize: '15px', fontWeight: '600' }}>
                          {actualDuration}h
                        </span>
                      </div>
                    )}
                  </IonCardContent>
                </IonCard>
              );
            })}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default StaffAttendance;
