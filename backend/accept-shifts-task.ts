
import 'dotenv/config';
import { Pool } from 'pg';

// Standalone script to accept shifts
async function run() {
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) {
        console.error('❌ DATABASE_URL is missing from .env');
        process.exit(1);
    }

    console.log('------------------------------------------------');
    // Sanitize URL for logging
    const hiddenUrl = rawUrl.replace(/:[^:@]+@/, ':****@');
    console.log(`🔌 Connecting to: ${hiddenUrl}`);

    // Use the URL + explicit SSL object. 
    // pg usually handles the merge, but let's be standard.
    const pool = new Pool({
        connectionString: rawUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 20000, // 20s timeout
    });

    let client;
    try {
        client = await pool.connect();
        console.log('✅ Connected successfully to database');

        const startDate = '2026-02-02';
        const endDate = '2026-02-08';

        // 1. Count
        const countQuery = `
            SELECT count(*) as count 
            FROM shifts 
            WHERE date >= $1 AND date <= $2
            AND (site_name ILIKE '%Erith%' OR site_name ILIKE '%Thamesmead%')
            AND staff_name NOT ILIKE '%Singita%'
        `;

        const res = await client.query(countQuery, [startDate, endDate]);
        const count = parseInt(res.rows[0].count);
        console.log(`\n📊 Found ${count} shifts matching criteria:`);
        console.log(`   - Date: ${startDate} to ${endDate}`);
        console.log(`   - Site: Erith OR Thamesmead`);
        console.log(`   - Staff: NOT Singita`);

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

            // List a few for verification
            if (updateRes.rows.length > 0) {
                console.log('\n📝 Sample updates:');
                updateRes.rows.slice(0, 5).forEach(r => {
                    console.log(`   - ${r.date}: ${r.staff_name} @ ${r.site_name}`);
                });
                if (updateRes.rows.length > 5) console.log(`   ... and ${updateRes.rows.length - 5} more`);
            }
        } else {
            console.log('\n⚠️ No shifts found to update.');
        }

    } catch (err: any) {
        console.error('\n❌ Error executing script:');
        console.error('   Message:', err.message);
        console.error('   Code:', err.code);
        if (err.message.includes('terminated')) {
            console.error('   Suggestion: Check VPN/Firewall or potential SSL handshake issues.');
        }
    } finally {
        if (client) client.release();
        await pool.end();
        console.log('\n🔌 Disconnected.');
        process.exit(0);
    }
}

run().catch(e => console.error(e));
