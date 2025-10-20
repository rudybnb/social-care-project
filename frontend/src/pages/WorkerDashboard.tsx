import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from '@ionic/react';

const WorkerDashboard: React.FC = () => {
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
                    <IonButton expand="block">Clock In</IonButton>
                    <IonButton expand="block" color="medium">Clock Out</IonButton>
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
                    <IonButton routerLink="/worker/attendance" expand="block">Attendance</IonButton>
                    <IonButton routerLink="/worker/rooms" expand="block">Rooms</IonButton>
                    <IonButton routerLink="/worker/queries" expand="block">Queries</IonButton>
                    <IonButton routerLink="/worker/shifts" expand="block">Shifts</IonButton>
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