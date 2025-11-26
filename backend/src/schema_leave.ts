import { pgTable, text, uuid, timestamp, integer, decimal, boolean } from 'drizzle-orm/pg-core';

// Annual Leave Balances - tracks each worker's leave entitlement and usage
export const leaveBalances = pgTable('leave_balances', {
  id: uuid('id').defaultRandom().primaryKey(),
  staffId: text('staff_id').notNull(), // References staff.id
  staffName: text('staff_name').notNull(),
  year: integer('year').notNull(), // e.g., 2025
  totalEntitlement: integer('total_entitlement').notNull().default(112), // Hours per year
  hoursUsed: integer('hours_used').notNull().default(0),
  hoursRemaining: integer('hours_remaining').notNull().default(112),
  carryOverFromPrevious: integer('carry_over_from_previous').default(0), // Max 24 hours
  carryOverToNext: integer('carry_over_to_next').default(0), // Max 24 hours
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Annual Leave Requests - tracks all leave requests
export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  staffId: text('staff_id').notNull(),
  staffName: text('staff_name').notNull(),
  startDate: text('start_date').notNull(), // YYYY-MM-DD
  endDate: text('end_date').notNull(), // YYYY-MM-DD
  totalDays: integer('total_days').notNull(), // Number of days
  totalHours: integer('total_hours').notNull(), // Total hours (days × 8)
  reason: text('reason'), // Optional reason for leave
  leaveType: text('leave_type').notNull().default('annual'), // 'annual' | 'sick' | 'personal'
  status: text('status').notNull().default('pending'), // 'pending' | 'approved' | 'rejected'
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  reviewedBy: text('reviewed_by'), // Admin who approved/rejected
  reviewedAt: timestamp('reviewed_at'),
  adminNotes: text('admin_notes'), // Admin can suggest alternative dates
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Leave Days - individual days of leave (for calendar display)
export const leaveDays = pgTable('leave_days', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').notNull(), // References leaveRequests.id
  staffId: text('staff_id').notNull(),
  staffName: text('staff_name').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  hours: integer('hours').notNull().default(8), // Usually 8 hours per day
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

