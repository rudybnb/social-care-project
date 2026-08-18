const API_URL = 'https://social-care-backend.onrender.com';

async function checkStartDates() {
  console.log('=== CHECKING STAFF START DATES ===');
  try {
    const res = await fetch(`${API_URL}/api/staff-start-dates`);
    if (res.ok) {
      const data = await res.json();
      console.log(`Total staff records: ${data.length}\n`);
      console.table(data);

      const missing = data.filter((s) => !s.startDate || s.startDate === 'Not Set' || s.startDate === '—' || s.startDate === '');
      console.log(`\nStaff with missing start dates (${missing.length}):`);
      console.table(missing);
    } else {
      console.log('Error status:', res.status);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

checkStartDates();
