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
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
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
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading annual leave data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Annual Leave Management</h1>

      {/* Leave Balances */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Staff Leave Balances</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {balances.map(balance => (
            <div key={balance.id} className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">{balance.staffName}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Entitlement:</span>
                  <span className="font-semibold">{balance.totalEntitlement}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Hours Accrued:</span>
                  <span className="font-semibold text-blue-600">{balance.hoursAccrued}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Hours Used:</span>
                  <span className="font-semibold text-red-600">{balance.hoursUsed}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Available:</span>
                  <span className="font-semibold text-green-600">{balance.hoursAccrued - balance.hoursUsed}h</span>
                </div>
                {balance.accrualInfo && (
                  <>
                    <div className="border-t pt-2 mt-2">
                      <div className="text-xs text-gray-600">
                        Months worked: {balance.accrualInfo.monthsWorked} ({balance.accrualInfo.quartersCompleted} quarters)
                      </div>
                      {balance.accrualInfo.nextAccrualHours > 0 && (
                        <div className="text-xs text-gray-600">
                          Next accrual: {balance.accrualInfo.nextAccrualHours}h on {new Date(balance.accrualInfo.nextAccrualDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Requests */}
      <div className="bg-yellow-50 rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Pending Requests ({pendingRequests.length})</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-gray-600">No pending leave requests</p>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(request => (
              <div key={request.id} className="bg-white border-2 border-yellow-400 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{request.staffName}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">{request.totalDays} days</span> ({request.totalHours} hours)
                    </p>
                    {request.reason && (
                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-semibold">Reason:</span> {request.reason}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Requested: {new Date(request.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowApproveModal(true);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRejectModal(true);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Requests */}
      <div className="bg-green-50 rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Approved Requests ({approvedRequests.length})</h2>
        {approvedRequests.length === 0 ? (
          <p className="text-gray-600">No approved leave requests</p>
        ) : (
          <div className="space-y-3">
            {approvedRequests.slice(0, 5).map(request => (
              <div key={request.id} className="bg-white border border-green-300 rounded-lg p-3">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold">{request.staffName}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()} ({request.totalDays} days)
                    </p>
                    <p className="text-xs text-gray-500">
                      Approved by {request.reviewedBy} on {request.reviewedAt && new Date(request.reviewedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-green-600 font-semibold">✓ Approved</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <div className="bg-red-50 rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Rejected Requests ({rejectedRequests.length})</h2>
          <div className="space-y-3">
            {rejectedRequests.slice(0, 3).map(request => (
              <div key={request.id} className="bg-white border border-red-300 rounded-lg p-3">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold">{request.staffName}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-red-600">
                      Reason: {request.rejectionReason}
                    </p>
                  </div>
                  <div className="text-red-600 font-semibold">✗ Rejected</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Approve Leave Request</h3>
            <div className="space-y-4">
              <div>
                <p><strong>Staff:</strong> {selectedRequest.staffName}</p>
                <p><strong>Dates:</strong> {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}</p>
                <p><strong>Duration:</strong> {selectedRequest.totalDays} days ({selectedRequest.totalHours} hours)</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Your Name *</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                >
                  Approve & Deduct Hours
                </button>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedRequest(null);
                    setAdminName('');
                    setAdminNotes('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Reject Leave Request</h3>
            <div className="space-y-4">
              <div>
                <p><strong>Staff:</strong> {selectedRequest.staffName}</p>
                <p><strong>Dates:</strong> {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Your Name *</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Why is this request being rejected?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Suggested Alternative Dates (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                  placeholder="Suggest alternative dates if available..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                >
                  Reject Request
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRequest(null);
                    setAdminName('');
                    setAdminNotes('');
                    setRejectionReason('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnualLeave;

