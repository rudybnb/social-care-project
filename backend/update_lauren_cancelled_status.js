const API_URL = 'https://social-care-backend.onrender.com';

async function run() {
  try {
    const staffId = 'e99f9d49-603c-4e3f-9b23-7764f9c683dc';
    const staffName = 'Lauren Alecia';

    console.log('Inserting/updating 3 Aug - 14 Aug request as CANCELLED...');
    
    // Check if d3c47f7f exists
    const res = await fetch(`${API_URL}/api/leave/requests/${staffId}`);
    const requests = await res.json();
    console.log('Current Requests count:', requests.length);

    let target = requests.find(r => r.startDate === '2026-08-03' && r.endDate === '2026-08-14' && r.totalHours === 48);

    if (!target) {
      console.log('Creating 3 Aug - 14 Aug (48h) request...');
      const createRes = await fetch(`${API_URL}/api/leave/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          staffName,
          startDate: '2026-08-03',
          endDate: '2026-08-14',
          totalDays: 6,
          totalHours: 48,
          reason: 'Annual Leave',
          leaveType: 'annual'
        })
      });
      target = await createRes.json();
      console.log('Created request:', target.id);
    }

    // Call DELETE endpoint which now sets status to 'cancelled' and refunds hours
    console.log(`Calling delete/cancel endpoint for request ${target.id}...`);
    const cancelRes = await fetch(`${API_URL}/api/leave/requests/${target.id}`, {
      method: 'DELETE'
    });
    console.log('Cancel response status:', cancelRes.status);
    const cancelData = await cancelRes.json();
    console.log('Cancel result:', cancelData);

    console.log('\n--- VERIFYING LAUREN LEAVE HISTORY ---');
    const finalRes = await fetch(`${API_URL}/api/leave/requests/${staffId}`);
    const finalRequests = await finalRes.json();
    finalRequests.forEach((r, i) => {
      console.log(`${i + 1}. ID: ${r.id} | ${r.startDate} to ${r.endDate} | Status: ${r.status} | ${r.totalDays}d / ${r.totalHours}h`);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
