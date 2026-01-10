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

import { Shift } from '../services/api';

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

  // Check if response is locked
  const isLocked = shift.responseLocked || false;
  const wasAutoAccepted = shift.autoAccepted || false;

  // Calculate time until deadline
  const getTimeUntilDeadline = () => {
    if (!shift.weekDeadline) return null;
    const deadline = new Date(shift.weekDeadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    if (diff < 0) return 'Deadline passed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const handleAccept = () => {
    if (isLocked) {
      alert('This shift is locked. Please contact admin to change your response.');
      return;
    }
    onAccept(shift.id);
    onClose();
  };

  const handleDecline = () => {
    if (isLocked) {
      alert('This shift is locked. Please contact admin to change your response.');
      return;
    }
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
  const isPending = !shift.staffStatus || shift.staffStatus === 'pending';

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

          {/* Deadline Warning Banner */}
          {isPending && !isLocked && getTimeUntilDeadline() && getTimeUntilDeadline() !== 'Deadline passed' && (
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <IonIcon icon={alertCircle} style={{ fontSize: '24px', color: 'white', flexShrink: 0 }} />
              <div style={{ color: 'white' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Response Required</div>
                <div style={{ fontSize: '13px' }}>
                  Accept or decline by Saturday midnight. {getTimeUntilDeadline()}
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                  Pending shifts will be auto-accepted after the deadline.
                </div>
              </div>
            </div>
          )}

          {/* Auto-Accepted Notice */}
          {wasAutoAccepted && (
            <div style={{
              background: '#10b98120',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <IonIcon icon={checkmarkCircle} style={{ fontSize: '24px', color: '#10b981', flexShrink: 0 }} />
              <div style={{ color: '#10b981', fontSize: '14px' }}>
                This shift was automatically accepted after the deadline passed.
              </div>
            </div>
          )}

          {/* Locked Notice */}
          {isLocked && isPending && (
            <div style={{
              background: '#ef444420',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <IonIcon icon={alertCircle} style={{ fontSize: '24px', color: '#ef4444', flexShrink: 0 }} />
              <div style={{ color: '#ef4444', fontSize: '14px' }}>
                Response deadline passed. Contact admin to change your response.
              </div>
            </div>
          )}

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

            {/* Clock In (only for today's shifts that aren't clocked in yet) */}
            {isToday && !shift.clockedIn && (
              <IonButton
                expand="block"
                color="primary"
                onClick={() => { onClockIn(shift); onClose(); }}
                style={{ '--background': '#9333ea', '--background-activated': '#7c3aed', marginTop: '8px' }}
              >
                <IonIcon slot="start" icon={qrCode} />
                {shift.staffStatus === 'accepted' ? 'Clock In with QR' : 'Accept & Clock In'}
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

