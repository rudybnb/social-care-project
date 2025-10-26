import React, { useState, useEffect } from 'react';
import { getShifts, subscribeToDataChange, getStaff, addStaff, updateStaff, deleteStaff, StaffMember, Agency, AgencyWorker, getAgencies, addAgency, updateAgency, deleteAgency, getAgencyWorkers, addAgencyWorker, updateAgencyWorker, deleteAgencyWorker } from '../data/sharedData';
import { calculateWeeklyHours } from '../utils/hoursCalculator';

const Directory: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'staff' | 'agency'>('staff');
  
  // Staff state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: 'Worker',
    site: 'All Sites',
    employmentType: 'Full-time',
    startDate: '',
    taxCode: '',
    standardRate: '12.50',
    enhancedRate: '',
    nightRate: '',
    pension: '',
    otherDeductions: ''
  });

  const [shifts, setShifts] = useState(getShifts());
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(getStaff());

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
      setShifts(getShifts());
      setStaffMembers(getStaff());
      setAgencies(getAgencies());
      setAgencyWorkers(getAgencyWorkers());
    });
    return unsubscribe;
  }, []);

  // Staff handlers
  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName) {
      alert('Please enter at least first and last name');
      return;
    }

    const newStaff: StaffMember = {
      id: Date.now(),
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email || undefined,
      username: formData.username || undefined,
      password: formData.password || undefined,
      role: formData.role,
      site: formData.site,
      status: 'Active',
      standardRate: formData.standardRate,
      enhancedRate: formData.enhancedRate || '—',
      nightRate: formData.nightRate || '—',
      rates: `Standard: £${formData.standardRate}/h (0-20h) • Enhanced: £${formData.enhancedRate || '—'}/h (20h+) • Night: £${formData.nightRate || '—'}/h`,
      pension: formData.pension ? `${formData.pension}%` : '—',
      deductions: formData.otherDeductions ? `£${formData.otherDeductions}` : '£0.00',
      tax: formData.taxCode || '—',
      weeklyHours: 0
    };

    addStaff(newStaff);
    
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      role: 'Worker',
      site: 'All Sites',
      employmentType: 'Full-time',
      startDate: '',
      taxCode: '',
      standardRate: '12.50',
      enhancedRate: '',
      nightRate: '',
      pension: '',
      otherDeductions: ''
    });

    alert(`Staff member ${newStaff.name} added successfully!`);
  };

  const handleDeactivate = (id: number | string, name: string) => {
    if (window.confirm(`Are you sure you want to deactivate ${name}?`)) {
      updateStaff(id, { status: 'Inactive' });
      alert(`${name} has been deactivated`);
    }
  };

  const handleDelete = (id: number | string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      deleteStaff(id);
      alert(`${name} has been deleted`);
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
          {/* Add Staff Form */}
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '24px 20px',
            border: '1px solid #3a3a3a',
            marginBottom: '24px'
          }}>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
              Add New Staff Member
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* First Name */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              {/* Last Name */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="e.g., staff@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              {/* Username */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Username (for login)
                </label>
                <input
                  type="text"
                  placeholder="e.g., lauren.alecia"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Temporary Password
                </label>
                <input
                  type="text"
                  placeholder="e.g., temp123"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              {/* Role */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                >
                  <option value="Worker">Worker</option>
                  <option value="Site Manager">Site Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Site */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Site
                </label>
                <select
                  value={formData.site}
                  onChange={(e) => setFormData({ ...formData, site: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                >
                  <option value="All Sites">All Sites</option>
                  <option value="Thamesmead Care Home">Thamesmead Care Home</option>
                  <option value="Rochester Care Home">Rochester Care Home</option>
                  <option value="Erith Care Home">Erith Care Home</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              {/* Standard Rate */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Standard Rate (£/h) - First 20h/week *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="12.50"
                  value={formData.standardRate}
                  onChange={(e) => setFormData({ ...formData, standardRate: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              {/* Enhanced Rate */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Enhanced Rate (£/h) - After 20h/week
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="15.00"
                  value={formData.enhancedRate}
                  onChange={(e) => setFormData({ ...formData, enhancedRate: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              {/* Night Rate */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Night Rate (£/h)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="18.00"
                  value={formData.nightRate}
                  onChange={(e) => setFormData({ ...formData, nightRate: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              {/* Tax Code */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Tax Code
                </label>
                <input
                  type="text"
                  placeholder="1257L"
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              {/* Pension */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Pension (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="5"
                  value={formData.pension}
                  onChange={(e) => setFormData({ ...formData, pension: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>

              {/* Other Deductions */}
              <div>
                <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                  Other Deductions (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.otherDeductions}
                  onChange={(e) => setFormData({ ...formData, otherDeductions: e.target.value })}
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
                  onFocus={(e) => e.target.style.borderColor = '#9333ea'}
                  onBlur={(e) => e.target.style.borderColor = '#3a3a3a'}
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#9333ea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#9333ea'}
            >
              Add Staff Member
            </button>
          </div>

          {/* Staff List */}
          <div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Staff Members ({staffMembers.length})
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {staffMembers.map((staff) => (
                <div
                  key={staff.id}
                  style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #3a3a3a'
                  }}
                >
                  <div style={{ marginBottom: '12px' }}>
                    <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
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
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280' }}>Rates:</span> {staff.rates}
                    </div>
                    <div>
                      <span style={{ color: '#6b7280' }}>Pension:</span> {staff.pension} • 
                      <span style={{ color: '#6b7280' }}> Deductions:</span> {staff.deductions} • 
                      <span style={{ color: '#6b7280' }}> Tax:</span> {staff.tax}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleDeactivate(staff.id, staff.name)}
                      disabled={staff.status === 'Inactive'}
                      style={{
                        flex: '1 1 auto',
                        minWidth: '120px',
                        padding: '10px 16px',
                        backgroundColor: staff.status === 'Inactive' ? '#3a3a3a' : '#6b7280',
                        color: 'white',
                        border: 'none',
                        borderRadius: '7px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: staff.status === 'Inactive' ? 'not-allowed' : 'pointer',
                        opacity: staff.status === 'Inactive' ? 0.5 : 1
                      }}
                    >
                      Deactivate
                    </button>
                    <button
                      onClick={() => handleDelete(staff.id, staff.name)}
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

