const API_URL = 'https://social-care-backend.onrender.com';

async function auditDirectory() {
  console.log('=== AUDITING STAFF DIRECTORY FOR MISSING INFORMATION ===\n');

  // Step 1: Scan all 10,000 keypad digit combinations
  const foundMap = new Map();
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
        foundMap.set(r.data.id, { digits: r.digits, ...r.data });
      }
    }
  }

  const staffWithPhone = Array.from(foundMap.values());
  console.log(`Found ${staffWithPhone.length} staff members with configured phone numbers.\n`);

  console.log('--- STAFF WITH WORKING PHONE NUMBERS ---');
  console.table(staffWithPhone);
}

auditDirectory();
