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
      .where(sql`${staff.id} = ${staffId} OR LOWER(${staff.name}) = LOWER(${staffId}) OR LOWER(${staff.username}) = LOWER(${staffId})`)
      .limit(1);

    if (!staffMember) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const actualStaffId = staffMember.id;

    // Get balance
    const balance = await db
      .select()
      .from(leaveBalances)
      .where(and(
        sql`staff_id = ${actualStaffId} OR LOWER(staff_name) = LOWER(${staffMember.name})`,
        eq(leaveBalances.year, parseInt(year))
      ))
      .limit(1);

    if (balance.length === 0) {
      // Auto-create balance for current year if missing
      const currentYear = new Date().getFullYear();
      if (parseInt(year) === currentYear) {
        const daysPerWeek = staffMember.daysPerWeek ?? 5;
        const maxAnnualHours = Math.round(daysPerWeek * 5.6 * 8);
        const [newBalance] = await db
          .insert(leaveBalances)
          .values({
            staffId,
            staffName: staffMember.name,
            year: currentYear,
            totalEntitlement: maxAnnualHours,
            hoursAccrued: staffMember.startDate ? calculateAccruedLeave(staffMember.startDate, daysPerWeek) : 0,
            hoursUsed: 0,
            hoursRemaining: maxAnnualHours,
            carryOverFromPrevious: 0,
            carryOverToNext: 0
          })
          .returning();

        return res.json({
          ...newBalance,
          startDate: staffMember.startDate
        });
      }
      return res.status(404).json({ error: 'Leave balance not found' });
    }

    // Calculate accrued hours if start date exists
    let hoursAccrued = balance[0].hoursAccrued;
    let accrualInfo = null;

    if (staffMember.startDate) {
      const daysPerWeek = staffMember.daysPerWeek ?? 5;
      hoursAccrued = calculateAccruedLeave(staffMember.startDate, daysPerWeek);
      accrualInfo = getAccrualBreakdown(staffMember.startDate, daysPerWeek);

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

// Update leave balance
router.put('/balance/:staffId/:year', async (req, res) => {
  try {
    const { staffId, year } = req.params;
    const { hoursUsed, hoursRemaining, hoursAccrued } = req.body;

    // Get existing balance
    const [existing] = await db
      .select()
      .from(leaveBalances)
      .where(and(
        eq(leaveBalances.staffId, staffId),
        eq(leaveBalances.year, parseInt(year))
      ))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Balance not found' });
    }

    // Update balance
    const updateData: any = {
      updatedAt: new Date()
    };

    if (hoursUsed !== undefined) updateData.hoursUsed = hoursUsed;
    if (hoursRemaining !== undefined) updateData.hoursRemaining = hoursRemaining;
    if (hoursAccrued !== undefined) updateData.hoursAccrued = hoursAccrued;

    const [updated] = await db
      .update(leaveBalances)
      .set(updateData)
      .where(eq(leaveBalances.id, existing.id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating leave balance:', error);
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
        totalEntitlement: totalEntitlement || 224,
        hoursAccrued: hoursAccrued || 0,
        hoursUsed: hoursUsed || 0,
        hoursRemaining: hoursRemaining || totalEntitlement || 224,
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

    // First try to find staff member by ID, name, or username
    const [staffMember] = await db
      .select()
      .from(staff)
      .where(sql`${staff.id} = ${staffId} OR LOWER(${staff.name}) = LOWER(${staffId}) OR LOWER(${staff.username}) = LOWER(${staffId})`)
      .limit(1);

    const actualStaffId = staffMember ? staffMember.id : staffId;
    const actualStaffName = staffMember ? staffMember.name : staffId;

    const requests = await db
      .select()
      .from(leaveRequests)
      .where(sql`staff_id = ${actualStaffId} OR LOWER(staff_name) = LOWER(${actualStaffName}) OR staff_id = ${staffId}`)
      .orderBy(sql`start_date DESC, requested_at DESC`);

    res.json(requests);
  } catch (error: any) {
    console.error('Error fetching staff leave requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new leave request
router.post('/requests', async (req, res) => {
  try {
    const { staffId, staffName, startDate, endDate, totalDays, totalHours, reason, leaveType } = req.body;

    const currentYear = new Date(startDate || Date.now()).getFullYear() || new Date().getFullYear();

    // Find staff member by ID, name, or username
    const [staffMember] = await db
      .select()
      .from(staff)
      .where(sql`${staff.id} = ${staffId} OR LOWER(${staff.name}) = LOWER(${staffId}) OR LOWER(${staff.username}) = LOWER(${staffId}) OR LOWER(${staff.name}) = LOWER(${staffName || ''})`)
      .limit(1);

    const targetStaffId = staffMember ? staffMember.id : staffId;
    const targetStaffName = staffMember ? staffMember.name : (staffName || 'Staff');

    // Calculate accrued hours
    let hoursAccrued = 0;
    if (staffMember && staffMember.startDate) {
      const daysPerWeek = staffMember.daysPerWeek ?? 5;
      hoursAccrued = calculateAccruedLeave(staffMember.startDate, daysPerWeek);
    }

    const balance = await db
      .select()
      .from(leaveBalances)
      .where(and(
        sql`staff_id = ${targetStaffId} OR LOWER(staff_name) = LOWER(${targetStaffName})`,
        eq(leaveBalances.year, currentYear)
      ))
      .limit(1);

    let userBalance = balance[0];
    if (!userBalance) {
      const daysPerWeek = staffMember?.daysPerWeek ?? 5;
      const maxAnnualHours = Math.round(daysPerWeek * 5.6 * 8);
      const [newBalance] = await db
        .insert(leaveBalances)
        .values({
          staffId: targetStaffId,
          staffName: targetStaffName,
          year: currentYear,
          totalEntitlement: maxAnnualHours,
          hoursAccrued: hoursAccrued || maxAnnualHours,
          hoursUsed: 0,
          hoursRemaining: maxAnnualHours,
          carryOverFromPrevious: 0,
          carryOverToNext: 0
        })
        .returning();
      userBalance = newBalance;
    }

    const isAnnualLeave = (leaveType || 'annual').toLowerCase() === 'annual';
    if (isAnnualLeave) {
      const effectiveAccrued = (hoursAccrued > 0 ? hoursAccrued : (userBalance.hoursAccrued > 0 ? userBalance.hoursAccrued : userBalance.totalEntitlement));
      const availableHours = effectiveAccrued - userBalance.hoursUsed;
      if (availableHours < totalHours && (userBalance.hoursRemaining || 0) < totalHours) {
        return res.status(400).json({
          error: `Insufficient annual leave balance. Available: ${Math.max(0, availableHours)}h, Requested: ${totalHours}h`
        });
      }
    }

    // Create leave request
    const [newRequest] = await db
      .insert(leaveRequests)
      .values({
        staffId: targetStaffId,
        staffName: targetStaffName,
        startDate,
        endDate,
        totalDays: Math.round(Number(totalDays) || 1),
        totalHours: Math.round(Number(totalHours) || 8),
        reason: reason || null,
        leaveType: leaveType || 'annual',
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

    const [request] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
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

    // Update annual leave balance if applicable
    if (request.status !== 'approved' && (request.leaveType === 'annual' || !request.leaveType)) {
      const year = new Date(request.startDate).getFullYear() || new Date().getFullYear();
      await db.execute(sql`
        UPDATE leave_balances
        SET 
          hours_used = hours_used + ${request.totalHours},
          hours_remaining = hours_remaining - ${request.totalHours},
          updated_at = NOW()
        WHERE (staff_id = ${request.staffId} OR LOWER(staff_name) = LOWER(${request.staffName})) AND year = ${year}
      `);
    }

    // Create leave days entries
    try {
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
    } catch (daysError) {
      console.error('Error creating leave days entries (continuing anyway):', daysError);
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

    // Refund hours if request was previously approved
    if (request.status === 'approved' && (request.leaveType === 'annual' || !request.leaveType)) {
      const year = new Date(request.startDate).getFullYear() || new Date().getFullYear();
      await db.execute(sql`
        UPDATE leave_balances
        SET 
          hours_used = GREATEST(0, hours_used - ${request.totalHours}),
          hours_remaining = hours_remaining + ${request.totalHours},
          updated_at = NOW()
        WHERE (staff_id = ${request.staffId} OR LOWER(staff_name) = LOWER(${request.staffName})) AND year = ${year}
      `);
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

// Delete leave request
router.delete('/requests/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get the request first
    const [request] = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // If the request was approved, restore the hours to the balance
    if (request.status === 'approved') {
      const year = new Date(request.startDate).getFullYear();

      // Get current balance
      const [balance] = await db
        .select()
        .from(leaveBalances)
        .where(and(
          eq(leaveBalances.staffId, request.staffId),
          eq(leaveBalances.year, year)
        ))
        .limit(1);

      if (balance) {
        // Restore the hours safely
        const newHoursUsed = Math.max(0, balance.hoursUsed - request.totalHours);
        const newHoursRemaining = balance.hoursRemaining + request.totalHours;

        await db
          .update(leaveBalances)
          .set({
            hoursUsed: newHoursUsed,
            hoursRemaining: newHoursRemaining,
            updatedAt: new Date()
          })
          .where(eq(leaveBalances.id, balance.id));
      }
    }

    // Try to delete associated leave days (ignore errors if table doesn't exist)
    try {
      await db
        .delete(leaveDays)
        .where(eq(leaveDays.requestId, id));
    } catch (daysError) {
      console.log('Could not delete leave_days (table may not exist):', daysError);
      // Continue anyway
    }

    // Update status to 'cancelled' so history is preserved
    const [updatedRequest] = await db
      .update(leaveRequests)
      .set({
        status: 'cancelled',
        updatedAt: new Date()
      })
      .where(eq(leaveRequests.id, id))
      .returning();

    res.json({ message: 'Leave request cancelled successfully', request: updatedRequest });
  } catch (error: any) {
    console.error('Error deleting leave request:', error);
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

