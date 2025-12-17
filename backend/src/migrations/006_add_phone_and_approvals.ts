import { Pool } from 'pg';

export async function up(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Adding phone column to staff table...');
    await client.query(`
      ALTER TABLE staff 
      ADD COLUMN IF NOT EXISTS phone TEXT;
    `);
    
    console.log('Creating approval_requests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS approval_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        staff_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        site_id TEXT NOT NULL,
        site_name TEXT NOT NULL,
        date TEXT NOT NULL,
        request_time TIMESTAMP NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'pending',
        approved_by TEXT,
        approved_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('Creating index on approval_requests...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_approval_requests_staff_site_date 
      ON approval_requests(staff_id, site_id, date);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_approval_requests_status 
      ON approval_requests(status);
    `);
    
    await client.query('COMMIT');
    console.log('✅ Migration 006 completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration 006 failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

export async function down(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query('DROP TABLE IF EXISTS approval_requests;');
    await client.query('ALTER TABLE staff DROP COLUMN IF EXISTS phone;');
    
    await client.query('COMMIT');
    console.log('✅ Migration 006 rolled back successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration 006 rollback failed:', error);
    throw error;
  } finally {
    client.release();
  }
}
