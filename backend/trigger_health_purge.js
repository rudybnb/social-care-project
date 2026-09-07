const API_URL = 'https://social-care-backend.onrender.com';

async function runPurge() {
  console.log('=== TRIGGERING HEALTH PURGE ENDPOINT ===');
  try {
    const res = await fetch(`${API_URL}/api/health?purge=true`);
    console.log('Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Purge Result:', JSON.stringify(data, null, 2));
    } else {
      console.log('Error:', await res.text());
    }
  } catch (e) {
    console.error('Purge Error:', e.message);
  }
}

runPurge();
