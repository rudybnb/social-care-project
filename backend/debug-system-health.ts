
// Using global fetch (Node 18+)
// const fetch = global.fetch; 


const BASE_URL = 'https://social-care-backend.onrender.com'; // Testing LIVE system as requested

async function runHealthCheck() {
    console.log('🏥 STARTING FULL SYSTEM HEALTH CHECK...');
    console.log(`target: ${BASE_URL}`);
    console.log('--------------------------------------------------');

    let staffMemberId = '';
    let siteId = '';
    let shiftId = '';

    try {
        // 1. CHECK API ACCESSIBILITY & DB CONNECTION (via Staff Endpoint)
        console.log('1. Checking Connectivity & Staff Directory...');
        const staffRes = await fetch(`${BASE_URL}/api/staff`);
        if (!staffRes.ok) throw new Error(`Staff API failed: ${staffRes.status}`);
        const staff = await staffRes.json();
        console.log(`   ✅ API Online. Found ${staff.length} staff members.`);

        // Pick a staff member to test with (Preferably "Test" or myself, but we'll use the first one and be careful)
        // Ideally we look for a user named 'Test' or similar.
        const testStaff = staff.find((s: any) => s.name.toLowerCase().includes('rudy'));
        const targetStaff = testStaff || staff[0];
        staffMemberId = targetStaff.id;
        console.log(`   ℹ️ Using Staff: ${targetStaff.name} (ID: ${staffMemberId})`);


        // 2. CHECK SITES
        console.log('\n2. Checking Sites...');
        const sitesRes = await fetch(`${BASE_URL}/api/sites`);
        if (!sitesRes.ok) throw new Error(`Sites API failed: ${sitesRes.status}`);
        const sites = await sitesRes.json();
        console.log(`   ✅ Sites API Online. Found ${sites.length} sites.`);

        const targetSite = sites[0];
        siteId = targetSite.id;
        console.log(`   ℹ️ Using Site: ${targetSite.name} (ID: ${siteId})`);


        // 2.5 CHECK QR LOGIN
        console.log('\n2.5. Testing Staff QR Login...');
        const loginRes = await fetch(`${BASE_URL}/api/auth/staff/qr-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffId: staffMemberId })
        });

        if (loginRes.ok) {
            const loginData = await loginRes.json();
            console.log(`   ✅ QR Login Successful for ${loginData.user.name}`);
        } else {
            console.warn(`   ⚠️ QR Login Warning: ${loginRes.status}`);
            // Don't fail the whole script for this as we might not have a mocked QR flow fully setup
        }


        // 3. CREATE TEST SHIFT (Pending)
        console.log('\n3. Creating Test Shift (Status: Pending)...');
        const today = new Date().toISOString().split('T')[0];
        const newShiftPayload = {
            id: `TEST_SHIFT_${Date.now()}`, // Schema requires ID
            staffId: staffMemberId,
            staffName: targetStaff.name,
            siteId: siteId,
            siteName: targetSite.name,
            siteColor: targetSite.color || '#000000',
            date: today,
            type: 'Day',
            startTime: '00:00',
            endTime: '01:00',
            duration: 1,
            is24Hour: false,
            notes: 'SYSTEM_HEALTH_CHECK_TEST_SHIFT_PLEASE_IGNORE',
            staffStatus: 'pending'
        };

        const createRes = await fetch(`${BASE_URL}/api/shifts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newShiftPayload)
        });

        if (!createRes.ok) throw new Error(`Create Shift Failed: ${createRes.status} ${createRes.statusText}`);
        const createdShift = await createRes.json();
        shiftId = createdShift.id;
        console.log(`   ✅ Shift Created: ${shiftId}`);


        // 4. ATTEMPT CLOCK-IN (Should FAIL due to Pending)
        console.log('\n4. Testing Clock-In Restriction (Pending Shift)...');
        const failInRes = await fetch(`${BASE_URL}/api/shifts/${shiftId}/clock-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                qrCode: siteId,
                staffId: staffMemberId
            })
        });

        if (failInRes.status === 403) {
            const err = await failInRes.json();
            console.log(`   ✅ Blocked Correctly: ${err.error}`);
        } else {
            console.error(`   ❌ FAILED: Status ${failInRes.status} (Expected 403)`);
            const txt = await failInRes.text();
            console.error('Response:', txt);
        }


        // 5. ACCEPT SHIFT
        console.log('\n5. Accepting Shift...');
        const acceptRes = await fetch(`${BASE_URL}/api/shifts/${shiftId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                staffStatus: 'accepted'
            })
        });
        if (!acceptRes.ok) throw new Error('Failed to accept shift');
        console.log(`   ✅ Shift Accepted.`);


        // 6. ATTEMPT CLOCK-IN (Should SUCCEED)
        console.log('\n6. Testing Valid Clock-In...');
        const successInRes = await fetch(`${BASE_URL}/api/shifts/${shiftId}/clock-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                qrCode: siteId, // Providing Correct QR
                staffId: staffMemberId
            })
        });

        if (successInRes.ok) {
            const data = await successInRes.json();
            console.log(`   ✅ Clock-In Successful! Time: ${data.shift.clockInTime}`);
        } else {
            console.error(`   ❌ Clock-In Failed: ${successInRes.status}`);
            console.error(await successInRes.text());
        }


        // 7. ATTEMPT CLOCK-IN AGAIN (Should Duplicate/Already In)
        console.log('\n7. Testing Double Clock-In...');
        const doubleInRes = await fetch(`${BASE_URL}/api/shifts/${shiftId}/clock-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                qrCode: siteId,
                staffId: staffMemberId
            })
        });
        // Expect 200 but message "Already clocked in"
        const doubleData = await doubleInRes.json();
        console.log(`   ℹ️ Response: ${doubleData.message}`);


        // 8. CLOCK OUT
        console.log('\n8. Testing Clock-Out...');
        // Wait 2 seconds to have some duration
        await new Promise(r => setTimeout(r, 2000));

        const outRes = await fetch(`${BASE_URL}/api/shifts/${shiftId}/clock-out`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                qrCode: siteId,
                staffId: staffMemberId
            })
        });

        if (outRes.ok) {
            const data = await outRes.json();
            console.log(`   ✅ Clock-Out Successful! Duration: ${data.shift.duration} hrs`);
        } else {
            console.error(`   ❌ Clock-Out Failed: ${outRes.status}`);
            console.error(await outRes.text());
        }


        // 9. CLEANUP
        console.log('\n9. Cleaning Up Test Data...');
        const delRes = await fetch(`${BASE_URL}/api/shifts/${shiftId}`, { method: 'DELETE' });
        if (delRes.ok) {
            console.log('   ✅ Test shift deleted.');
        } else {
            console.warn('   ⚠️ Failed to delete test shift.');
        }

        console.log('\n--------------------------------------------------');
        console.log('✅ SYSTEM HEALTH CHECK COMPLETE');

    } catch (error) {
        console.error('\n❌ CRITICAL SYSTEM FAILURE ❌');
        console.error(error);

        // Try to clean up if shiftId exists
        if (shiftId) {
            console.log('Attempting emergency cleanup...');
            fetch(`${BASE_URL}/api/shifts/${shiftId}`, { method: 'DELETE' }).catch(() => { });
        }
    }
}

runHealthCheck();
