import React from 'react';

const Sites: React.FC = () => {
  const sites = [
    {
      name: 'Kent Care Home',
      location: 'Kent',
      postCode: 'CT1 1AA',
      status: 'Active',
      statusColor: '#9333ea',
      clockInQR: 'Not generated'
    },
    {
      name: 'London Care Home',
      location: 'London',
      postCode: 'SW1A 1AA',
      status: 'Active',
      statusColor: '#10b981',
      clockInQR: 'Not generated'
    },
    {
      name: 'Essex Care Home',
      location: 'Essex',
      postCode: 'CM1 1AA',
      status: 'Active',
      statusColor: '#6366f1',
      clockInQR: 'Not generated'
    }
  ];

  return (
    <div style={{ padding: '30px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            Site Management
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            Manage your organization's locations and facilities
          </p>
        </div>
        <button
          onClick={() => alert('Add Site clicked')}
          onTouchEnd={(e) => {
            e.preventDefault();
            alert('Add Site clicked');
          }}
          style={{
            padding: '12px 28px',
            backgroundColor: '#9333ea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation',
            boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)'
          }}
        >
          + Add Site
        </button>
      </div>

      {/* Sites Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {sites.map((site, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '12px',
              padding: '28px',
              border: '1px solid #3a3a3a',
              position: 'relative'
            }}
          >
            {/* Edit Button */}
            <button
              onClick={() => alert(`Edit ${site.name}`)}
              onTouchEnd={(e) => {
                e.preventDefault();
                alert(`Edit ${site.name}`);
              }}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: '14px',
                cursor: 'pointer',
                touchAction: 'manipulation',
                padding: '4px 8px'
              }}
            >
              Edit
            </button>

            {/* Site Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                backgroundColor: site.statusColor,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                flexShrink: 0
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <div>
                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
                  {site.name}
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                  {site.location}
                </p>
              </div>
            </div>

            {/* Site Details */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>Post Code</span>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{site.postCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>Status</span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  backgroundColor: `${site.statusColor}20`,
                  color: site.statusColor,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: site.statusColor, borderRadius: '50%', display: 'inline-block' }}></span>
                  {site.status}
                </span>
              </div>
            </div>

            {/* QR Code Section */}
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '10px',
              padding: '18px',
              border: '1px solid #2a2a2a'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#9333ea',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '10px'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </div>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Clock-in QR Code</span>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 14px 0' }}>
                {site.clockInQR}
              </p>
              <button
                onClick={() => alert(`Generate QR for ${site.name}`)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  alert(`Generate QR for ${site.name}`);
                }}
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#2a2a2a',
                  color: 'white',
                  border: '1px solid #3a3a3a',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  width: '100%'
                }}
              >
                Generate QR Code
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sites;

