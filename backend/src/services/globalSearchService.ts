import { staff, shifts, leaveBalances, leaveRequests, approvalRequests, quotes, remittances, roomScans, rooms, sites, queries, queryMessages } from '../schema.js';

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

export interface SwapsSearchResult {
  id: string;
  shiftId: string;
  requesterId: string;
  requesterName: string;
  takerId: string;
  takerName: string;
  siteName: string;
  date: string;
  type: string;
  startTime: string;
  endTime: string;
  swapStatus: 'pending' | 'completed';
  approvedBy: string | null;
  approvedAt: Date | null;
  link: string;
}

export interface ApprovalsSearchResult {
  id: string;
  staffId: string;
  staffName: string;
  siteId: string;
  siteName: string;
  date: string;
  requestTime: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  approvedAt: Date | null;
  notes: string | null;
  link: string;
}

export interface QuotesSearchResult {
  id: string;
  childInitials: string;
  quoteStatus: string | null;
  providerName: string | null;
  placementType: string | null;
  createdDate: string | null;
  createdAt: Date;
  link: string;
}

export interface RemittancesSearchResult {
  id: string;
  paymentNo: string;
  paymentDate: string;
  siteName: string | null;
  payeeName: string;
  description: string;
  datesCovered: string;
  hoursWorked: string;
  hourlyRate: string;
  paymentTotal: string;
  status: string;
  createdAt: Date;
  link: string;
}

export interface RoomScansSearchResult {
  id: string;
  roomId: string;
  roomName: string | null;
  siteName: string | null;
  userId: string;
  staffName: string | null;
  shiftId: string | null;
  scannedAt: Date;
  taskCompleted: boolean | null;
  notes: string | null;
  link: string;
}

export interface SitesSearchResult {
  id: string;
  name: string;
  location: string | null;
  postcode: string | null;
  address: string | null;
  status: string;
  color: string | null;
  link: string;
}

export interface UnscheduledSearchResult {
  id: string;
  staffId: string;
  staffName: string;
  siteId: string;
  siteName: string;
  date: string;
  requestTime: Date;
  status: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  notes: string | null;
  link: string;
}

export interface PayrollSearchResult {
  id: string;
  staffId: string;
  staffName: string;
  siteName: string;
  date: string;
  type: string;
  startTime: string;
  endTime: string;
  duration: number;
  clockedIn: boolean | null;
  clockedOut: boolean | null;
  hourlyRate: string | null;
  link: string;
}

export interface ReportsSearchResult {
  id: string;
  siteId: string;
  userId: string;
  category: string | null;
  status: string;
  createdAt: Date;
  link: string;
}

export interface QueriesSearchResult {
  id: string;
  siteId: string;
  userId: string;
  category: string | null;
  status: string;
  messageCount: number;
  lastMessage: string | null;
  createdAt: Date;
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
    swaps: number;
    approvals: number;
    quotes: number;
    remittances: number;
    roomScans: number;
    sites: number;
    unscheduled: number;
    payroll: number;
    reports: number;
    queries: number;
  };
  results: {
    staff: StaffSearchResult[];
    leave: LeaveSearchResult[];
    shifts: ShiftSearchResult[];
    attendance: AttendanceSearchResult[];
    swaps: SwapsSearchResult[];
    approvals: ApprovalsSearchResult[];
    quotes: QuotesSearchResult[];
    remittances: RemittancesSearchResult[];
    roomScans: RoomScansSearchResult[];
    sites: SitesSearchResult[];
    unscheduled: UnscheduledSearchResult[];
    payroll: PayrollSearchResult[];
    reports: ReportsSearchResult[];
    queries: QueriesSearchResult[];
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

  const selectOptionalTable = async (table: any, tableName: string): Promise<any[]> => {
    try {
      return await database.select().from(table);
    } catch (error: any) {
      if (error?.code === '42P01' || /relation .* does not exist/i.test(error?.message || '')) {
        console.warn(`Global Search optional table "${tableName}" is unavailable; returning no ${tableName} results.`);
        return [];
      }
      throw error;
    }
  };

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
  const runSwaps = section === 'all' || section === 'swaps';
  const runApprovals = section === 'all' || section === 'approvals';
  const runQuotes = section === 'all' || section === 'quotes';
  const runRemittances = section === 'all' || section === 'remittances';
  const runRoomScans = section === 'all' || section === 'room-scans';
  const runSites = section === 'all' || section === 'sites';
  const runUnscheduled = section === 'all' || section === 'unscheduled';
  const runPayroll = section === 'all' || section === 'payroll';
  const runReports = section === 'all' || section === 'reports';
  const runQueries = section === 'all' || section === 'queries';

  // Retrieve only columns used by Global Search. Selecting the whole staff schema
  // can break search when optional employment-detail columns are not yet present.
  const allStaff = await database.select({
    id: staff.id,
    name: staff.name,
    username: staff.username,
    email: staff.email,
    role: staff.role,
    site: staff.site,
    status: staff.status,
    standardRate: staff.standardRate,
    rates: staff.rates,
    startDate: staff.startDate,
    createdAt: staff.createdAt,
  }).from(staff);

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

  // 5. Swaps Search (shifts with swap flags)
  let swapResults: SwapsSearchResult[] = [];
  if (runSwaps) {
    const allShifts = await database.select().from(shifts);

    const isSwapFlagSet = (value: unknown): boolean => value === true || value === 'true' || value === 't' || value === 1;

    const staffMap = new Map<string, { id: string; name: string }>();
    for (const s of allStaff) {
      staffMap.set(String(s.id).toLowerCase(), { id: s.id, name: s.name });
    }

    const filteredSwaps = allShifts.filter((s: any) => {
      const isCompletedSwap = isSwapFlagSet(s.isSwapped);
      const isPendingSwap = isSwapFlagSet(s.isOfferedForSwap) && !isCompletedSwap;
      if (!isCompletedSwap && !isPendingSwap) return false;

      // For pending swaps (offered, not yet accepted), staffId is still the original staff
      // For completed swaps, originalStaffId holds the original staff, staffId is the taker
      const requesterId = isPendingSwap ? s.staffId : (s.originalStaffId || s.staffId);
      const requesterInfo = staffMap.get(String(requesterId).toLowerCase());

      if (staffFilter) {
        const matchRequesterId = String(requesterId).toLowerCase() === staffFilter;
        const matchRequesterName = requesterInfo && (requesterInfo.name || '').toLowerCase().includes(staffFilter);
        const takerId = isPendingSwap ? null : s.staffId;
        const takerName = isPendingSwap ? null : s.staffName;
        const matchTakerId = takerId && String(takerId).toLowerCase() === staffFilter;
        const matchTakerName = takerName && (takerName || '').toLowerCase().includes(staffFilter);
        if (!matchRequesterId && !matchRequesterName && !matchTakerId && !matchTakerName) return false;
      }

      if (siteFilter) {
        const shiftSite = (s.siteName || '').toLowerCase();
        if (!shiftSite.includes(siteFilter) && String(s.siteId || '').toLowerCase() !== siteFilter) {
          return false;
        }
      }

      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['swap', 'swaps', 'swap-shift', 'shift'].includes(t));
        if (tokens.length > 0) {
          const takerName = isPendingSwap ? null : s.staffName;
          const matchText = `${requesterInfo?.name || ''} ${takerName || ''} ${s.siteName || ''} ${s.date || ''}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }

      if (dateRange) {
        if (s.date < dateRange.start || s.date > dateRange.end) return false;
      }

      return true;
    });

    swapResults = filteredSwaps.slice(0, 50).map((s: any) => {
      const isCompletedSwap = isSwapFlagSet(s.isSwapped);
      const isPendingSwap = isSwapFlagSet(s.isOfferedForSwap) && !isCompletedSwap;
      const requesterId = isPendingSwap ? s.staffId : (s.originalStaffId || s.staffId);
      const requesterInfo = staffMap.get(String(requesterId).toLowerCase());
      return {
        id: `swap_${s.id}`,
        shiftId: s.id,
        requesterId,
        requesterName: requesterInfo?.name || 'Unknown',
        takerId: isPendingSwap ? '' : s.staffId,
        takerName: isPendingSwap ? 'Not yet accepted' : s.staffName,
        siteName: s.siteName,
        date: s.date,
        type: s.type,
        startTime: s.startTime,
        endTime: s.endTime,
        swapStatus: isCompletedSwap ? 'completed' : 'pending',
        approvedBy: null as string | null,
        approvedAt: null as Date | null,
        link: '/admin/rota'
      };
    });
  }

  // 6. Approvals Search (approval_requests table)
  let approvalResults: ApprovalsSearchResult[] = [];
  if (runApprovals) {
    const allApprovals = await database.select().from(approvalRequests);

    const filteredApprovals = allApprovals.filter((r: any) => {
      if (staffFilter) {
        const matchId = String(r.staffId).toLowerCase() === staffFilter;
        const matchName = (r.staffName || '').toLowerCase().includes(staffFilter);
        if (!matchId && !matchName) return false;
      }

      if (siteFilter) {
        const approvalSite = (r.siteName || '').toLowerCase();
        if (!approvalSite.includes(siteFilter) && String(r.siteId || '').toLowerCase() !== siteFilter) {
          return false;
        }
      }

      if (qLower.includes('approved') && r.status !== 'approved') return false;
      if (qLower.includes('pending') && r.status !== 'pending') return false;
      if (qLower.includes('rejected') && r.status !== 'rejected') return false;

      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['approval', 'approvals', 'approved', 'pending', 'rejected', 'request'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${r.staffName || ''} ${r.siteName || ''} ${r.date || ''} ${r.notes || ''}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }

      if (dateRange) {
        if (r.date < dateRange.start || r.date > dateRange.end) return false;
      }

      return true;
    });

    approvalResults = filteredApprovals.slice(0, 50).map((r: any) => ({
      id: r.id,
      staffId: r.staffId,
      staffName: r.staffName,
      siteId: r.siteId,
      siteName: r.siteName,
      date: r.date,
      requestTime: r.requestTime,
      status: r.status,
      approvedBy: r.approvedBy || null,
      approvedAt: r.approvedAt || null,
      notes: r.notes || null,
      link: '/admin/approvals'
    }));
  }

  // 7. Quotes Search
  let quoteResults: QuotesSearchResult[] = [];
  if (runQuotes) {
    const allQuotes = await database.select().from(quotes);

    const filteredQuotes = allQuotes.filter((q: any) => {
      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['quote', 'quotes', 'child', 'provider'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${q.childInitials || ''} ${q.quoteStatus || ''} ${q.providerName || ''} ${q.placementType || ''}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }

      if (qLower.includes('draft') && q.quoteStatus !== 'Draft Quote') return false;
      if (qLower.includes('final') && q.quoteStatus !== 'Final Quote') return false;
      if (qLower.includes('submitted') && q.quoteStatus !== 'Submitted') return false;

      if (dateRange) {
        if (q.createdDate && (q.createdDate < dateRange.start || q.createdDate > dateRange.end)) return false;
      }

      return true;
    });

    quoteResults = filteredQuotes.slice(0, 50).map((q: any) => ({
      id: q.id,
      childInitials: q.childInitials,
      quoteStatus: q.quoteStatus || null,
      providerName: q.providerName || null,
      placementType: q.placementType || null,
      createdDate: q.createdDate || null,
      createdAt: q.createdAt,
      link: '/admin/quotes'
    }));
  }

  // 8. Remittances Search
  let remittanceResults: RemittancesSearchResult[] = [];
  if (runRemittances) {
    const allRemittances = await database.select().from(remittances);

    const filteredRemittances = allRemittances.filter((r: any) => {
      if (siteFilter) {
        const remSite = (r.siteName || '').toLowerCase();
        if (!remSite.includes(siteFilter)) return false;
      }

      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['remittance', 'remittances', 'payment', 'payee'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${r.payeeName || ''} ${r.siteName || ''} ${r.paymentNo || ''} ${r.description || ''} ${r.datesCovered || ''}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }

      if (qLower.includes('sent') && r.status !== 'sent') return false;
      if (qLower.includes('saved') && r.status !== 'saved') return false;

      if (dateRange) {
        if (r.paymentDate && (r.paymentDate < dateRange.start || r.paymentDate > dateRange.end)) return false;
      }

      return true;
    });

    remittanceResults = filteredRemittances.slice(0, 50).map((r: any) => ({
      id: r.id,
      paymentNo: r.paymentNo,
      paymentDate: r.paymentDate,
      siteName: r.siteName || null,
      payeeName: r.payeeName,
      description: r.description,
      datesCovered: r.datesCovered,
      hoursWorked: r.hoursWorked,
      hourlyRate: r.hourlyRate,
      paymentTotal: r.paymentTotal,
      status: r.status,
      createdAt: r.createdAt,
      link: '/admin/payroll'
    }));
  }

  // 9. Room Scans Search
  let roomScanResults: RoomScansSearchResult[] = [];
  if (runRoomScans) {
    const allScans = await selectOptionalTable(roomScans, 'room_scans');
    const allRooms = await selectOptionalTable(rooms, 'rooms');
    const allSites = await database.select().from(sites);

    const roomMap = new Map<string, { name: string; siteId: string }>();
    for (const r of allRooms) {
      roomMap.set(String(r.id).toLowerCase(), { name: r.name, siteId: r.siteId });
    }
    const siteMap = new Map<string, string>();
    for (const s of allSites) {
      siteMap.set(String(s.id).toLowerCase(), s.name);
    }

    const staffNameMap = new Map<string, string>();
    for (const s of allStaff) {
      staffNameMap.set(String(s.id).toLowerCase(), s.name);
    }

    const filteredScans = allScans.filter((scan: any) => {
      if (staffFilter) {
        const matchUserId = String(scan.userId).toLowerCase() === staffFilter;
        const userName = staffNameMap.get(String(scan.userId).toLowerCase()) || '';
        const matchUserName = userName.toLowerCase().includes(staffFilter);
        if (!matchUserId && !matchUserName) return false;
      }

      const roomInfo = roomMap.get(String(scan.roomId).toLowerCase());
      if (roomInfo) {
        const roomSiteName = siteMap.get(roomInfo.siteId) || '';
        if (siteFilter) {
          if (!roomSiteName.toLowerCase().includes(siteFilter)) return false;
        }
      }

      if (cleanLower) {
        const userName = staffNameMap.get(String(scan.userId).toLowerCase()) || '';
        const roomName = roomMap.get(String(scan.roomId).toLowerCase())?.name || '';
        const tokens = cleanLower.split(/\s+/).filter(t => !['scan', 'scans', 'room', 'task'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${userName} ${roomName}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }

      if (dateRange) {
        const scanDate = new Date(scan.scannedAt);
        const scanDateStr = formatDateLocal(scanDate);
        if (scanDateStr < dateRange.start || scanDateStr > dateRange.end) return false;
      }

      return true;
    });

    roomScanResults = filteredScans.slice(0, 50).map((scan: any) => {
      const roomInfo = roomMap.get(String(scan.roomId).toLowerCase());
      const roomSiteName = roomInfo ? (siteMap.get(roomInfo.siteId) || null) : null;
      return {
        id: scan.id,
        roomId: scan.roomId,
        roomName: roomInfo?.name || null,
        siteName: roomSiteName,
        userId: scan.userId,
        staffName: staffNameMap.get(String(scan.userId).toLowerCase()) || null,
        shiftId: scan.shiftId || null,
        scannedAt: scan.scannedAt,
        taskCompleted: scan.taskCompleted,
        notes: scan.notes || null,
        link: '/admin/room-scans'
      };
    });
  }

  // 10. Sites Search
  let siteResults: SitesSearchResult[] = [];
  if (runSites) {
    const allSites = await database.select().from(sites);

    const filteredSites = allSites.filter((s: any) => {
      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['site', 'sites', 'location'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${s.name || ''} ${s.location || ''} ${s.postcode || ''} ${s.address || ''} ${s.status || ''}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }

      if (qLower.includes('active') && s.status !== 'Active') return false;
      if (qLower.includes('inactive') && s.status !== 'Inactive') return false;

      return true;
    });

    siteResults = filteredSites.slice(0, 50).map((s: any) => ({
      id: s.id,
      name: s.name,
      location: s.location || null,
      postcode: s.postcode || null,
      address: s.address || null,
      status: s.status,
      color: s.color || null,
      link: '/admin/sites'
    }));
  }

  // 11. Unscheduled Search (approval_requests with status=pending)
  let unscheduledResults: UnscheduledSearchResult[] = [];
  if (runUnscheduled) {
    const allApprovals = await database.select().from(approvalRequests);

    const filteredUnscheduled = allApprovals.filter((r: any) => {
      if (r.status !== 'pending') return false;

      if (staffFilter) {
        const matchId = String(r.staffId).toLowerCase() === staffFilter;
        const matchName = (r.staffName || '').toLowerCase().includes(staffFilter);
        if (!matchId && !matchName) return false;
      }

      if (siteFilter) {
        const approvalSite = (r.siteName || '').toLowerCase();
        if (!approvalSite.includes(siteFilter) && String(r.siteId || '').toLowerCase() !== siteFilter) {
          return false;
        }
      }

      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['unscheduled', 'pending', 'approval', 'request', 'clock-in'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${r.staffName || ''} ${r.siteName || ''} ${r.date || ''} ${r.notes || ''}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }

      if (dateRange) {
        if (r.date < dateRange.start || r.date > dateRange.end) return false;
      }

      return true;
    });

    unscheduledResults = filteredUnscheduled.slice(0, 50).map((r: any) => ({
      id: r.id,
      staffId: r.staffId,
      staffName: r.staffName,
      siteId: r.siteId,
      siteName: r.siteName,
      date: r.date,
      requestTime: r.requestTime,
      status: r.status,
      approvedBy: r.approvedBy || null,
      approvedAt: r.approvedAt || null,
      notes: r.notes || null,
      link: '/admin/unscheduled'
    }));
  }

  // 12. Payroll Search (clocked shifts for payroll)
  let payrollResults: PayrollSearchResult[] = [];
  if (runPayroll) {
    const allShifts = await database.select().from(shifts);

    const staffRateMap = new Map<string, string | null>();
    for (const s of allStaff) {
      staffRateMap.set(String(s.id).toLowerCase(), s.standardRate || s.rates || null);
    }

    const filteredPayroll = allShifts.filter((s: any) => {
      if (!s.clockedIn) return false;

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

      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['payroll', 'pay', 'paid', 'hours', 'clocked'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${s.staffName || ''} ${s.siteName || ''} ${s.date || ''}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }

      if (dateRange) {
        if (s.date < dateRange.start || s.date > dateRange.end) return false;
      }

      return true;
    });

    payrollResults = filteredPayroll.slice(0, 50).map((s: any) => ({
      id: s.id,
      staffId: s.staffId,
      staffName: s.staffName,
      siteName: s.siteName,
      date: s.date,
      type: s.type,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration,
      clockedIn: s.clockedIn,
      clockedOut: s.clockedOut,
      hourlyRate: staffRateMap.get(String(s.staffId).toLowerCase()) || null,
      link: '/admin/payroll'
    }));
  }

  // 13. Reports Search (queries table)
  let reportResults: ReportsSearchResult[] = [];
  if (runReports) {
    const allQueries = await selectOptionalTable(queries, 'queries');

    const filteredReports = allQueries.filter((q: any) => {
      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['report', 'reports'].includes(t));
        if (tokens.length > 0) {
          const matchText = `${q.category || ''} ${q.status || ''} ${q.siteId || ''}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }

      if (qLower.includes('open') && q.status !== 'open') return false;
      if (qLower.includes('closed') && q.status !== 'closed') return false;

      if (dateRange) {
        const createdDate = formatDateLocal(new Date(q.createdAt));
        if (createdDate < dateRange.start || createdDate > dateRange.end) return false;
      }

      return true;
    });

    reportResults = filteredReports.slice(0, 50).map((q: any) => ({
      id: q.id,
      siteId: q.siteId,
      userId: q.userId,
      category: q.category || null,
      status: q.status,
      createdAt: q.createdAt,
      link: '/admin/reports'
    }));
  }

  // 14. Queries Search (queries + query_messages tables)
  let queryResults: QueriesSearchResult[] = [];
  if (runQueries) {
    const allQueries = await selectOptionalTable(queries, 'queries');
    const allMessages = await selectOptionalTable(queryMessages, 'query_messages');

    const messagesByQuery = new Map<string, any[]>();
    for (const m of allMessages) {
      const qId = String(m.queryId).toLowerCase();
      if (!messagesByQuery.has(qId)) messagesByQuery.set(qId, []);
      messagesByQuery.get(qId)!.push(m);
    }

    const filteredQueries = allQueries.filter((q: any) => {
      if (cleanLower) {
        const tokens = cleanLower.split(/\s+/).filter(t => !['query', 'queries', 'message'].includes(t));
        if (tokens.length > 0) {
          const msgs = messagesByQuery.get(String(q.id).toLowerCase()) || [];
          const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].message : '';
          const matchText = `${q.category || ''} ${q.status || ''} ${q.siteId || ''} ${lastMsg}`.toLowerCase();
          if (!tokens.some(t => matchText.includes(t))) return false;
        }
      }

      if (qLower.includes('open') && q.status !== 'open') return false;
      if (qLower.includes('closed') && q.status !== 'closed') return false;

      if (dateRange) {
        const createdDate = formatDateLocal(new Date(q.createdAt));
        if (createdDate < dateRange.start || createdDate > dateRange.end) return false;
      }

      return true;
    });

    queryResults = filteredQueries.slice(0, 50).map((q: any) => {
      const msgs = messagesByQuery.get(String(q.id).toLowerCase()) || [];
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].message : null;
      return {
        id: q.id,
        siteId: q.siteId,
        userId: q.userId,
        category: q.category || null,
        status: q.status,
        messageCount: msgs.length,
        lastMessage: lastMsg,
        createdAt: q.createdAt,
        link: '/admin/queries'
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
      attendance: attendanceResults.length,
      swaps: swapResults.length,
      approvals: approvalResults.length,
      quotes: quoteResults.length,
      remittances: remittanceResults.length,
      roomScans: roomScanResults.length,
      sites: siteResults.length,
      unscheduled: unscheduledResults.length,
      payroll: payrollResults.length,
      reports: reportResults.length,
      queries: queryResults.length
    },
    results: {
      staff: staffResults,
      leave: leaveResults,
      shifts: shiftResults,
      attendance: attendanceResults,
      swaps: swapResults,
      approvals: approvalResults,
      quotes: quoteResults,
      remittances: remittanceResults,
      roomScans: roomScanResults,
      sites: siteResults,
      unscheduled: unscheduledResults,
      payroll: payrollResults,
      reports: reportResults,
      queries: queryResults
    }
  };
}
