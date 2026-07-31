import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToDataChange, Agency, AgencyWorker, getAgencies, addAgency, updateAgency, deleteAgency, getAgencyWorkers, addAgencyWorker, updateAgencyWorker, deleteAgencyWorker } from '../data/sharedData';
import { useAuth } from '../context/AuthContext';
import { staffAPI, StaffAuthError, SafeStaff } from '../services/api';

const Directory: React.FC = () => {
  const { token, clearSession } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'staff' | 'agency'>('staff');

  // Staff search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SafeStaff[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAuthExpired, setSearchAuthExpired] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Agency state
  const [agencies, setAgencies] = useState<Agency[]>(getAgencies());
  const [agencyWorkers, setAgencyWorkers] = useState<AgencyWorker[]>(getAgencyWorkers());

  const [agencyForm, setAgencyForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: ''
  });

  const [workerForm, setWorkerForm] = useState({
    name: '',
    agencyId: '',
    role: 'Care Worker',
    hourlyRate: '',
    availability: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  // Subscribe to changes
  useEffect(() => {
    const unsubscribe = subscribeToDataChange(() => {
      setAgencies(getAgencies());
      setAgencyWorkers(getAgencyWorkers());
    });
    return unsubscribe;
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    setSearchError(null);
    setSearchAuthExpired(false);
    setSearchPerformed(true);
    setIsSearching(true);
    setSearchResults(null);
    try {
      const results = await staffAPI.search(query, token);
      const validResults = (results || []).filter(
        (s) => s && typeof s.name === 'string' && s.name.trim() !== ''
      );
      setSearchResults(validResults);
    } catch (err) {
      if (err instanceof StaffAuthError) {
        setSearchAuthExpired(true);
        clearSession();
      } else {
        setSearchError(err instanceof Error ? err.message : 'Failed to search staff. Please try again.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Agency handlers
  const handleAddAgency = () => {
    if (!agencyForm.name || !agencyForm.contactPerson) {
      alert('Please enter agency name and contact person');
      return;
    }

    const newAgency: Agency = {
      id: Date.now(),
      name: agencyForm.name,
      contactPerson: agencyForm.contactPerson,
      phone: agencyForm.phone,
      email: agencyForm.email,
      status: 'Active'
    };

    addAgency(newAgency);
    setAgencyForm({ name: '', contactPerson: '', phone: '', email: '' });
    alert(`Agency ${newAgency.name} added successfully!`);
  };

  const handleAddWorker = () => {
    if (!workerForm.name || !workerForm.agencyId || !workerForm.hourlyRate) {
      alert('Please enter worker name, select agency, and specify hourly rate');
      return;
    }

    const selectedAgency = agencies.find(a => String(a.id) === String(workerForm.agencyId));
    if (!selectedAgency) {
      alert('Selected agency not found');
      return;
    }

    const newWorker: AgencyWorker = {
      id: Date.now(),
      name: workerForm.name,
      agencyId: workerForm.agencyId,
      agencyName: selectedAgency.name,
      role: workerForm.role,
      hourlyRate: workerForm.hourlyRate,
      availability: workerForm.availability,
      startDate: workerForm.startDate,
      endDate: workerForm.endDate || undefined,
      status: 'Active',
      notes: workerForm.notes
    };

    addAgencyWorker(newWorker);
    setWorkerForm({
      name: '',
      agencyId: '',
      role: 'Care Worker',
      hourlyRate: '',
      availability: '',
      startDate: '',
      endDate: '',
      notes: ''
    });
    alert(`Agency worker ${newWorker.name} added successfully!`);
  };

  const handleDeactivateAgency = (id: string | number, name: string) => {
    if (window.confirm(`Are you sure you want to deactivate ${name}?`)) {
      updateAgency(id, { status: 'Inactive' });
      alert(`${name} has been deactivated`);
    }
  };

  const handleDeleteAgency = (id: string | number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This will also remove all workers from this agency.`)) {
      deleteAgency(id);
      alert(`${name} has been deleted`);
    }
  };

  const handleDeactivateWorker = (id: string | number, name: string) => {
    if (window.confirm(`Are you sure you want to deactivate ${name}?`)) {
      updateAgencyWorker(id, { status: 'Inactive' });
      alert(`${name} has been deactivated`);
    }
  };

  const handleDeleteWorker = (id: string | number, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteAgencyWorker(id);
      alert(`${name} has been deleted`);
    }
  };

  const handleViewProfile = (staffId: string) => {
    navigate(`/admin/directory/staff/${staffId}`);
  };

  return (
    <div style={{ padding: '20px 16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
          Directory
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
          Manage your permanent staff and agency workers
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #3a3a3a'
      }}>
        <button
          onClick={() => setActiveTab('staff')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: activeTab === 'staff' ? '#9333ea' : '#9ca3af',
            border: 'none',
            borderBottom: activeTab === 'staff' ? '2px solid #9333ea' : '2px solid transparent',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Permanent Staff
        </button>
        <button
          onClick={() => setActiveTab('agency')}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: activeTab === 'agency' ? '#9333ea' : '#9ca3af',
            border: 'none',
            borderBottom: activeTab === 'agency' ? '2px solid #9333ea' : '2px solid transparent',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Agency Workers
        </button>
      </div>

      {/* Staff Tab Content */}
      {activeTab === 'staff' && (
        <>
          {/* Search Staff */}
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '24px 20px',
            border: '1px solid #3a3a3a',
            marginBottom: '24px'
          }}>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Search Staff
            </h2>
            <form
              onSubmit={handleSearch}
              style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, username, role, site, status or email..."
                disabled={isSearching}
                style={{
                  flex: 1,
                  minWidth: '220px',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
              />
              <button
                type="submit"
                disabled={isSearching}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#9333ea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  opacity: isSearching ? 0.6 : 1,
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (!isSearching) e.currentTarget.style.backgroundColor = '#7c3aed';
                }}
                onMouseLeave={(e) => {
                  if (!isSearching) e.currentTarget.style.backgroundColor = '#9333ea';
                }}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {isSearching && (
              <div style={{ color: '#9ca3af', fontSize: '14px', padding: '8px 0' }}>
                Loading staff...
              </div>
            )}

            {searchAuthExpired && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#ef444420',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                Your session has expired. Please log out and sign in again to search staff.
              </div>
            )}

            {!searchAuthExpired && searchError && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#ef444420',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                {searchError}
              </div>
            )}

            {!isSearching && searchPerformed && !searchAuthExpired && !searchError && searchResults && searchResults.length === 0 && (
              <div style={{ color: '#9ca3af', fontSize: '14px', padding: '8px 0' }}>
                No staff found matching "{searchQuery.trim()}".
              </div>
            )}

            {!isSearching && searchPerformed && !searchAuthExpired && !searchError && searchResults && searchResults.length > 0 && (
              <>
                <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
                  {searchResults.length} result{searchResults.length === 1 ? '' : 's'} for "{searchQuery.trim()}"
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '16px'
                }} data-testid="staff-search-results">
                  {searchResults.map((staff) => (
                    <div
                      key={staff.id}
                      style={{
                        backgroundColor: '#1a1a1a',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid #3a3a3a'
                      }}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: 0, marginBottom: '8px' }}>
                          {staff.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                          <span style={{ color: '#9ca3af', fontSize: '13px' }}>{staff.role}</span>
                          <span style={{ color: '#6b7280', fontSize: '13px' }}>•</span>
                          <span style={{ color: '#9ca3af', fontSize: '13px' }}>{staff.site}</span>
                        </div>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          backgroundColor: staff.status === 'Active' ? '#10b98120' : '#6b728020',
                          color: staff.status === 'Active' ? '#10b981' : '#6b7280',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          <span style={{ width: '5px', height: '5px', backgroundColor: staff.status === 'Active' ? '#10b981' : '#6b7280', borderRadius: '50%', display: 'inline-block' }}></span>
                          {staff.status}
                        </span>
                      </div>
                      <div style={{
                        paddingTop: '12px',
                        borderTop: '1px solid #2a2a2a',
                        color: '#9ca3af',
                        fontSize: '12px',
                        lineHeight: '1.8',
                        marginBottom: '14px'
                      }}>
                        <div>
                          <span style={{ color: '#6b7280' }}>Username:</span> {staff.username || '—'}
                        </div>
                        <div>
                          <span style={{ color: '#6b7280' }}>Email:</span> {staff.email || '—'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewProfile(String(staff.id))}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '7px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

        </>
      )}

      {/* Agency Tab Content */}
      {activeTab === 'agency' && (
        <>
          {/* Add Agency Form */}
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '24px 20px',
            border: '1px solid #3a3a3a',
            marginBottom: '24px'
          }}>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
              Add New Agency
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Agency Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Premier Care Agency"
                  value={agencyForm.name}
                  onChange={(e) => setAgencyForm({ ...agencyForm, name: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Contact Person *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Sarah Johnson"
                  value={agencyForm.contactPerson}
                  onChange={(e) => setAgencyForm({ ...agencyForm, contactPerson: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="020 1234 5678"
                  value={agencyForm.phone}
                  onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="contact@agency.com"
                  value={agencyForm.email}
                  onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>
            </div>

            <button
              onClick={handleAddAgency}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
            >
              Add Agency
            </button>
          </div>

          {/* Add Agency Worker Form */}
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '24px 20px',
            border: '1px solid #3a3a3a',
            marginBottom: '24px'
          }}>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
              Add Agency Worker
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Worker Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Michael Brown"
                  value={workerForm.name}
                  onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Agency *
                </label>
                <select
                  value={workerForm.agencyId}
                  onChange={(e) => setWorkerForm({ ...workerForm, agencyId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1a1a1a',
                    color: 'white',
                    border: '1px solid #3a3a3a',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                >
                  <option value="">Select Agency</option>
                  {agencies.filter(a => a.status === 'Active').map(agency => (
                    <option key={agency.id} value={agency.id}>{agency.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Role
                </label>
                <select
                  value={workerForm.role}
                  onChange={(e) => setWorkerForm({ ...workerForm, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1a1a1a',
                    color: 'white',
                    border: '1px solid #3a3a3a',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                >
                  <option value="Care Worker">Care Worker</option>
                  <option value="Senior Care Worker">Senior Care Worker</option>
                  <option value="Nurse">Nurse</option>
                  <option value="Support Worker">Support Worker</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Hourly Rate (£) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="18.50"
                  value={workerForm.hourlyRate}
                  onChange={(e) => setWorkerForm({ ...workerForm, hourlyRate: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Availability
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mon-Fri, 8am-6pm"
                  value={workerForm.availability}
                  onChange={(e) => setWorkerForm({ ...workerForm, availability: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={workerForm.startDate}
                  onChange={(e) => setWorkerForm({ ...workerForm, startDate: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={workerForm.endDate}
                  onChange={(e) => setWorkerForm({ ...workerForm, endDate: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Notes
                </label>
                <textarea
                  placeholder="e.g., 2 months contract, specialized in dementia care"
                  value={workerForm.notes}
                  onChange={(e) => setWorkerForm({ ...workerForm, notes: e.target.value })}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1a1a1a',
                    color: 'white',
                    border: '1px solid #3a3a3a',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#10b981'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>
            </div>

            <button
              onClick={handleAddWorker}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
            >
              Add Agency Worker
            </button>
          </div>

          {/* Agencies List */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Agencies ({agencies.length})
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {agencies.map((agency) => (
                <div
                  key={agency.id}
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #3a3a3a'
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {agency.name}
                    </h3>
                    <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '8px' }}>
                      <div>Contact: {agency.contactPerson}</div>
                      {agency.phone && <div>Phone: {agency.phone}</div>}
                      {agency.email && <div>Email: {agency.email}</div>}
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      backgroundColor: agency.status === 'Active' ? '#10b98120' : '#6b728020',
                      color: agency.status === 'Active' ? '#10b981' : '#6b7280',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      <span style={{ width: '5px', height: '5px', backgroundColor: agency.status === 'Active' ? '#10b981' : '#6b7280', borderRadius: '50%', display: 'inline-block' }}></span>
                      {agency.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleDeactivateAgency(agency.id, agency.name)}
                      disabled={agency.status === 'Inactive'}
                      style={{
                        flex: '1 1 auto',
                        minWidth: '120px',
                        padding: '10px 16px',
                        backgroundColor: agency.status === 'Inactive' ? '#3a3a3a' : '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '7px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: agency.status === 'Inactive' ? 'not-allowed' : 'pointer',
                        opacity: agency.status === 'Inactive' ? 0.5 : 1
                      }}
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleDeleteAgency(agency.id, agency.name)}
                      style={{
                        flex: '1 1 auto',
                        minWidth: '120px',
                        padding: '10px 16px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '7px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agency Workers List */}
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Agency Workers ({agencyWorkers.length})
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {agencyWorkers.map((worker) => (
                <div
                  key={worker.id}
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #3a3a3a'
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {worker.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '13px' }}>{worker.role}</span>
                      <span style={{ color: '#6b7280', fontSize: '13px' }}>•</span>
                      <span style={{ color: '#10b981', fontSize: '13px' }}>{worker.agencyName}</span>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      backgroundColor: worker.status === 'Active' ? '#10b98120' : '#6b728020',
                      color: worker.status === 'Active' ? '#10b981' : '#6b7280',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      <span style={{ width: '5px', height: '5px', backgroundColor: worker.status === 'Active' ? '#10b981' : '#6b7280', borderRadius: '50%', display: 'inline-block' }}></span>
                      {worker.status}
                    </span>
                  </div>

                  <div style={{
                    paddingTop: '12px',
                    borderTop: '1px solid #2a2a2a',
                    color: '#9ca3af',
                    fontSize: '12px',
                    lineHeight: '1.8',
                    marginBottom: '14px'
                  }}>
                    <div><span style={{ color: '#6b7280' }}>Rate:</span> £{worker.hourlyRate}/h</div>
                    {worker.availability && <div><span style={{ color: '#6b7280' }}>Availability:</span> {worker.availability}</div>}
                    {worker.startDate && <div><span style={{ color: '#6b7280' }}>Period:</span> {worker.startDate} {worker.endDate ? `- ${worker.endDate}` : '(ongoing)'}</div>}
                    {worker.notes && <div><span style={{ color: '#6b7280' }}>Notes:</span> {worker.notes}</div>}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleDeactivateWorker(worker.id, worker.name)}
                      disabled={worker.status === 'Inactive'}
                      style={{
                        flex: '1 1 auto',
                        minWidth: '120px',
                        padding: '10px 16px',
                        backgroundColor: worker.status === 'Inactive' ? '#3a3a3a' : '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '7px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: worker.status === 'Inactive' ? 'not-allowed' : 'pointer',
                        opacity: worker.status === 'Inactive' ? 0.5 : 1
                      }}
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleDeleteWorker(worker.id, worker.name)}
                      style={{
                        flex: '1 1 auto',
                        minWidth: '120px',
                        padding: '10px 16px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '7px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Directory;

