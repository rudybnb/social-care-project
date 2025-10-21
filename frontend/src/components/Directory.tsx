import React, { useState } from 'react';

const Directory: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'Worker',
    site: 'All Sites',
    employmentType: 'Full-time',
    startDate: '',
    taxCode: '',
    nightRate: '',
    hourlyRate: '',
    overtimeRate: '',
    pension: '',
    otherDeductions: ''
  });

  const staffMembers = [
    {
      name: 'Admin User',
      role: 'Admin',
      site: 'All Sites',
      status: 'Active',
      rates: '£/h — • Night — • OT —',
      pension: '—',
      deductions: '£0.00',
      tax: '—'
    },
    {
      name: 'Site Manager',
      role: 'Site Manager',
      site: 'London Care Home',
      status: 'Active',
      rates: '£/h — • Night — • OT —',
      pension: '—',
      deductions: '£0.00',
      tax: '—'
    }
  ];

  const handleSubmit = () => {
    alert('Add Staff clicked - Form would be submitted');
    console.log('Form data:', formData);
  };

  return (
    <div style={{ padding: '20px 16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
          Staff Directory
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
          Manage your team members and their assignments
        </p>
      </div>

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

        {/* Form Grid - Mobile Optimized */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* First Name */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              First Name
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
              Last Name
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
            >
              <option>Worker</option>
              <option>Site Manager</option>
              <option>Admin</option>
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
            >
              <option>All Sites</option>
              <option>Kent Care Home</option>
              <option>London Care Home</option>
              <option>Essex Care Home</option>
            </select>
          </div>

          {/* Employment Type */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Employment Type
            </label>
            <select
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
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
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Start Date
            </label>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
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

          {/* Tax Code */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Tax Code
            </label>
            <input
              type="text"
              placeholder="e.g., 1257L, BR"
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

          {/* Night Rate */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Night Rate (£/h)
            </label>
            <input
              type="text"
              placeholder="e.g., 14.00"
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

          {/* Hourly Rate */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Hourly Rate (£/h)
            </label>
            <input
              type="text"
              placeholder="e.g., 12.50"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
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

          {/* Overtime Rate */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Overtime Rate (£/h)
            </label>
            <input
              type="text"
              placeholder="e.g., 18.75"
              value={formData.overtimeRate}
              onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })}
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
              type="text"
              placeholder="e.g., 3"
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
              type="text"
              placeholder="e.g., 10.00"
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

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleSubmit();
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
            boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)',
            width: '100%',
            maxWidth: '200px'
          }}
        >
          Add Staff
        </button>
      </div>

      {/* Staff List */}
      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        padding: '24px 20px',
        border: '1px solid #3a3a3a'
      }}>
        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
          Staff Members
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {staffMembers.map((staff, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '10px',
                padding: '18px 16px',
                border: '1px solid #2a2a2a'
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: '0 0 6px 0' }}>
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
                  backgroundColor: '#10b98120',
                  color: '#10b981',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  <span style={{ width: '5px', height: '5px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span>
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
                  onClick={() => alert(`Deactivate ${staff.name}`)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    alert(`Deactivate ${staff.name}`);
                  }}
                  style={{
                    flex: '1 1 auto',
                    minWidth: '120px',
                    padding: '10px 16px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '7px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    touchAction: 'manipulation'
                  }}
                >
                  Deactivate
                </button>
                <button
                  onClick={() => alert(`Delete ${staff.name}`)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    alert(`Delete ${staff.name}`);
                  }}
                  style={{
                    flex: '1 1 auto',
                    minWidth: '120px',
                    padding: '10px 16px',
                    backgroundColor: '#4b5563',
                    color: 'white',
                    border: 'none',
                    borderRadius: '7px',
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
      </div>
    </div>
  );
};

export default Directory;

