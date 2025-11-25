import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { leaveBalances, leaveRequests, leaveDays, staff } from '../schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { calculateAccruedLeave, getAccrualBreakdown } from '../utils/leaveAccrual.js';

const router: Router = Router();

// ==================== LEAVE BALANCES ====================

// Get leave balance for a staff member
router.get('/balance/:staffId/:year', async (req, res) => {
  try {
    const { staffId, year } = req.params;
    
    // Get staff member to check start date
    const [staffMember] = await db
      .select()
      .from(staff)
      .where(eq(staff.id, staffId))
      .limit(1);
    
    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    
    // Get balance
    const balance = await db
      .select()
      .from(leaveBalances)
      .where(and(
        eq(leaveBalances.staffId, staffId),
        eq(leaveBalances.year, parseInt(year))
      ))
      .limit(1);
    
    if (balance.length === 0) {
      return res.status(404).json({ error: 'Leave balance not found' });
    }
    
    // Calculate accrued hours if start date exists
    let hoursAccrued = balance[0].hoursAccrued;
    let accrualInfo = null;
    
    if (staffMember.startDate) {
      hoursAccrued = calculateAccruedLeave(staffMember.startDate);
      accrualInfo = getAccrualBreakdown(staffMember.startDate);
      
      // Update balance with calculated accrued hours
      await db
        .update(leaveBalances)
        .set({ hoursAccrued, updatedAt: new Date() })
        .where(eq(leaveBalances.id, balance[0].id));
    }
    
    res.json({
      ...balance[0],
      hoursAccrued,
      accrualInfo,
      startDate: staffMember.startDate
    });
  } catch (error: any) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all leave balances for current year
router.get('/balances', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const balances = await db
      .select()
      .from(leaveBalances)
      .where(eq(leaveBalances.year, currentYear));
    
    res.json(balances);
  } catch (error: any) {
    console.error('Error fetching leave balances:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update leave balance
router.post('/balances', async (req, res) => {
  try {
    const { staffId, staffName, year, totalEntitlement, hoursAccrued, hoursUsed, hoursRemaining } = req.body;
    
    // Check if balance already exists
    const existing = await db
      .select()
      .from(leaveBalances)
      .where(and(
        eq(leaveBalances.staffId, staffId),
        eq(leaveBalances.year, year)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Balance already exists for this staff member and year' });
    }
    
    // Create new balance
    const [newBalance] = await db
      .insert(leaveBalances)
      .values({
        staffId,
        staffName,
        year,
        totalEntitlement: totalEntitlement || 112,
        hoursAccrued: hoursAccrued || 0,
        hoursUsed: hoursUsed || 0,
        hoursRemaining: hoursRemaining || totalEntitlement || 112,
        carryOverFromPrevious: 0,
        carryOverToNext: 0
      })
      .returning();
    
    res.status(201).json(newBalance);
  } catch (error: any) {
    console.error('Error creating leave balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== LEAVE REQUESTS ====================

// Get all leave requests
router.get('/requests', async (req, res) => {
  try {
    const requests = await db
      .select()
      .from(leaveRequests)
      .orderBy(sql`requested_at DESC`);
    
    res.json(requests);
  } catch (error: any) {
    console.error('Error fetching leave requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get leave requests for a specific staff member
router.get('/requests/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;
    const requests = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.staffId, staffId))
      .orderBy(sql`requested_at DESC`);
    
    res.json(requests);
  } catch (error: any) {
    console.error('Error fetching staff leave requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new leave request
router.post('/requests', async (req, res) => {
  try {
    const { staffId, staffName, startDate, endDate, totalDays, totalHours, reason } = req.body;
    
    // Check if staff has enough leave balance
    const currentYear = new Date().getFullYear();
    
    // Get staff member to check start date
    const [staffMember] = await db
      .select()
      .from(staff)
      .where(eq(staff.id, staffId))
      .limit(1);
    
    if (!staffMember) {
      return res.status(400).json({ error: 'Staff member not found' });
    }
    
    // Calculate accrued hours
    let hoursAccrued = 0;
    if (staffMember.startDate) {
      hoursAccrued = calculateAccruedLeave(staffMember.startDate);
    }
    
    // Check if staff has completed 3-month probation
    if (hoursAccrued === 0) {
      return res.status(400).json({ 
        error: 'You must complete 3 months of employment before requesting annual leave' 
      });
    }
    
    const balance = await db
      .select()
      .from(leaveBalances)
      .where(and(
        eq(leaveBalances.staffId, staffId),
        eq(leaveBalances.year, currentYear)
      ))
      .limit(1);
    
    if (balance.length === 0) {
      return res.status(400).json({ error: 'Staff member not eligible for annual leave' });
    }
    
    // Check if enough hours have accrued
    const availableHours = hoursAccrued - balance[0].hoursUsed;
    if (availableHours < totalHours) {
      return res.status(400).json({ 
        error: `Insufficient accrued leave. Accrued: ${hoursAccrued}h, Used: ${balance[0].hoursUsed}h, Available: ${availableHours}h, Requested: ${totalHours}h` 
      });
    }
    
    // Create leave request
    const [newRequest] = await db
      .insert(leaveRequests)
      .values({
        staffId,
        staffName,
        startDate,
        endDate,
        totalDays,
        totalHours,
        reason,
        status: 'pending'
      })
      .returning();
    
    res.json(newRequest);
  } catch (error: any) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve leave request
router.put('/requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewedBy, adminNotes } = req.body;
    
    // Get the request
    const [request] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);
    
    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been reviewed' });
    }
    
    // Update request status
    const [updatedRequest] = await db
      .update(leaveRequests)
      .set({
        status: 'approved',
        reviewedBy,
        reviewedAt: new Date(),
        adminNotes,
        updatedAt: new Date()
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    
    // Update leave balance
    const currentYear = new Date().getFullYear();
    await db.execute(sql`
      UPDATE leave_balances
      SET 
        hours_used = hours_used + ${request.totalHours},
        hours_remaining = hours_remaining - ${request.totalHours},
        updated_at = NOW()
      WHERE staff_id = ${request.staffId} AND year = ${currentYear}
    `);
    
    // Create leave days entries
    const start = new Date(request.startDate);
    const end = new Date(request.endDate);
    const leaveDaysData = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      leaveDaysData.push({
        requestId: request.id,
        staffId: request.staffId,
        staffName: request.staffName,
        date: d.toISOString().split('T')[0],
        hours: 8
      });
    }
    
    if (leaveDaysData.length > 0) {
      await db.insert(leaveDays).values(leaveDaysData);
    }
    
    res.json(updatedRequest);
  } catch (error: any) {
    console.error('Error approving leave request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject leave request
router.put('/requests/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewedBy, rejectionReason, adminNotes } = req.body;
    
    const [request] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);
    
    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been reviewed' });
    }
    
    const [updatedRequest] = await db
      .update(leaveRequests)
      .set({
        status: 'rejected',
        reviewedBy,
        reviewedAt: new Date(),
        rejectionReason,
        adminNotes,
        updatedAt: new Date()
      })
      .where(eq(leaveRequests.id, id))
      .returning();
    
    res.json(updatedRequest);
  } catch (error: any) {
    console.error('Error rejecting leave request:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== LEAVE DAYS ====================

// Get leave days for a date range
router.get('/days', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let days;
    if (startDate && endDate) {
      days = await db
        .select()
        .from(leaveDays)
        .where(and(
          sql`date >= ${startDate}`,
          sql`date <= ${endDate}`
        ));
    } else {
      days = await db.select().from(leaveDays);
    }
    
    res.json(days);
  } catch (error: any) {
    console.error('Error fetching leave days:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

