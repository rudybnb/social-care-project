import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge, IonIcon, IonRefresher, IonRefresherContent, IonToast } from '@ionic/react';
import { calendar, time, location, qrCode, logOut, statsChart } from 'ionicons/icons';
import QRScanner from './QRScanner';

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
  isBank: boolean;
}

interface StaffDashboardProps {
  staffId: string;
  staffName: string;
  onLogout: () => void;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ staffId, staffName, onLogout }) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; color: string }>({ show: false, message: '', color: 'success' });

  // Fetch staff shifts
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

  useEffect(() => {
    fetchShifts();
  }, [staffId]);

  // Filter shifts
  const today = new Date().toISOString().split('T')[0];
  const upcomingShifts = shifts
    .filter(s => s.date >= today && !s.isBank)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);
  
  const todayShifts = shifts.filter(s => s.date === today && !s.isBank);
  const activeShift = todayShifts.find(s => s.clockedIn && !s.clockedOut);

  // Calculate stats
  const totalHoursThisWeek = shifts
    .filter(s => {
      const shiftDate = new Date(s.date);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return shiftDate >= weekStart && s.clockedIn && s.clockedOut;
    })
    .reduce((total, s) => total + s.duration, 0);

  const completedShifts = shifts.filter(s => s.clockedOut).length;

  const handleRefresh = async (event: CustomEvent) => {
    await fetchShifts();
    event.detail.complete();
  };

  const openScanner = (shift: Shift) => {
    setSelectedShift(shift);
    setShowScanner(true);
  };

  const handleQRScan = async (qrCodeData: string) => {
    if (!selectedShift) return;

    try {
      const endpoint = selectedShift.clockedIn ? 'clock-out' : 'clock-in';
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/shifts/${selectedShift.id}/${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode: qrCodeData, staffId })
        }
      );

      if (response.ok) {
        const data = await response.json();
        setToast({
          show: true,
          message: data.message,
          color: 'success'
        });
        await fetchShifts(); // Refresh shifts
      } else {
        const errorData = await response.json();
        setToast({
          show: true,
          message: errorData.error || 'Failed to process clock-in/out',
          color: 'danger'
        });
      }
    } catch (error) {
      console.error('Clock-in/out error:', error);
      setToast({
        show: true,
        message: 'Network error. Please try again.',
        color: 'danger'
      });
    } finally {
      setShowScanner(false);
      setSelectedShift(null);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#9333ea' }}>
          <IonTitle>Staff Dashboard</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onLogout}>
            <IonIcon icon={logOut} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#1a1a1a' }}>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {/* Welcome Section */}
        <div style={{
          background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)',
          padding: '24px',
          color: 'white'
        }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 'bold' }}>
            Welcome, {staffName}
          </h2>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          padding: '16px'
        }}>
          <div style={{
            background: '#2a2a2a',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #3a3a3a'
          }}>
            <div style={{ color: '#fbbf24', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              {totalHoursThisWeek}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>
              Hours This Week
            </div>
          </div>

          <div style={{
            background: '#2a2a2a',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #3a3a3a'
          }}>
            <div style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              {completedShifts}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>
              Completed
            </div>
          </div>

          <div style={{
            background: '#2a2a2a',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            border: '1px solid #3a3a3a'
          }}>
            <div style={{ color: '#9333ea', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              {upcomingShifts.length}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>
              Upcoming
            </div>
          </div>
        </div>

        {/* Active Shift */}
        {activeShift && (
          <div style={{ padding: '0 16px 16px' }}>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
              Active Shift
            </h3>
            <div style={{
              background: '#2a2a2a',
              borderRadius: '12px',
              padding: '16px',
              border: `2px solid ${activeShift.siteColor}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {activeShift.siteName}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                    {activeShift.startTime} - {activeShift.endTime}
                  </div>
                </div>
                <IonBadge color="success" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  ACTIVE
                </IonBadge>
              </div>
              
              <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
                Clocked in at: {activeShift.clockInTime ? new Date(activeShift.clockInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </div>

              <IonButton
                expand="block"
                color="danger"
                onClick={() => openScanner(activeShift)}
              >
                <IonIcon slot="start" icon={qrCode} />
                Clock Out
              </IonButton>
            </div>
          </div>
        )}

        {/* Today's Shifts */}
        {todayShifts.length > 0 && !activeShift && (
          <div style={{ padding: '0 16px 16px' }}>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
              Today's Shifts
            </h3>
            {todayShifts.map(shift => (
              <div key={shift.id} style={{
                background: '#2a2a2a',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                border: `1px solid ${shift.siteColor}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {shift.siteName}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                      {shift.type === 'Day' ? '☀️' : '🌙'} {shift.startTime} - {shift.endTime}
                    </div>
                  </div>
                  {shift.clockedOut ? (
                    <IonBadge color="medium">COMPLETED</IonBadge>
                  ) : shift.clockedIn ? (
                    <IonBadge color="success">ACTIVE</IonBadge>
                  ) : (
                    <IonBadge color="warning">PENDING</IonBadge>
                  )}
                </div>

                {!shift.clockedIn && (
                  <IonButton
                    expand="block"
                    color="success"
                    onClick={() => openScanner(shift)}
                  >
                    <IonIcon slot="start" icon={qrCode} />
                    Clock In
                  </IonButton>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upcoming Shifts */}
        <div style={{ padding: '0 16px 16px' }}>
          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
            Upcoming Shifts
          </h3>
          {upcomingShifts.length === 0 ? (
            <div style={{
              background: '#2a2a2a',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              border: '1px solid #3a3a3a'
            }}>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                No upcoming shifts assigned
              </div>
            </div>
          ) : (
            upcomingShifts.map(shift => (
              <div key={shift.id} style={{
                background: '#2a2a2a',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                border: '1px solid #3a3a3a'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'inline-block',
                      background: shift.siteColor,
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginBottom: '8px'
                    }}>
                      {new Date(shift.date).getDate()} {new Date(shift.date).toLocaleDateString('en-GB', { month: 'short' })}
                    </div>
                    <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {shift.siteName}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                      {shift.type === 'Day' ? '☀️ Day' : '🌙 Night'} • {shift.startTime} - {shift.endTime}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>
                      {shift.duration} hours
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* QR Scanner */}
        {showScanner && selectedShift && (
          <QRScanner
            onScan={handleQRScan}
            onClose={() => {
              setShowScanner(false);
              setSelectedShift(null);
            }}
            shiftInfo={{
              siteName: selectedShift.siteName,
              type: selectedShift.type,
              startTime: selectedShift.startTime,
              endTime: selectedShift.endTime,
              clockedIn: selectedShift.clockedIn
            }}
          />
        )}

        {/* Toast Notifications */}
        <IonToast
          isOpen={toast.show}
          onDidDismiss={() => setToast({ ...toast, show: false })}
          message={toast.message}
          duration={3000}
          color={toast.color}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default StaffDashboard;

