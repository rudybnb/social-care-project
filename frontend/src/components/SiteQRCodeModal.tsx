import QRCode from 'qrcode';

const SiteQRCodeModal: React.FC<SiteQRCodeModalProps> = ({ siteId, siteName, onClose }) => {
  const [copied, setCopied] = useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const qrDisplayUrl = `${window.location.origin}/#/site-qr/${siteId}?name=${encodeURIComponent(siteName)}`;

  React.useEffect(() => {
    if (canvasRef.current) {
      // Backend expects 'SITE_{siteId}'
      const code = `SITE_${siteId}`;
      QRCode.toCanvas(canvasRef.current, code, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) console.error('Error generating QR:', error);
      });
    }
  }, [siteId]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrDisplayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenInNewTab = () => {
    window.open(qrDisplayUrl, '_blank');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code - ${siteName}</title>
            <style>
              body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
              h1 { margin-bottom: 20px; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <h1>${siteName}</h1>
            <img src="${canvasRef.current?.toDataURL()}" />
            <p>Scan to Clock In/Out</p>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
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
          maxWidth: '550px',
          width: '90%',
          textAlign: 'center',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔒</div>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            Site QR Code
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            {siteName}
          </p>
        </div>

        {/* QR Code Canvas */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'inline-block'
        }}>
          <canvas ref={canvasRef} />
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
            Direct Link:
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '24px' }}>
          <button
            onClick={handleCopyUrl}
            style={{
              padding: '12px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: copied ? '#10b981' : '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {copied ? '✓ Copied' : '📋 Copy Link'}
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '12px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: '#f59e0b',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🖨️ Print QR
          </button>
          <button
            onClick={handleOpenInNewTab}
            style={{
              padding: '12px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: '#8b5cf6',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🖥️ Open Tab
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
            📱 How to use:
          </div>
          <ol style={{ color: '#9ca3af', fontSize: '14px', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
            <li><strong>Print this QR code</strong></li>
            <li><strong>Stick it at the entrance</strong> of the site</li>
            <li><strong>Staff scan it</strong> using their phone camera to clock in/out</li>
            <li>The code <strong>does not change</strong>, so you only need to print it once.</li>
          </ol>
        </div>

        {/* Simple Note */}
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
            ✅ Static QR Code
          </div>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
            This QR code is unique to this site and permanent. You do not need to generate a new one every day.
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

