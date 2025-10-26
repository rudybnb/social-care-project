import React, { useState } from 'react';
import Modal from './Modal';
import { getSites, addSite, updateSite, deleteSite, notifySitesChanged, Site } from '../data/sharedData';
import SiteQRCodeModal from './SiteQRCodeModal';

const Sites: React.FC = () => {
  const [sites, setSites] = useState<Site[]>(getSites());
  const [showAddSite, setShowAddSite] = useState(false);
  const [showEditSite, setShowEditSite] = useState(false);
  const [qrModalSite, setQrModalSite] = useState<Site | null>(null);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  
  const [siteForm, setSiteForm] = useState({
    name: '',
    location: '',
    postcode: '',
    address: ''
  });

  // Refresh sites list
  const refreshSites = () => {
    setSites(getSites());
  };

  const handleAddSite = () => {
    if (!siteForm.name || !siteForm.location || !siteForm.postcode || !siteForm.address) {
      alert('Please fill in all fields');
      return;
    }

    const colors = ['#8b7ab8', '#7ab8a8', '#a87ab8', '#b88b7a', '#7a8bb8', '#b8a87a'];
    const newSite: Site = {
      id: `SITE_${Date.now()}`,
      name: siteForm.name,
      location: siteForm.location,
      postcode: siteForm.postcode,
      address: siteForm.address,
      status: 'Active',
      qrGenerated: false,
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    addSite(newSite);
    notifySitesChanged();
    refreshSites();
    setShowAddSite(false);
    setSiteForm({ name: '', location: '', postcode: '', address: '' });
    alert(`Site "${newSite.name}" added successfully!`);
  };

  const handleEditSite = () => {
    if (!selectedSite || !siteForm.name || !siteForm.location || !siteForm.postcode || !siteForm.address) {
      alert('Please fill in all fields');
      return;
    }

    updateSite(selectedSite.id, {
      name: siteForm.name,
      location: siteForm.location,
      postcode: siteForm.postcode,
      address: siteForm.address
    });
    
    notifySitesChanged();
    refreshSites();
    setShowEditSite(false);
    setSelectedSite(null);
    setSiteForm({ name: '', location: '', postcode: '', address: '' });
    alert(`Site updated successfully!`);
  };

  const handleDeleteSite = (site: Site) => {
    if (window.confirm(`Are you sure you want to delete "${site.name}"?\n\nThis will remove it from the Rota as well.`)) {
      deleteSite(site.id);
      notifySitesChanged();
      refreshSites();
      alert(`Site "${site.name}" deleted successfully!`);
    }
  };

  const openEditModal = (site: Site) => {
    setSelectedSite(site);
    setSiteForm({
      name: site.name,
      location: site.location,
      postcode: site.postcode,
      address: site.address
    });
    setShowEditSite(true);
  };

  const handleGenerateQR = (site: Site) => {
    updateSite(site.id, { qrGenerated: true });
    notifySitesChanged();
    refreshSites();
    setQrModalSite(site);
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
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {sites.map((site) => (
          <div
            key={site.id}
            style={{
              backgroundColor: '#2a2a2a',
              borderRadius: '12px',
              padding: '20px',
              border: `2px solid ${site.color}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Site Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: `${site.color}30`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '14px',
                border: `2px solid ${site.color}`
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={site.color} strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'white', fontSize: '17px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
                  {site.name}
                </h3>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  backgroundColor: site.status === 'Active' ? '#10b98120' : '#6b728020',
                  color: site.status === 'Active' ? '#10b981' : '#6b7280',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  ● {site.status}
                </div>
              </div>
            </div>

            {/* Site Details */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" style={{ marginRight: '8px', marginTop: '2px', flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <div style={{ color: 'white', fontSize: '13px', marginBottom: '2px' }}>
                    {site.address}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                    {site.location}, {site.postcode}
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              border: '1px solid #3a3a3a'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={site.qrGenerated ? '#10b981' : '#6b7280'} strokeWidth="2" style={{ marginRight: '10px' }}>
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                  <span style={{ color: site.qrGenerated ? '#10b981' : '#6b7280', fontSize: '12px', fontWeight: '600' }}>
                    Clock-in QR
                  </span>
                </div>
                <span style={{
                  padding: '3px 8px',
                  backgroundColor: site.qrGenerated ? '#10b98120' : '#6b728020',
                  color: site.qrGenerated ? '#10b981' : '#6b7280',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {site.qrGenerated ? 'Generated' : 'Not generated'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => handleGenerateQR(site)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleGenerateQR(site);
                }}
                style={{
                  padding: '10px',
                  backgroundColor: site.qrGenerated ? '#4b5563' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  gridColumn: '1 / -1'
                }}
              >
                {site.qrGenerated ? 'View QR Code' : 'Generate QR Code'}
              </button>
              
              <button
                onClick={() => openEditModal(site)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  openEditModal(site);
                }}
                style={{
                  padding: '10px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                Edit
              </button>

              <button
                onClick={() => setQrModalSite(site)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setQrModalSite(site);
                }}
                style={{
                  padding: '10px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                📍 QR Code
              </button>

              <button
                onClick={() => handleDeleteSite(site)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleDeleteSite(site);
                }}
                style={{
                  padding: '10px',
                  backgroundColor: '#7a7a7a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                Delete
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
              placeholder="e.g., Thamesmead Care Home"
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
              Address *
            </label>
            <input
              type="text"
              placeholder="e.g., 65 Nickelby Close"
              value={siteForm.address}
              onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
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
              placeholder="e.g., Thamesmead"
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
              Postcode *
            </label>
            <input
              type="text"
              placeholder="e.g., SE28 8LY"
              value={siteForm.postcode}
              onChange={(e) => setSiteForm({ ...siteForm, postcode: e.target.value })}
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

      {/* Edit Site Modal */}
      <Modal isOpen={showEditSite} onClose={() => setShowEditSite(false)} title="Edit Site">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Site Name *
            </label>
            <input
              type="text"
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
              Address *
            </label>
            <input
              type="text"
              value={siteForm.address}
              onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
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
              Postcode *
            </label>
            <input
              type="text"
              value={siteForm.postcode}
              onChange={(e) => setSiteForm({ ...siteForm, postcode: e.target.value })}
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
              onClick={() => setShowEditSite(false)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setShowEditSite(false);
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
              onClick={handleEditSite}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleEditSite();
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
              Save Changes
            </button>
          </div>
        </div>
      </Modal>



      {/* Site QR Code Modal */}
      {qrModalSite && (
        <SiteQRCodeModal
          siteId={qrModalSite.id}
          siteName={qrModalSite.name}
          onClose={() => setQrModalSite(null)}
        />
      )}
    </div>
  );
};

export default Sites;

