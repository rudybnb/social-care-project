import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgresql://social_care_db_user:bwJcUNpMJAaKfJRdKBpLuVXbzEQqhqBt@dpg-ct0k1qe8ii6s73b1kqp0-a.oregon-postgres.render.com/social_care_db';

async function run() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB. Updating 3 Aug - 14 Aug request to status = cancelled ...');

    // Update 3 Aug - 14 Aug request status to 'cancelled'
    const res = await client.query(`
      UPDATE leave_requests 
      SET status = 'cancelled', updated_at = NOW() 
      WHERE id = '08bdc2a7-124f-40e7-aab4-377e259a2853' OR (start_date = '2026-08-03' AND end_date = '2026-08-14' AND total_hours = 48)
      RETURNING *;
    `);

    console.log('Updated rows:', res.rows);

    // Also let's check all leave requests for Lauren
    const all = await client.query(`
      SELECT id, staff_name, start_date, end_date, total_days, total_hours, status 
      FROM leave_requests 
      WHERE staff_name ILIKE '%lauren%'
      ORDER BY start_date DESC, requested_at DESC;
    `);

    console.log('\n--- ALL LAUREN LEAVE REQUESTS IN DB ---');
    console.table(all.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
