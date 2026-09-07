const API_URL = 'https://social-care-backend.onrender.com';

async function runPurge() {
  console.log('=== EXECUTING RAW SQL TEST STAFF PURGE ===');
  try {
    const res = await fetch(`${API_URL}/api/purge-test-staff`);
    console.log('Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Purge Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('Error:', await res.text());
    }
  } catch (e) {
    console.error('Purge Error:', e.message);
  }
}

runPurge();
