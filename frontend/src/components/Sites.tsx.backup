import React, { useState } from 'react';
import Modal from './Modal';

const Sites: React.FC = () => {
  const [showAddSite, setShowAddSite] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const [siteForm, setSiteForm] = useState({
    name: '',
    location: '',
    postCode: ''
  });

  const [sites, setSites] = useState([
    {
      id: 1,
      name: 'Kent Care Home',
      location: 'Kent',
      postCode: 'CT1 1AA',
      status: 'Active',
      statusColor: '#9333ea',
      hasQR: false
    },
    {
      id: 2,
      name: 'London Care Home',
      location: 'London',
      postCode: 'SW1A 1AA',
      status: 'Active',
      statusColor: '#10b981',
      hasQR: false
    },
    {
      id: 3,
      name: 'Essex Care Home',
      location: 'Essex',
      postCode: 'CM1 1AA',
      status: 'Active',
      statusColor: '#6366f1',
      hasQR: false
    }
  ]);

  const handleAddSite = () => {
    if (!siteForm.name || !siteForm.location || !siteForm.postCode) {
      alert('Please fill in all fields');
      return;
    }

    const colors = ['#9333ea', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc'];
    const newSite = {
      id: Date.now(),
      ...siteForm,
      status: 'Active',
      statusColor: colors[Math.floor(Math.random() * colors.length)],
      hasQR: false
    };

    setSites([...sites, newSite]);
    setShowAddSite(false);
    setSiteForm({ name: '', location: '', postCode: '' });
    alert(`Site "${newSite.name}" added successfully!`);
  };

  const handleGenerateQR = (site: any) => {
    setSelectedSite(site);
    setSites(sites.map(s => s.id === site.id ? { ...s, hasQR: true } : s));
    setShowQRCode(true);
  };

  return (
    <div style={{ padding: '20px 16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
            Site Management
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
            Manage your organization's locations and facilities
          </p>
        </div>
        <button
          onClick={() => setShowAddSite(true)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setShowAddSite(true);
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
            boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)'
          }}
        >
          + Add Site
        </button>
      </div>

      {/* Sites Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {sites.map((site) => (
          <div
            key={site.id}
            style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '12px',
              padding: '24px 20px',
              border: '1px solid #3a3a3a',
              position: 'relative'
            }}
          >
            {/* Site Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: site.statusColor,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '14px',
                flexShrink: 0
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ color: 'white', fontSize: '17px', fontWeight: 'bold', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {site.name}
                </h3>
                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                  {site.location}
                </p>
              </div>
            </div>

            {/* Site Details */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
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
              padding: '16px',
              border: '1px solid #2a2a2a'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: site.hasQR ? '#10b981' : '#9333ea',
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
              <p style={{ color: '#9ca3af', fontSize: '12px', margin: '0 0 12px 0' }}>
                {site.hasQR ? 'QR code generated' : 'Not generated'}
              </p>
              <button
                onClick={() => handleGenerateQR(site)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleGenerateQR(site);
                }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: site.hasQR ? '#10b981' : '#9333ea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  width: '100%'
                }}
              >
                {site.hasQR ? 'View QR Code' : 'Generate QR Code'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Site Modal */}
      <Modal isOpen={showAddSite} onClose={() => setShowAddSite(false)} title="Add New Site">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Site Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Brighton Care Home"
              value={siteForm.name}
              onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Location *
            </label>
            <input
              type="text"
              placeholder="e.g., Brighton"
              value={siteForm.location}
              onChange={(e) => setSiteForm({ ...siteForm, location: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Post Code *
            </label>
            <input
              type="text"
              placeholder="e.g., BN1 1AA"
              value={siteForm.postCode}
              onChange={(e) => setSiteForm({ ...siteForm, postCode: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => setShowAddSite(false)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setShowAddSite(false);
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#4b5563',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddSite}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleAddSite();
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#9333ea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              Add Site
            </button>
          </div>
        </div>
      </Modal>

      {/* QR Code Modal */}
      <Modal isOpen={showQRCode} onClose={() => setShowQRCode(false)} title={`QR Code - ${selectedSite?.name}`}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px' }}>
            Staff can scan this QR code to clock in at {selectedSite?.name}
          </p>
          
          {/* QR Code Placeholder */}
          <div style={{
            width: '250px',
            height: '250px',
            margin: '0 auto 24px',
            backgroundColor: 'white',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: `
                repeating-linear-gradient(0deg, #000 0px, #000 10px, transparent 10px, transparent 20px),
                repeating-linear-gradient(90deg, #000 0px, #000 10px, transparent 10px, transparent 20px)
              `,
              borderRadius: '8px'
            }}></div>
          </div>

          <div style={{
            backgroundColor: '#1a1a1a',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>Site ID</div>
            <div style={{ color: 'white', fontSize: '16px', fontWeight: '600', fontFamily: 'monospace' }}>
              SITE-{selectedSite?.id}
            </div>
          </div>

          <button
            onClick={() => alert('Download functionality would save QR code as image')}
            onTouchEnd={(e) => {
              e.preventDefault();
              alert('Download functionality would save QR code as image');
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
              width: '100%'
            }}
          >
            Download QR Code
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Sites;

