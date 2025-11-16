import { Request, Response } from 'express';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || '';
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL }) : undefined;

export async function createStaffTable(req: Request, res: Response) {
  if (!pool) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    console.log('🔍 Checking if staff table exists...');
    
    // Check if staff table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'staff'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    console.log(`Staff table exists: ${tableExists}`);
    
    if (!tableExists) {
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
      console.log('✅ Staff table created');
      
      return res.json({
        success: true,
        message: 'Staff table created successfully',
        action: 'created'
      });
    } else {
      // Table exists, check columns
      console.log('📝 Checking staff table columns...');
      const columnsResult = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'staff'
        ORDER BY ordinal_position;
      `);
      
      const columns = columnsResult.rows.map(r => r.column_name);
      console.log('Existing columns:', columns);
      
      // Add missing columns
      const requiredColumns = [
        'email', 'username', 'password', 'weekly_hours'
      ];
      
      for (const col of requiredColumns) {
        if (!columns.includes(col)) {
          console.log(`Adding missing column: ${col}`);
          if (col === 'weekly_hours') {
            await pool.query(`ALTER TABLE staff ADD COLUMN ${col} INTEGER DEFAULT 0;`);
          } else {
            await pool.query(`ALTER TABLE staff ADD COLUMN ${col} TEXT;`);
          }
        }
      }
      
      return res.json({
        success: true,
        message: 'Staff table verified and updated',
        action: 'updated',
        columns: columns
      });
    }
  } catch (error: any) {
    console.error('❌ Error managing staff table:', error.message);
    console.error('Full error:', error);
    res.status(500).json({
      error: 'Failed to manage staff table',
      details: error.message
    });
  }
}

