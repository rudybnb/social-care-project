import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { staffAPI, StaffAuthError, SafeStaff } from '../services/api';

const StaffProfile: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const { token, clearSession } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<SafeStaff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authExpired, setAuthExpired] = useState(false);

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
        if (active) setStaff(result);
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

  if (authExpired) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '20px' }}>
        <div style={{ color: '#f87171', fontSize: '14px' }}>
          Your session has expired. Please log in again.
        </div>
      </div>
    );
  }

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
        <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', margin: '0 0 16px 0' }}>
          Staff Profile
        </h1>

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
                <div style={{ color: '#9ca3af', fontSize: '14px' }}>{staff.username || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Role</div>
                <div style={{ color: '#9ca3af', fontSize: '14px' }}>{staff.role || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Assigned Site</div>
                <div style={{ color: '#9ca3af', fontSize: '14px' }}>{staff.site || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Status</div>
                <div style={{ color: '#9ca3af', fontSize: '14px' }}>{staff.status || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Email</div>
                <div style={{ color: '#9ca3af', fontSize: '14px' }}>{staff.email || '—'}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Staff ID</div>
                <div style={{ color: '#9ca3af', fontSize: '14px' }}>{staff.id}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffProfile;
