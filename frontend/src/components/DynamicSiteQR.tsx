import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import QRCode from 'qrcode';

const DynamicSiteQR: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlSiteName = searchParams.get('name');

  const [siteName, setSiteName] = useState(urlSiteName || 'Loading...');
  const [currentCode, setCurrentCode] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate static QR code for backend compatibility
  const generateCode = () => {
    // Backend expects 'SITE_{siteId}'
    // See backend/src/index.ts around line 618
    return `SITE_${siteId}`;
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
        // Try to find in shared data first (which might be cached)
        const { getSites } = await import('../data/sharedData');
        const sites = getSites();
        const localSite = sites.find((s: any) => s.id === siteId);

        if (localSite) {
          setSiteName(localSite.name);
          return;
        }

        // Fallback to direct API call
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/api/sites`);
        const apiSites = await response.json();
        const site = apiSites.find((s: any) => s.id === siteId);
        if (site) {
          setSiteName(site.name);
        } else {
          setSiteName('Site Not Found');
        }
      } catch (error) {
        console.error('Error fetching site:', error);
        setSiteName('Error Loading Site');
      }
    };
    fetchSiteName();
  }, [siteId]);

  // Update QR code once on mount
  useEffect(() => {
    updateQRCode();
  }, [siteId, siteName]);

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
          🔒 Secure Site QR Code
        </p>
      </div>
    </div>
  );
};

export default DynamicSiteQR;

