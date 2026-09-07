const API_URL = 'https://social-care-backend.onrender.com';

async function runPurgeNow() {
  console.log('=== EXECUTING /api/purge-now ON LIVE DATABASE ===');
  try {
    const res = await fetch(`${API_URL}/api/purge-now`);
    console.log('Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Purge Now Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('Error text:', await res.text());
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

runPurgeNow();
