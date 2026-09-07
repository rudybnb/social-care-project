const API_URL = 'https://social-care-backend.onrender.com';

async function getAllStartDates() {
  console.log('=== SCANNING ALL STAFF MEMBERS IN DIRECTORY ===');

  // Step 1: Fast scan all 10,000 phone digit combinations to find all staff IDs and names
  const foundMap = new Map();
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
      if (r && r.data && r.data.id) {
        foundMap.set(r.data.id, { digits: r.digits, ...r.data });
      }
    }
  }

  const staffList = Array.from(foundMap.values());
  console.log(`Found ${staffList.length} staff profiles in directory via keypad search.\n`);

  // Step 2: For each staff member, fetch their shifts to extract staff start date or profile info
  const staffDetails = [];

  for (const s of staffList) {
    try {
      // Try to fetch staff shifts to get earliest shift date / start date context
      const res = await fetch(`${API_URL}/api/staff/${s.id}/shifts`);
      let earliestShiftDate = 'N/A';
      if (res.ok) {
        const shifts = await res.json();
        if (shifts.length > 0) {
          shifts.sort((a, b) => a.date.localeCompare(b.date));
          earliestShiftDate = shifts[0].date;
        }
      }
      staffDetails.push({
        id: s.id,
        name: s.name,
        phoneLast4: s.digits,
        earliestShiftDate
      });
    } catch (e) {
      staffDetails.push({
        id: s.id,
        name: s.name,
        phoneLast4: s.digits,
        earliestShiftDate: 'Unknown'
      });
    }
  }

  console.log('=== STAFF DIRECTORY LISTING ===');
  console.table(staffDetails);
  console.log(JSON.stringify(staffDetails, null, 2));
}

getAllStartDates();
