const API_URL = 'https://social-care-backend.onrender.com';

async function checkAllStaff() {
  console.log('=== FETCHING ALL STAFF MEMBERS FROM DB ===');
  
  const res = await fetch(`${API_URL}/api/staff-start-dates`);
  if (res.ok) {
    const allStaff = await res.json();
    console.log(`Total staff in DB: ${allStaff.length}\n`);
    console.table(allStaff);

    const banke = allStaff.find(s => s.name && s.name.toLowerCase().includes('banke'));
    console.log('\n--- BANKE O IN DB ---');
    console.log(banke);
  } else {
    console.log('Error:', res.status, await res.text());
  }
}

checkAllStaff();
