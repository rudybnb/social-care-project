const API_URL = 'https://social-care-backend.onrender.com';

async function checkAugustShifts() {
  const melissaId = 'd61a205b-2663-427e-b98d-2c583d3df834';
  const shiftsRes = await fetch(`${API_URL}/api/staff/${melissaId}/shifts`);
  if (shiftsRes.ok) {
    const shifts = await shiftsRes.json();
    const augShifts = shifts.filter(s => s.date && s.date.startsWith('2026-08'));
    console.log(`--- MELISSA AUGUST 2026 SHIFTS (${augShifts.length}) ---`);
    console.log(JSON.stringify(augShifts, null, 2));
  }
}

checkAugustShifts();
