import { Request, Response } from 'express';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || '';
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : undefined;

export async function fixStaffSchema(req: Request, res: Response) {
  if (!pool) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    console.log('🔧 Fixing staff table schema...');
    
    // Rename full_name to name if it exists
    console.log('📝 Step 1: Renaming full_name to name...');
    try {
      await pool.query(`ALTER TABLE staff RENAME COLUMN full_name TO name;`);
      console.log('✅ Renamed full_name to name');
    } catch (error: any) {
      console.log(`⚠️  Column rename skipped: ${error.message}`);
    }
    
    // Add all missing columns
    console.log('📝 Step 2: Adding missing columns...');
    await pool.query(`
      ALTER TABLE staff 
      ADD COLUMN IF NOT EXISTS name TEXT,
      ADD COLUMN IF NOT EXISTS site TEXT DEFAULT 'All Sites',
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active',
      ADD COLUMN IF NOT EXISTS standard_rate DECIMAL(10,2) DEFAULT 12.50,
      ADD COLUMN IF NOT EXISTS enhanced_rate TEXT DEFAULT '—',
      ADD COLUMN IF NOT EXISTS night_rate TEXT DEFAULT '—',
      ADD COLUMN IF NOT EXISTS rates TEXT DEFAULT '£12.50/h',
      ADD COLUMN IF NOT EXISTS pension TEXT DEFAULT '—',
      ADD COLUMN IF NOT EXISTS deductions TEXT DEFAULT '£0.00',
      ADD COLUMN IF NOT EXISTS tax TEXT DEFAULT '—',
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    console.log('✅ All missing columns added');
    
    // Update NULL values in required columns
    console.log('📝 Step 3: Updating NULL values in required columns...');
    await pool.query(`
      UPDATE staff 
      SET 
        name = COALESCE(name, 'Staff Member'),
        site = COALESCE(site, 'All Sites'),
        status = COALESCE(status, 'Active'),
        rates = COALESCE(rates, '£12.50/h'),
        created_at = COALESCE(created_at, NOW()),
        updated_at = COALESCE(updated_at, NOW())
      WHERE name IS NULL OR site IS NULL OR status IS NULL OR rates IS NULL;
    `);
    console.log('✅ NULL values updated');
    
    // Set NOT NULL constraints
    console.log('📝 Step 4: Setting NOT NULL constraints...');
    try {
      await pool.query(`
        ALTER TABLE staff 
        ALTER COLUMN name SET NOT NULL,
        ALTER COLUMN role SET NOT NULL,
        ALTER COLUMN site SET NOT NULL,
        ALTER COLUMN status SET NOT NULL,
        ALTER COLUMN standard_rate SET NOT NULL,
        ALTER COLUMN rates SET NOT NULL,
        ALTER COLUMN created_at SET NOT NULL,
        ALTER COLUMN updated_at SET NOT NULL;
      `);
      console.log('✅ NOT NULL constraints set');
    } catch (error: any) {
      console.log(`⚠️  Constraints skipped: ${error.message}`);
    }
    
    // Get final column list
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'staff'
      ORDER BY ordinal_position;
    `);
    
    console.log('✅ Staff table schema fixed!');
    
    res.json({
      success: true,
      message: 'Staff table schema fixed successfully',
      columns: columnsResult.rows
    });
  } catch (error: any) {
    console.error('❌ Error fixing staff schema:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      error: 'Failed to fix staff schema',
      details: error.message
    });
  }
}

