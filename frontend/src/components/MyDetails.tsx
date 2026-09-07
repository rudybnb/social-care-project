import React, { useState, useEffect } from 'react';
import SensitiveField from './SensitiveField';
import { API_URL, getStoredStaffBearerToken } from '../services/api';

interface MyDetailsProps {
  staffId: string;
  staffName: string;
}

interface StaffDetails {
  id: string;
  name: string;
  phone: string | null;
  hourlyRate: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  townCity: string | null;
  staffPostcode: string | null;
  nextOfKinName: string | null;
  nextOfKinRelationship: string | null;
  nextOfKinPhone: string | null;
}

const MyDetails: React.FC<MyDetailsProps> = ({ staffId, staffName }) => {
  const [details, setDetails] = useState<StaffDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const token = getStoredStaffBearerToken();
        if (!token) {
          setError('Please log in to view your details.');
          return;
        }

        const response = await fetch(
          `${API_URL}/api/staff/me`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError('Your session has expired. Please log in again.');
          } else {
            setError('Failed to load your details.');
          }
          return;
        }

        const data = await response.json();
        setDetails(data);
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [staffId]);

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
        Loading your details...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#f87171' }}>
        {error}
      </div>
    );
  }

  if (!details) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9ca3af' }}>
        No details found.
      </div>
    );
  }

  const sectionStyle = {
    backgroundColor: '#2a2a2a',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #3a3a3a'
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: '600' as const,
    color: '#9ca3af',
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px', color: '#9ca3af', fontSize: '14px' }}>
        Sensitive information is masked. Hold to view.
      </div>

      {/* Hourly Rate */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Hourly Rate</div>
        <SensitiveField value={details.hourlyRate} label="hourly rate" displayPrefix="£" />
      </div>

      {/* Phone Number */}
      <div style={sectionStyle}>
        <div style={labelStyle}>Phone Number</div>
        <SensitiveField value={details.phone} label="phone number" />
      </div>

      {/* Address */}
      <div style={sectionStyle}>
        <div style={{ ...labelStyle, marginBottom: '12px' }}>Address</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Address Line 1</div>
            <SensitiveField value={details.addressLine1} label="address line 1" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Address Line 2</div>
            <SensitiveField value={details.addressLine2} label="address line 2" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Town / City</div>
              <SensitiveField value={details.townCity} label="town or city" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Postcode</div>
              <SensitiveField value={details.staffPostcode} label="postcode" />
            </div>
          </div>
        </div>
      </div>

      {/* Next of Kin */}
      <div style={sectionStyle}>
        <div style={{ ...labelStyle, marginBottom: '12px' }}>Next of Kin</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Name</div>
            <SensitiveField value={details.nextOfKinName} label="next of kin name" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Relationship</div>
            <SensitiveField value={details.nextOfKinRelationship} label="relationship" />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>Phone</div>
            <SensitiveField value={details.nextOfKinPhone} label="next of kin phone" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDetails;
