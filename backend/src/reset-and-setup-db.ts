import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('render.com') ? {
    rejectUnauthorized: false
  } : false
});

async function resetAndSetupDatabase() {
  console.log('🔄 Resetting and setting up database...\n');
  
  try {
    // Drop all existing tables
    console.log('📝 Step 1: Dropping existing tables...');
    await pool.query(`
      DROP TABLE IF EXISTS attendance CASCADE;
      DROP TABLE IF EXISTS rooms CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS shifts CASCADE;
      DROP TABLE IF EXISTS staff CASCADE;
      DROP TABLE IF EXISTS sites CASCADE;
    `);
    console.log('✅ All tables dropped\n');
    
    // Create sites table
    console.log('📝 Step 2: Creating sites table...');
    await pool.query(`
      CREATE TABLE sites (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        postcode TEXT NOT NULL,
        address TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        qr_code TEXT,
        qr_generated BOOLEAN DEFAULT false,
        color TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Sites table created\n');
    
    // Create staff table
    console.log('📝 Step 3: Creating staff table...');
    await pool.query(`
      CREATE TABLE staff (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT,
        username TEXT,
        password TEXT,
        role TEXT NOT NULL,
        site TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        standard_rate DECIMAL(10,2) NOT NULL DEFAULT 12.50,
        enhanced_rate TEXT DEFAULT '—',
        night_rate TEXT DEFAULT '—',
        rates TEXT NOT NULL,
        pension TEXT DEFAULT '—',
        deductions TEXT DEFAULT '£0.00',
        tax TEXT DEFAULT '—',
        weekly_hours INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Staff table created\n');
    
    // Create shifts table
    console.log('📝 Step 4: Creating shifts table...');
    await pool.query(`
      CREATE TABLE shifts (
        id TEXT PRIMARY KEY,
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        site_id TEXT NOT NULL,
        site_name TEXT NOT NULL,
        site_color TEXT NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        duration INTEGER NOT NULL,
        is_bank BOOLEAN DEFAULT false,
        is_24_hour BOOLEAN DEFAULT false,
        approved_24hr_by TEXT,
        notes TEXT,
        extended BOOLEAN DEFAULT false,
        extension_hours INTEGER,
        extension_reason TEXT,
        extension_approved_by TEXT,
        extension_approval_required BOOLEAN DEFAULT false,
        clocked_in BOOLEAN DEFAULT false,
        clock_in_time TIMESTAMP,
        clocked_out BOOLEAN DEFAULT false,
        clock_out_time TIMESTAMP,
        staff_status TEXT DEFAULT 'pending',
        decline_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Shifts table created\n');
    
    // Create legacy users table
    console.log('📝 Step 5: Creating legacy users table...');
    await pool.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Users table created\n');
    
    // Create legacy attendance table
    console.log('📝 Step 6: Creating legacy attendance table...');
    await pool.query(`
      CREATE TABLE attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        site_id UUID NOT NULL,
        shift_id UUID,
        clock_in TIMESTAMP,
        clock_out TIMESTAMP,
        gps_lat TEXT,
        gps_lng TEXT,
        photo_url TEXT,
        break_minutes INTEGER DEFAULT 0,
        overtime_minutes INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Attendance table created\n');
    
    // Create legacy rooms table
    console.log('📝 Step 7: Creating legacy rooms table...');
    await pool.query(`
      CREATE TABLE rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Rooms table created\n');
    
    // Create indexes
    console.log('📝 Step 8: Creating indexes...');
    await pool.query(`
      CREATE INDEX idx_shifts_date ON shifts(date);
      CREATE INDEX idx_shifts_staff_id ON shifts(staff_id);
      CREATE INDEX idx_shifts_site_id ON shifts(site_id);
      CREATE INDEX idx_staff_username ON staff(username);
    `);
    console.log('✅ Indexes created\n');
    
    // Insert default sites
    console.log('📝 Step 9: Inserting default sites...');
    await pool.query(`
      INSERT INTO sites (id, name, location, postcode, address, color) VALUES
      ('SITE_001', 'Thamesmead Care Home', 'Thamesmead', 'SE28 8XX', '123 Thames Road, Thamesmead, London', '#3B82F6'),
      ('SITE_002', 'Rochester Care Home', 'Rochester', 'ME1 1XX', '456 High Street, Rochester, Kent', '#10B981')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Default sites inserted\n');
    
    console.log('✅ Database reset and setup complete!\n');
    console.log('📋 Summary:');
    console.log('   - All tables recreated with correct schema');
    console.log('   - Indexes created for performance');
    console.log('   - Default sites inserted');
    console.log('   - Ready for staff and shift data\n');
    
  } catch (error: any) {
    console.error('❌ Setup failed:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

resetAndSetupDatabase().catch(console.error);

