import { sql } from 'drizzle-orm';
import { db } from '../db.js';

export async function up() {
  console.log('>>> Creating annual leave tables...');
  
  // Create leave_balances table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS leave_balances (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      staff_id TEXT NOT NULL,
      staff_name TEXT NOT NULL,
      year INTEGER NOT NULL,
      total_entitlement INTEGER NOT NULL DEFAULT 112,
      hours_used INTEGER NOT NULL DEFAULT 0,
      hours_remaining INTEGER NOT NULL DEFAULT 112,
      carry_over_from_previous INTEGER DEFAULT 0,
      carry_over_to_next INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
      UNIQUE(staff_id, year)
    )
  `);
  
  // Create leave_requests table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      staff_id TEXT NOT NULL,
      staff_name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_days INTEGER NOT NULL,
      total_hours INTEGER NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT NOW() NOT NULL,
      reviewed_by TEXT,
      reviewed_at TIMESTAMP,
      admin_notes TEXT,
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // Create leave_days table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS leave_days (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      request_id UUID NOT NULL,
      staff_id TEXT NOT NULL,
      staff_name TEXT NOT NULL,
      date TEXT NOT NULL,
      hours INTEGER NOT NULL DEFAULT 8,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  console.log('>>> Annual leave tables created successfully');
  
  // Initialize leave balances for eligible staff (L A, M B, I M)
  console.log('>>> Initializing leave balances for eligible staff...');
  
  const currentYear = new Date().getFullYear();
  const eligibleStaff = [
    { id: 'LA', name: 'L A' },
    { id: 'MB', name: 'M B' },
    { id: 'IM', name: 'I M' }
  ];
  
  for (const staff of eligibleStaff) {
    await db.execute(sql`
      INSERT INTO leave_balances (staff_id, staff_name, year, total_entitlement, hours_used, hours_remaining)
      VALUES (${staff.id}, ${staff.name}, ${currentYear}, 112, 0, 112)
      ON CONFLICT (staff_id, year) DO NOTHING
    `);
  }
  
  console.log('>>> Leave balances initialized for eligible staff');
}

export async function down() {
  console.log('>>> Dropping annual leave tables...');
  await db.execute(sql`DROP TABLE IF EXISTS leave_days CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS leave_requests CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS leave_balances CASCADE`);
  console.log('>>> Annual leave tables dropped');
}

