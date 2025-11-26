import React, { useState, useEffect } from 'react';
import { leaveAPI, LeaveRequest, LeaveBalance } from '../services/leaveAPI';

interface WorkerLeaveProps {
  staffId: string;
  staffName: string;
}

const WorkerLeave: React.FC<WorkerLeaveProps> = ({ staffId, staffName }) => {
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  
  // Form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState<'annual' | 'sick' | 'personal'>('annual');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [staffId]);

  const loadData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const [balanceData, requestsData] = await Promise.all([
        leaveAPI.getBalance(staffId, currentYear).catch(() => null),
        leaveAPI.getStaffRequests(staffId)
      ]);
      setBalance(balanceData);
      setRequests(requestsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading leave data:', error);
      setLoading(false);
    }
  };

  const calculateDays = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end
    return diffDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      alert('Please select start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      alert('End date must be after start date');
      return;
    }

    const totalDays = calculateDays(startDate, endDate);
    const totalHours = totalDays * 8;

    // Check if enough hours available
    if (balance) {
      const available = balance.hoursAccrued - balance.hoursUsed;
      if (totalHours > available) {
        alert(`Insufficient leave balance. You have ${available} hours available, but requesting ${totalHours} hours.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await leaveAPI.createRequest({
        staffId,
        staffName,
        startDate,
        endDate,
        totalDays,
        totalHours,
        reason: reason.trim() || undefined,
        leaveType
      });
      
      alert('Leave request submitted successfully! Awaiting admin approval.');
      setShowRequestForm(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setLeaveType('annual');
      loadData();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!balance) {
    return (
      <div className="p-6 bg-yellow-50 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Annual Leave Not Available</h2>
        <p>You are not currently eligible for annual leave. This may be because:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>You have not completed the 3-month probation period</li>
          <li>Your employment start date has not been set in the system</li>
          <li>You are not a permanent staff member</li>
        </ul>
        <p className="mt-4">Please contact your manager if you believe this is an error.</p>
      </div>
    );
  }

  const availableHours = balance.hoursAccrued - balance.hoursUsed;
  const availableDays = Math.floor(availableHours / 8);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">My Annual Leave</h1>

      {/* Leave Balance Card */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Leave Balance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-3xl font-bold">{balance.hoursAccrued}h</div>
            <div className="text-sm opacity-90">Accrued</div>
          </div>
          <div>
            <div className="text-3xl font-bold">{balance.hoursUsed}h</div>
            <div className="text-sm opacity-90">Used</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-300">{availableHours}h</div>
            <div className="text-sm opacity-90">Available</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-300">{availableDays}</div>
            <div className="text-sm opacity-90">Days Available</div>
          </div>
        </div>
        
        {balance.accrualInfo && balance.accrualInfo.nextAccrualHours > 0 && (
          <div className="mt-4 pt-4 border-t border-white border-opacity-30">
            <p className="text-sm">
              🎉 Next accrual: <strong>{balance.accrualInfo.nextAccrualHours} hours</strong> on{' '}
              <strong>{new Date(balance.accrualInfo.nextAccrualDate).toLocaleDateString()}</strong>
            </p>
            <p className="text-xs opacity-75 mt-1">
              You've worked {balance.accrualInfo.monthsWorked} months ({balance.accrualInfo.quartersCompleted} quarters completed)
            </p>
          </div>
        )}
      </div>

      {/* Request Leave Button */}
      <button
        onClick={() => setShowRequestForm(!showRequestForm)}
        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow"
        disabled={availableHours === 0}
      >
        {availableHours === 0 ? 'No Leave Available' : '+ Request Annual Leave'}
      </button>

      {/* Request Form */}
      {showRequestForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Request Annual Leave</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">End Date *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                  min={startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Leave Type *</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as 'annual' | 'sick' | 'personal')}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
              </select>
            </div>

            {startDate && endDate && (
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-sm">
                  <strong>Duration:</strong> {calculateDays(startDate, endDate)} days ({calculateDays(startDate, endDate) * 8} hours)
                </p>
                <p className="text-sm">
                  <strong>Remaining after:</strong> {availableHours - (calculateDays(startDate, endDate) * 8)} hours
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1">Reason (Optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={3}
                placeholder="e.g., Family holiday, personal matters..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button
                type="button"
                onClick={() => setShowRequestForm(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* My Requests */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">My Leave Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-600">No leave requests yet</p>
        ) : (
          <div className="space-y-3">
            {requests.map(request => (
              <div
                key={request.id}
                className={`border-2 rounded-lg p-4 ${
                  request.status === 'pending' ? 'border-yellow-400 bg-yellow-50' :
                  request.status === 'approved' ? 'border-green-400 bg-green-50' :
                  'border-red-400 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        request.leaveType === 'annual' ? 'bg-purple-200 text-purple-800' :
                        request.leaveType === 'sick' ? 'bg-red-200 text-red-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {request.leaveType === 'annual' ? 'Annual' : request.leaveType === 'sick' ? 'Sick' : 'Personal'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {request.totalDays} days ({request.totalHours} hours)
                    </p>
                    {request.reason && (
                      <p className="text-sm text-gray-700 mt-1">
                        <strong>Reason:</strong> {request.reason}
                      </p>
                    )}
                    {request.status === 'approved' && request.reviewedBy && (
                      <p className="text-xs text-green-700 mt-2">
                        ✓ Approved by {request.reviewedBy} on {request.reviewedAt && new Date(request.reviewedAt).toLocaleDateString()}
                      </p>
                    )}
                    {request.status === 'rejected' && (
                      <div className="mt-2">
                        <p className="text-xs text-red-700">
                          ✗ Rejected: {request.rejectionReason}
                        </p>
                        {request.adminNotes && (
                          <p className="text-xs text-gray-600 mt-1">
                            Admin suggestion: {request.adminNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={`font-bold ${
                    request.status === 'pending' ? 'text-yellow-600' :
                    request.status === 'approved' ? 'text-green-600' :
                    'text-red-600'
                  }`}>
                    {request.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerLeave;

