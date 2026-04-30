import { db } from './src/index.js';
import { shifts } from './src/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
  if (!db) return console.log('No db');
  const userShifts = await db.select().from(shifts).where(eq(shifts.staffName, 'Lauren Alecia'));
  console.log(JSON.stringify(userShifts, null, 2));
  process.exit(0);
}
run();
