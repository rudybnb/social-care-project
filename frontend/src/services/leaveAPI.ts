import { API_URL } from './api';

export interface LeaveBalance {
  id: string;
  staffId: string;
  staffName: string;
  year: number;
  totalEntitlement: number;
  hoursAccrued: number;
  hoursUsed: number;
  hoursRemaining: number;
  carryOverFromPrevious: number;
  carryOverToNext: number;
  startDate?: string;
  accrualInfo?: {
    monthsWorked: number;
    quartersCompleted: number;
    hoursAccrued: number;
    nextAccrualDate: string;
    nextAccrualHours: number;
  };
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalHours: number;
  reason?: string;
  leaveType: 'annual' | 'sick' | 'personal';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  adminNotes?: string;
  rejectionReason?: string;
}

export const leaveAPI = {
  // Get balance for a staff member
  async getBalance(staffId: string, year: number): Promise<LeaveBalance> {
    const response = await fetch(`${API_URL}/api/leave/balance/${staffId}/${year}`);
    if (!response.ok) throw new Error('Failed to fetch leave balance');
    return response.json();
  },

  // Get all balances (admin)
  async getAllBalances(): Promise<LeaveBalance[]> {
    const response = await fetch(`${API_URL}/api/leave/balances`);
    if (!response.ok) throw new Error('Failed to fetch leave balances');
    return response.json();
  },

  // Get all requests (admin)
  async getAllRequests(): Promise<LeaveRequest[]> {
    const response = await fetch(`${API_URL}/api/leave/requests`);
    if (!response.ok) throw new Error('Failed to fetch leave requests');
    return response.json();
  },

  // Get requests for a staff member
  async getStaffRequests(staffId: string): Promise<LeaveRequest[]> {
    const response = await fetch(`${API_URL}/api/leave/requests/${staffId}`);
    if (!response.ok) throw new Error('Failed to fetch staff requests');
    return response.json();
  },

  // Create new request
  async createRequest(data: {
    staffId: string;
    staffName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    totalHours: number;
    reason?: string;
    leaveType?: 'annual' | 'sick' | 'personal';
  }): Promise<LeaveRequest> {
    const response = await fetch(`${API_URL}/api/leave/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create leave request');
    }
    return response.json();
  },

  // Approve request
  async approveRequest(id: string, reviewedBy: string, adminNotes?: string): Promise<LeaveRequest> {
    const response = await fetch(`${API_URL}/api/leave/requests/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewedBy, adminNotes })
    });
    if (!response.ok) throw new Error('Failed to approve leave request');
    return response.json();
  },

  // Reject request
  async rejectRequest(id: string, reviewedBy: string, rejectionReason: string, adminNotes?: string): Promise<LeaveRequest> {
    const response = await fetch(`${API_URL}/api/leave/requests/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewedBy, rejectionReason, adminNotes })
    });
    if (!response.ok) throw new Error('Failed to reject leave request');
    return response.json();
  }
};

