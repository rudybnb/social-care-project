import { staff, shifts, leaveBalances, leaveRequests } from '../schema.js';

export interface GlobalSearchQueryParsed {
  rawQuery: string;
  cleanText: string;
  dateRange: { start: string; end: string } | null;
  dateLabel: string;
}

export interface GlobalSearchOptions {
  q?: string;
  section?: string;
  site?: string;
  staffId?: string;
  staffName?: string;
  dateFilter?: string;
  startDate?: string;
  endDate?: string;
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

export async function executeGlobalSearch(
  database: any,
  queryOrOptions: string | GlobalSearchOptions,
  now: Date = new Date()
): Promise<GlobalSearchResults> {
  const options: GlobalSearchOptions = typeof queryOrOptions === 'string' ? { q: queryOrOptions } : (queryOrOptions || {});
  const rawQuery = options.q || '';
  const section = (options.section || 'all').toLowerCase();
  const siteFilter = (options.site && options.site !== 'all') ? options.site.toLowerCase() : null;
  const staffFilter = (options.staffId && options.staffId !== 'all') ? options.staffId.toLowerCase() :
                      (options.staffName && options.staffName !== 'all') ? options.staffName.toLowerCase() : null;
  const dateFilter = options.dateFilter || 'any';

  const parsed = parseGlobalSearchQuery(rawQuery, now);
  const qLower = parsed.rawQuery.toLowerCase();
  const cleanLower = parsed.cleanText.toLowerCase();

  const todayStr = formatDateLocal(now);

  // Compute explicit dateRange based on dateFilter option or parsed text
  let dateRange: { start: string; end: string } | null = null;
  if (dateFilter === 'today') {
    dateRange = { start: todayStr, end: todayStr };
  } else if (dateFilter === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yStr = formatDateLocal(y);
    dateRange = { start: yStr, end: yStr };
  } else if (dateFilter === 'this_week') {
    const start = new Date(now);
    start.setDate(start.getDate() - start.getDay());
    dateRange = { start: formatDateLocal(start), end: todayStr };
  } else if (dateFilter === 'last_week') {
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    dateRange = { start: formatDateLocal(start), end: formatDateLocal(end) };
  } else if (dateFilter === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    dateRange = { start: formatDateLocal(start), end: formatDateLocal(end) };
  } else if (dateFilter === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    dateRange = { start: formatDateLocal(start), end: formatDateLocal(end) };
  } else if (dateFilter === 'custom' && options.startDate && options.endDate) {
    dateRange = { start: options.startDate, end: options.endDate };
  } else if (parsed.dateRange) {
    dateRange = parsed.dateRange;
  }

  // Section intent checks
  const runStaff = section === 'all' || section === 'staff' || section === 'directory';
  const runLeave = section === 'all' || section === 'leave' || section === 'annual-leave';
  const runShifts = section === 'all' || section === 'shifts' || section === 'rota';
  const runAttendance = section === 'all' || section === 'attendance';

  // Retrieve all staff members for site/staff lookups
  const allStaff = await database.select().from(staff);

  // Map site staff if site filter is active
  let siteStaffIdSet: Set<string> | null = null;
  let siteStaffNameSet: Set<string> | null = null;
  if (siteFilter) {
    siteStaffIdSet = new Set(
      allStaff
        .filter((s: any) => (s.site || '').toLowerCase().includes(siteFilter) || String(s.siteId || '').toLowerCase() === siteFilter)
        .map((s: any) => String(s.id).toLowerCase())
    );
    siteStaffNameSet = new Set(
      allStaff
        .filter((s: any) => (s.site || '').toLowerCase().includes(siteFilter) || String(s.siteId || '').toLowerCase() === siteFilter)
        .map((s: any) => (s.name || '').toLowerCase())
    );
  }

  // 1. Staff Search
  let staffResults: StaffSearchResult[] = [];
  if (runStaff) {
    const filteredStaff = allStaff.filter((s: any) => {
      if (staffFilter) {
        const matchId = String(s.id).toLowerCase() === staffFilter;
        const matchName = (s.name || '').toLowerCase().includes(staffFilter);
        const matchUser = (s.username || '').toLowerCase() === staffFilter;
        if (!matchId && !matchName && !matchUser) return false;
      }

      if (siteFilter) {
        const staffSite = (s.site || '').toLowerCase();
        if (!staffSite.includes(siteFilter) && String(s.siteId || '').toLowerCase() !== siteFilter) {
          return false;
        }
      }

      if (cleanLower) {
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

      if (qLower.includes('new') || parsed.dateLabel === 'this month') {
        const created = new Date(s.createdAt || s.startDate || 0);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (created < thisMonthStart) return false;
      }

      return true;
    });

    const staffMap = new Map();
    for (const s of filteredStaff) {
      const key = s.name ? s.name.trim().toLowerCase() : String(s.id).toLowerCase();
      if (!staffMap.has(key)) {
        staffMap.set(key, s);
      }
    }
    const uniqueStaffList = Array.from(staffMap.values());

    staffResults = uniqueStaffList.slice(0, 50).map((s: any) => ({
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
  if (runLeave) {
    const allBalances = await database.select().from(leaveBalances);
    const allRequests = await database.select().from(leaveRequests);

    const filteredBalances = allBalances.filter((b: any) => {
      if (staffFilter) {
        const matchId = String(b.staffId).toLowerCase() === staffFilter;
        const matchName = (b.staffName || '').toLowerCase().includes(staffFilter);
        if (!matchId && !matchName) return false;
      }

      if (siteStaffIdSet && siteStaffNameSet) {
        const matchId = siteStaffIdSet.has(String(b.staffId).toLowerCase());
        const matchName = siteStaffNameSet.has((b.staffName || '').toLowerCase());
        if (!matchId && !matchName) return false;
      }

      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['leave', 'available', 'balance', 'vacation', 'holiday'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${b.staffName || ''} ${b.staffId || ''}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }
      return true;
    });

    for (const b of filteredBalances.slice(0, 30)) {
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
      if (staffFilter) {
        const matchId = String(r.staffId).toLowerCase() === staffFilter;
        const matchName = (r.staffName || '').toLowerCase().includes(staffFilter);
        if (!matchId && !matchName) return false;
      }

      if (siteStaffIdSet && siteStaffNameSet) {
        const matchId = siteStaffIdSet.has(String(r.staffId).toLowerCase());
        const matchName = siteStaffNameSet.has((r.staffName || '').toLowerCase());
        if (!matchId && !matchName) return false;
      }

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

      // Overlap Logic: Leave request overlaps dateRange if r.startDate <= dateRange.end AND r.endDate >= dateRange.start
      if (dateRange) {
        const reqStart = r.startDate;
        const reqEnd = r.endDate || r.startDate;
        if (reqStart > dateRange.end || reqEnd < dateRange.start) {
          return false;
        }
      }

      return true;
    });

    for (const r of filteredRequests.slice(0, 30)) {
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
  if (runShifts) {
    const allShifts = await database.select().from(shifts);

    const filteredShifts = allShifts.filter((s: any) => {
      if (staffFilter) {
        const matchId = String(s.staffId).toLowerCase() === staffFilter;
        const matchName = (s.staffName || '').toLowerCase().includes(staffFilter);
        if (!matchId && !matchName) return false;
      }

      if (siteFilter) {
        const shiftSite = (s.siteName || '').toLowerCase();
        if (!shiftSite.includes(siteFilter) && String(s.siteId || '').toLowerCase() !== siteFilter) {
          return false;
        }
      }

      if (qLower.includes('missed') && s.clockedIn) return false;
      if ((qLower.includes('unfilled') || qLower.includes('bank')) && !s.isBank && !s.staffName.toLowerCase().includes('bank')) return false;
      if (qLower.includes('unconfirmed') && s.staffStatus !== 'pending') return false;
      if (qLower.includes('completed') && (!s.clockedIn || !s.clockedOut)) return false;

      if (dateRange) {
        if (s.date < dateRange.start || s.date > dateRange.end) return false;
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

    shiftResults = filteredShifts.slice(0, 50).map((s: any) => ({
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
  if (runAttendance) {
    const allShifts = await database.select().from(shifts);

    const filteredAttendance = allShifts.filter((s: any) => {
      if (staffFilter) {
        const matchId = String(s.staffId).toLowerCase() === staffFilter;
        const matchName = (s.staffName || '').toLowerCase().includes(staffFilter);
        if (!matchId && !matchName) return false;
      }

      if (siteFilter) {
        const shiftSite = (s.siteName || '').toLowerCase();
        if (!shiftSite.includes(siteFilter) && String(s.siteId || '').toLowerCase() !== siteFilter) {
          return false;
        }
      }

      let isAbsent = !s.clockedIn && s.date <= todayStr && s.staffStatus !== 'declined';
      let isLate = s.clockedIn && s.clockInTime && new Date(s.clockInTime).toISOString().split('T')[1]?.slice(0,5) > s.startTime;
      let isMissingClockOut = s.clockedIn && !s.clockedOut && s.date <= todayStr;

      if (qLower.includes('absent') && !isAbsent) return false;
      if (qLower.includes('late') && !isLate) return false;
      if ((qLower.includes('missing') || qLower.includes('missing clock-outs')) && !isMissingClockOut) return false;

      if (!qLower.includes('absent') && !qLower.includes('late') && !qLower.includes('missing') && !isAbsent && !isLate && !isMissingClockOut) {
        return false;
      }

      if (dateRange) {
        if (s.date < dateRange.start || s.date > dateRange.end) return false;
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

    attendanceResults = filteredAttendance.slice(0, 50).map((s: any) => {
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
