const API_URL = 'https://social-care-backend.onrender.com';

async function checkDirect() {
  const melissaId = 'd61a205b-2663-427e-b98d-2c583d3df834';
  
  // 1. Fetch shifts directly for Melissa ID
  console.log(`Fetching shifts for staff ID: ${melissaId}`);
  const shiftsRes = await fetch(`${API_URL}/api/staff/${melissaId}/shifts`);
  console.log('Shifts HTTP Status:', shiftsRes.status);
  if (shiftsRes.ok) {
    const shifts = await shiftsRes.json();
    console.log('\n--- MELISSA SHIFTS ---');
    console.log(JSON.stringify(shifts, null, 2));
  } else {
    console.log('Shifts error body:', await shiftsRes.text());
  }

  // 2. Scan all 10,000 digits for Melissa to see what phone digits are registered for her
  console.log('\n--- SCANNING ALL 10,000 DIGITS FOR MELISSA ---');
  for (let i = 0; i <= 9999; i += 500) {
    const promises = [];
    for (let j = i; j < Math.min(i + 500, 10000); j++) {
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
      if (r && r.data && r.data.name && (r.data.name.toLowerCase().includes('melissa') || r.data.name.toLowerCase().includes('blake'))) {
        console.log('FOUND MELISSA VIA DIGITS:', r);
      }
    }
  }
}

checkDirect();
