import { staff, shifts, leaveBalances, leaveRequests } from '../schema.js';
import { ilike, or, and, gte, lte, sql, eq } from 'drizzle-orm';

export interface GlobalSearchQueryParsed {
  rawQuery: string;
  cleanText: string;
  dateRange: { start: string; end: string } | null;
  dateLabel: string;
}

export interface StaffSearchResult {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  role: string;
  site: string;
  status: string;
  startDate: string | null;
  createdAt: Date;
  rates: string;
  link: string;
}

export interface LeaveSearchResult {
  id: string;
  staffId: string;
  staffName: string;
  category: 'balance' | 'request';
  startDate?: string;
  endDate?: string;
  totalDays?: number;
  totalHours?: number;
  hoursRemaining?: number;
  hoursAccrued?: number;
  totalEntitlement?: number;
  reason?: string | null;
  status?: string;
  link: string;
}

export interface ShiftSearchResult {
  id: string;
  staffId: string;
  staffName: string;
  siteId: string;
  siteName: string;
  date: string;
  type: string;
  startTime: string;
  endTime: string;
  duration: number;
  clockedIn: boolean | null;
  clockedOut: boolean | null;
  staffStatus: string | null;
  isBank: boolean | null;
  link: string;
}

export interface AttendanceSearchResult {
  id: string;
  shiftId: string;
  staffId: string;
  staffName: string;
  siteName: string;
  date: string;
  type: string;
  issue: 'absent' | 'late' | 'missing_clock_out';
  clockInTime: Date | null;
  clockOutTime: Date | null;
  startTime: string;
  endTime: string;
  details: string;
  link: string;
}

export interface GlobalSearchResults {
  query: string;
  parsed: GlobalSearchQueryParsed;
  counts: {
    staff: number;
    leave: number;
    shifts: number;
    attendance: number;
  };
  results: {
    staff: StaffSearchResult[];
    leave: LeaveSearchResult[];
    shifts: ShiftSearchResult[];
    attendance: AttendanceSearchResult[];
  };
}

export function formatDateLocal(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseGlobalSearchQuery(rawQuery: string, now: Date = new Date()): GlobalSearchQueryParsed {
  const query = (rawQuery || '').trim().toLowerCase();
  let dateRange: { start: string; end: string } | null = null;
  let dateLabel = '';

  const todayStr = formatDateLocal(now);

  if (query.includes('yesterday')) {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const dateStr = formatDateLocal(y);
    dateRange = { start: dateStr, end: dateStr };
    dateLabel = 'yesterday';
  } else if (query.includes('today')) {
    dateRange = { start: todayStr, end: todayStr };
    dateLabel = 'today';
  } else if (query.includes('last week')) {
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    dateRange = { start: formatDateLocal(start), end: formatDateLocal(end) };
    dateLabel = 'last week';
  } else if (query.includes('next week')) {
    const start = new Date(now);
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    dateRange = { start: formatDateLocal(start), end: formatDateLocal(end) };
    dateLabel = 'next week';
  } else if (query.includes('this week')) {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    dateRange = { start: formatDateLocal(start), end: todayStr };
    dateLabel = 'this week';
  } else if (query.includes('this month')) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    dateRange = { start: formatDateLocal(start), end: todayStr };
    dateLabel = 'this month';
  } else if (query.includes('last month')) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    dateRange = { start: formatDateLocal(start), end: formatDateLocal(end) };
    dateLabel = 'last month';
  }

  const cleanText = query
    .replace(/\b(yesterday|today|last week|next week|this week|this month|last month)\b/gi, '')
    .trim();

  return { rawQuery, cleanText, dateRange, dateLabel };
}

export async function executeGlobalSearch(database: any, rawQuery: string, now: Date = new Date()): Promise<GlobalSearchResults> {
  const parsed = parseGlobalSearchQuery(rawQuery, now);
  const qLower = parsed.rawQuery.toLowerCase();
  const cleanLower = parsed.cleanText.toLowerCase();

  const todayStr = now.toISOString().split('T')[0];

  // Detect query intents
  const isStaffIntent = /\b(staff|worker|workers|admin|new|newly|active|inactive|director|manager)\b/i.test(qLower) || !qLower;
  const isLeaveIntent = /\b(leave|holiday|vacation|balance|available|approved|pending|rejected|accrued|entitlement)\b/i.test(qLower);
  const isShiftIntent = /\b(shift|shifts|missed|unfilled|bank|unconfirmed|unscheduled|completed|day|night|thamesmead|kent|site)\b/i.test(qLower);
  const isAttendanceIntent = /\b(attendance|absent|late|clock|clockin|clockout|punch|punches|missing)\b/i.test(qLower);

  const searchAll = !isStaffIntent && !isLeaveIntent && !isShiftIntent && !isAttendanceIntent;

  // 1. Staff Search
  let staffResults: StaffSearchResult[] = [];
  if (searchAll || isStaffIntent || cleanLower.length > 0) {
    const allStaff = await database.select().from(staff);
    
    // Filter staff
    const filteredStaff = allStaff.filter((s: any) => {
      if (cleanLower) {
        // Exclude generic intent words when matching name/username/site/role
        const tokens = cleanLower.split(/\s+/).filter(t => !['staff', 'worker', 'workers', 'active', 'inactive', 'at', 'in', 'available', 'leave', 'shift', 'shifts', 'absent', 'new', 'newly'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${s.name || ''} ${s.username || ''} ${s.email || ''} ${s.role || ''} ${s.site || ''} ${s.status || ''}`.toLowerCase();
          const matchesToken = tokens.some(t => matchText.includes(t));
          if (!matchesToken) return false;
        }
      }

      if (qLower.includes('active') && s.status !== 'Active') return false;
      if (qLower.includes('inactive') && s.status !== 'Inactive') return false;
      if (qLower.includes('worker') && s.role !== 'Worker') return false;

      // Filter by new staff if requested
      if (qLower.includes('new') || parsed.dateLabel === 'this month') {
        const created = new Date(s.createdAt || s.startDate || 0);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (created < thisMonthStart) return false;
      }

      return true;
    });

    staffResults = filteredStaff.slice(0, 20).map((s: any) => ({
      id: s.id,
      name: s.name,
      username: s.username || null,
      email: s.email || null,
      role: s.role,
      site: s.site,
      status: s.status,
      startDate: s.startDate || null,
      createdAt: s.createdAt,
      rates: s.rates || '£12.50/hr',
      link: '/admin/directory'
    }));
  }

  // 2. Leave Search
  let leaveResults: LeaveSearchResult[] = [];
  if (searchAll || isLeaveIntent || cleanLower.length > 0) {
    // Leave balances
    const allBalances = await database.select().from(leaveBalances);
    const allRequests = await database.select().from(leaveRequests);

    const filteredBalances = allBalances.filter((b: any) => {
      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['leave', 'available', 'balance', 'vacation', 'holiday'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${b.staffName || ''} ${b.staffId || ''}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }
      return true;
    });

    for (const b of filteredBalances.slice(0, 10)) {
      leaveResults.push({
        id: b.id,
        staffId: b.staffId,
        staffName: b.staffName,
        category: 'balance',
        hoursRemaining: b.hoursRemaining,
        hoursAccrued: b.hoursAccrued,
        totalEntitlement: b.totalEntitlement,
        link: '/admin/annual-leave'
      });
    }

    const filteredRequests = allRequests.filter((r: any) => {
      if (qLower.includes('approved') && r.status !== 'approved') return false;
      if (qLower.includes('pending') && r.status !== 'pending') return false;
      if (qLower.includes('rejected') && r.status !== 'rejected') return false;

      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['leave', 'approved', 'pending', 'rejected', 'request', 'requests'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${r.staffName || ''} ${r.reason || ''} ${r.leaveType || ''}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }

      if (parsed.dateRange) {
        if (r.startDate < parsed.dateRange.start || r.startDate > parsed.dateRange.end) {
          return false;
        }
      }

      return true;
    });

    for (const r of filteredRequests.slice(0, 10)) {
      leaveResults.push({
        id: r.id,
        staffId: r.staffId,
        staffName: r.staffName,
        category: 'request',
        startDate: r.startDate,
        endDate: r.endDate,
        totalDays: r.totalDays,
        totalHours: r.totalHours,
        reason: r.reason,
        status: r.status,
        link: '/admin/annual-leave'
      });
    }
  }

  // 3. Shifts Search
  let shiftResults: ShiftSearchResult[] = [];
  if (searchAll || isShiftIntent || cleanLower.length > 0) {
    const allShifts = await database.select().from(shifts);

    const filteredShifts = allShifts.filter((s: any) => {
      if (qLower.includes('missed') && s.clockedIn) return false;
      if ((qLower.includes('unfilled') || qLower.includes('bank')) && !s.isBank && !s.staffName.toLowerCase().includes('bank')) return false;
      if (qLower.includes('unconfirmed') && s.staffStatus !== 'pending') return false;
      if (qLower.includes('completed') && (!s.clockedIn || !s.clockedOut)) return false;

      if (parsed.dateRange) {
        if (s.date < parsed.dateRange.start || s.date > parsed.dateRange.end) return false;
      }

      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['shift', 'shifts', 'missed', 'unfilled', 'unconfirmed', 'completed', 'bank', 'at', 'in', 'for'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${s.staffName || ''} ${s.siteName || ''} ${s.type || ''} ${s.date || ''}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }

      return true;
    });

    shiftResults = filteredShifts.slice(0, 20).map((s: any) => ({
      id: s.id,
      staffId: s.staffId,
      staffName: s.staffName,
      siteId: s.siteId,
      siteName: s.siteName,
      date: s.date,
      type: s.type,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration,
      clockedIn: s.clockedIn,
      clockedOut: s.clockedOut,
      staffStatus: s.staffStatus,
      isBank: s.isBank,
      link: '/admin/rota'
    }));
  }

  // 4. Attendance Search
  let attendanceResults: AttendanceSearchResult[] = [];
  if (searchAll || isAttendanceIntent || qLower.includes('absent') || qLower.includes('late') || qLower.includes('missing')) {
    const allShifts = await database.select().from(shifts);

    const filteredAttendance = allShifts.filter((s: any) => {
      let isAbsent = !s.clockedIn && s.date <= todayStr && s.staffStatus !== 'declined';
      let isLate = s.clockedIn && s.clockInTime && new Date(s.clockInTime).toISOString().split('T')[1]?.slice(0,5) > s.startTime;
      let isMissingClockOut = s.clockedIn && !s.clockedOut && s.date <= todayStr;

      if (qLower.includes('absent') && !isAbsent) return false;
      if (qLower.includes('late') && !isLate) return false;
      if ((qLower.includes('missing') || qLower.includes('missing clock-outs')) && !isMissingClockOut) return false;

      if (!qLower.includes('absent') && !qLower.includes('late') && !qLower.includes('missing') && !isAbsent && !isLate && !isMissingClockOut) {
        return false;
      }

      if (parsed.dateRange) {
        if (s.date < parsed.dateRange.start || s.date > parsed.dateRange.end) return false;
      }

      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['attendance', 'absent', 'late', 'missing', 'clock-ins', 'clock-outs', 'staff', 'at', 'in'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${s.staffName || ''} ${s.siteName || ''} ${s.date || ''}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }

      return true;
    });

    attendanceResults = filteredAttendance.slice(0, 20).map((s: any) => {
      let issue: 'absent' | 'late' | 'missing_clock_out' = 'absent';
      let details = 'Staff member did not clock in for scheduled shift';

      if (s.clockedIn && !s.clockedOut && s.date <= todayStr) {
        issue = 'missing_clock_out';
        details = 'Clocked in but missing clock-out record';
      } else if (s.clockedIn && s.clockInTime && new Date(s.clockInTime).toISOString().split('T')[1]?.slice(0,5) > s.startTime) {
        issue = 'late';
        details = `Late clock-in recorded at ${new Date(s.clockInTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
      }

      return {
        id: `att_${s.id}`,
        shiftId: s.id,
        staffId: s.staffId,
        staffName: s.staffName,
        siteName: s.siteName,
        date: s.date,
        type: s.type,
        issue,
        clockInTime: s.clockInTime || null,
        clockOutTime: s.clockOutTime || null,
        startTime: s.startTime,
        endTime: s.endTime,
        details,
        link: '/admin/attendance'
      };
    });
  }

  return {
    query: rawQuery,
    parsed,
    counts: {
      staff: staffResults.length,
      leave: leaveResults.length,
      shifts: shiftResults.length,
      attendance: attendanceResults.length
    },
    results: {
      staff: staffResults,
      leave: leaveResults,
      shifts: shiftResults,
      attendance: attendanceResults
    }
  };
}
