const API_URL = 'https://social-care-backend.onrender.com';

async function fetchFullStaffAudit() {
  console.log('=== AUDITING ALL STAFF PROFILES VIA ADMIN API ===\n');

  // 1. Try logging in as admin
  let token = null;
  const loginRes = await fetch(`${API_URL}/api/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Admin123Password' })
  });

  if (loginRes.ok) {
    const data = await loginRes.json();
    token = data.token;
    console.log('✅ Admin Auth Successful!');
  } else {
    console.log('Admin Auth Failed:', loginRes.status, await loginRes.text());
  }

  // 2. Fetch staff list using token if available
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const staffRes = await fetch(`${API_URL}/api/staff`, { headers });

  if (staffRes.ok) {
    const allStaff = await staffRes.json();
    console.log(`\nFound ${allStaff.length} TOTAL staff profiles in database:\n`);

    const fullAudit = allStaff.map((s) => {
      const present = [];
      const missing = [];

      if (s.name) present.push('Name'); else missing.push('Name');
      if (s.username) present.push('Username'); else missing.push('Username');
      if (s.role) present.push('Role'); else missing.push('Role');
      if (s.site) present.push('Site'); else missing.push('Site');
      if (s.status) present.push('Status'); else missing.push('Status');
      if (s.startDate && s.startDate !== 'Not Set') present.push(`Start Date (${s.startDate})`); else missing.push('Start Date');
      if (s.phone && String(s.phone).trim()) present.push(`Phone (${s.phone})`); else missing.push('Phone Number (Kiosk PIN)');
      if (s.email && String(s.email).trim()) present.push(`Email (${s.email})`); else missing.push('Email');
      if (s.hourlyRate) present.push('Hourly Rate'); else missing.push('Hourly Rate');
      if (s.nextOfKinName && String(s.nextOfKinName).trim()) present.push('Next of Kin Name'); else missing.push('Next of Kin Name');
      if (s.nextOfKinPhone && String(s.nextOfKinPhone).trim()) present.push('Next of Kin Phone'); else missing.push('Next of Kin Phone');

      return {
        id: s.id,
        name: s.name || s.username || 'Unknown',
        role: s.role || 'N/A',
        site: s.site || 'N/A',
        status: s.status || 'Active',
        phone: s.phone || '❌ MISSING',
        email: s.email || '❌ MISSING',
        startDate: s.startDate || '❌ MISSING',
        missingFields: missing.length > 0 ? missing.join(', ') : '✅ Profile Complete'
      };
    });

    console.log(JSON.stringify(fullAudit, null, 2));

  } else {
    console.log('Failed to fetch /api/staff:', staffRes.status, await staffRes.text());
  }
}

fetchFullStaffAudit();
