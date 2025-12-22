import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import { shifts } from './src/schema.js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

(async () => {
  try {
    const allShifts = await db.select().from(shifts);
    console.log('Total shifts:', allShifts.length);
    
    // Find duplicates by staffId, date, startTime, endTime
    const duplicates = {};
    allShifts.forEach(shift => {
      const key = `${shift.staffId}-${shift.date}-${shift.startTime}-${shift.endTime}`;
      if (!duplicates[key]) duplicates[key] = [];
      duplicates[key].push(shift);
    });
    
    const dupes = Object.values(duplicates).filter(group => group.length > 1);
    console.log('\nDuplicate shift groups:', dupes.length);
    
    dupes.forEach((group, idx) => {
      console.log(`\n--- Duplicate Group ${idx + 1} ---`);
      group.forEach(s => {
        console.log(`ID: ${s.id}, Staff: ${s.staffName}, Date: ${s.date}, Time: ${s.startTime}-${s.endTime}, Status: ${s.status}, Site: ${s.siteName}`);
      });
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
