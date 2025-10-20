import { pgTable, serial, text, timestamp, integer, boolean, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'admin' | 'worker'
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sites = pgTable('sites', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  settings: text('settings'), // JSON string
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const shifts = pgTable('shifts', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').notNull(),
  userId: uuid('user_id').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  recurring: boolean('recurring').default(false),
  status: text('status').default('scheduled'),
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