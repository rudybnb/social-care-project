import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { parseGlobalSearchQuery, executeGlobalSearch } from '../services/globalSearchService.js';
import { createAuthRouter } from '../routes/auth.js';
import adminRoutes from '../routes/admin.js';
import { staff, shifts, leaveBalances, leaveRequests } from '../schema.js';

class FakeDb {
  public staffRows: any[] = [];
  public leaveBalanceRows: any[] = [];
  public leaveRequestRows: any[] = [];
  public shiftRows: any[] = [];
  public sessionRows: any[] = [];

  constructor() {
    // Populate realistic test data (no passwords/secrets in output)
    this.staffRows = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Lauren Alecia',
        username: 'lauren',
        email: 'lauren@care.com',
        role: 'Worker',
        site: 'Thamesmead Care Home',
        status: 'Active',
        rates: '£12.50/hr',
        startDate: '2026-08-01',
        createdAt: new Date('2026-08-01T10:00:00Z'),
        password: '$2b$10$hashedpasswordsecret123'
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Rudy Diedericks',
        username: 'rudy',
        email: 'rudy@care.com',
        role: 'Admin',
        site: 'All Sites',
        status: 'Active',
        rates: '£15.00/hr',
        startDate: '2026-01-10',
        createdAt: new Date('2026-01-10T10:00:00Z'),
        password: '$2b$10$hashedpasswordsecret123'
      }
    ];

    this.leaveBalanceRows = [
      {
        id: 'bal-1',
        staffId: '11111111-1111-1111-1111-111111111111',
        staffName: 'Lauren Alecia',
        totalEntitlement: 224,
        hoursAccrued: 80,
        hoursUsed: 16,
        hoursRemaining: 64,
        year: 2026
      }
    ];

    this.leaveRequestRows = [
      {
        id: 'req-1',
        staffId: '11111111-1111-1111-1111-111111111111',
        staffName: 'Lauren Alecia',
        startDate: '2026-08-10',
        endDate: '2026-08-12',
        totalDays: 3,
        totalHours: 24,
        reason: 'Family holiday',
        leaveType: 'annual',
        status: 'approved'
      }
    ];

    const todayStr = '2026-08-02';
    const yesterdayStr = '2026-08-01';

    this.shiftRows = [
      {
        id: 'shift-missed-1',
        staffId: '11111111-1111-1111-1111-111111111111',
        staffName: 'Lauren Alecia',
        siteId: 'SITE_001',
        siteName: 'Thamesmead Care Home',
        date: yesterdayStr,
        type: 'Day',
        startTime: '08:00',
        endTime: '20:00',
        duration: 12,
        clockedIn: false,
        clockedOut: false,
        staffStatus: 'accepted',
        isBank: false
      },
      {
        id: 'shift-unfilled-1',
        staffId: 'bank-placeholder',
        staffName: 'Bank Worker',
        siteId: 'SITE_001',
        siteName: 'Thamesmead Care Home',
        date: '2026-08-05',
        type: 'Night',
        startTime: '20:00',
        endTime: '08:00',
        duration: 12,
        clockedIn: false,
        clockedOut: false,
        staffStatus: 'pending',
        isBank: true
      }
    ];
  }

  select() {
    const db = this;
    return {
      from(table: any) {
        if (table === staff || table?.name === 'staff' || table?.[Symbol.for('drizzle:Name')] === 'staff') return Promise.resolve(db.staffRows);
        if (table === leaveBalances || table?.name === 'leave_balances' || table?.[Symbol.for('drizzle:Name')] === 'leave_balances') return Promise.resolve(db.leaveBalanceRows);
        if (table === leaveRequests || table?.name === 'leave_requests' || table?.[Symbol.for('drizzle:Name')] === 'leave_requests') return Promise.resolve(db.leaveRequestRows);
        if (table === shifts || table?.name === 'shifts' || table?.[Symbol.for('drizzle:Name')] === 'shifts') return Promise.resolve(db.shiftRows);
        return Promise.resolve([]);
      }
    };
  }
}

// 1. Unit Test for Query Parser
test('Global Search Parser: correctly parses relative date terms and keywords', () => {
  const fixedNow = new Date('2026-08-02T12:00:00Z');

  const p1 = parseGlobalSearchQuery('staff absent last week', fixedNow);
  assert.equal(p1.dateLabel, 'last week');
  assert.ok(p1.dateRange);

  const p2 = parseGlobalSearchQuery('missed shifts yesterday', fixedNow);
  assert.equal(p2.dateLabel, 'yesterday');
  assert.equal(p2.dateRange?.start, '2026-08-01');

  const p3 = parseGlobalSearchQuery('new staff this month', fixedNow);
  assert.equal(p3.dateLabel, 'this month');
  assert.equal(p3.dateRange?.start, '2026-08-01');

  const p4 = parseGlobalSearchQuery('Lauren leave available', fixedNow);
  assert.equal(p4.cleanText, 'lauren leave available');
});

// 2. Unit Test for Search Execution & Safe Output
test('Global Search Engine: Groups results into 4 categories and excludes sensitive fields', async () => {
  const fakeDb = new FakeDb();
  const fixedNow = new Date('2026-08-02T12:00:00Z');

  const res = await executeGlobalSearch(fakeDb, 'Lauren leave available', fixedNow);

  assert.ok(res.results.staff);
  assert.ok(res.results.leave);
  assert.ok(res.results.shifts);
  assert.ok(res.results.attendance);

  // Check safety: password and secrets must NOT exist in output JSON
  const jsonStr = JSON.stringify(res);
  assert.ok(!jsonStr.includes('hashedpasswordsecret123'), 'Secrets/passwords must never be in search results');
  assert.ok(!jsonStr.includes('password'), 'Password keys must not exist in safe staff search payload');
});

// 3. Search Intent Tests
test('Global Search Engine: Handles specific search query intents', async () => {
  const fakeDb = new FakeDb();
  const fixedNow = new Date('2026-08-02T12:00:00Z');

  // Query 1: staff absent last week
  const q1 = await executeGlobalSearch(fakeDb, 'staff absent last week', fixedNow);
  assert.ok(q1.counts.attendance >= 0);

  // Query 2: missed shifts yesterday
  const q2 = await executeGlobalSearch(fakeDb, 'missed shifts yesterday', fixedNow);
  assert.ok(q2.results.shifts.some(s => s.id === 'shift-missed-1'));

  // Query 3: new staff this month
  const q3 = await executeGlobalSearch(fakeDb, 'new staff this month', fixedNow);
  assert.ok(q3.results.staff.some(s => s.name === 'Lauren Alecia'));

  // Query 4: unfilled shifts next week
  const q4 = await executeGlobalSearch(fakeDb, 'unfilled shifts next week', fixedNow);
  assert.ok(q4.results.shifts.some(s => s.isBank === true));

  // Query 5: active workers at Thamesmead
  const q5 = await executeGlobalSearch(fakeDb, 'active workers at Thamesmead', fixedNow);
  assert.ok(q5.results.staff.some(s => s.site.includes('Thamesmead')));
});
