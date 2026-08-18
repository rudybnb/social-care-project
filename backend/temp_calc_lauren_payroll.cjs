const http = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, dataRaw: data, error: e.message });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== GETTING ALL STAFF ===');
  const staffRes = await fetchJson('https://social-care-backend.onrender.com/api/staff');
  console.log('Staff keys:', Object.keys(staffRes.data));
  const staffArray = Array.isArray(staffRes.data) ? staffRes.data : (staffRes.data.staff || staffRes.data.rows || []);
  const lauren = staffArray.find(s => s.name?.toLowerCase().includes('lauren'));
  console.log('Lauren Staff record:', lauren);

  console.log('\n=== PAYROLL AUDIT (2026-07-14 TO 2026-08-14) ===');
  const auditRes = await fetchJson('https://social-care-backend.onrender.com/api/admin/audit-payroll?startDate=2026-07-14&endDate=2026-08-14');
  console.log('Audit status:', auditRes.status);
  if (auditRes.data) {
    if (auditRes.data.staffSummary) {
      const laurenSummary = auditRes.data.staffSummary.find(s => s.staffName?.toLowerCase().includes('lauren'));
      console.log('Lauren Audit Summary:', JSON.stringify(laurenSummary, null, 2));
    }
    if (auditRes.data.fullReport) {
      // Find Lauren section in fullReport
      const reportLines = auditRes.data.fullReport.split('\n');
      let printing = false;
      for (const line of reportLines) {
        if (line.includes('Lauren')) printing = true;
        else if (printing && line.startsWith('## ')) printing = false;
        if (printing) console.log(line);
      }
    }
  }
}

run().catch(console.error);
