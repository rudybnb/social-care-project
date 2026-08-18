import pkg from 'pg';
const { Pool } = pkg;

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://social_care_db_user:bwJcUNpMJAaKfJRdKBpLuVXbzEQqhqBt@dpg-ct0k1qe8ii6s73b1kqp0-a.oregon-postgres.render.com/social_care_db';

const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT s.*, st.name as staff_member_name 
      FROM shifts s 
      LEFT JOIN staff st ON s.staff_id = st.id 
      WHERE (st.name ILIKE '%lauren%' OR s.staff_name ILIKE '%lauren%')
        AND s.date >= '2026-07-14' AND s.date <= '2026-08-09'
      ORDER BY s.date ASC, s.start_time ASC
    `);

    console.log(`Found ${res.rows.length} shifts between 2026-07-14 and 2026-08-09:\n`);
    
    const unclocked = [];
    res.rows.forEach((s, i) => {
      const isClocked = s.clocked_in && s.clocked_out;
      console.log(`${i+1}. ID: ${s.id} | Date: ${s.date} | Site: ${s.site_name} | ${s.start_time}-${s.end_time} | ClockedIn: ${s.clocked_in} | ClockedOut: ${s.clocked_out}`);
      if (!isClocked) unclocked.push(s);
    });

    console.log(`\nUnclocked/Incomplete shifts needing update: ${unclocked.length}`);
    unclocked.forEach((s, i) => {
      console.log(`  ${i+1}. Date: ${s.date} | ${s.site_name} | ${s.start_time}-${s.end_time}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
