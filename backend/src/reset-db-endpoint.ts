import { Request, Response } from 'express';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || '';
const pool = DATABASE_URL ? new Pool({ 
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('render.com') ? {
    rejectUnauthorized: false
  } : false
}) : undefined;

export async function resetDatabase(req: Request, res: Response) {
  if (!pool) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    console.log('🔄 Starting database reset...');
    
    // Drop all existing tables
    console.log('📝 Dropping existing tables...');
    await pool.query(`
      DROP TABLE IF EXISTS attendance CASCADE;
      DROP TABLE IF EXISTS rooms CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS shifts CASCADE;
      DROP TABLE IF EXISTS staff CASCADE;
      DROP TABLE IF EXISTS sites CASCADE;
    `);
    console.log('✅ All tables dropped');
    
    // Create sites table
    console.log('📝 Creating sites table...');
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
    
    // Create staff table
    console.log('📝 Creating staff table...');
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
    
    // Create shifts table
    console.log('📝 Creating shifts table...');
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
    
    // Create legacy tables
    await pool.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
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
      
      CREATE TABLE rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        site_id UUID NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    // Create indexes
    console.log('📝 Creating indexes...');
    await pool.query(`
      CREATE INDEX idx_shifts_date ON shifts(date);
      CREATE INDEX idx_shifts_staff_id ON shifts(staff_id);
      CREATE INDEX idx_shifts_site_id ON shifts(site_id);
      CREATE INDEX idx_staff_username ON staff(username);
    `);
    
    // Insert default sites
    console.log('📝 Inserting default sites...');
    await pool.query(`
      INSERT INTO sites (id, name, location, postcode, address, color) VALUES
      ('SITE_001', 'Thamesmead Care Home', 'Thamesmead', 'SE28 8XX', '123 Thames Road, Thamesmead, London', '#3B82F6'),
      ('SITE_002', 'Rochester Care Home', 'Rochester', 'ME1 1XX', '456 High Street, Rochester, Kent', '#10B981');
    `);
    
    console.log('✅ Database reset complete!');
    
    res.json({
      success: true,
      message: 'Database reset successfully',
      details: {
        tablesCreated: ['sites', 'staff', 'shifts', 'users', 'attendance', 'rooms'],
        defaultSitesInserted: 2,
        indexesCreated: 4
      }
    });
  } catch (error: any) {
    console.error('❌ Database reset failed:', error.message);
    res.status(500).json({
      error: 'Failed to reset database',
      details: error.message
    });
  }
}

