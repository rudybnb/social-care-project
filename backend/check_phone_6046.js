const API_URL = 'https://social-care-backend.onrender.com';

async function checkPhone6046() {
  console.log('=== CHECKING PHONE DIGITS 6046 ON PRODUCTION BACKEND ===');
  
  // 1. Lookup 6046
  const lookup6046 = await fetch(`${API_URL}/api/staff/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneDigits: '6046' })
  });

  console.log('Lookup 6046 HTTP status:', lookup6046.status);
  if (lookup6046.ok) {
    console.log('Lookup 6046 Result:', await lookup6046.json());
  } else {
    console.log('Lookup 6046 Error:', await lookup6046.text());
  }

  // 2. Lookup 6789
  const lookup6789 = await fetch(`${API_URL}/api/staff/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneDigits: '6789' })
  });

  console.log('\nLookup 6789 HTTP status:', lookup6789.status);
  if (lookup6789.ok) {
    console.log('Lookup 6789 Result:', await lookup6789.json());
  } else {
    console.log('Lookup 6789 Error:', await lookup6789.text());
  }
}

checkPhone6046();
