import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import * as OTPAuth from 'otpauth';

const DynamicSiteQR: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const [siteName, setSiteName] = useState('Loading...');
  const [currentCode, setCurrentCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate TOTP secret for this site (deterministic based on siteId)
  const getSecret = (siteId: string) => {
    // In production, this should be stored securely in the database
    // For now, we'll generate a deterministic secret based on siteId
    return `ECCLESIA${siteId.toUpperCase().replace(/[^A-Z0-9]/g, '')}SECRET`;
  };

  // Generate current TOTP code
  const generateCode = () => {
    const secret = getSecret(siteId || '');
    const totp = new OTPAuth.TOTP({
      issuer: 'Ecclesia Care',
      label: siteName,
      algorithm: 'SHA1',
      digits: 6,
      period: 60, // 60 second validity
      secret: OTPAuth.Secret.fromBase32(secret)
    });
    
    const token = totp.generate();
    const qrData = `SITE_CHECKIN:${siteId}:${token}`;
    return qrData;
  };

  // Update QR code
  const updateQRCode = () => {
    const code = generateCode();
    setCurrentCode(code);
    
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, code, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    }
  };

  // Fetch site name
  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/sites`);
        const sites = await response.json();
        const site = sites.find((s: any) => s.id === siteId);
        if (site) {
          setSiteName(site.name);
        }
      } catch (error) {
        console.error('Error fetching site:', error);
      }
    };
    fetchSiteName();
  }, [siteId]);

  // Update QR code every 60 seconds
  useEffect(() => {
    updateQRCode();
    const interval = setInterval(() => {
      updateQRCode();
      setTimeLeft(60);
    }, 60000);

    return () => clearInterval(interval);
  }, [siteId, siteName]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) return 60;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h1 style={{
          color: '#2563eb',
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '10px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          📍 {siteName}
        </h1>
        <p style={{
          color: '#9ca3af',
          fontSize: '24px',
          margin: 0
        }}>
          Site Check-In
        </p>
      </div>

      {/* QR Code Container */}
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        marginBottom: '30px'
      }}>
        <canvas ref={canvasRef} />
      </div>

      {/* Timer */}
      <div style={{
        backgroundColor: '#2a2a2a',
        padding: '20px 40px',
        borderRadius: '16px',
        border: '2px solid #3a3a3a',
        marginBottom: '30px'
      }}>
        <div style={{
          color: '#9ca3af',
          fontSize: '16px',
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          Code refreshes in
        </div>
        <div style={{
          color: timeLeft <= 10 ? '#ef4444' : '#10b981',
          fontSize: '48px',
          fontWeight: 'bold',
          textAlign: 'center',
          fontFamily: 'monospace'
        }}>
          {timeLeft}s
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        backgroundColor: '#2a2a2a',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #3a3a3a',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <h3 style={{
          color: 'white',
          fontSize: '20px',
          marginBottom: '16px'
        }}>
          📱 How to Clock In/Out
        </h3>
        <ol style={{
          color: '#9ca3af',
          fontSize: '16px',
          lineHeight: '1.8',
          textAlign: 'left',
          paddingLeft: '24px',
          margin: 0
        }}>
          <li>Open the Staff App on your phone</li>
          <li>Navigate to your assigned shift</li>
          <li>Tap "Clock In" or "Clock Out"</li>
          <li>Scan this QR code</li>
        </ol>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '40px',
        color: '#6b7280',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        <p style={{ margin: '8px 0' }}>
          Ecclesia Family Centre
        </p>
        <p style={{ margin: '8px 0' }}>
          Social Care Management System
        </p>
        <p style={{ margin: '8px 0', fontSize: '12px' }}>
          🔒 Secure Dynamic QR Code • Refreshes every 60 seconds
        </p>
      </div>
    </div>
  );
};

export default DynamicSiteQR;

