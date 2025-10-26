import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonTextarea,
  IonButtons,
  IonBadge
} from '@ionic/react';
import {
  close,
  checkmarkCircle,
  closeCircle,
  time,
  alertCircle,
  qrCode,
  chatbubble,
  people,
  location,
  calendar
} from 'ionicons/icons';

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
  status?: string;
  clockInTime?: string;
  clockOutTime?: string;
  isBank: boolean;
}

interface Coworker {
  staffName: string;
  type: string;
}

interface ShiftDetailsModalProps {
  isOpen: boolean;
  shift: Shift | null;
  coworkers: Coworker[];
  onClose: () => void;
  onAccept: (shiftId: string) => void;
  onDecline: (shiftId: string, reason?: string) => void;
  onRunningLate: (shiftId: string, reason?: string) => void;
  onCantMakeIt: (shiftId: string, reason: string) => void;
  onClockIn: (shift: Shift) => void;
  onSendMessage: (message: string) => void;
}

const ShiftDetailsModal: React.FC<ShiftDetailsModalProps> = ({
  isOpen,
  shift,
  coworkers,
  onClose,
  onAccept,
  onDecline,
  onRunningLate,
  onCantMakeIt,
  onClockIn,
  onSendMessage
}) => {
  const [showDeclineReason, setShowDeclineReason] = useState(false);
  const [showLateReason, setShowLateReason] = useState(false);
  const [showCantMakeReason, setShowCantMakeReason] = useState(false);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  if (!shift) return null;

  const handleAccept = () => {
    onAccept(shift.id);
    onClose();
  };

  const handleDecline = () => {
    if (showDeclineReason) {
      onDecline(shift.id, reason);
      setReason('');
      setShowDeclineReason(false);
      onClose();
    } else {
      setShowDeclineReason(true);
    }
  };

  const handleRunningLate = () => {
    if (showLateReason) {
      onRunningLate(shift.id, reason);
      setReason('');
      setShowLateReason(false);
      onClose();
    } else {
      setShowLateReason(true);
    }
  };

  const handleCantMakeIt = () => {
    if (showCantMakeReason) {
      if (reason.trim()) {
        onCantMakeIt(shift.id, reason);
        setReason('');
        setShowCantMakeReason(false);
        onClose();
      }
    } else {
      setShowCantMakeReason(true);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
      setShowMessageBox(false);
    }
  };

  const isToday = shift.date === new Date().toISOString().split('T')[0];
  const isPending = !shift.status || shift.status === 'pending';

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar style={{ '--background': '#9333ea' }}>
          <IonTitle style={{ color: 'white' }}>Shift Details</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon icon={close} style={{ color: 'white' }} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#1a1a1a' }}>
        <div style={{ padding: '16px' }}>
          {/* Shift Info Card */}
          <div style={{
            background: '#2a2a2a',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '16px',
            borderLeft: `4px solid ${shift.siteColor}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                {shift.type === 'Day' ? '☀️' : '🌙'} {shift.type} Shift
              </h2>
              {isToday && <IonBadge color="success">TODAY</IonBadge>}
            </div>

            <div style={{ color: '#999', fontSize: '14px', marginBottom: '20px' }}>
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                <IonIcon icon={calendar} style={{ marginRight: '8px', fontSize: '18px' }} />
                {new Date(shift.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                <IonIcon icon={time} style={{ marginRight: '8px', fontSize: '18px' }} />
                {shift.startTime} - {shift.endTime} ({shift.duration} hours)
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <IonIcon icon={location} style={{ marginRight: '8px', fontSize: '18px' }} />
                {shift.siteName}
              </div>
            </div>
          </div>

          {/* Coworkers */}
          {coworkers.length > 0 && (
            <div style={{
              background: '#2a2a2a',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
                <IonIcon icon={people} style={{ marginRight: '8px' }} />
                Working With ({coworkers.length})
              </h3>
              <IonList style={{ background: 'transparent' }}>
                {coworkers.map((coworker, idx) => (
                  <IonItem key={idx} style={{ '--background': '#1a1a1a', '--color': 'white', marginBottom: '8px', borderRadius: '8px' }}>
                    <IonLabel>
                      <div style={{ fontWeight: '500' }}>{coworker.staffName}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>{coworker.type} Shift</div>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>
            </div>
          )}

          {/* Actions */}
          <div style={{ marginBottom: '16px' }}>
            {/* Accept/Decline (only for pending shifts) */}
            {isPending && !shift.clockedIn && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <IonButton expand="block" color="success" onClick={handleAccept}>
                  <IonIcon slot="start" icon={checkmarkCircle} />
                  Accept
                </IonButton>
                <IonButton expand="block" color="danger" onClick={handleDecline}>
                  <IonIcon slot="start" icon={closeCircle} />
                  Decline
                </IonButton>
              </div>
            )}

            {showDeclineReason && (
              <div style={{ marginBottom: '12px' }}>
                <IonTextarea
                  placeholder="Reason for declining (optional)"
                  value={reason}
                  onIonChange={e => setReason(e.detail.value || '')}
                  rows={3}
                  style={{ 
                    '--background': '#2a2a2a', 
                    '--color': 'white',
                    '--padding-start': '12px',
                    '--padding-end': '12px',
                    borderRadius: '8px'
                  }}
                />
                <IonButton expand="block" color="danger" onClick={handleDecline} style={{ marginTop: '8px' }}>
                  Confirm Decline
                </IonButton>
              </div>
            )}

            {/* Running Late / Can't Make It (only for today's shifts) */}
            {isToday && !shift.clockedIn && (
              <>
                <IonButton expand="block" fill="outline" color="warning" onClick={handleRunningLate} style={{ marginBottom: '8px' }}>
                  <IonIcon slot="start" icon={time} />
                  Running Late
                </IonButton>

                {showLateReason && (
                  <div style={{ marginBottom: '12px' }}>
                    <IonTextarea
                      placeholder="Reason (optional)"
                      value={reason}
                      onIonChange={e => setReason(e.detail.value || '')}
                      rows={2}
                      style={{ 
                        '--background': '#2a2a2a', 
                        '--color': 'white',
                        '--padding-start': '12px',
                        '--padding-end': '12px',
                        borderRadius: '8px'
                      }}
                    />
                    <IonButton expand="block" color="warning" onClick={handleRunningLate} style={{ marginTop: '8px' }}>
                      Confirm Running Late
                    </IonButton>
                  </div>
                )}

                <IonButton expand="block" fill="outline" color="danger" onClick={handleCantMakeIt} style={{ marginBottom: '8px' }}>
                  <IonIcon slot="start" icon={alertCircle} />
                  Can't Make It
                </IonButton>

                {showCantMakeReason && (
                  <div style={{ marginBottom: '12px' }}>
                    <IonTextarea
                      placeholder="Reason (required)"
                      value={reason}
                      onIonChange={e => setReason(e.detail.value || '')}
                      rows={3}
                      style={{ 
                        '--background': '#2a2a2a', 
                        '--color': 'white',
                        '--padding-start': '12px',
                        '--padding-end': '12px',
                        borderRadius: '8px'
                      }}
                    />
                    <IonButton 
                      expand="block" 
                      color="danger" 
                      onClick={handleCantMakeIt} 
                      disabled={!reason.trim()}
                      style={{ marginTop: '8px' }}
                    >
                      Confirm Can't Make It
                    </IonButton>
                  </div>
                )}
              </>
            )}

            {/* Clock In (only for today's accepted shifts) */}
            {isToday && !shift.clockedIn && shift.status === 'accepted' && (
              <IonButton expand="block" color="primary" onClick={() => { onClockIn(shift); onClose(); }}>
                <IonIcon slot="start" icon={qrCode} />
                Clock In with QR
              </IonButton>
            )}

            {/* Message to Admin */}
            <IonButton 
              expand="block" 
              fill="outline" 
              color="medium" 
              onClick={() => setShowMessageBox(!showMessageBox)}
              style={{ marginTop: '12px' }}
            >
              <IonIcon slot="start" icon={chatbubble} />
              Message Admin
            </IonButton>

            {showMessageBox && (
              <div style={{ marginTop: '12px' }}>
                <IonTextarea
                  placeholder="Type your message to admin..."
                  value={message}
                  onIonChange={e => setMessage(e.detail.value || '')}
                  rows={4}
                  style={{ 
                    '--background': '#2a2a2a', 
                    '--color': 'white',
                    '--padding-start': '12px',
                    '--padding-end': '12px',
                    borderRadius: '8px',
                    marginBottom: '8px'
                  }}
                />
                <IonButton 
                  expand="block" 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  Send Message
                </IonButton>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default ShiftDetailsModal;

