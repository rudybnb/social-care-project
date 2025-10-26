import React, { useState, useEffect } from 'react';
import { IonPage, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonBadge, IonIcon, IonRefresher, IonRefresherContent, IonToast } from '@ionic/react';
import { calendar, time, location, qrCode, logOut, statsChart } from 'ionicons/icons';
import QRScanner from './QRScanner';
import StaffCalendar from './StaffCalendar';
import ShiftDetailsModal from './ShiftDetailsModal';

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
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [modalShift, setModalShift] = useState<Shift | null>(null);
  const [allShifts, setAllShifts] = useState<any[]>([]);

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

  // Fetch all shifts for coworker info
  const fetchAllShifts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/shifts`);
      if (response.ok) {
        const data = await response.json();
        setAllShifts(data);
      }
    } catch (error) {
      console.error('Error fetching all shifts:', error);
    }
  };

  useEffect(() => {
    fetchShifts();
    fetchAllShifts();
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
        <IonToolbar style={{ '--background': '#9333ea', '--color': 'white' }}>
          <IonTitle>Staff Dashboard</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onLogout} style={{ '--color': 'white' }}>
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
            <div style={{ color: '#f59e0b', fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
              {totalHoursThisWeek}
            </div>
            <div style={{ color: '#6b7280', fontSize: '12px' }}>
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
            <div style={{ color: '#6b7280', fontSize: '12px' }}>
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
            <div style={{ color: '#6b7280', fontSize: '12px' }}>
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
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>
                    {activeShift.startTime} - {activeShift.endTime}
                  </div>
                </div>
                <IonBadge color="success" style={{ fontSize: '12px', padding: '6px 12px' }}>
                  ACTIVE
                </IonBadge>
              </div>
              
              <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '12px' }}>
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


        {/* Calendar View */}
        <div style={{ padding: '0 0 16px' }}>
          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', padding: '0 16px' }}>
            <IonIcon icon={calendar} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            My Schedule
          </h3>
          <StaffCalendar 
            staffId={staffId} 
            shifts={shifts} 
            onDayClick={(date, dayShifts) => {
              if (dayShifts.length > 0) {
                setModalShift(dayShifts[0]);
                setShowShiftModal(true);
              }
            }} 
          />
        </div>

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
                No upcoming shifts
              </div>
            </div>
          ) : (
            upcomingShifts.map(shift => (
              <div key={shift.id} style={{
                background: '#2a2a2a',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                border: `1px solid ${shift.siteColor}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {shift.siteName}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                      {new Date(shift.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>
                      {shift.startTime} - {shift.endTime}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '12px' }}>
                      {shift.duration} hours
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {showScanner && selectedShift && (
          <QRScanner 
            onScan={handleQRScan} 
            onClose={() => setShowScanner(false)} 
            shiftInfo={selectedShift} 
          />
        )}

        {showShiftModal && modalShift && (
          <ShiftDetailsModal
            isOpen={showShiftModal}
            shift={modalShift}
            coworkers={allShifts
              .filter(s => s.date === modalShift.date && s.staffId !== staffId)
              .map(s => ({ 
                staffName: s.staffName, 
                type: `${s.type} Shift ${s.startTime}-${s.endTime}` 
              }))}
            onClose={() => setShowShiftModal(false)}
            onAccept={async (shiftId) => {
              try {
                const response = await fetch(
                  `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/shifts/${shiftId}/status`,
                  {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ staffStatus: 'accepted' })
                  }
                );
                if (response.ok) {
                  setToast({ show: true, message: 'Shift accepted!', color: 'success' });
                  fetchShifts();
                } else {
                  setToast({ show: true, message: 'Failed to accept shift', color: 'danger' });
                }
              } catch (error) {
                console.error('Error accepting shift:', error);
                setToast({ show: true, message: 'Network error', color: 'danger' });
              }
            }}
            onDecline={async (shiftId, reason) => {
              try {
                const response = await fetch(
                  `${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/shifts/${shiftId}/status`,
                  {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ staffStatus: 'declined', declineReason: reason })
                  }
                );
                if (response.ok) {
                  setToast({ show: true, message: `Shift declined${reason ? ': ' + reason : ''}`, color: 'warning' });
                  fetchShifts();
                } else {
                  setToast({ show: true, message: 'Failed to decline shift', color: 'danger' });
                }
              } catch (error) {
                console.error('Error declining shift:', error);
                setToast({ show: true, message: 'Network error', color: 'danger' });
              }
            }}
            onRunningLate={(shiftId, reason) => {
              setToast({ show: true, message: `Marked as running late${reason ? ': ' + reason : ''}`, color: 'warning' });
            }}
            onCantMakeIt={(shiftId, reason) => {
              setToast({ show: true, message: `Marked as can't make it: ${reason}`, color: 'danger' });
              fetchShifts();
            }}
            onClockIn={(shift) => {
              openScanner(shift);
            }}
            onSendMessage={(message) => {
              setToast({ show: true, message: 'Message sent to admin!', color: 'success' });
            }}
          />
        )}

        <IonToast
          isOpen={toast.show}
          onDidDismiss={() => setToast({ show: false, message: '', color: 'success' })}
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

