import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { close, checkmarkCircle, alertCircle } from 'ionicons/icons';

interface QRScannerProps {
  onScan: (qrCode: string) => void;
  onClose: () => void;
  shiftInfo?: {
    siteName: string;
    type: string;
    startTime: string;
    endTime: string;
    clockedIn: boolean;
  };
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, shiftInfo }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setScanning(true);
      setError('');

      const html5QrCode = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          console.log('QR Code scanned:', decodedText);
          setSuccess(true);
          stopScanner();
          setTimeout(() => {
            onScan(decodedText);
          }, 500);
        },
        (errorMessage) => {
          // Scanning error - ignore, this happens frequently
        }
      );
    } catch (err: any) {
      console.error('Scanner error:', err);
      setError(err.message || 'Failed to start camera. Please check permissions.');
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: '#2563eb',
        padding: '16px',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
          Scan QR Code
        </h3>
        <IonButton fill="clear" onClick={onClose} style={{ color: 'white' }}>
          <IonIcon icon={close} slot="icon-only" />
        </IonButton>
      </div>

      {/* Scanner Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px'
      }}>
        {/* QR Scanner */}
        <div style={{
          width: '100%',
          maxWidth: '400px',
          marginBottom: '24px',
          position: 'relative'
        }}>
          <div 
            id={qrCodeRegionId} 
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              border: success ? '3px solid #10b981' : error ? '3px solid #ef4444' : '3px solid #2563eb'
            }}
          />
          
          {success && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(16, 185, 129, 0.9)',
              borderRadius: '50%',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IonIcon icon={checkmarkCircle} style={{ fontSize: '64px', color: 'white' }} />
            </div>
          )}
        </div>

        {/* Shift Info */}
        {shiftInfo && (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '16px',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid #e5e7eb',
            marginBottom: '16px'
          }}>
            <div style={{ color: '#111827', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
              {shiftInfo.siteName}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>
              {shiftInfo.type === 'Day' ? '☀️ Day Shift' : '🌙 Night Shift'} • {shiftInfo.startTime} - {shiftInfo.endTime}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!error && !success && (
          <div style={{
            color: '#d1d5db',
            fontSize: '14px',
            textAlign: 'center',
            maxWidth: '320px'
          }}>
            {scanning ? (
              <>
                Position the QR code within the frame
                {shiftInfo && (
                  <>
                    <br />
                    to {shiftInfo.clockedIn ? 'clock out' : 'clock in'}
                  </>
                )}
              </>
            ) : (
              <IonSpinner name="crescent" />
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#ef4444',
            padding: '16px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <IonIcon icon={alertCircle} style={{ fontSize: '24px', flexShrink: 0 }} />
            <div style={{ fontSize: '14px' }}>{error}</div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div style={{
            background: '#d1fae5',
            color: '#065f46',
            padding: '16px',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '400px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <IonIcon icon={checkmarkCircle} style={{ fontSize: '24px', flexShrink: 0 }} />
            <div style={{ fontSize: '14px' }}>QR Code scanned successfully!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;

