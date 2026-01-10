import { ApprovalRequest } from '../types/approvalTypes';

const API_URL = process.env.REACT_APP_API_URL || 'https://social-care-backend.onrender.com';

export const approvalAPI = {
  // Create a new approval request
  async createRequest(request: Omit<ApprovalRequest, 'id' | 'requestTime' | 'status'>): Promise<ApprovalRequest> {
    const response = await fetch(`${API_URL}/api/approvals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...request,
        requestTime: new Date().toISOString(),
        status: 'pending'
      })
    });
    if (!response.ok) throw new Error('Failed to create approval request');
    return response.json();
  },

  // Get all approval requests
  async getAllRequests(): Promise<ApprovalRequest[]> {
    const response = await fetch(`${API_URL}/api/approvals`);
    if (!response.ok) throw new Error('Failed to fetch approval requests');
    return response.json();
  },

  // Get pending approval requests
  async getPendingRequests(): Promise<ApprovalRequest[]> {
    const response = await fetch(`${API_URL}/api/approvals?status=pending`);
    if (!response.ok) throw new Error('Failed to fetch pending requests');
    return response.json();
  },

  // Approve a request
  async approveRequest(id: string, approvedBy: string): Promise<ApprovalRequest> {
    const response = await fetch(`${API_URL}/api/approvals/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy })
    });
    if (!response.ok) throw new Error('Failed to approve request');
    return response.json();
  },

  // Reject a request
  async rejectRequest(id: string, rejectedBy: string, notes?: string): Promise<ApprovalRequest> {
    const response = await fetch(`${API_URL}/api/approvals/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectedBy, notes })
    });
    if (!response.ok) throw new Error('Failed to reject request');
    return response.json();
  },

  // Check if staff has approved request for today at site
  async checkApprovedRequest(staffId: string, siteId: string, date: string): Promise<ApprovalRequest | null> {
    const response = await fetch(`${API_URL}/api/approvals/check?staffId=${staffId}&siteId=${siteId}&date=${date}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.approved ? data.request : null;
  }
};
