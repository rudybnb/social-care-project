import React, { useState, useEffect } from 'react';
import { ApprovalRequest } from '../types/approvalTypes';
import { approvalAPI } from '../services/approvalAPI';

const ApprovalRequests: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    loadRequests();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadRequests, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadRequests = async () => {
    try {
      const data = filter === 'pending' 
        ? await approvalAPI.getPendingRequests()
        : await approvalAPI.getAllRequests();
      
      const filtered = filter === 'all' 
        ? data 
        : data.filter(r => r.status === filter);
      
      setRequests(filtered);
    } catch (error) {
      console.error('Failed to load approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: ApprovalRequest) => {
    if (!window.confirm(`Approve unscheduled shift for ${request.staffName} at ${request.siteName}?`)) {
      return;
    }

    try {
      await approvalAPI.approveRequest(request.id, 'Admin');
      alert('Request approved! Staff can now clock in.');
      loadRequests();
    } catch (error) {
      alert('Failed to approve request');
    }
  };

  const handleReject = async (request: ApprovalRequest) => {
    const notes = window.prompt(`Reject request for ${request.staffName}? (Optional reason):`);
    if (notes === null) return; // User cancelled

    try {
      await approvalAPI.rejectRequest(request.id, 'Admin', notes);
      alert('Request rejected');
      loadRequests();
    } catch (error) {
      alert('Failed to reject request');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'approved': return '✓';
      case 'rejected': return '✗';
      default: return '•';
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', color: 'white', textAlign: 'center' }}>
        Loading approval requests...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          📋 Unscheduled Shift Approval Requests
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          Review and approve staff requests to clock in for unscheduled shifts
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              backgroundColor: filter === tab ? '#3b82f6' : '#1a1a1a',
              color: 'white',
              border: filter === tab ? '2px solid #3b82f6' : '2px solid #3a3a3a',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
          border: '2px solid #3a3a3a'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <div style={{ color: '#9ca3af', fontSize: '16px' }}>
            No {filter !== 'all' ? filter : ''} approval requests
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map(request => (
            <div
              key={request.id}
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                padding: '20px',
                border: `2px solid ${request.status === 'pending' ? '#f59e0b' : '#3a3a3a'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                {/* Request Info */}
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ 
                      fontSize: '20px',
                      color: getStatusColor(request.status)
                    }}>
                      {getStatusIcon(request.status)}
                    </span>
                    <span style={{ 
                      color: getStatusColor(request.status),
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {request.status}
                    </span>
                  </div>

                  <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {request.staffName}
                  </div>

                  <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '4px' }}>
                    📍 {request.siteName}
                  </div>

                  <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '4px' }}>
                    📅 {formatDate(request.date)}
                  </div>

                  <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                    🕐 Requested at {formatTime(request.requestTime)}
                  </div>

                  {request.status === 'approved' && request.approvedBy && (
                    <div style={{ 
                      color: '#10b981', 
                      fontSize: '12px', 
                      marginTop: '8px',
                      fontStyle: 'italic'
                    }}>
                      Approved by {request.approvedBy} at {request.approvedAt ? formatTime(request.approvedAt) : 'N/A'}
                    </div>
                  )}

                  {request.status === 'rejected' && request.notes && (
                    <div style={{ 
                      color: '#ef4444', 
                      fontSize: '12px', 
                      marginTop: '8px',
                      fontStyle: 'italic'
                    }}>
                      Reason: {request.notes}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {request.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleApprove(request)}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        minWidth: '100px'
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(request)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        minWidth: '100px'
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={loadRequests}
        style={{
          marginTop: '24px',
          width: '100%',
          backgroundColor: '#1a1a1a',
          color: '#9ca3af',
          border: '2px solid #3a3a3a',
          borderRadius: '12px',
          padding: '14px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        🔄 Refresh
      </button>
    </div>
  );
};

export default ApprovalRequests;
