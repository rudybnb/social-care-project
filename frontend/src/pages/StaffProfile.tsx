import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { staffAPI, StaffAuthError, SafeStaff } from '../services/api';
import SensitiveField from '../components/SensitiveField';

const StaffProfile: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const { token, user, clearSession } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<SafeStaff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authExpired, setAuthExpired] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    email: '',
    role: '',
    site: '',
    phone: '',
    startDate: '',
    hourlyRate: '',
    addressLine1: '',
    addressLine2: '',
    townCity: '',
    staffPostcode: '',
    nextOfKinName: '',
    nextOfKinRelationship: '',
    nextOfKinPhone: ''
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!staffId) {
        if (active) setError('No staff member specified.');
        if (active) setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await staffAPI.getById(staffId, token);
        if (active) {
          setStaff(result);
          setEditForm({
            name: result.name || '',
            username: result.username || '',
            email: result.email || '',
            role: result.role || '',
            site: result.site || '',
            phone: result.phone || '',
            startDate: result.startDate || '',
            hourlyRate: result.hourlyRate || '',
            addressLine1: result.addressLine1 || '',
            addressLine2: result.addressLine2 || '',
            townCity: result.townCity || '',
            staffPostcode: result.staffPostcode || '',
            nextOfKinName: result.nextOfKinName || '',
            nextOfKinRelationship: result.nextOfKinRelationship || '',
            nextOfKinPhone: result.nextOfKinPhone || ''
          });
        }
      } catch (err) {
        if (err instanceof StaffAuthError) {
          if (active) setAuthExpired(true);
          clearSession();
        } else {
          if (active) setError(err instanceof Error ? err.message : 'Failed to load staff profile.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [staffId, token, clearSession]);

  const validateForm = (): string | null => {
    if (!editForm.name.trim()) return 'Staff name is required.';
    if (editForm.hourlyRate !== '' && editForm.hourlyRate !== undefined) {
      const rate = Number(editForm.hourlyRate);
      if (isNaN(rate) || rate < 0) return 'Hourly rate must be zero or greater.';
    }
    if (editForm.phone) {
      const norm = editForm.phone.replace(/[\s\-\(\)]/g, '');
      if (norm.length > 0 && norm.length < 10) return 'Phone number must contain at least 10 digits.';
    }
    if (editForm.nextOfKinName && !editForm.nextOfKinPhone.trim()) {
      return 'Next of kin phone number is required when a next of kin name is entered.';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const updated = await staffAPI.update(staffId!, editForm);
      setStaff(updated as SafeStaff);
      setIsEditing(false);
      setSuccessMessage('Staff profile updated successfully.');
    } catch (err: any) {
      setFormError(err.message || 'Failed to update staff profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (staff) {
      setEditForm({
        name: staff.name || '',
        username: staff.username || '',
        email: staff.email || '',
        role: staff.role || '',
        site: staff.site || '',
        phone: staff.phone || '',
        startDate: staff.startDate || '',
        hourlyRate: staff.hourlyRate || '',
        addressLine1: staff.addressLine1 || '',
        addressLine2: staff.addressLine2 || '',
        townCity: staff.townCity || '',
        staffPostcode: staff.staffPostcode || '',
        nextOfKinName: staff.nextOfKinName || '',
        nextOfKinRelationship: staff.nextOfKinRelationship || '',
        nextOfKinPhone: staff.nextOfKinPhone || ''
      });
    }
    setIsEditing(false);
    setFormError(null);
  };

  if (authExpired) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '20px' }}>
        <div style={{ color: '#f87171', fontSize: '14px' }}>
          Your session has expired. Please log in again.
        </div>
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#1a1a1a',
    color: 'white',
    border: '1px solid #3a3a3a',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600' as const,
    color: '#d4d4d8',
    marginBottom: '4px'
  };

  const readOnlyStyle = {
    color: '#9ca3af',
    fontSize: '14px',
    padding: '10px 0'
  };

  return (
    <div style={{ padding: '20px 16px', maxWidth: '800px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/admin/directory')}
        style={{
          marginBottom: '16px',
          padding: '10px 16px',
          backgroundColor: '#6b7280',
          color: 'white',
          border: 'none',
          borderRadius: '7px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        ← Back to Directory
      </button>

      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        padding: '24px 20px',
        border: '1px solid #3a3a3a'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', margin: 0 }}>
            Staff Profile
          </h1>
          {isAdmin && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#9333ea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Edit Profile
            </button>
          )}
        </div>

        {successMessage && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#16a34a20',
            border: '1px solid #16a34a',
            borderRadius: '8px',
            color: '#4ade80',
            fontSize: '14px'
          }}>
            {successMessage}
          </div>
        )}

        {formError && (
          <div style={{
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#ef444420',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '14px'
          }}>
            {formError}
          </div>
        )}

        {loading && (
          <div style={{ color: '#9ca3af', fontSize: '14px', padding: '8px 0' }}>
            Loading staff profile...
          </div>
        )}

        {!loading && error && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#ef444420',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {!loading && !error && staff && (
          <div>
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input style={inputStyle} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>Username</label>
                    <input style={inputStyle} value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input style={inputStyle} type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input style={inputStyle} type="tel" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="e.g. 07700 900123" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Role</label>
                    <select style={inputStyle} value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                      <option value="Care Worker">Care Worker</option>
                      <option value="Senior Care Worker">Senior Care Worker</option>
                      <option value="Team Leader">Team Leader</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Assigned Site</label>
                    <input style={inputStyle} value={editForm.site} onChange={e => setEditForm({...editForm, site: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Hourly Rate (£)</label>
                    <input style={inputStyle} type="number" step="0.01" min="0" value={editForm.hourlyRate} onChange={e => setEditForm({...editForm, hourlyRate: e.target.value})} placeholder="e.g. 13.50" />
                  </div>
                  <div>
                    <label style={labelStyle}>Start Date</label>
                    <input style={inputStyle} type="date" value={editForm.startDate} onChange={e => setEditForm({...editForm, startDate: e.target.value})} />
                  </div>
                </div>

                {/* Address Section */}
                <div style={{ borderTop: '1px solid #3a3a3a', paddingTop: '14px' }}>
                  <div style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>Address</div>
                  <div>
                    <label style={labelStyle}>Address Line 1</label>
                    <input style={inputStyle} value={editForm.addressLine1} onChange={e => setEditForm({...editForm, addressLine1: e.target.value})} placeholder="e.g. 123 High Street" />
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <label style={labelStyle}>Address Line 2</label>
                    <input style={inputStyle} value={editForm.addressLine2} onChange={e => setEditForm({...editForm, addressLine2: e.target.value})} placeholder="e.g. Flat 4B" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <div>
                      <label style={labelStyle}>Town/City</label>
                      <input style={inputStyle} value={editForm.townCity} onChange={e => setEditForm({...editForm, townCity: e.target.value})} placeholder="e.g. London" />
                    </div>
                    <div>
                      <label style={labelStyle}>Postcode</label>
                      <input style={inputStyle} value={editForm.staffPostcode} onChange={e => setEditForm({...editForm, staffPostcode: e.target.value})} placeholder="e.g. SE1 9AA" />
                    </div>
                  </div>
                </div>

                {/* Next of Kin Section */}
                <div style={{ borderTop: '1px solid #3a3a3a', paddingTop: '14px' }}>
                  <div style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>Next of Kin</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>Full Name</label>
                      <input style={inputStyle} value={editForm.nextOfKinName} onChange={e => setEditForm({...editForm, nextOfKinName: e.target.value})} placeholder="e.g. Jane Smith" />
                    </div>
                    <div>
                      <label style={labelStyle}>Relationship</label>
                      <input style={inputStyle} value={editForm.nextOfKinRelationship} onChange={e => setEditForm({...editForm, nextOfKinRelationship: e.target.value})} placeholder="e.g. Spouse" />
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <label style={labelStyle}>Phone Number</label>
                    <input style={inputStyle} type="tel" value={editForm.nextOfKinPhone} onChange={e => setEditForm({...editForm, nextOfKinPhone: e.target.value})} placeholder="e.g. 07700 900456" />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button onClick={handleCancel} style={{ padding: '10px 18px', backgroundColor: '#3f3f46', color: '#d4d4d8', border: 'none', borderRadius: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={isSaving} style={{ padding: '10px 24px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
                  {staff.name}
                </h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '16px'
                }}>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Username</div>
                    <div style={readOnlyStyle}>{staff.username || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Role</div>
                    <div style={readOnlyStyle}>{staff.role || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Assigned Site</div>
                    <div style={readOnlyStyle}>{staff.site || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Status</div>
                    <div style={readOnlyStyle}>{staff.status || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Email</div>
                    <div style={readOnlyStyle}>{staff.email || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Staff ID</div>
                    <div style={readOnlyStyle}>{staff.id}</div>
                  </div>
                </div>

                {/* Admin-only fields */}
                {isAdmin && (
                  <div style={{ borderTop: '1px solid #3a3a3a', marginTop: '20px', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600' }}>Employment Details</div>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '12px', fontStyle: 'italic' }}>
                      Sensitive information is masked. Hold to view.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                      <div>
                        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Phone Number</div>
                        <SensitiveField value={staff.phone} label="phone number" />
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Hourly Rate</div>
                        <SensitiveField value={staff.hourlyRate} label="hourly rate" displayPrefix="£" />
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Start Date</div>
                        <div style={readOnlyStyle}>{staff.startDate || '—'}</div>
                      </div>
                    </div>

                    {(staff.addressLine1 || staff.townCity || staff.staffPostcode) && (
                      <>
                        <div style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Address</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <SensitiveField value={staff.addressLine1} label="address line 1" />
                          {staff.addressLine2 && <SensitiveField value={staff.addressLine2} label="address line 2" />}
                          <SensitiveField value={staff.townCity} label="town/city" />
                          <SensitiveField value={staff.staffPostcode} label="postcode" />
                        </div>
                      </>
                    )}

                    {staff.nextOfKinName && (
                      <>
                        <div style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600', marginTop: '16px', marginBottom: '8px' }}>Next of Kin</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                          <div>
                            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Name</div>
                            <SensitiveField value={staff.nextOfKinName} label="next of kin name" />
                          </div>
                          <div>
                            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Relationship</div>
                            <SensitiveField value={staff.nextOfKinRelationship} label="next of kin relationship" />
                          </div>
                          <div>
                            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Phone</div>
                            <SensitiveField value={staff.nextOfKinPhone} label="next of kin phone" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffProfile;
