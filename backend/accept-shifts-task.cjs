
require('dotenv').config();
const { Pool } = require('pg');

async function run() {
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) {
        console.error('❌ DATABASE_URL is missing from .env');
        process.exit(1);
    }

    // Sanitize URL for logging
    const hiddenUrl = rawUrl.replace(/:[^:@]+@/, ':****@');
    console.log(`🔌 Connecting to: ${hiddenUrl}`);
    console.log(`   (Node version: ${process.version})`);

    const pool = new Pool({
        connectionString: rawUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 20000,
    });

    let client;
    try {
        client = await pool.connect();
        console.log('✅ Connected successfully to database');

        const startDate = '2026-02-02';
        const endDate = '2026-02-08';

        const countQuery = `
            SELECT count(*) as count 
            FROM shifts 
            WHERE date >= $1 AND date <= $2
            AND (site_name ILIKE '%Erith%' OR site_name ILIKE '%Thamesmead%')
            AND staff_name NOT ILIKE '%Singita%'
        `;

        const res = await client.query(countQuery, [startDate, endDate]);
        const count = parseInt(res.rows[0].count);
        console.log(`\n📊 Found ${count} shifts matching criteria.`);

        if (count > 0) {
            console.log('\n🔄 Updating shifts to "accepted"...');
            const updateQuery = `
                UPDATE shifts 
                SET staff_status = 'accepted'
                WHERE date >= $1 AND date <= $2
                AND (site_name ILIKE '%Erith%' OR site_name ILIKE '%Thamesmead%')
                AND staff_name NOT ILIKE '%Singita%'
                RETURNING id, staff_name, site_name, date
            `;

            const updateRes = await client.query(updateQuery, [startDate, endDate]);
            console.log(`✅ Successfully updated ${updateRes.rowCount} shifts.`);
        } else {
            console.log('\n⚠️ No shifts found to update.');
        }

    } catch (err) {
        console.error('\n❌ Error executing script:');
        console.error('   Message:', err.message);
    } finally {
        if (client) client.release();
        await pool.end();
        console.log('\n🔌 Disconnected.');
    }
}

run().catch(e => console.error(e));
