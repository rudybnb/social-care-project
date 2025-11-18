import { db } from '../db.js';
import { sql } from 'drizzle-orm';

export async function changeDurationToDecimal() {
  console.log('Running migration: Change duration column to support decimal values...');
  
  try {
    if (!db) {
      console.error('Database not configured');
      return;
    }

    // Change duration column from integer to real (float)
    await db.execute(sql`
      ALTER TABLE shifts 
      ALTER COLUMN duration TYPE real USING duration::real
    `);
    
    console.log('✅ Successfully changed duration column to real type');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

