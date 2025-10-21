import React from 'react';

const Sites: React.FC = () => {
  const sites = [
    {
      name: 'Kent Care Home',
      location: 'Kent',
      postCode: 'CT1 1AA',
      status: 'Active',
      statusColor: '#9333ea',
      clockInQR: 'Not generated',
      icon: '🏢'
    },
    {
      name: 'London Care Home',
      location: 'London',
      postCode: 'SW1A 1AA',
      status: 'Active',
      statusColor: '#10b981',
      clockInQR: 'Not generated',
      icon: '🏢'
    },
    {
      name: 'Essex Care Home',
      location: 'Essex',
      postCode: 'CM1 1AA',
      status: 'Active',
      statusColor: '#f59e0b',
      clockInQR: 'Not generated',
      icon: '🏢'
    }
  ];

  return (
    <div style={{ padding: '30px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
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
            padding: '12px 24px',
            backgroundColor: '#9333ea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            touchAction: 'manipulation',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ➕ Add Site
        </button>
      </div>

      {/* Sites Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {sites.map((site, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#2a2a3a',
              borderRadius: '12px',
              padding: '24px',
              border: '1px solid #3a3a4a',
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
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: '18px',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              ✏️
            </button>

            {/* Site Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '50px',
                height: '50px',
                backgroundColor: site.statusColor,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                marginRight: '16px'
              }}>
                {site.icon}
              </div>
              <div>
                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                  {site.name}
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📍 {site.location}
                </p>
              </div>
            </div>

            {/* Site Details */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#9ca3af', fontSize: '13px' }}>Post Code: </span>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{site.postCode}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#9ca3af', fontSize: '13px', marginRight: '8px' }}>Status: </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  backgroundColor: `${site.statusColor}20`,
                  color: site.statusColor,
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  ● {site.status}
                </span>
              </div>
            </div>

            {/* QR Code Section */}
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px', marginRight: '8px' }}>📱</span>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Clock-in QR</span>
              </div>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: '0 0 12px 0' }}>
                {site.clockInQR}
              </p>
              <button
                onClick={() => alert(`Generate QR for ${site.name}`)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  alert(`Generate QR for ${site.name}`);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2a2a3a',
                  color: 'white',
                  border: '1px solid #3a3a4a',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🔄 Generate QR
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sites;

