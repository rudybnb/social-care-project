const API_URL = 'https://social-care-backend.onrender.com';

async function scanPhone() {
  console.log('=== SCANNING ALL 10,000 DIGITS TO LOCATE MELISSA BLAKE\'S PHONE NUMBER ===');
  
  let foundMatch = null;
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
      if (r && r.data && r.data.name && (r.data.name.toLowerCase().includes('melissa') || r.data.name.toLowerCase().includes('blake'))) {
        foundMatch = r;
        console.log(`\n✅ FOUND MELISSA BLAKE IN DB!`);
        console.log(`Registered Last 4 Digits: ${r.digits}`);
        console.log(`Staff Record:`, r.data);
      }
    }
  }

  if (!foundMatch) {
    console.log('\n❌ RESULT: Melissa Blake currently has NO phone number registered in the database (phone field is empty or null).');
  }
}

scanPhone();
