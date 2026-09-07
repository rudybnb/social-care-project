const API_URL = 'https://social-care-backend.onrender.com';

async function checkAuditLogs() {
  console.log('=== CHECKING AUDIT LOGS FOR MELISSA BLAKE ===');
  
  const melissaId = 'd61a205b-2663-427e-b98d-2c583d3df834';
  
  // Try fetching audit logs endpoint or health endpoint if accessible
  try {
    const res = await fetch(`${API_URL}/api/admin/audit-logs?staffId=${melissaId}`);
    console.log('Audit logs HTTP status:', res.status);
    if (res.ok) {
      console.log(await res.json());
    } else {
      console.log('Body:', await res.text());
    }
  } catch (e) {
    console.error('Error fetching audit logs:', e);
  }
}

checkAuditLogs();
