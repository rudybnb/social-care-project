import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { useNavigate } from 'react-router-dom';

const WorkerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleClockIn = () => {
    alert('Clock In clicked - This would record your clock-in time');
  };

  const handleClockOut = () => {
    alert('Clock Out clicked - This would record your clock-out time');
  };

  const handleNavigation = (path: string, label: string) => {
    alert(`${label} clicked - Would navigate to ${path}`);
    // navigate(path);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Worker Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Today</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="space-y-2">
                    <div>Shift: 08:00 - 16:00</div>
                    <div>Room: A-103</div>
                    <div>Status: Not clocked in</div>
                    
                    {/* Native buttons for better touch compatibility */}
                    <button
                      onClick={handleClockIn}
                      style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '8px',
                        backgroundColor: '#3880ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        touchAction: 'manipulation'
                      }}
                    >
                      Clock In
                    </button>
                    
                    <button
                      onClick={handleClockOut}
                      style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '8px',
                        backgroundColor: '#92949c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        touchAction: 'manipulation'
                      }}
                    >
                      Clock Out
                    </button>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeMd="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Quick Links</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleNavigation('/worker/attendance', 'Attendance')}
                      style={{
                        padding: '12px',
                        backgroundColor: '#3880ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        touchAction: 'manipulation'
                      }}
                    >
                      Attendance
                    </button>
                    
                    <button
                      onClick={() => handleNavigation('/worker/rooms', 'Rooms')}
                      style={{
                        padding: '12px',
                        backgroundColor: '#3880ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        touchAction: 'manipulation'
                      }}
                    >
                      Rooms
                    </button>
                    
                    <button
                      onClick={() => handleNavigation('/worker/queries', 'Queries')}
                      style={{
                        padding: '12px',
                        backgroundColor: '#3880ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        touchAction: 'manipulation'
                      }}
                    >
                      Queries
                    </button>
                    
                    <button
                      onClick={() => handleNavigation('/worker/shifts', 'Shifts')}
                      style={{
                        padding: '12px',
                        backgroundColor: '#3880ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        touchAction: 'manipulation'
                      }}
                    >
                      Shifts
                    </button>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default WorkerDashboard;

