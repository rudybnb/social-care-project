import React, { useState } from 'react';

interface SiteQRCodeModalProps {
  siteId: string;
  siteName: string;
  onClose: () => void;
}

const SiteQRCodeModal: React.FC<SiteQRCodeModalProps> = ({ siteId, siteName, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  const qrDisplayUrl = `${window.location.origin}/#/site-qr/${siteId}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrDisplayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInNewTab = () => {
    window.open(qrDisplayUrl, '_blank');
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
          maxWidth: '550px',
          width: '90%',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            Dynamic Site QR Code
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            {siteName}
          </p>
        </div>

        {/* Security Badge */}
        <div
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          ✓ Secure • QR Code refreshes every 60 seconds
        </div>

        {/* URL Display */}
        <div
          style={{
            backgroundColor: '#2a2a2a',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #3a3a3a'
          }}
        >
          <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px', textAlign: 'left' }}>
            Display URL:
          </div>
          <div
            style={{
              backgroundColor: '#1a1a1a',
              padding: '12px',
              borderRadius: '6px',
              color: '#3b82f6',
              fontSize: '13px',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              textAlign: 'left'
            }}
          >
            {qrDisplayUrl}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={handleCopyUrl}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: copied ? '#10b981' : '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy URL'}
          </button>
          <button
            onClick={handleOpenInNewTab}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: '#8b5cf6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🖥️ Open Display
          </button>
        </div>

        {/* Instructions */}
        <div
          style={{
            backgroundColor: '#2a2a2a',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'left',
            border: '1px solid #3a3a3a'
          }}
        >
          <div style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            📱 Setup Instructions:
          </div>
          <ol style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
            <li><strong>Get a tablet or old phone</strong> for the site entrance</li>
            <li><strong>Open the URL above</strong> in the browser</li>
            <li><strong>Keep the screen on</strong> (adjust device settings)</li>
            <li><strong>Mount it at the entrance</strong> where staff can easily scan</li>
            <li><strong>Keep it plugged in</strong> to power</li>
          </ol>
        </div>

        {/* Security Info */}
        <div
          style={{
            backgroundColor: '#2a2a2a',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'left',
            border: '1px solid #3a3a3a'
          }}
        >
          <div style={{ color: '#10b981', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
            🔒 Why Dynamic QR Codes?
          </div>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
            The QR code changes every 60 seconds, preventing staff from taking photos and clocking in from home. 
            They must be physically present at the site to scan the live QR code.
          </p>
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

export default SiteQRCodeModal;

