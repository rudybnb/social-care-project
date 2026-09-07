import { db } from './src/db.js';
import { staff } from './src/schema.js';

async function auditAllStaffProfiles() {
  console.log('=== COMPLETE STAFF PROFILE AUDIT ===\n');

  if (!db) {
    console.error('Database connection not available.');
    process.exit(1);
  }

  try {
    const allStaff = await db.select().from(staff);
    console.log(`Total Staff Profiles in Database: ${allStaff.length}\n`);

    const auditReport = allStaff.map((s: any) => {
      const present: string[] = [];
      const missing: string[] = [];

      // Check fields
      if (s.name) present.push('Name'); else missing.push('Name');
      if (s.username) present.push('Username'); else missing.push('Username');
      if (s.role) present.push('Role'); else missing.push('Role');
      if (s.site) present.push('Site'); else missing.push('Site');
      if (s.status) present.push('Status'); else missing.push('Status');
      if (s.startDate) present.push('Start Date'); else missing.push('Start Date');
      if (s.phone && String(s.phone).trim()) present.push(`Phone (${s.phone})`); else missing.push('Phone Number (Kiosk PIN)');
      if (s.email && String(s.email).trim()) present.push(`Email (${s.email})`); else missing.push('Email Address');
      if (s.hourlyRate || s.standardRate) present.push('Hourly Rate'); else missing.push('Hourly Rate');
      if (s.nextOfKinName && String(s.nextOfKinName).trim()) present.push('Next of Kin Name'); else missing.push('Next of Kin Name');
      if (s.nextOfKinPhone && String(s.nextOfKinPhone).trim()) present.push('Next of Kin Phone'); else missing.push('Next of Kin Phone');

      return {
        name: s.name || s.username || 'Unknown',
        role: s.role || 'N/A',
        site: s.site || 'N/A',
        status: s.status || 'N/A',
        startDate: s.startDate || 'Missing',
        phone: s.phone || '❌ MISSING',
        email: s.email || '❌ MISSING',
        detailsPresent: present.join(', '),
        missingFields: missing.length > 0 ? missing.join(', ') : '✅ Profile Complete'
      };
    });

    console.log(JSON.stringify(auditReport, null, 2));

  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    process.exit(0);
  }
}

auditAllStaffProfiles();
