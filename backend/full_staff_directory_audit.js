const API_URL = 'https://social-care-backend.onrender.com';

async function fetchFullAudit() {
  console.log('=== COMPLETE DIRECTORY AUDIT OF ALL STAFF PROFILES ===\n');

  // Step 1: Collect staff IDs from phone lookup scan and shifts
  const staffIds = new Set();

  // Scan keypad digits
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
            return data.id;
          }
          return null;
        }).catch(() => null)
      );
    }
    const results = await Promise.all(promises);
    results.filter(Boolean).forEach(id => staffIds.add(id));
  }

  // Also add known staff IDs (from previous queries / rotas)
  const knownIds = [
    'd61a205b-2663-427e-b98d-2c583d3df834', // Melissa Blake
    'a2a67ff5-ea5b-4bc7-a7ba-19690e76d4e3', // Singita Zoe
    '12412909-a247-4949-a7d2-44d4292be7bd', // Narfisa Posey
    'ca810b80-259c-4f07-b70b-7300b1087484', // Irina Mitrovici
    '9b7f1e9c-7d55-4466-9960-9e6a7706abfb', // Alison Cooper
    'e99f9d49-603c-4e3f-9b23-7764f9c683dc', // Lauren Alecia
    'ce7abd5a-bae7-4885-bf44-9e215bd4088d', // Ghazal Mayahi
    '80c56aa7-b015-4822-a37b-b4b53dccd29c', // Kaitlyn Grant
    'cc560b06-f881-4d38-81d0-42e0ffc53ba8', // Evander Fisher
    '87b7145d-c70a-4e32-80d5-f0d0e2d656da'  // Prudence Diedericks
  ];
  knownIds.forEach(id => staffIds.add(id));

  // Step 2: For each staff ID, call `/api/auth/staff/qr-login` to get their full profile details
  const fullProfiles = [];
  for (const id of staffIds) {
    try {
      const res = await fetch(`${API_URL}/api/auth/staff/qr-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          fullProfiles.push(data.user);
        }
      }
    } catch (e) {}
  }

  console.log(`Successfully retrieved ${fullProfiles.length} full staff profiles:\n`);

  const auditReport = fullProfiles.map(s => {
    const present = [];
    const missing = [];

    if (s.name) present.push('Name'); else missing.push('Name');
    if (s.username) present.push('Username'); else missing.push('Username');
    if (s.role) present.push('Role'); else missing.push('Role');
    if (s.site) present.push('Site'); else missing.push('Site');
    if (s.status) present.push('Status'); else missing.push('Status');
    if (s.startDate && s.startDate !== 'Not Set') present.push(`Start Date (${s.startDate})`); else missing.push('Start Date');
    if (s.phone && String(s.phone).trim()) present.push(`Phone (${s.phone})`); else missing.push('Phone Number (Kiosk PIN)');
    if (s.email && String(s.email).trim()) present.push(`Email (${s.email})`); else missing.push('Email Address');
    if (s.nextOfKinName && String(s.nextOfKinName).trim()) present.push('Next of Kin Name'); else missing.push('Next of Kin Name');
    if (s.nextOfKinPhone && String(s.nextOfKinPhone).trim()) present.push('Next of Kin Phone'); else missing.push('Next of Kin Phone');

    return {
      name: s.name || s.username || 'Unknown',
      role: s.role || 'N/A',
      site: s.site || 'N/A',
      status: s.status || 'Active',
      phone: s.phone || '❌ MISSING',
      email: s.email || '❌ MISSING',
      startDate: s.startDate || '❌ MISSING',
      nextOfKin: (s.nextOfKinName ? `${s.nextOfKinName} (${s.nextOfKinPhone || 'No Phone'})` : '❌ MISSING'),
      missingFields: missing.length > 0 ? missing.join(', ') : '✅ Profile Complete'
    };
  });

  console.table(auditReport);
  console.log('\n--- DETAILED AUDIT REPORT JSON ---');
  console.log(JSON.stringify(auditReport, null, 2));
}

fetchFullAudit();
