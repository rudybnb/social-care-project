import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`ALTER TABLE "shifts" ADD COLUMN "is_offered_for_swap" boolean DEFAULT false;`);
    console.log("Added is_offered_for_swap");
  } catch(e) { console.error(e.message) }
  
  try {
    await pool.query(`ALTER TABLE "shifts" ADD COLUMN "is_swapped" boolean DEFAULT false;`);
    console.log("Added is_swapped");
  } catch(e) { console.error(e.message) }

  try {
    await pool.query(`ALTER TABLE "shifts" ADD COLUMN "original_staff_id" text;`);
    console.log("Added original_staff_id");
  } catch(e) { console.error(e.message) }
  
  pool.end();
}
run();
