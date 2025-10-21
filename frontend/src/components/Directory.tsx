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
    <div style={{ padding: '30px', maxWidth: '1400px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
          Staff Directory
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
          Manage your team members and their assignments
        </p>
      </div>

      {/* Add Staff Form */}
      <div style={{
        backgroundColor: '#2a2a3a',
        borderRadius: '12px',
        padding: '30px',
        border: '1px solid #3a3a4a',
        marginBottom: '30px'
      }}>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
          Add New Staff Member
        </h2>

        {/* Form Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          {/* First Name */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              First Name
            </label>
            <input
              type="text"
              placeholder="e.g., John"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a4a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* Last Name */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Last Name
            </label>
            <input
              type="text"
              placeholder="e.g., Doe"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a4a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* Role */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a4a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option>Worker</option>
              <option>Site Manager</option>
              <option>Admin</option>
            </select>
          </div>

          {/* Site */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Site
            </label>
            <select
              value={formData.site}
              onChange={(e) => setFormData({ ...formData, site: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a4a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                cursor: 'pointer'
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
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Employment Type
            </label>
            <select
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a4a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                cursor: 'pointer'
              }}
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Start Date
            </label>
            <input
              type="text"
              placeholder="dd/mm/yyyy"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a4a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* Tax Code */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Tax Code
            </label>
            <input
              type="text"
              placeholder="e.g., 1257L, BR"
              value={formData.taxCode}
              onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a4a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* Night Rate */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Night Rate (£/h)
            </label>
            <input
              type="text"
              placeholder="e.g., 14.00"
              value={formData.nightRate}
              onChange={(e) => setFormData({ ...formData, nightRate: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a4a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* Hourly Rate */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Hourly Rate (£/h)
            </label>
            <input
              type="text"
              placeholder="e.g., 12.50"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a4a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* Overtime Rate */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Overtime Rate (£/h)
            </label>
            <input
              type="text"
              placeholder="e.g., 18.75"
              value={formData.overtimeRate}
              onChange={(e) => setFormData({ ...formData, overtimeRate: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a4a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* Pension */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Pension (%)
            </label>
            <input
              type="text"
              placeholder="e.g., 3"
              value={formData.pension}
              onChange={(e) => setFormData({ ...formData, pension: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a4a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          {/* Other Deductions */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Other Deductions (£)
            </label>
            <input
              type="text"
              placeholder="e.g., 10.00"
              value={formData.otherDeductions}
              onChange={(e) => setFormData({ ...formData, otherDeductions: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a4a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
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
            padding: '12px 32px',
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
          Add Staff
        </button>
      </div>

      {/* Staff List */}
      <div style={{
        backgroundColor: '#2a2a3a',
        borderRadius: '12px',
        padding: '30px',
        border: '1px solid #3a3a4a'
      }}>
        <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
          Staff
        </h2>

        {staffMembers.map((staff, index) => (
          <div
            key={index}
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '16px',
              border: '1px solid #2a2a2a'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                  {staff.name} • {staff.role} • {staff.site}
                </h3>
                <p style={{ color: '#10b981', fontSize: '13px', margin: 0 }}>
                  Status: {staff.status}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => alert(`Deactivate ${staff.name}`)}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    alert(`Deactivate ${staff.name}`);
                  }}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
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
                    padding: '6px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    touchAction: 'manipulation'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
            <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.6' }}>
              <p style={{ margin: '4px 0' }}>Rate £/h {staff.rates}</p>
              <p style={{ margin: '4px 0' }}>Pension {staff.pension} • Deductions {staff.deductions} • Tax {staff.tax}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Directory;

