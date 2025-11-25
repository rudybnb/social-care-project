import { pgTable, serial, text, timestamp, integer, boolean, uuid, decimal, real } from 'drizzle-orm/pg-core';

// Staff members (enhanced from users table)
export const staff = pgTable('staff', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email'), // Staff email address
  username: text('username'), // For staff login
  password: text('password'), // Hashed password for staff login
  role: text('role').notNull(), // 'Admin' | 'Site Manager' | 'Worker'
  site: text('site').notNull(),
  status: text('status').notNull().default('Active'), // 'Active' | 'Inactive'
  standardRate: decimal('standard_rate', { precision: 10, scale: 2 }).notNull().default('12.50'),
  enhancedRate: text('enhanced_rate').default('—'),
  nightRate: text('night_rate').default('—'),
  rates: text('rates').notNull(), // Display string for rates
  pension: text('pension').default('—'),
  deductions: text('deductions').default('£0.00'),
  tax: text('tax').default('—'),
  weeklyHours: integer('weekly_hours').default(0),
  startDate: text('start_date'), // Employment start date for leave accrual calculation
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sites/Care Homes
export const sites = pgTable('sites', {
  id: text('id').primaryKey(), // e.g., 'SITE_001'
  name: text('name').notNull(),
  location: text('location').notNull(),
  postcode: text('postcode').notNull(),
  address: text('address').notNull(),
  status: text('status').notNull().default('Active'), // 'Active' | 'Inactive'
  qrCode: text('qr_code'), // QR code data for clock-in
  qrGenerated: boolean('qr_generated').default(false),
  color: text('color').notNull(), // Hex color for UI
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Shifts
export const shifts = pgTable('shifts', {
  id: text('id').primaryKey(), // e.g., 'SHIFT_DAY_1234567890'
  staffId: text('staff_id').notNull(),
  staffName: text('staff_name').notNull(),
  siteId: text('site_id').notNull(),
  siteName: text('site_name').notNull(),
  siteColor: text('site_color').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD format
  type: text('type').notNull(), // 'Day' | 'Night'
  startTime: text('start_time').notNull(), // HH:MM format
  endTime: text('end_time').notNull(), // HH:MM format
  duration: real('duration').notNull(), // hours (supports decimals like 12.43)
  isBank: boolean('is_bank').default(false), // BANK placeholder flag
  is24Hour: boolean('is_24_hour').default(false),
  approved24HrBy: text('approved_24hr_by'),
  notes: text('notes'),
  extended: boolean('extended').default(false),
  extensionHours: integer('extension_hours'),
  extensionReason: text('extension_reason'),
  extensionApprovedBy: text('extension_approved_by'),
  extensionApprovalRequired: boolean('extension_approval_required').default(false),
  clockedIn: boolean('clocked_in').default(false), // Staff clocked in
  clockInTime: timestamp('clock_in_time'), // Actual clock-in time
  clockedOut: boolean('clocked_out').default(false), // Staff clocked out
  clockOutTime: timestamp('clock_out_time'), // Actual clock-out time
  staffStatus: text('staff_status').default('pending'), // 'pending' | 'accepted' | 'declined'
  declineReason: text('decline_reason'), // Reason for declining shift
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Annual Leave Balances
export const leaveBalances = pgTable('leave_balances', {
  id: uuid('id').defaultRandom().primaryKey(),
  staffId: text('staff_id').notNull(),
  staffName: text('staff_name').notNull(),
  year: integer('year').notNull(),
  totalEntitlement: integer('total_entitlement').notNull().default(112),
  hoursAccrued: integer('hours_accrued').notNull().default(0), // Hours earned so far based on months worked
  hoursUsed: integer('hours_used').notNull().default(0),
  hoursRemaining: integer('hours_remaining').notNull().default(112),
  carryOverFromPrevious: integer('carry_over_from_previous').default(0),
  carryOverToNext: integer('carry_over_to_next').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Annual Leave Requests
export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  staffId: text('staff_id').notNull(),
  staffName: text('staff_name').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  totalDays: integer('total_days').notNull(),
  totalHours: integer('total_hours').notNull(),
  reason: text('reason'),
  status: text('status').notNull().default('pending'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  adminNotes: text('admin_notes'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Leave Days
export const leaveDays = pgTable('leave_days', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').notNull(),
  staffId: text('staff_id').notNull(),
  staffName: text('staff_name').notNull(),
  date: text('date').notNull(),
  hours: integer('hours').notNull().default(8),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Legacy tables (keep for compatibility)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'admin' | 'worker'
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attendance = pgTable('attendance', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  siteId: uuid('site_id').notNull(),
  shiftId: uuid('shift_id'),
  clockIn: timestamp('clock_in'),
  clockOut: timestamp('clock_out'),
  gpsLat: text('gps_lat'),
  gpsLng: text('gps_lng'),
  photoUrl: text('photo_url'),
  breakMinutes: integer('break_minutes').default(0),
  overtimeMinutes: integer('overtime_minutes').default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rooms = pgTable('rooms', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull(),
  name: text('name').notNull(),
  qrCode: text('qr_code').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const roomScans = pgTable('room_scans', {
  id: uuid('id').defaultRandom().primaryKey(),
  roomId: uuid('room_id').notNull(),
  userId: uuid('user_id').notNull(),
  shiftId: uuid('shift_id'),
  scannedAt: timestamp('scanned_at').defaultNow().notNull(),
  taskCompleted: boolean('task_completed').default(false),
  notes: text('notes'),
});

export const queries = pgTable('queries', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull(),
  userId: uuid('user_id').notNull(),
  category: text('category'),
  status: text('status').default('open'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const queryMessages = pgTable('query_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  queryId: uuid('query_id').notNull(),
  senderId: uuid('sender_id').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

