import { db } from './src/index.js';
import { shifts } from './src/schema.js';
import { eq } from 'drizzle-orm';

async function testDraftShiftVisibility() {
    console.log("1. Creating a draft shift directly via API...");
    // Mock user Admin User (ID 1), Site Thamesmead (SITE_001)
    const shiftData = {
        staffId: '1',
        staffName: 'Admin User',
        siteId: 'SITE_001',
        siteName: 'Thamesmead',
        siteColor: '#8b7ab8',
        date: '2030-01-01',
        type: 'Day',
        startTime: '07:00',
        endTime: '19:00',
        duration: 12,
        is24Hour: false,
        isBank: false,
        notes: 'TEST_DRAFT_SHIFT',
        staffStatus: 'pending',
        published: false
    };

    try {
        const createRes = await fetch('http://localhost:5000/api/shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(shiftData)
        });

        if (!createRes.ok) {
            console.error("Failed to create shift:", await createRes.text());
            process.exit(1);
        }

        const createdShift = await createRes.json();
        console.log(`✅ Created shift ID: ${createdShift.id}, published: ${createdShift.published}`);

        console.log("\n2. Fetching shifts for staff ID 1...");
        // This is the endpoint the staff app uses
        const fetchRes = await fetch(`http://localhost:5000/api/staff/1/shifts`);
        const staffShifts = await fetchRes.json();

        const foundDraft = staffShifts.find(s => s.notes === 'TEST_DRAFT_SHIFT');
        if (foundDraft) {
            console.error("❌ FAILED: The draft shift WAS returned in the staff's shift list!");
        } else {
            console.log("✅ PASSED: The draft shift was NOT returned to the staff.");
        }

        console.log("\n3. Cleaning up test shift...");
        await fetch(`http://localhost:5000/api/shifts/${createdShift.id}`, { method: 'DELETE' });
        console.log("✅ Cleanup complete.");
        process.exit(0);

    } catch (e) {
        console.error("Test error:", e);
        process.exit(1);
    }
}

testDraftShiftVisibility();
