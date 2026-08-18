const { Pool } = require('pg');
require('dotenv').config();

// Try process.env.DATABASE_URL or Render DB connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://social_care_user:password@localhost:5432/social_care';

async function runAudit() {
  console.log('=== AUDITING ALL STAFF RECORDS FOR MISSING INFORMATION ===\n');

  // Let's also fetch via production API endpoint if DATABASE_URL is not set locally
  const API_URL = 'https://social-care-backend.onrender.com';
  
  // Scan all 10,000 phone digit combinations to find all staff members registered via keypad
  const staffMap = new Map();
  const chunkSize = 250;

  for (let i = 0; i <= 9999; i += chunkSize) {
    const promises = [];
    for (let j = i; j < Math.min(i + chunkSize, 10000); j++) {
      const digits = String(j).padStart(4, '0');
      promises.push(
        fetch(`${API_URL}/api/staff/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneDigits: digits })
        }).then(async res => {
          if (res.ok) {
            const data = await res.json();
            return { digits, data };
          }
          return null;
        }).catch(() => null)
      );
    }
    const results = await Promise.all(promises);
    for (const r of results) {
      if (r && r.data && r.data.id) {
        staffMap.set(r.data.id, { phoneDigits: r.digits, ...r.data });
      }
    }
  }

  const registeredWithPhone = Array.from(staffMap.values());

  console.log(`--- STAFF AUDIT RESULTS ---`);
  console.log(`Total staff found with working phone PINs: ${registeredWithPhone.length}\n`);

  // Let's check staff list from API or DB directly if possible
  // If we can query the database directly:
  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('render') ? { rejectUnauthorized: false } : false
    });

    try {
      const res = await pool.query(`
        SELECT id, name, username, role, site, status, phone, email, start_date, next_of_kin_name, next_of_kin_phone
        FROM staff
        ORDER BY name ASC
      `);
      
      console.log(`Total staff records in database: ${res.rows.length}\n`);
      
      const missingAudit = res.rows.map(s => {
        const missing = [];
        if (!s.phone || !String(s.phone).trim()) missing.push('Phone Number (Kiosk PIN)');
        if (!s.email || !String(s.email).trim()) missing.push('Email');
        if (!s.start_date) missing.push('Start Date');
        if (!s.next_of_kin_name) missing.push('Next of Kin Name');
        if (!s.next_of_kin_phone) missing.push('Next of Kin Phone');
        
        return {
          id: s.id,
          name: s.name,
          role: s.role,
          site: s.site,
          status: s.status,
          missingCount: missing.length,
          missingFields: missing.join(', ') || 'None (Complete)'
        };
      });

      console.table(missingAudit);

      const staffWithMissing = missingAudit.filter(s => s.missingCount > 0);
      console.log(`\n⚠️ STAFF MEMBERS WITH MISSING INFORMATION (${staffWithMissing.length}):`);
      console.log(JSON.stringify(staffWithMissing, null, 2));

      await pool.end();
      return;
    } catch (e) {
      console.log('Direct DB connection skipped:', e.message);
    }
  }

  // Fallback scan summary
  console.log('Staff members registered with working phone PINs:');
  console.table(registeredWithPhone);
}

runAudit();
