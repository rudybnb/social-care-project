import pkg from 'pg';
const { Client } = pkg;

const DATABASE_URL = 'postgresql://social_care_db_user:bwJcUNpMJAaKfJRdKBpLuVXbzEQqhqBt@dpg-ct0k1qe8ii6s73b1kqp0-a.oregon-postgres.render.com/social_care_db';

async function fixLaurenShift() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB. Updating Lauren\'s Aug 14 shift ...');

    const res = await client.query(`
      UPDATE shifts
      SET 
        clocked_in = true,
        clocked_out = true,
        clock_in_time = '2026-08-14 19:07:04.136+00',
        clock_out_time = '2026-08-15 07:28:00.000+00',
        end_time = '07:28',
        duration = 12.35,
        updated_at = NOW()
      WHERE id = 'SHIFT_NIGHT_1785973859314_1'
      RETURNING *;
    `);

    console.log('Updated shift row:');
    console.log(JSON.stringify(res.rows[0], null, 2));

  } catch (err) {
    console.error('Error updating DB:', err);
  } finally {
    await client.end();
  }
}

fixLaurenShift();
