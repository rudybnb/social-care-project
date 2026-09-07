const API_URL = 'https://social-care-backend.onrender.com';

async function checkMelissaShiftsDetailed() {
  console.log('=== CHECKING DETAILED SHIFTS FOR MELISSA BLAKE ===');
  
  // 1. Lookup Melissa's ID
  const lookupRes = await fetch(`${API_URL}/api/staff/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneDigits: '6789' })
  });

  if (!lookupRes.ok) {
    console.error('Failed to lookup Melissa 6789:', lookupRes.status);
    return;
  }

  const staffData = await lookupRes.json();
  console.log('Staff found:', staffData);

  // 2. Fetch shifts
  const shiftsRes = await fetch(`${API_URL}/api/staff/${staffData.id}/shifts`);
  const shifts = await shiftsRes.json();
  console.log('\n--- ALL SHIFTS FOR MELISSA BLAKE ---');
  console.log(JSON.stringify(shifts, null, 2));

  // 3. Fetch sites
  const sitesRes = await fetch(`${API_URL}/api/sites`);
  if (sitesRes.ok) {
    const sites = await sitesRes.json();
    console.log('\n--- ALL SITES ---');
    console.log(JSON.stringify(sites, null, 2));
  } else {
    console.log('\nFailed to fetch sites (might require auth):', sitesRes.status);
  }
}

checkMelissaShiftsDetailed();
