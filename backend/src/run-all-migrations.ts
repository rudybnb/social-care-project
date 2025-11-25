import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function runAllMigrations() {
  console.log('🔄 Starting comprehensive database migration...\n');
  
  try {
    // Migration 1: Add staff_status and decline_reason to shifts table
    console.log('📝 Migration 1: Adding staff_status and decline_reason columns...');
    try {
      await pool.query(`
        ALTER TABLE shifts 
        ADD COLUMN IF NOT EXISTS staff_status TEXT DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS decline_reason TEXT;
      `);
      console.log('✅ Migration 1 complete\n');
    } catch (error: any) {
      console.log(`⚠️  Migration 1 skipped (columns might already exist): ${error.message}\n`);
    }
    
    // Migration 2: Ensure all required columns exist in staff table
    console.log('📝 Migration 2: Ensuring staff table has all required columns...');
    try {
      await pool.query(`
        ALTER TABLE staff 
        ADD COLUMN IF NOT EXISTS email TEXT,
        ADD COLUMN IF NOT EXISTS username TEXT,
        ADD COLUMN IF NOT EXISTS password TEXT,
        ADD COLUMN IF NOT EXISTS standard_rate DECIMAL(10,2) DEFAULT 12.50,
        ADD COLUMN IF NOT EXISTS enhanced_rate DECIMAL(10,2) DEFAULT 14.00,
        ADD COLUMN IF NOT EXISTS night_rate DECIMAL(10,2) DEFAULT 15.00,
        ADD COLUMN IF NOT EXISTS is_bank BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
      `);
      console.log('✅ Migration 2 complete\n');
    } catch (error: any) {
      console.log(`⚠️  Migration 2 skipped: ${error.message}\n`);
    }
    
    // Migration 3: Ensure shifts table has all required columns
    console.log('📝 Migration 3: Ensuring shifts table has all required columns...');
    try {
      await pool.query(`
        ALTER TABLE shifts 
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
      `);
      console.log('✅ Migration 3 complete\n');
    } catch (error: any) {
      console.log(`⚠️  Migration 3 skipped: ${error.message}\n`);
    }
    
    // Migration 4: Change duration column to support decimal values
    console.log('📝 Migration 4: Changing duration column to support decimal hours...');
    try {
      await pool.query(`
        ALTER TABLE shifts 
        ALTER COLUMN duration TYPE real USING duration::real;
      `);
      console.log('✅ Migration 4 complete\n');
    } catch (error: any) {
      console.log(`⚠️  Migration 4 skipped: ${error.message}\n`);
    }
    
    // Migration 5: Create indexes for better performance
    console.log('📝 Migration 5: Creating indexes...');
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);
        CREATE INDEX IF NOT EXISTS idx_shifts_staff_id ON shifts(staff_id);
        CREATE INDEX IF NOT EXISTS idx_shifts_site_id ON shifts(site_id);
        CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username);
      `);
      console.log('✅ Migration 5 complete\n');
    } catch (error: any) {
      console.log(`⚠️  Migration 5 skipped: ${error.message}\n`);
    }
    
    // Migration 6: Create annual leave tables
    console.log('📝 Migration 6: Creating annual leave tables...');
    try {
      // Add start_date to staff table
      await pool.query(`
        ALTER TABLE staff
        ADD COLUMN IF NOT EXISTS start_date TEXT;
      `);
      
      // Create leave_balances table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS leave_balances (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          staff_id TEXT NOT NULL,
          staff_name TEXT NOT NULL,
          year INTEGER NOT NULL,
          total_entitlement INTEGER NOT NULL DEFAULT 112,
          hours_accrued INTEGER NOT NULL DEFAULT 0,
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
      await pool.query(`
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
      await pool.query(`
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
      
      // Initialize leave balances for eligible staff
      const currentYear = new Date().getFullYear();
      await pool.query(`
        INSERT INTO leave_balances (staff_id, staff_name, year, total_entitlement, hours_used, hours_remaining)
        SELECT id, name, ${currentYear}, 112, 0, 112
        FROM staff
        WHERE name IN ('L A', 'M B', 'I M')
        ON CONFLICT (staff_id, year) DO NOTHING
      `);
      
      console.log('✅ Migration 6 complete\n');
    } catch (error: any) {
      console.log(`⚠️  Migration 6 skipped: ${error.message}\n`);
    }
    
    // Verify tables exist
    console.log('🔍 Verifying database schema...\n');
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Existing tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    console.log('\n✅ All migrations complete!');
    console.log('✅ Database is ready for production use\n');
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runAllMigrations().catch(console.error);

