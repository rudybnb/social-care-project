import React, { useState, useEffect } from 'react';
import { leaveAPI, LeaveRequest, LeaveBalance } from '../services/leaveAPI';

const AnnualLeave: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [requestsData, balancesData] = await Promise.all([
        leaveAPI.getAllRequests(),
        leaveAPI.getAllBalances()
      ]);
      setRequests(requestsData);
      setBalances(balancesData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading leave data:', error);
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !adminName.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      await leaveAPI.approveRequest(selectedRequest.id, adminName, adminNotes);
      setShowApproveModal(false);
      setSelectedRequest(null);
      setAdminName('');
      setAdminNotes('');
      loadData();
      alert('Leave request approved successfully');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !adminName.trim() || !rejectionReason.trim()) {
      alert('Please enter your name and rejection reason');
      return;
    }

    try {
      await leaveAPI.rejectRequest(selectedRequest.id, adminName, rejectionReason, adminNotes);
      setShowRejectModal(false);
      setSelectedRequest(null);
      setAdminName('');
      setAdminNotes('');
      setRejectionReason('');
      loadData();
      alert('Leave request rejected');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading annual leave data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 16px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
        borderRadius: '12px',
        padding: '24px 20px',
        marginBottom: '24px',
        boxShadow: '0 4px 20px rgba(147, 51, 234, 0.2)'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          margin: '0 0 6px 0'
        }}>
          🏖️ Annual Leave Management
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.9)',
          margin: 0
        }}>
          Manage staff annual leave requests and balances
        </p>
      </div>

      {/* Leave Balances */}
      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #3a3a3a',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          Staff Leave Balances
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {balances.map(balance => (
            <div key={balance.id} style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #3a3a3a'
            }}>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
                {balance.staffName}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af', fontSize: '13px' }}>Total Entitlement:</span>
                  <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{balance.totalEntitlement}h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af', fontSize: '13px' }}>Hours Accrued:</span>
                  <span style={{ color: '#6366f1', fontSize: '13px', fontWeight: '600' }}>{balance.hoursAccrued}h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9ca3af', fontSize: '13px' }}>Hours Used:</span>
                  <span style={{ color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>{balance.hoursUsed}h</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #3a3a3a' }}>
                  <span style={{ color: '#9ca3af', fontSize: '13px', fontWeight: '600' }}>Available:</span>
                  <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>
                    {balance.hoursAccrued - balance.hoursUsed}h ({Math.floor((balance.hoursAccrued - balance.hoursUsed) / 8)} days)
                  </span>
                </div>
                {balance.accrualInfo && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #3a3a3a' }}>
                    <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '4px' }}>
                      Worked: {balance.accrualInfo.monthsWorked} months ({balance.accrualInfo.quartersCompleted} quarters)
                    </div>
                    {balance.accrualInfo.nextAccrualHours > 0 && (
                      <div style={{ color: '#6b7280', fontSize: '11px' }}>
                        Next: +{balance.accrualInfo.nextAccrualHours}h on {new Date(balance.accrualInfo.nextAccrualDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Requests */}
      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        padding: '20px',
        border: '2px solid #f59e0b',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          🟡 Pending Requests ({pendingRequests.length})
        </h2>
        {pendingRequests.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No pending leave requests</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingRequests.map(request => (
              <div key={request.id} style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {request.staffName}
                    </h3>
                    <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px' }}>
                      📅 {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p style={{ color: 'white', fontSize: '13px', marginBottom: '8px' }}>
                      <span style={{ color: '#f59e0b', fontWeight: '600' }}>{request.totalDays} days</span> ({request.totalHours} hours)
                    </p>
                    {request.reason && (
                      <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #3a3a3a' }}>
                        <span style={{ fontWeight: '600' }}>Reason:</span> {request.reason}
                      </p>
                    )}
                    <p style={{ color: '#6b7280', fontSize: '11px', marginTop: '8px' }}>
                      Requested: {new Date(request.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowApproveModal(true);
                      }}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRejectModal(true);
                      }}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Requests */}
      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #10b981',
        marginBottom: '24px'
      }}>
        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          🟢 Approved Requests ({approvedRequests.length})
        </h2>
        {approvedRequests.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No approved leave requests</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {approvedRequests.slice(0, 5).map(request => (
              <div key={request.id} style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      {request.staffName}
                    </h3>
                    <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()} ({request.totalDays} days)
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '11px' }}>
                      Approved by {request.reviewedBy} on {request.reviewedAt && new Date(request.reviewedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ color: '#10b981', fontSize: '14px', fontWeight: '600' }}>✓ Approved</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <div style={{
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #ef4444'
        }}>
          <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            🔴 Rejected Requests ({rejectedRequests.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rejectedRequests.slice(0, 3).map(request => (
              <div key={request.id} style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                      {request.staffName}
                    </h3>
                    <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p style={{ color: '#ef4444', fontSize: '11px' }}>
                      Reason: {request.rejectionReason}
                    </p>
                  </div>
                  <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: '600' }}>✗ Rejected</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid #3a3a3a'
          }}>
            <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              Approve Leave Request
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px' }}>
                <strong style={{ color: 'white' }}>Staff:</strong> {selectedRequest.staffName}
              </p>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px' }}>
                <strong style={{ color: 'white' }}>Dates:</strong> {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}
              </p>
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                <strong style={{ color: 'white' }}>Duration:</strong> {selectedRequest.totalDays} days ({selectedRequest.totalHours} hours)
              </p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                Your Name *
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: 'white',
                  fontSize: '14px'
                }}
                placeholder="Enter your name"
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: 'white',
                  fontSize: '14px',
                  minHeight: '80px'
                }}
                placeholder="Optional notes"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleApprove}
                style={{
                  flex: 1,
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✓ Approve & Deduct Hours
              </button>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                  setAdminName('');
                  setAdminNotes('');
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#3a3a3a',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid #3a3a3a'
          }}>
            <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
              Reject Leave Request
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '4px' }}>
                <strong style={{ color: 'white' }}>Staff:</strong> {selectedRequest.staffName}
              </p>
              <p style={{ color: '#9ca3af', fontSize: '13px' }}>
                <strong style={{ color: 'white' }}>Dates:</strong> {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}
              </p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                Your Name *
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: 'white',
                  fontSize: '14px'
                }}
                placeholder="Enter your name"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: 'white',
                  fontSize: '14px',
                  minHeight: '80px'
                }}
                placeholder="Why are you rejecting this request?"
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                Alternative Dates (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  color: 'white',
                  fontSize: '14px',
                  minHeight: '60px'
                }}
                placeholder="Suggest alternative dates..."
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleReject}
                style={{
                  flex: 1,
                  backgroundColor: '#ef4444',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ✗ Reject Request
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setAdminName('');
                  setAdminNotes('');
                  setRejectionReason('');
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#3a3a3a',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnualLeave;
