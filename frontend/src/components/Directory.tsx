import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  subscribeToDataChange,
  Agency,
  AgencyWorker,
  getAgencies,
  addAgency,
  updateAgency,
  deleteAgency,
  getAgencyWorkers,
  addAgencyWorker,
  updateAgencyWorker,
  deleteAgencyWorker,
  addStaff,
  Site
} from '../data/sharedData';
import { useAuth } from '../context/AuthContext';
import { staffAPI, sitesAPI, StaffAuthError, SafeStaff } from '../services/api';

const Directory: React.FC = () => {
  const { token, clearSession } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'staff' | 'agency'>('staff');

  // Staff state & filters
  const [staffList, setStaffList] = useState<SafeStaff[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Dynamic sites list from database
  const [dynamicSites, setDynamicSites] = useState<Site[]>([]);

  const [searchAuthExpired, setSearchAuthExpired] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Add Staff Modal & Form State
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);
  const [staffFormError, setStaffFormError] = useState<string | null>(null);
  const [staffSuccessMessage, setStaffSuccessMessage] = useState<string | null>(null);

  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    username: '',
    email: '',
    role: 'Care Worker',
    site: '',
    status: 'Active',
    startDate: new Date().toISOString().split('T')[0],
    password: ''
  });

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

  // Subscribe to agency & staff data changes
  useEffect(() => {
    const unsubscribe = subscribeToDataChange(() => {
      setAgencies(getAgencies());
      setAgencyWorkers(getAgencyWorkers());
    });
    return unsubscribe;
  }, []);

  // Fetch dynamic sites list on mount
  useEffect(() => {
    let isMounted = true;
    sitesAPI.getAll()
      .then((sites) => {
        if (isMounted) {
          const sorted = [...sites].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          setDynamicSites(sorted);
          if (sorted.length > 0) {
            setNewStaffForm((prev) => ({
              ...prev,
              site: prev.site || sorted[0].name
            }));
          }
        }
      })
      .catch((err) => console.warn('Failed to load sites for directory filter:', err));
    return () => { isMounted = false; };
  }, []);

  // Fetch staff from API
  const fetchStaff = useCallback(async (query: string = '') => {
    setSearchError(null);
    setSearchAuthExpired(false);
    try {
      const results = await staffAPI.search(query.trim(), token);
      const validResults = (results || []).filter(
        (s) => s && typeof s.name === 'string' && s.name.trim() !== ''
      );
      validResults.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setStaffList(validResults);
    } catch (err) {
      if (err instanceof StaffAuthError) {
        setSearchAuthExpired(true);
        clearSession();
      } else {
        setSearchError(err instanceof Error ? err.message : 'Failed to load staff. Please try again.');
      }
    }
  }, [token, clearSession]);

  // Load all staff on initial mount
  useEffect(() => {
    fetchStaff('');
  }, [fetchStaff]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchPerformed(true);
    fetchStaff(searchQuery);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSite('all');
    setSelectedRole('all');
    setSelectedStatus('all');
    setSearchPerformed(false);
    fetchStaff('');
  };

  // Add New Staff Submission Handler
  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffFormError(null);
    setStaffSuccessMessage(null);

    if (!newStaffForm.name || !newStaffForm.name.trim()) {
      setStaffFormError('Staff member full name is required.');
      return;
    }

    if (!newStaffForm.password || !newStaffForm.password.trim()) {
      setStaffFormError('Temporary password is required.');
      return;
    }

    setIsSubmittingStaff(true);

    try {
      const payload = {
        name: newStaffForm.name.trim(),
        username: newStaffForm.username.trim() || undefined,
        email: newStaffForm.email.trim() || undefined,
        role: newStaffForm.role,
        site: newStaffForm.site || (dynamicSites.length > 0 ? dynamicSites[0].name : 'General'),
        status: newStaffForm.status as 'Active' | 'Inactive',
        startDate: newStaffForm.startDate,
        password: newStaffForm.password.trim()
      };

      const created = await staffAPI.create(payload, token);

      // Pushes to shared memory and notifies Rota / Assign Workers dropdown
      await addStaff(created as any).catch(() => {});

      setStaffSuccessMessage(`Staff member "${created.name}" created successfully!`);
      
      // Reset form
      setNewStaffForm({
        name: '',
        username: '',
        email: '',
        role: 'Care Worker',
        site: dynamicSites.length > 0 ? dynamicSites[0].name : 'General',
        status: 'Active',
        startDate: new Date().toISOString().split('T')[0],
        password: ''
      });

      setIsAddStaffModalOpen(false);

      // Re-fetch Directory staff list
      await fetchStaff('');
    } catch (err: any) {
      setStaffFormError(err.message || 'Failed to create staff member.');
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete staff member "${name}"? This action cannot be undone.`)) {
      try {
        await staffAPI.delete(id, token);
        await fetchStaff(searchQuery);
      } catch (err: any) {
        alert(err.message || 'Failed to delete staff member.');
      }
    }
  };

  // Filter staffList based on selected dropdown filters
  const filteredStaff = staffList.filter((s) => {
    if (selectedSite !== 'all') {
      const staffSite = (s.site || '').toLowerCase();
      if (!staffSite.includes(selectedSite.toLowerCase())) return false;
    }

    if (selectedRole !== 'all') {
      if ((s.role || '').toLowerCase() !== selectedRole.toLowerCase()) return false;
    }

    if (selectedStatus !== 'all') {
      if ((s.status || '').toLowerCase() !== selectedStatus.toLowerCase()) return false;
    }

    return true;
  });

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

  // Derive unique roles from staff list for filter dropdown
  const uniqueRoles = Array.from(new Set(staffList.map((s) => s.role).filter(Boolean))).sort();

  return (
    <div style={{ padding: '20px 16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
            Directory
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
            Manage permanent staff and agency worker records
          </p>
        </div>

        {/* Add New Staff Button (Permanent Staff Tab) */}
        {activeTab === 'staff' && (
          <button
            onClick={() => {
              setStaffFormError(null);
              setIsAddStaffModalOpen(true);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            + Add New Staff
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {staffSuccessMessage && (
        <div style={{
          marginBottom: '20px',
          padding: '12px 16px',
          backgroundColor: '#16a34a20',
          border: '1px solid #16a34a',
          borderRadius: '8px',
          color: '#4ade80',
          fontSize: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{staffSuccessMessage}</span>
          <button
            onClick={() => setStaffSuccessMessage(null)}
            style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

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
          Permanent Staff ({staffList.length})
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
          Agency Workers ({agencyWorkers.length})
        </button>
      </div>

      {/* Add New Staff Modal Dialog */}
      {isAddStaffModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '540px',
            border: '1px solid #3a3a3a',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                Add New Permanent Staff Member
              </h2>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {staffFormError && (
              <div style={{
                marginBottom: '16px',
                padding: '10px 14px',
                backgroundColor: '#ef444420',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                color: '#f87171',
                fontSize: '13px'
              }}>
                {staffFormError}
              </div>
            )}

            <form onSubmit={handleCreateStaffSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                {/* 1. Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d4d4d8', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStaffForm.name}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                    placeholder="e.g. Jane Smith"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      color: 'white',
                      border: '1px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 2. Username & Email Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d4d4d8', marginBottom: '4px' }}>
                      Username (Optional)
                    </label>
                    <input
                      type="text"
                      value={newStaffForm.username}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, username: e.target.value })}
                      placeholder="Auto-generated if blank"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        border: '1px solid #3a3a3a',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d4d4d8', marginBottom: '4px' }}>
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={newStaffForm.email}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                      placeholder="jane@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        border: '1px solid #3a3a3a',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* 3. Role & Site Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d4d4d8', marginBottom: '4px' }}>
                      Role *
                    </label>
                    <select
                      value={newStaffForm.role}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        border: '1px solid #3a3a3a',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="Care Worker">Care Worker</option>
                      <option value="Senior Care Worker">Senior Care Worker</option>
                      <option value="Team Leader">Team Leader</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d4d4d8', marginBottom: '4px' }}>
                      Assigned Site *
                    </label>
                    <select
                      value={newStaffForm.site}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, site: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        border: '1px solid #3a3a3a',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      {dynamicSites.map((site) => (
                        <option key={site.id} value={site.name}>{site.name}</option>
                      ))}
                      {dynamicSites.length === 0 && <option value="General">General</option>}
                    </select>
                  </div>
                </div>

                {/* 4. Status & Start Date Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d4d4d8', marginBottom: '4px' }}>
                      Employment Status *
                    </label>
                    <select
                      value={newStaffForm.status}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, status: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        border: '1px solid #3a3a3a',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d4d4d8', marginBottom: '4px' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newStaffForm.startDate}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, startDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        backgroundColor: '#1a1a1a',
                        color: 'white',
                        border: '1px solid #3a3a3a',
                        borderRadius: '6px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* 5. Temporary Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d4d4d8', marginBottom: '4px' }}>
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newStaffForm.password}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, password: e.target.value })}
                    placeholder="Enter temporary password"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: '#1a1a1a',
                      color: 'white',
                      border: '1px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#3f3f46',
                    color: '#d4d4d8',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStaff}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isSubmittingStaff ? 'not-allowed' : 'pointer',
                    opacity: isSubmittingStaff ? 0.7 : 1
                  }}
                >
                  {isSubmittingStaff ? 'Saving...' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Tab Content */}
      {activeTab === 'staff' && (
        <>
          {/* Search & Filter Staff Controls */}
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

            <form onSubmit={handleSearchSubmit}>
              {/* Filters Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '16px'
              }}>
                {/* 1. Name / Keyword Filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d4d4d8', marginBottom: '6px' }}>
                    Staff Name / Keyword
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, username, role, site, status or email..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#1a1a1a',
                      color: 'white',
                      border: '1px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* 2. Site Filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d4d4d8', marginBottom: '6px' }}>
                    Site
                  </label>
                  <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#1a1a1a',
                      color: 'white',
                      border: '1px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="all">All Sites</option>
                    {dynamicSites.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Role Filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d4d4d8', marginBottom: '6px' }}>
                    Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#1a1a1a',
                      color: 'white',
                      border: '1px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="all">All Roles</option>
                    {uniqueRoles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Status Filter */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#d4d4d8', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: '#1a1a1a',
                      color: 'white',
                      border: '1px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  >
                    <option value="all">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    backgroundColor: '#9333ea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#3f3f46',
                    color: '#d4d4d8',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </form>

            {searchAuthExpired && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: '#ef444420',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '14px'
              }}>
                Your session has expired. Please log in again.
              </div>
            )}

            {searchError && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                backgroundColor: '#ef444420',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '14px'
              }}>
                {searchError}
              </div>
            )}
          </div>

          {/* Results List */}
          {!searchError && (
            <div>
              {filteredStaff.length === 0 ? (
                <div style={{
                  backgroundColor: '#2a2a2a',
                  borderRadius: '12px',
                  padding: '40px 20px',
                  border: '1px solid #3a3a3a',
                  textAlign: 'center',
                  color: '#9ca3af'
                }}>
                  <p style={{ margin: 0, fontSize: '15px' }}>
                    {searchPerformed || searchQuery || selectedSite !== 'all' || selectedRole !== 'all' || selectedStatus !== 'all'
                      ? `No staff found matching "${searchQuery}"`
                      : 'No permanent staff records found.'}
                  </p>
                </div>
              ) : (
                <div data-testid="staff-search-results">
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                      Permanent Staff Directory ({filteredStaff.length})
                    </h3>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '16px'
                  }}>
                    {filteredStaff.map((staffMember) => (
                      <div
                        key={staffMember.id}
                        style={{
                          backgroundColor: '#2a2a2a',
                          borderRadius: '12px',
                          padding: '20px',
                          border: '1px solid #3a3a3a',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '12px'
                          }}>
                            <div>
                              <h4 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                                {staffMember.name}
                              </h4>
                              {staffMember.username && (
                                <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                                  {staffMember.username}
                                </p>
                              )}
                            </div>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: staffMember.status === 'Active' ? '#15803d' : '#991b1b',
                              color: 'white'
                            }}>
                              {staffMember.status}
                            </span>
                          </div>

                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            fontSize: '13px',
                            color: '#d1d5db'
                          }}>
                            <div>
                              <span style={{ color: '#9ca3af' }}>Role: </span>
                              <strong style={{ color: 'white' }}>{staffMember.role}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#9ca3af' }}>Site: </span>
                              <strong style={{ color: 'white' }}>{staffMember.site}</strong>
                            </div>
                            {staffMember.email && (
                              <div>
                                <span style={{ color: '#9ca3af' }}>Email: </span>
                                <span style={{ color: '#e5e7eb' }}>{staffMember.email}</span>
                              </div>
                            )}
                            {staffMember.startDate && (
                              <div>
                                <span style={{ color: '#9ca3af' }}>Start Date: </span>
                                <span style={{ color: '#e5e7eb' }}>{staffMember.startDate}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                          <button
                            onClick={() => handleViewProfile(String(staffMember.id))}
                            style={{
                              flex: 1,
                              padding: '10px 16px',
                              backgroundColor: '#3a3a3a',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              textAlign: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a4a4a'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(String(staffMember.id), staffMember.name)}
                            title="Delete staff member"
                            style={{
                              padding: '10px 16px',
                              backgroundColor: '#991b1b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#991b1b'}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Add New Agency
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <input
                type="text"
                value={agencyForm.name}
                onChange={(e) => setAgencyForm({ ...agencyForm, name: e.target.value })}
                placeholder="Agency Name *"
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="text"
                value={agencyForm.contactPerson}
                onChange={(e) => setAgencyForm({ ...agencyForm, contactPerson: e.target.value })}
                placeholder="Contact Person *"
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="tel"
                value={agencyForm.phone}
                onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                placeholder="Phone Number"
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="email"
                value={agencyForm.email}
                onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
                placeholder="Email Address"
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              onClick={handleAddAgency}
              style={{
                padding: '10px 24px',
                backgroundColor: '#9333ea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
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
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Add Agency Worker
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <input
                type="text"
                value={workerForm.name}
                onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                placeholder="Worker Full Name *"
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <select
                value={workerForm.agencyId}
                onChange={(e) => setWorkerForm({ ...workerForm, agencyId: e.target.value })}
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select Agency *</option>
                {agencies.filter(a => a.status === 'Active').map(agency => (
                  <option key={agency.id} value={agency.id}>{agency.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={workerForm.role}
                onChange={(e) => setWorkerForm({ ...workerForm, role: e.target.value })}
                placeholder="Role (e.g. Care Worker)"
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="text"
                value={workerForm.hourlyRate}
                onChange={(e) => setWorkerForm({ ...workerForm, hourlyRate: e.target.value })}
                placeholder="Hourly Rate (e.g. £15.00/hr) *"
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              onClick={handleAddWorker}
              style={{
                padding: '10px 24px',
                backgroundColor: '#9333ea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Add Worker
            </button>
          </div>

          {/* Agencies List */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
              Agencies ({agencies.length})
            </h3>
            {agencies.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>No agencies added yet.</p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {agencies.map((agency) => (
                  <div
                    key={agency.id}
                    style={{
                      backgroundColor: '#2a2a2a',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #3a3a3a'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4 style={{ color: 'white', margin: 0, fontSize: '15px' }}>{agency.name}</h4>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        backgroundColor: agency.status === 'Active' ? '#15803d' : '#991b1b',
                        color: 'white'
                      }}>
                        {agency.status}
                      </span>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0' }}>Contact: {agency.contactPerson}</p>
                    {agency.phone && <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0' }}>Phone: {agency.phone}</p>}
                    {agency.email && <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0' }}>Email: {agency.email}</p>}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      {agency.status === 'Active' && (
                        <button
                          onClick={() => handleDeactivateAgency(agency.id, agency.name)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#b45309',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Deactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAgency(agency.id, agency.name)}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#991b1b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Agency Workers List */}
          <div>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
              Agency Workers ({agencyWorkers.length})
            </h3>
            {agencyWorkers.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>No agency workers added yet.</p>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {agencyWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    style={{
                      backgroundColor: '#2a2a2a',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '1px solid #3a3a3a'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4 style={{ color: 'white', margin: 0, fontSize: '15px' }}>{worker.name}</h4>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        backgroundColor: worker.status === 'Active' ? '#15803d' : '#991b1b',
                        color: 'white'
                      }}>
                        {worker.status}
                      </span>
                    </div>
                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0' }}>Agency: {worker.agencyName}</p>
                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0' }}>Role: {worker.role}</p>
                    <p style={{ color: '#9ca3af', fontSize: '13px', margin: '4px 0' }}>Rate: {worker.hourlyRate}</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      {worker.status === 'Active' && (
                        <button
                          onClick={() => handleDeactivateWorker(worker.id, worker.name)}
                          style={{
                            padding: '4px 10px',
                            backgroundColor: '#b45309',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Deactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteWorker(worker.id, worker.name)}
                        style={{
                          padding: '4px 10px',
                          backgroundColor: '#991b1b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Directory;
