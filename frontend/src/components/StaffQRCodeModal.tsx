import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface StaffQRCodeModalProps {
  staffId: string;
  staffName: string;
  onClose: () => void;
}

const StaffQRCodeModal: React.FC<StaffQRCodeModalProps> = ({ staffId, staffName, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const qrData = `STAFF_LOGIN:${staffId}`;
      QRCode.toCanvas(canvasRef.current, qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  }, [staffId]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${staffName.replace(/\s+/g, '_')}_QR_Login.png`;
      link.href = url;
      link.click();
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${staffName} - QR Code Login</title>
            <style>
              body {
                margin: 0;
                padding: 40px;
                font-family: Arial, sans-serif;
                text-align: center;
              }
              h1 {
                font-size: 24px;
                margin-bottom: 10px;
              }
              p {
                font-size: 14px;
                color: #666;
                margin-bottom: 30px;
              }
              img {
                border: 2px solid #000;
                padding: 20px;
                background: white;
              }
              .instructions {
                margin-top: 30px;
                font-size: 12px;
                color: #999;
              }
            </style>
          </head>
          <body>
            <h1>${staffName}</h1>
            <p>Staff Login QR Code</p>
            <img src="${dataUrl}" alt="QR Code" />
            <div class="instructions">
              <p>Scan this QR code on the Staff Login page to access your account</p>
              <p>Ecclesia Family Centre - Social Care Management System</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #3a3a3a',
          padding: '32px',
          maxWidth: '450px',
          width: '90%',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            QR Code Login
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            {staffName}
          </p>
        </div>

        {/* QR Code */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            marginBottom: '24px',
            display: 'inline-block'
          }}
        >
          <canvas ref={canvasRef} />
        </div>

        {/* Instructions */}
        <div
          style={{
            backgroundColor: '#2a2a2a',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'left'
          }}
        >
          <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.6' }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: 'white' }}>
              📱 How to use:
            </div>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Open the Staff Login page on your phone</li>
              <li>Click "📷 Scan QR Code to Login"</li>
              <li>Scan this QR code</li>
              <li>You'll be logged in automatically!</li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <button
            onClick={handleDownload}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: '#10b981',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            💾 Download
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🖨️ Print
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#9ca3af',
            backgroundColor: 'transparent',
            border: '1px solid #3a3a3a',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default StaffQRCodeModal;

