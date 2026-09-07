const API_URL = 'https://social-care-backend.onrender.com';

async function checkStartDatesDirect() {
  console.log('=== CHECKING STAFF START DATES DIRECTLY ===');
  try {
    const res = await fetch(`${API_URL}/api/admin/audit-payroll?startDate=2024-01-01&endDate=2026-12-31&format=text`);
    if (res.ok) {
      const text = await res.text();
      // Match lines like: ## 👤 Name (id) or Start Date: ...
      const sections = text.split('## 👤 ');
      const results = [];
      for (const sec of sections) {
        if (!sec.trim()) continue;
        const nameLine = sec.split('\n')[0];
        const name = nameLine.split('(')[0].trim();
        const startDateMatch = sec.match(/Start Date:\s*([^\n]+)/);
        const startDate = startDateMatch ? startDateMatch[1].trim() : 'MISSING';
        results.push({ name, startDate });
      }
      console.table(results);

      const missing = results.filter(r => r.startDate === 'MISSING' || r.startDate === 'Not Set' || r.startDate === '—');
      console.log(`\nMissing / Unset Start Dates (${missing.length}):`);
      console.table(missing);
    } else {
      console.log('Error status:', res.status);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkStartDatesDirect();
