import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { getSites, getStaff, subscribeToSitesChange, Site as SharedSite, StaffMember, getShifts, setShifts as setSharedShifts, subscribeToDataChange, addShift, updateShift, removeShift, getAllWorkers } from '../data/sharedData';
import { shiftsAPI } from '../services/api';
import { calculateDuration } from '../utils/calculateDuration';

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  siteId: string;
  siteName: string;
  siteColor: string;
  date: string;
  type: 'Day' | 'Night';
  startTime: string;
  endTime: string;
  duration: number;
  is24Hour: boolean;
  isBank?: boolean; // True if this is a BANK placeholder shift
  approved24HrBy?: string;
  duplicateShiftApprovedBy?: string; // For multiple workers on same shift
  notes?: string;
  extended?: boolean;
  extensionHours?: number;
  extensionReason?: string;
  extensionApprovedBy?: string;
  extensionApprovalRequired?: boolean;
  staffStatus?: 'pending' | 'accepted' | 'declined';
  declineReason?: string;
}

const Rota: React.FC = () => {
  const [sites, setSites] = useState<SharedSite[]>(getSites());
  const [staff, setStaff] = useState<Array<StaffMember | any>>(getAllWorkers());

  // Subscribe to site changes from Sites page
  useEffect(() => {
    const unsubscribe = subscribeToSitesChange(() => {
      setSites(getSites());
    });
    return unsubscribe;
  }, []);

  // Subscribe to staff changes (including agency workers)
  useEffect(() => {
    const unsubscribe = subscribeToDataChange(() => {
      setStaff(getAllWorkers());
    });
    return unsubscribe;
  }, []);

  const [shifts, setShifts] = useState<Shift[]>(getShifts());
  const [isLoadingShifts, setIsLoadingShifts] = useState(true);

  // Fetch shifts from API on component mount and whenever shifts change
  useEffect(() => {
    let isMounted = true;
    const loadShifts = async () => {
      try {
        setIsLoadingShifts(true);
        const fetchedShifts = await shiftsAPI.getAll();
        if (isMounted) {
          setShifts(fetchedShifts);
          // REMOVED: setSharedShifts triggers notifyDataChanged which causes subscription loop
          // setSharedShifts(fetchedShifts);
        }
      } catch (error) {
        console.error('Failed to load shifts:', error);
        // Fall back to cached data
        if (isMounted) {
          setShifts(getShifts());
        }
      } finally {
        if (isMounted) {
          setIsLoadingShifts(false);
        }
      }
    };
    loadShifts();

    // Set up interval to refresh every 5 seconds when on Rota page
    const refreshInterval = setInterval(loadShifts, 5000);

    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, []);

  // DISABLED: This subscription causes infinite loop with the data change notifications
  // The 5-second refresh interval (line 82) is sufficient for keeping shifts updated
  // useEffect(() => {
  //   const unsubscribe = subscribeToDataChange(() => {
  //     setShifts(getShifts());
  //   });
  //   return unsubscribe;
  // }, []);

  // REMOVED: This was causing an infinite loop
  // The shifts are already synced when fetched from API (line 65)
  // useEffect(() => {
  //   setSharedShifts(shifts);
  // }, [shifts]);

  const [showAssignShift, setShowAssignShift] = useState(false);
  const [show24HrApproval, setShow24HrApproval] = useState(false);
  const [pending24HrShift, setPending24HrShift] = useState<any>(null);
  const [showDuplicateApproval, setShowDuplicateApproval] = useState(false);
  const [pendingDuplicateShift, setPendingDuplicateShift] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);

  // Non-24-hour approval states
  const [showNon24HrApproval, setShowNon24HrApproval] = useState(false);
  const [pendingNon24HrShifts, setPendingNon24HrShifts] = useState<any>(null);
  const [non24HrApprovalForm, setNon24HrApprovalForm] = useState({
    approvedBy: '',
    reason: '',
    totalHours: 0,
    dayHours: 0,
    nightHours: 0
  });

  const [shiftForm, setShiftForm] = useState({
    siteId: '',
    date: '',
    workerCount: 1,
    workers: [
      {
        staffId: '',
        hours: 0,
        minutes: 0,
        startTime: '08:00'
      }
    ],
    notes: ''
  });

  // Staff search states
  const [dayStaffSearch, setDayStaffSearch] = useState('');
  const [nightStaffSearch, setNightStaffSearch] = useState('');
  const [showDayStaffList, setShowDayStaffList] = useState(false);
  const [showNightStaffList, setShowNightStaffList] = useState(false);

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);

  // Shift extension states
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedShiftForExtension, setSelectedShiftForExtension] = useState<Shift | null>(null);
  const [extensionForm, setExtensionForm] = useState({
    hours: '',
    reason: '',
    approvedBy: ''
  });

  const [approvalForm, setApprovalForm] = useState({
    approvedBy: '',
    reason: ''
  });

  // Shift edit states
  const [showEditShiftModal, setShowEditShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [editShiftForm, setEditShiftForm] = useState({
    date: '',
    startTime: '',
    endTime: ''
  });

  // Shift split states
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedShiftForSplit, setSelectedShiftForSplit] = useState<Shift | null>(null);
  const [splitForm, setSplitForm] = useState({
    splitTime: '14:00',
    newStaffId: '',
    notes: ''
  });

  // Get current week dates
  const getWeekDates = (weekOffset: number = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - currentDay + 1 + (weekOffset * 7));

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date.toISOString().split('T')[0];
    });
  };

  const weekDates = getWeekDates(selectedWeek);
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = new Date().toISOString().split('T')[0];

  // Check if a date is today
  const isToday = (date: string) => date === today;

  // Rule validation functions
  const validateShift = (newShift: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // NEW RULE: No past date assignments (TEMPORARILY DISABLED FOR SYSTEM POPULATION)
    // const today = new Date();
    // today.setHours(0, 0, 0, 0);
    // const shiftDate = new Date(newShift.date);
    // shiftDate.setHours(0, 0, 0, 0);
    // 
    // if (shiftDate < today) {
    //   errors.push(`INVALID DATE: Cannot assign shifts to past dates. Selected date: ${newShift.date}`);
    // }

    // R1: Maximum 4 workers per site per day (flexible shift patterns)
    // Count total workers assigned to this site on this date (excluding declined shifts)
    const workersOnSiteToday = shifts.filter(s =>
      s.date === newShift.date &&
      s.siteId === newShift.siteId &&
      s.staffStatus !== 'declined' &&
      s.staffId !== newShift.staffId // Don't count the new worker yet
    );

    const totalWorkers = workersOnSiteToday.length + 1; // +1 for the new worker

    // Hard limit: Maximum 4 workers per site per day
    if (totalWorkers > 4) {
      errors.push(`MAXIMUM WORKERS EXCEEDED: This site already has 4 workers assigned on ${newShift.date}. Cannot assign more than 4 workers per site per day.`);
    }
    // If 3-4 workers: Require admin approval
    else if (totalWorkers >= 3 && !newShift.duplicateShiftApprovedBy) {
      const workerNames = workersOnSiteToday.map((s: Shift) => s.staffName).join(', ');
      errors.push(`MULTIPLE WORKERS: ${workerNames} already assigned to this site on ${newShift.date}. Admin approval required to assign ${totalWorkers} workers (max 4).`);
    }
    // If 2 workers on same shift type: Require admin approval
    else if (totalWorkers === 2) {
      const sameShiftType = workersOnSiteToday.find(s => s.type === newShift.type);
      if (sameShiftType && !newShift.duplicateShiftApprovedBy) {
        errors.push(`DUPLICATE SHIFT: ${sameShiftType.staffName} is already assigned to ${newShift.type} shift at this site on this date. Admin approval required to assign multiple workers to same shift type.`);
      }
    }

    // NEW RULE: Same worker cannot work same time at different sites
    const sameTimeShift = shifts.find(s =>
      s.date === newShift.date &&
      s.staffId === newShift.staffId &&
      s.type === newShift.type &&
      s.siteId !== newShift.siteId
    );
    if (sameTimeShift) {
      errors.push(`TIME CONFLICT: ${newShift.staffName} is already working ${newShift.type} shift at ${sameTimeShift.siteName} on this date.`);
    }

    // R2: Site exclusivity per day (only if not 24-hour shift)
    if (!newShift.is24Hour) {
      const sameDayShift = shifts.find(s =>
        s.date === newShift.date &&
        s.staffId === newShift.staffId &&
        s.siteId !== newShift.siteId
      );
      if (sameDayShift) {
        errors.push(`CONFLICT: ${newShift.staffName} is already assigned to ${sameDayShift.siteName} on this date.`);
      }
    }

    // R3: 24-hour shift requires admin approval (DISABLED)
    // if (newShift.is24Hour && !newShift.approved24HrBy) {
    //   errors.push(`24-hour shifts require admin or site manager approval.`);
    // }

    // R5: Rest period (12 hours minimum)
    const staffShifts = shifts.filter(s => s.staffId === newShift.staffId);
    const newShiftStart = new Date(`${newShift.date}T${newShift.startTime}`);

    for (const existingShift of staffShifts) {
      const existingEnd = new Date(`${existingShift.date}T${existingShift.endTime}`);
      const hoursDiff = Math.abs((newShiftStart.getTime() - existingEnd.getTime()) / (1000 * 60 * 60));

      if (hoursDiff < 12 && hoursDiff > 0) {
        errors.push(`REST PERIOD: Only ${hoursDiff.toFixed(1)} hours rest since last shift. Minimum 12 hours required.`);
      }
    }

    return { valid: errors.length === 0, errors };
  };

  // Filter staff by search term (name or initials)
  const filterStaff = (searchTerm: string) => {
    if (!searchTerm) return staff.filter(s => s.status === 'Active');

    const search = searchTerm.toLowerCase().trim();
    return staff.filter(s => {
      if (s.status !== 'Active') return false;

      const name = s.name.toLowerCase();
      // Match full name
      if (name.includes(search)) return true;

      // Match initials (e.g., "MB" for "Melissa Blake")
      const nameParts = s.name.split(' ');
      const initials = nameParts.map((part: string) => part[0]).join('').toLowerCase();
      if (initials.includes(search)) return true;

      return false;
    });
  };

  // Handle worker count change
  const handleWorkerCountChange = (count: number) => {
    const newWorkers = [];
    for (let i = 0; i < count; i++) {
      if (i < shiftForm.workers.length) {
        // Keep existing worker data
        newWorkers.push(shiftForm.workers[i]);
      } else {
        // Add new empty worker with hours/minutes
        newWorkers.push({
          staffId: '',
          hours: 0,
          minutes: 0,
          startTime: '08:00'
        });
      }
    }
    setShiftForm({ ...shiftForm, workerCount: count, workers: newWorkers });
  };

  // Update worker field
  const updateWorker = (index: number, field: string, value: string) => {
    const newWorkers = [...shiftForm.workers];
    if (field === 'hours' || field === 'minutes') {
      newWorkers[index] = { ...newWorkers[index], [field]: parseInt(value) || 0 };
    } else {
      newWorkers[index] = { ...newWorkers[index], [field]: value };
    }
    setShiftForm({ ...shiftForm, workers: newWorkers });
  };

  // Calculate total allocated hours from all workers
  const calculateAllocatedHours = (): number => {
    return shiftForm.workers.reduce((total, worker) => {
      const workerHours = worker.hours + (worker.minutes / 60);
      return total + workerHours;
    }, 0);
  };

  // Calculate remaining hours to reach 24
  const calculateRemainingHours = (): { hours: number; minutes: number; total: number } => {
    const allocated = calculateAllocatedHours();
    const remaining = 24 - allocated;
    const hours = Math.floor(Math.abs(remaining));
    const minutes = Math.round((Math.abs(remaining) - hours) * 60);
    return { hours, minutes, total: remaining };
  };

  const handleAssignShift = async () => {
    // Validate required fields
    if (!shiftForm.siteId || !shiftForm.date) {
      alert('Please select a site and date.');
      return;
    }

    // Validate all workers have staff selected
    const emptyWorkers = shiftForm.workers.filter(w => !w.staffId);
    if (emptyWorkers.length > 0) {
      alert(`Please select staff for all ${shiftForm.workerCount} worker(s).`);
      return;
    }

    // Check for duplicate staff
    const staffIds = shiftForm.workers.map((w: any) => w.staffId);
    const duplicates = staffIds.filter((id, index) => staffIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      alert('ERROR: Cannot assign the same worker multiple times.');
      return;
    }

    const selectedSite = sites.find(s => String(s.id) === String(shiftForm.siteId));
    if (!selectedSite) {
      alert('Invalid site selection');
      return;
    }

    // Validate date (no past day shifts)
    const shiftDate = new Date(shiftForm.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftDateOnly = new Date(shiftDate);
    shiftDateOnly.setHours(0, 0, 0, 0);

    // Removed: Day/Night shift type validation (now using flexible hours)

    // Validate each worker and create shifts
    const shiftsToCreate: Shift[] = [];
    const assignedWorkers: string[] = [];

    for (let i = 0; i < shiftForm.workers.length; i++) {
      const worker = shiftForm.workers[i];

      // Get staff member
      const staffMember = worker.staffId === 'BANK'
        ? { id: 'BANK', name: 'BANK (Placeholder)', status: 'Active' }
        : staff.find(s => String(s.id) === String(worker.staffId));

      if (!staffMember) {
        alert(`Invalid staff selection for Worker ${i + 1}`);
        return;
      }

      // Validate agency worker
      const isAgency = staffMember.id !== 'BANK' && 'agencyName' in staffMember;
      if (isAgency) {
        const hourlyRate = (staffMember as any).hourlyRate?.trim();
        if (!hourlyRate || hourlyRate === '' || hourlyRate === '0' || hourlyRate === '0.00') {
          alert(`❌ CANNOT ASSIGN ${staffMember.name}\\n\\nThis agency worker does not have an hourly rate configured.\\n\\nPlease set their hourly rate in the Directory before assigning shifts.`);
          return;
        }

        const rateNum = parseFloat(hourlyRate);
        if (isNaN(rateNum) || rateNum <= 0) {
          alert(`❌ CANNOT ASSIGN ${staffMember.name}\\n\\nThis agency worker has an invalid hourly rate: "${hourlyRate}"\\n\\nPlease update their hourly rate in the Directory.`);
          return;
        }

        // Check contract dates
        if ((staffMember as any).startDate) {
          const startDate = new Date((staffMember as any).startDate);
          const endDate = (staffMember as any).endDate ? new Date((staffMember as any).endDate) : null;

          if (shiftDate < startDate) {
            alert(`❌ CANNOT ASSIGN ${staffMember.name}\\n\\nThis agency worker's contract starts on ${startDate.toLocaleDateString('en-GB')}.\\n\\nShift date (${shiftDate.toLocaleDateString('en-GB')}) is before their start date.`);
            return;
          }

          if (endDate && shiftDate > endDate) {
            alert(`❌ CANNOT ASSIGN ${staffMember.name}\\n\\nThis agency worker's contract ended on ${endDate.toLocaleDateString('en-GB')}.\\n\\nShift date (${shiftDate.toLocaleDateString('en-GB')}) is after their end date.`);
            return;
          }
        }
      }

      // Calculate duration from hours and minutes
      const durationHours = worker.hours + (worker.minutes / 60);

      // Calculate end time from start time + duration
      const [startHour, startMin] = worker.startTime.split(':').map(Number);
      const totalMinutes = startHour * 60 + startMin + worker.hours * 60 + worker.minutes;
      const endHour = Math.floor(totalMinutes / 60) % 24;
      const endMin = totalMinutes % 60;
      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

      // Determine if it's a day or night shift based on start time
      const shiftType = startHour >= 8 && startHour < 20 ? 'Day' : 'Night';

      // Create shift object
      const shift: Shift = {
        id: `SHIFT_${shiftType.toUpperCase()}_${Date.now()}_${i}`,
        staffId: worker.staffId,
        staffName: staffMember.name,
        siteId: shiftForm.siteId,
        siteName: selectedSite.name,
        siteColor: selectedSite.color,
        date: shiftForm.date,
        type: shiftType as 'Day' | 'Night',
        startTime: worker.startTime,
        endTime: endTime,
        duration: Math.round(durationHours),
        is24Hour: false,
        isBank: worker.staffId === 'BANK',
        notes: shiftForm.notes,
        staffStatus: 'pending'
      };

      shiftsToCreate.push(shift);
      assignedWorkers.push(`${staffMember.name} (${durationHours.toFixed(1)}h)`);
    }

    // Validate all shifts (check for conflicts, multiple workers, etc.)
    let needsApproval = false;
    let approvalShift: Shift | null = null;
    const allValidationErrors: string[] = [];

    // First pass: Check ALL shifts for validation errors
    for (const shift of shiftsToCreate) {
      const validation = validateShift(shift);
      if (!validation.valid) {
        // Separate approval-required errors from blocking errors
        const approvalErrors = validation.errors.filter(e =>
          e.includes('MULTIPLE WORKERS') || e.includes('DUPLICATE SHIFT')
        );
        const blockingErrors = validation.errors.filter(e =>
          !e.includes('MULTIPLE WORKERS') && !e.includes('DUPLICATE SHIFT')
        );

        // If there are blocking errors (conflicts, rest period, etc.), stop immediately
        if (blockingErrors.length > 0) {
          allValidationErrors.push(`${shift.staffName}:\n${blockingErrors.join('\n')}`);
        }

        // If only approval errors, mark for approval
        if (approvalErrors.length > 0 && blockingErrors.length === 0) {
          needsApproval = true;
          approvalShift = shift;
        }
      }
    }

    // If there are any blocking errors, show them all and stop
    if (allValidationErrors.length > 0) {
      alert(`CANNOT ASSIGN SHIFT:\\n\\n${allValidationErrors.join('\\n\\n')}`);
      return;
    }

    // If approval needed, show dialog for first conflicting shift
    if (needsApproval && approvalShift) {
      setPendingDuplicateShift({
        shift: approvalShift,
        type: approvalShift.type,
        existing: null,
        allShifts: shiftsToCreate // Store all shifts to create after approval
      });
      setShowDuplicateApproval(true);
      return;
    }

    // All validations passed, create all shifts
    for (const shift of shiftsToCreate) {
      // Check if replacing declined shift
      const declinedShift = shifts.find(s =>
        s.date === shift.date &&
        s.siteId === shift.siteId &&
        s.type === shift.type &&
        s.staffStatus === 'declined'
      );
      if (declinedShift) {
        await removeShift(declinedShift.id);
      }

      await addShift(shift);
    }

    // Refresh shifts from shared data
    setShifts(getShifts());
    console.log('Shifts created and refreshed');

    setShowAssignShift(false);
    setShiftForm({
      siteId: '',
      date: '',
      workerCount: 1,
      workers: [
        {
          staffId: '',
          hours: 0,
          minutes: 0,
          startTime: '08:00'
        }
      ],
      notes: ''
    });

    alert(`✅ SHIFT(S) ASSIGNED!\\n\\n${assignedWorkers.join('\\n')}\\n\\nSite: ${selectedSite.name}\\nDate: ${shiftForm.date}`);
  };

  const handleSplitShift = (shift: Shift) => {
    setSelectedShiftForSplit(shift);
    setSplitForm({
      splitTime: '14:00', // Default middle of a day shift
      newStaffId: '',
      notes: ''
    });
    setShowSplitModal(true);
  };

  const executeSplit = async () => {
    if (!selectedShiftForSplit || !splitForm.newStaffId || !splitForm.splitTime) {
      alert('Please select a new staff member and split time');
      return;
    }

    const { splitTime, newStaffId, notes } = splitForm;
    const originalShift = selectedShiftForSplit;

    // Create the two new shifts
    const part1: Shift = {
      ...originalShift,
      id: `SPLIT_${originalShift.id}_1_${Date.now()}`,
      endTime: splitTime,
      notes: `${originalShift.notes || ''} [Split Part 1]`.trim()
    };

    const newStaff = staff.find(s => String(s.id) === String(newStaffId));
    const part2: Shift = {
      ...originalShift,
      id: `SPLIT_${originalShift.id}_2_${Date.now()}`,
      staffId: newStaffId,
      staffName: newStaff?.name || 'Unknown',
      startTime: splitTime,
      notes: `${notes} [Split Part 2]`.trim(),
      staffStatus: 'pending' // Second part usually needs acceptance
    };

    try {
      // 1. Remove original
      await removeShift(originalShift.id);

      // 2. Add part 1
      await addShift(part1);

      // 3. Add part 2
      await addShift(part2);

      // Refresh
      setShifts(getShifts());
      setShowSplitModal(false);
      alert('Shift split successfully between ' + originalShift.staffName + ' and ' + part2.staffName);
    } catch (error) {
      console.error('Failed to split shift:', error);
      alert('Error splitting shift');
    }
  };

  const handleApprove24Hr = async () => {
    if (!approvalForm.approvedBy || !approvalForm.reason) {
      alert('Please provide approver name and reason');
      return;
    }

    const approvedShift: Shift = {
      ...pending24HrShift,
      approved24HrBy: approvalForm.approvedBy,
      notes: `24HR APPROVED: ${approvalForm.reason}. ${pending24HrShift.notes || ''}`
    };

    // Validate with approval
    const validation = validateShift(approvedShift);

    if (!validation.valid) {
      alert(`CANNOT APPROVE 24-HOUR SHIFT:\n\n${validation.errors.join('\n\n')}`);
      return;
    }

    // Save approved shift to backend database
    await addShift(approvedShift);

    // Refresh shifts from shared data store
    setShifts(getShifts());

    setShow24HrApproval(false);
    setShowAssignShift(false);
    setPending24HrShift(null);
    setApprovalForm({ approvedBy: '', reason: '' });
    setShiftForm({
      siteId: '',
      date: '',
      workerCount: 1,
      workers: [
        {
          staffId: '',
          hours: 0,
          minutes: 0,
          startTime: '08:00'
        }
      ],
      notes: ''
    });
    alert(`24-hour shift approved and assigned!\n\nApproved by: ${approvalForm.approvedBy}`);
  };

  const handleApproveNon24Hr = async () => {
    // NOTE: This function is deprecated with the new multi-worker form
    // It's kept for compatibility but should not be called
    alert('This approval workflow is no longer used. Please use the new multi-worker assignment form.');
    setShowNon24HrApproval(false);
  };

  const handleApproveDuplicateShift = async () => {
    if (!approvalForm.approvedBy || !approvalForm.reason) {
      alert('Please provide approver name and reason');
      return;
    }

    // Get all shifts to create (from pendingDuplicateShift.allShifts if available)
    const shiftsToCreate = pendingDuplicateShift.allShifts || [pendingDuplicateShift.shift];

    // Add approval to all shifts
    const approvedShifts = shiftsToCreate.map((shift: Shift) => ({
      ...shift,
      duplicateShiftApprovedBy: approvalForm.approvedBy,
      notes: `APPROVED: ${approvalForm.reason}. ${shift.notes || ''}`
    }));

    // Validate all shifts with approval
    for (const shift of approvedShifts) {
      const validation = validateShift(shift);
      if (!validation.valid) {
        alert(`CANNOT APPROVE SHIFT:\n\n${validation.errors.join('\n\n')}`);
        return;
      }
    }

    // Save all approved shifts to backend database
    for (const shift of approvedShifts) {
      // Check if replacing declined shift
      const declinedShift = shifts.find(s =>
        s.date === shift.date &&
        s.siteId === shift.siteId &&
        s.type === shift.type &&
        s.staffStatus === 'declined'
      );
      if (declinedShift) {
        await removeShift(declinedShift.id);
      }

      await addShift(shift);
    }

    // Refresh shifts from shared data store
    setShifts(getShifts());

    setShowDuplicateApproval(false);
    setShowAssignShift(false);
    setPendingDuplicateShift(null);
    setApprovalForm({ approvedBy: '', reason: '' });
    setShiftForm({
      siteId: '',
      date: '',
      workerCount: 1,
      workers: [
        {
          staffId: '',
          hours: 0,
          minutes: 0,
          startTime: '08:00'
        }
      ],
      notes: ''
    });

    const workerNames = approvedShifts.map((s: Shift) => `${s.type}: ${s.staffName}`).join('\n');
    alert(`✅ SHIFTS APPROVED AND ASSIGNED!\n\n${workerNames}\n\nApproved by: ${approvalForm.approvedBy}\nReason: ${approvalForm.reason}`);
  };

  const handleDeleteShift = async () => {
    if (!shiftToDelete) return;

    // Check if removing this shift leaves the 24-hour cycle incomplete
    const oppositeShiftType = shiftToDelete.type === 'Day' ? 'Night' : 'Day';
    const oppositeShift = shifts.find(s =>
      s.date === shiftToDelete.date &&
      s.siteId === shiftToDelete.siteId &&
      s.type === oppositeShiftType
    );

    if (oppositeShift) {
      // There's an opposite shift, so removing would break the 24-hour cycle
      const options = [
        `Option 1: Assign a replacement worker for the ${shiftToDelete.type} shift`,
        `Option 2: Approve ${oppositeShift.staffName} for 24-hour shift`,
        `Option 3: Cancel removal (keep current assignment)`
      ];

      const choice = window.prompt(
        `⚠️ COVERAGE REQUIRED\n\n` +
        `Removing this shift will break the 24-hour cycle at ${shiftToDelete.siteName} on ${shiftToDelete.date}.\n\n` +
        `Current coverage:\n` +
        `• ${shiftToDelete.type} Shift: ${shiftToDelete.staffName} (being removed)\n` +
        `• ${oppositeShiftType} Shift: ${oppositeShift.staffName} (will remain)\n\n` +
        `Choose an option:\n` +
        `1 = Assign replacement worker\n` +
        `2 = Approve ${oppositeShift.staffName} for 24hr shift\n` +
        `3 = Cancel removal\n` +
        `4 = Delete complete 24h shift (requires reason)\n\n` +
        `Enter 1, 2, 3, or 4:`
      );

      if (choice === '1') {
        // Remove shift and open assignment modal pre-filled
        await removeShift(shiftToDelete.id);
        setShifts(getShifts());
        setShiftForm({
          siteId: shiftToDelete.siteId,
          date: shiftToDelete.date,
          workerCount: 1,
          workers: [
            {
              staffId: shiftToDelete.type === 'Day' ? '' : oppositeShift.staffId,
              hours: 0,
              minutes: 0,
              startTime: shiftToDelete.type === 'Day' ? '20:00' : '08:00'
            }
          ],
          notes: `Replacement for removed shift`
        });
        setShowDeleteConfirm(false);
        setShiftToDelete(null);
        setShowAssignShift(true);
        return;
      } else if (choice === '2') {
        // Remove shift and convert opposite to 24-hour with approval
        const updated24HrShift = {
          ...oppositeShift,
          is24Hour: true,
          duration: 24,
          startTime: '08:00',
          endTime: '08:00',
          notes: `Converted to 24hr after ${shiftToDelete.type} shift removal`
        };
        setPending24HrShift(updated24HrShift);
        await removeShift(shiftToDelete.id);
        await removeShift(oppositeShift.id);
        setShifts(getShifts());
        setShowDeleteConfirm(false);
        setShiftToDelete(null);
        setShow24HrApproval(true);
        return;
      } else if (choice === '4') {
        // Delete complete 24h shift (both Day and Night) with reason
        const reason = window.prompt(
          `⚠️ DELETE COMPLETE 24H SHIFT\n\n` +
          `This will remove BOTH shifts:\n` +
          `• Day Shift: ${shiftToDelete.type === 'Day' ? shiftToDelete.staffName : oppositeShift.staffName}\n` +
          `• Night Shift: ${shiftToDelete.type === 'Night' ? shiftToDelete.staffName : oppositeShift.staffName}\n\n` +
          `Site: ${shiftToDelete.siteName}\n` +
          `Date: ${shiftToDelete.date}\n\n` +
          `Please provide a reason for deleting this 24h shift:`
        );

        if (reason && reason.trim()) {
          // Delete both shifts from database
          (async () => {
            try {
              const response = await fetch(`https://social-care-backend.onrender.com/api/shifts/clear/${shiftToDelete.siteId}/${shiftToDelete.date}`, {
                method: 'DELETE'
              });

              if (!response.ok) {
                throw new Error('Failed to delete shifts');
              }

              // Remove shifts from database and local state
              await removeShift(shiftToDelete.id);
              await removeShift(oppositeShift.id);
              setShifts(getShifts());
              setShowDeleteConfirm(false);
              setShiftToDelete(null);
              alert(`✅ Complete 24h shift deleted\n\nReason: ${reason}`);
            } catch (error) {
              console.error('Error deleting shifts:', error);
              alert('❌ Failed to delete shifts from database. Please try again.');
              setShowDeleteConfirm(false);
              setShiftToDelete(null);
            }
          })();
          return;
        } else {
          alert('❌ Deletion cancelled. Reason is required.');
          setShowDeleteConfirm(false);
          setShiftToDelete(null);
          return;
        }
      } else {
        // Cancel
        setShowDeleteConfirm(false);
        setShiftToDelete(null);
        return;
      }
    } else {
      // No opposite shift exists, removing would leave NO coverage
      alert(
        `❌ CANNOT REMOVE SHIFT\n\n` +
        `This is the ONLY shift assigned at ${shiftToDelete.siteName} on ${shiftToDelete.date}.\n\n` +
        `Removing it would leave NO COVERAGE for that day.\n\n` +
        `You must assign a replacement before removing this shift.`
      );
      setShowDeleteConfirm(false);
      setShiftToDelete(null);
      return;
    }
  };

  const confirmDeleteShift = (shift: Shift) => {
    setShiftToDelete(shift);
    setShowDeleteConfirm(true);
  };

  const clearDay = async (date: string, siteId: string, siteName: string) => {
    const dayShift = getShiftForSlot(date, siteId, 'Day');
    const nightShift = getShiftForSlot(date, siteId, 'Night');
    const shiftCount = (dayShift ? 1 : 0) + (nightShift ? 1 : 0);

    if (shiftCount === 0) {
      alert('No shifts to clear for this day.');
      return;
    }

    const confirmed = window.confirm(
      `⚠️ CLEAR ALL SHIFTS\n\n` +
      `This will remove ${shiftCount} shift(s) at ${siteName} on ${new Date(date).toLocaleDateString('en-GB')}:\n\n` +
      `${dayShift ? '• Day Shift (' + dayShift.staffName + ')\n' : ''}` +
      `${nightShift ? '• Night Shift (' + nightShift.staffName + ')\n' : ''}` +
      `\nAre you sure you want to continue?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`https://social-care-backend.onrender.com/api/shifts/clear/${siteId}/${date}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to clear shifts');
      }

      const result = await response.json();

      // Remove shifts from database and local state
      if (dayShift) await removeShift(dayShift.id);
      if (nightShift) await removeShift(nightShift.id);
      setShifts(getShifts());

      alert(`✅ ${result.message}`);
    } catch (error) {
      console.error('Error clearing day:', error);
      alert('❌ Failed to clear shifts. Please try again.');
    }
  };

  const getShiftForSlot = (date: string, siteId: string, type: 'Day' | 'Night') => {
    const matchingShifts = shifts.filter(s => {
      const dateMatch = s.date === date;
      const siteMatch = String(s.siteId) === String(siteId);
      const typeMatch = s.type === type;
      return dateMatch && siteMatch && typeMatch;
    });
    return matchingShifts[0];
  };

  const getStaffRotationBalance = (staffId: string | number) => {
    const staffShifts = shifts.filter(s => s.staffId === staffId);
    const siteCount: { [key: string]: number } = {};

    sites.forEach(site => {
      siteCount[site.id] = staffShifts.filter(s => s.siteId === site.id).length;
    });

    const total = staffShifts.length;
    const counts = Object.values(siteCount);
    const balanced = counts.length > 0 ? (Math.max(...counts) - Math.min(...counts) <= 1) : true;

    return { siteCount, total, balanced };
  };

  // Shift Extension Handlers
  const handleExtendShift = (shift: Shift) => {
    setSelectedShiftForExtension(shift);
    setExtensionForm({ hours: '', reason: '', approvedBy: '' });
    setShowExtensionModal(true);
  };

  const handleSubmitExtension = async () => {
    if (!selectedShiftForExtension || !extensionForm.hours) {
      alert('Please enter extension hours');
      return;
    }

    const extensionHours = parseFloat(extensionForm.hours);
    if (isNaN(extensionHours) || extensionHours <= 0 || extensionHours > 12) {
      alert('Extension hours must be between 0 and 12');
      return;
    }

    // Check if approval is required (>3 hours)
    const requiresApproval = extensionHours > 3;

    if (requiresApproval && (!extensionForm.approvedBy || !extensionForm.reason)) {
      alert(
        `⚠️ OVERTIME APPROVAL REQUIRED\n\n` +
        `Extension of ${extensionHours} hours exceeds 3-hour limit.\n\n` +
        `Please provide:\n` +
        `• Approver name (Admin/Manager)\n` +
        `• Reason for extension`
      );
      return;
    }

    // Update the shift with extension
    await updateShift(selectedShiftForExtension.id, {
      extended: true,
      extensionHours,
      extensionReason: extensionForm.reason || 'Extension requested',
      extensionApprovedBy: requiresApproval ? extensionForm.approvedBy : 'Auto-approved (<3hrs)',
      extensionApprovalRequired: requiresApproval,
      duration: selectedShiftForExtension.duration + extensionHours
    });
    setShifts(getShifts());
    setShowExtensionModal(false);
    setSelectedShiftForExtension(null);
    setExtensionForm({ hours: '', reason: '', approvedBy: '' });

    alert(
      `✅ SHIFT EXTENDED\n\n` +
      `Staff: ${selectedShiftForExtension.staffName}\n` +
      `Extension: +${extensionHours} hours\n` +
      `New Duration: ${selectedShiftForExtension.duration + extensionHours} hours\n` +
      `${requiresApproval ? `Approved by: ${extensionForm.approvedBy}` : 'Auto-approved'}`
    );
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setEditShiftForm({
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime
    });
    setShowEditShiftModal(true);
  };

  const handleSubmitEditShift = async () => {
    if (!editingShift) return;

    try {
      // Calculate new duration
      const duration = calculateDuration(editShiftForm.startTime, editShiftForm.endTime);

      // Update the shift
      await updateShift(editingShift.id, {
        date: editShiftForm.date,
        startTime: editShiftForm.startTime,
        endTime: editShiftForm.endTime,
        duration
      });

      setShifts(getShifts());
      setShowEditShiftModal(false);
      setEditingShift(null);
      setEditShiftForm({ date: '', startTime: '', endTime: '' });

      alert(
        `✅ SHIFT UPDATED\n\n` +
        `Staff: ${editingShift.staffName}\n` +
        `New Date: ${editShiftForm.date}\n` +
        `New Time: ${editShiftForm.startTime}-${editShiftForm.endTime}\n` +
        `Duration: ${duration} hours`
      );
    } catch (error: any) {
      alert(`Error updating shift: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px 16px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Sticky Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: '#1a1a1a',
        zIndex: 100,
        paddingTop: '16px',
        paddingBottom: '16px',
        marginBottom: '24px',
        borderBottom: '2px solid #3a3a3a'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              Rota Management
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>
              {new Date(weekDates[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - {new Date(weekDates[6]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => setShowAssignShift(true)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setShowAssignShift(true);
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#9333ea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)'
            }}
          >
            + Assign Shift
          </button>
        </div>

        {/* Declined Shifts Alert */}
        {(() => {
          const declinedShifts = shifts.filter(s => s.staffStatus === 'declined');
          if (declinedShifts.length === 0) return null;
          return (
            <div style={{
              backgroundColor: '#ef444420',
              border: '2px solid #ef4444',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <span style={{ color: '#ef4444', fontSize: '14px', fontWeight: '700' }}>
                  {declinedShifts.length} SHIFT{declinedShifts.length > 1 ? 'S' : ''} DECLINED - 24HR COVERAGE AT RISK
                </span>
              </div>
              <div style={{ color: '#fca5a5', fontSize: '12px' }}>
                {declinedShifts.map((shift, idx) => (
                  <div key={shift.id} style={{ marginBottom: '4px' }}>
                    • {shift.staffName} - {shift.siteName} - {shift.type} Shift on {new Date(shift.date).toLocaleDateString('en-GB')}
                    {shift.declineReason && ` (Reason: ${shift.declineReason})`}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Week Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setSelectedWeek(selectedWeek - 1)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setSelectedWeek(selectedWeek - 1);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            ← Previous
          </button>
          <span style={{ color: 'white', fontSize: '15px', fontWeight: '600', flex: 1, textAlign: 'center' }}>
            Week of {new Date(weekDates[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button
            onClick={() => setSelectedWeek(selectedWeek + 1)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setSelectedWeek(selectedWeek + 1);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4b5563',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Rota Grid */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '1200px' }}>
          {sites.filter(site => site.status === 'Active').map((site) => (
            <div key={site.id} style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'inline-block',
                padding: '8px 16px',
                backgroundColor: '#2a2a2a',
                borderRadius: '8px',
                border: `2px solid ${site.color}`,
                marginBottom: '12px'
              }}>
                <h2 style={{
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: site.color,
                    borderRadius: '50%'
                  }}></div>
                  {site.name}
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '12px', margin: '4px 0 0 22px' }}>
                  {site.address}, {site.location}, {site.postcode}
                </p>
              </div>

              {/* Shift Status Summary */}
              {(() => {
                const siteShifts = shifts.filter(s => s.siteId === site.id && !s.isBank);
                const pendingCount = siteShifts.filter(s => s.staffStatus === 'pending').length;
                const acceptedCount = siteShifts.filter(s => s.staffStatus === 'accepted').length;
                const declinedCount = siteShifts.filter(s => s.staffStatus === 'declined').length;

                if (pendingCount === 0 && acceptedCount === 0 && declinedCount === 0) return null;

                return (
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '16px',
                    marginLeft: '22px'
                  }}>
                    {pendingCount > 0 && (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#f59e0b20',
                        border: '1px solid #f59e0b',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#f59e0b'
                      }}>
                        ⏳ {pendingCount} Pending Response{pendingCount !== 1 ? 's' : ''}
                      </div>
                    )}
                    {acceptedCount > 0 && (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#10b98120',
                        border: '1px solid #10b981',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#10b981'
                      }}>
                        ✓ {acceptedCount} Accepted
                      </div>
                    )}
                    {declinedCount > 0 && (
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#ef444420',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#ef4444'
                      }}>
                        ✗ {declinedCount} Declined
                      </div>
                    )}
                  </div>
                );
              })()}

              <div style={{
                backgroundColor: '#2a2a2a',
                borderRadius: '12px',
                border: '1px solid #3a3a3a',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {weekDates.map((date, index) => {
                    const isTodayDate = isToday(date);
                    return (
                      <div
                        key={date}
                        style={{
                          borderRight: index < 6 ? '1px solid #3a3a3a' : 'none',
                          backgroundColor: isTodayDate ? '#9333ea15' : 'transparent'
                        }}
                      >
                        {/* Day Header */}
                        <div style={{
                          padding: '12px 10px',
                          backgroundColor: isTodayDate ? '#9333ea30' : '#1a1a1a',
                          textAlign: 'center',
                          border: isTodayDate ? '2px solid #9333ea' : 'none',
                          borderBottom: '1px solid #3a3a3a'
                        }}>
                          <div style={{
                            color: isTodayDate ? '#9333ea' : 'white',
                            fontSize: '13px',
                            fontWeight: '600',
                            marginBottom: '2px'
                          }}>
                            {dayNames[index]}
                          </div>
                          <div style={{ color: isTodayDate ? '#9333ea' : '#9ca3af', fontSize: '11px' }}>
                            {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </div>
                          {isTodayDate && (
                            <div style={{
                              color: '#9333ea',
                              fontSize: '10px',
                              fontWeight: '600',
                              marginTop: '4px'
                            }}>
                              TODAY
                            </div>
                          )}
                          {/* Coverage Badge and Clear Day Button */}
                          {(() => {
                            const dayShift = getShiftForSlot(date, site.id, 'Day');
                            const nightShift = getShiftForSlot(date, site.id, 'Night');
                            const coverage = (dayShift ? 1 : 0) + (nightShift ? 1 : 0);
                            const bgColor = coverage === 2 ? '#10b98120' : coverage === 1 ? '#f59e0b20' : '#ef444420';
                            const textColor = coverage === 2 ? '#10b981' : coverage === 1 ? '#f59e0b' : '#ef4444';
                            return (
                              <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                                <div style={{
                                  padding: '2px 6px',
                                  backgroundColor: bgColor,
                                  border: `1px solid ${textColor}40`,
                                  borderRadius: '4px',
                                  display: 'inline-block'
                                }}>
                                  <span style={{ color: textColor, fontSize: '10px', fontWeight: '700' }}>
                                    {coverage}/2
                                  </span>
                                </div>
                                {coverage > 0 && (
                                  <button
                                    onClick={() => clearDay(date, site.id, site.name)}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      clearDay(date, site.id, site.name);
                                    }}
                                    style={{
                                      padding: '3px 8px',
                                      backgroundColor: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '9px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      touchAction: 'manipulation',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    Clear Day
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Day Shift */}
                        <div style={{
                          padding: '10px 8px',
                          borderBottom: '1px solid #3a3a3a',
                          minHeight: '90px'
                        }}>
                          <div style={{ color: '#fbbf24', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
                            DAY
                          </div>
                          {(() => {
                            const shift = getShiftForSlot(date, site.id, 'Day');
                            return shift ? (
                              <div>
                                <div style={{
                                  backgroundColor: shift.staffStatus === 'accepted' ? '#10b98120' : shift.staffStatus === 'declined' ? '#ef444420' : `${site.color}20`,
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  border: shift.staffStatus === 'accepted' ? '2px solid #10b981' : shift.staffStatus === 'declined' ? '2px solid #ef4444' : `1px solid ${site.color}40`,
                                  marginBottom: '6px'
                                }}>
                                  <div style={{
                                    color: shift.isBank ? '#f59e0b' : (shift.staffName && staff.find(s => s.name === shift.staffName && 'agencyName' in s) ? '#10b981' : 'white'),
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    marginBottom: '2px'
                                  }}>
                                    {shift.isBank ? '🏦 ' : ''}{shift.staffName}
                                    {shift.isBank && (() => {
                                      const shiftDate = new Date(shift.date);
                                      const tomorrow = new Date();
                                      tomorrow.setDate(tomorrow.getDate() + 1);
                                      tomorrow.setHours(0, 0, 0, 0);
                                      const isUrgent = shiftDate <= tomorrow;
                                      return (
                                        <span style={{
                                          marginLeft: '4px',
                                          padding: '1px 4px',
                                          backgroundColor: isUrgent ? '#ef444420' : '#f59e0b20',
                                          border: `1px solid ${isUrgent ? '#ef4444' : '#f59e0b'}`,
                                          borderRadius: '3px',
                                          fontSize: '9px',
                                          fontWeight: '700',
                                          letterSpacing: '0.3px',
                                          color: isUrgent ? '#ef4444' : '#f59e0b'
                                        }}>
                                          {isUrgent ? '⚠️ URGENT' : 'PENDING'}
                                        </span>
                                      );
                                    })()}
                                    {!shift.isBank && shift.staffName && staff.find(s => s.name === shift.staffName && 'agencyName' in s) && (
                                      <span style={{
                                        marginLeft: '4px',
                                        padding: '1px 4px',
                                        backgroundColor: '#10b98130',
                                        borderRadius: '3px',
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        letterSpacing: '0.3px'
                                      }}>
                                        AGENCY
                                      </span>
                                    )}
                                    {shift.staffStatus === 'pending' && !shift.isBank && (
                                      <span style={{
                                        marginLeft: '4px',
                                        padding: '1px 4px',
                                        backgroundColor: '#f59e0b20',
                                        border: '1px solid #f59e0b',
                                        borderRadius: '3px',
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        letterSpacing: '0.3px',
                                        color: '#f59e0b'
                                      }}>
                                        ⏳ PENDING
                                      </span>
                                    )}
                                    {shift.staffStatus === 'accepted' && (
                                      <span style={{
                                        marginLeft: '4px',
                                        padding: '1px 4px',
                                        backgroundColor: '#10b98130',
                                        border: '1px solid #10b981',
                                        borderRadius: '3px',
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        letterSpacing: '0.3px',
                                        color: '#10b981'
                                      }}>
                                        ✓ ACCEPTED
                                      </span>
                                    )}
                                    {shift.staffStatus === 'declined' && (
                                      <span style={{
                                        marginLeft: '4px',
                                        padding: '1px 4px',
                                        backgroundColor: '#ef444420',
                                        border: '1px solid #ef4444',
                                        borderRadius: '3px',
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        letterSpacing: '0.3px',
                                        color: '#ef4444'
                                      }}>
                                        ✗ DECLINED
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                                    {shift.startTime}-{shift.endTime}
                                  </div>
                                  {shift.is24Hour && (
                                    <div style={{ color: '#f59e0b', fontSize: '10px', fontWeight: '600', marginTop: '4px' }}>
                                      24HR APPROVED
                                    </div>
                                  )}
                                  {shift.extended && (
                                    <div style={{ color: '#10b981', fontSize: '10px', fontWeight: '600', marginTop: '4px' }}>
                                      +{shift.extensionHours}h EXTENDED
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    onClick={() => handleEditShift(shift)}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      handleEditShift(shift);
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '4px',
                                      backgroundColor: '#3b82f6',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      touchAction: 'manipulation'
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleExtendShift(shift)}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      handleExtendShift(shift);
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '4px',
                                      backgroundColor: '#10b981',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      touchAction: 'manipulation'
                                    }}
                                  >
                                    Extend
                                  </button>
                                  <button
                                    onClick={() => handleSplitShift(shift)}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      handleSplitShift(shift);
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '4px',
                                      backgroundColor: '#8b5cf6',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      touchAction: 'manipulation'
                                    }}
                                  >
                                    Split
                                  </button>
                                  <button
                                    onClick={() => confirmDeleteShift(shift)}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      confirmDeleteShift(shift);
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '4px',
                                      backgroundColor: '#6b7280',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      touchAction: 'manipulation'
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ color: '#6b7280', fontSize: '11px', fontStyle: 'italic' }}>
                                Unassigned
                              </div>
                            );
                          })()}
                        </div>

                        {/* Night Shift */}
                        <div style={{
                          padding: '10px 8px',
                          minHeight: '90px'
                        }}>
                          <div style={{ color: '#6366f1', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
                            NIGHT
                          </div>
                          {(() => {
                            const shift = getShiftForSlot(date, site.id, 'Night');
                            return shift ? (
                              <div>
                                <div style={{
                                  backgroundColor: shift.staffStatus === 'accepted' ? '#10b98120' : shift.staffStatus === 'declined' ? '#ef444420' : `${site.color}20`,
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  border: shift.staffStatus === 'accepted' ? '2px solid #10b981' : shift.staffStatus === 'declined' ? '2px solid #ef4444' : `1px solid ${site.color}40`,
                                  marginBottom: '6px'
                                }}>
                                  <div style={{
                                    color: shift.isBank ? '#f59e0b' : (shift.staffName && staff.find(s => s.name === shift.staffName && 'agencyName' in s) ? '#10b981' : 'white'),
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    marginBottom: '2px'
                                  }}>
                                    {shift.isBank ? '🏦 ' : ''}{shift.staffName}
                                    {shift.isBank && (() => {
                                      const shiftDate = new Date(shift.date);
                                      const tomorrow = new Date();
                                      tomorrow.setDate(tomorrow.getDate() + 1);
                                      tomorrow.setHours(0, 0, 0, 0);
                                      const isUrgent = shiftDate <= tomorrow;
                                      return (
                                        <span style={{
                                          marginLeft: '4px',
                                          padding: '1px 4px',
                                          backgroundColor: isUrgent ? '#ef444420' : '#f59e0b20',
                                          border: `1px solid ${isUrgent ? '#ef4444' : '#f59e0b'}`,
                                          borderRadius: '3px',
                                          fontSize: '9px',
                                          fontWeight: '700',
                                          letterSpacing: '0.3px',
                                          color: isUrgent ? '#ef4444' : '#f59e0b'
                                        }}>
                                          {isUrgent ? '⚠️ URGENT' : 'PENDING'}
                                        </span>
                                      );
                                    })()}
                                    {!shift.isBank && shift.staffName && staff.find(s => s.name === shift.staffName && 'agencyName' in s) && (
                                      <span style={{
                                        marginLeft: '4px',
                                        padding: '1px 4px',
                                        backgroundColor: '#10b98130',
                                        borderRadius: '3px',
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        letterSpacing: '0.3px'
                                      }}>
                                        AGENCY
                                      </span>
                                    )}
                                    {shift.staffStatus === 'pending' && !shift.isBank && (
                                      <span style={{
                                        marginLeft: '4px',
                                        padding: '1px 4px',
                                        backgroundColor: '#f59e0b20',
                                        border: '1px solid #f59e0b',
                                        borderRadius: '3px',
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        letterSpacing: '0.3px',
                                        color: '#f59e0b'
                                      }}>
                                        ⏳ PENDING
                                      </span>
                                    )}
                                    {shift.staffStatus === 'accepted' && (
                                      <span style={{
                                        marginLeft: '4px',
                                        padding: '1px 4px',
                                        backgroundColor: '#10b98130',
                                        border: '1px solid #10b981',
                                        borderRadius: '3px',
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        letterSpacing: '0.3px',
                                        color: '#10b981'
                                      }}>
                                        ✓ ACCEPTED
                                      </span>
                                    )}
                                    {shift.staffStatus === 'declined' && (
                                      <span style={{
                                        marginLeft: '4px',
                                        padding: '1px 4px',
                                        backgroundColor: '#ef444420',
                                        border: '1px solid #ef4444',
                                        borderRadius: '3px',
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        letterSpacing: '0.3px',
                                        color: '#ef4444'
                                      }}>
                                        ✗ DECLINED
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                                    {shift.startTime}-{shift.endTime}
                                  </div>
                                  {shift.is24Hour && (
                                    <div style={{ color: '#f59e0b', fontSize: '10px', fontWeight: '600', marginTop: '4px' }}>
                                      24HR APPROVED
                                    </div>
                                  )}
                                  {shift.extended && (
                                    <div style={{ color: '#10b981', fontSize: '10px', fontWeight: '600', marginTop: '4px' }}>
                                      +{shift.extensionHours}h EXTENDED
                                    </div>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    onClick={() => handleEditShift(shift)}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      handleEditShift(shift);
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '4px',
                                      backgroundColor: '#3b82f6',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      touchAction: 'manipulation'
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleExtendShift(shift)}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      handleExtendShift(shift);
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '4px',
                                      backgroundColor: '#10b981',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      touchAction: 'manipulation'
                                    }}
                                  >
                                    Extend
                                  </button>
                                  <button
                                    onClick={() => handleSplitShift(shift)}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      handleSplitShift(shift);
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '4px',
                                      backgroundColor: '#8b5cf6',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      touchAction: 'manipulation'
                                    }}
                                  >
                                    Split
                                  </button>
                                  <button
                                    onClick={() => confirmDeleteShift(shift)}
                                    onTouchEnd={(e) => {
                                      e.preventDefault();
                                      confirmDeleteShift(shift);
                                    }}
                                    style={{
                                      flex: 1,
                                      padding: '4px',
                                      backgroundColor: '#6b7280',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '10px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      touchAction: 'manipulation'
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ color: '#6b7280', fontSize: '11px', fontStyle: 'italic' }}>
                                Unassigned
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Rotation Balance */}
      <div style={{
        backgroundColor: '#2a2a2a',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #3a3a3a',
        marginTop: '24px'
      }}>
        <h3 style={{ color: 'white', fontSize: '17px', fontWeight: 'bold', marginBottom: '16px' }}>
          Staff Rotation Balance
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {staff.map((s) => {
            const balance = getStaffRotationBalance(s.id);
            return (
              <div key={s.id} style={{
                backgroundColor: '#1a1a1a',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${balance.balanced ? '#10b98140' : '#f59e0b40'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{s.name}</span>
                  <span style={{
                    padding: '3px 8px',
                    backgroundColor: balance.balanced ? '#10b98120' : '#f59e0b20',
                    color: balance.balanced ? '#10b981' : '#f59e0b',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {balance.balanced ? 'Balanced' : 'Unbalanced'}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {sites.map(site => (
                    <span key={site.id} style={{ marginRight: '8px' }}>
                      {site.name.split(' ')[0]}: {balance.siteCount[site.id] || 0}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Total shifts: {balance.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assign Shift Modal */}
      <Modal isOpen={showAssignShift} onClose={() => setShowAssignShift(false)} title="Assign Workers to Site">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Site Selection */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Site *
            </label>
            <select
              value={shiftForm.siteId}
              onChange={(e) => setShiftForm({ ...shiftForm, siteId: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">Select site...</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Date *
            </label>
            <input
              type="date"
              value={shiftForm.date}
              onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Worker Count Selection */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
              How many workers for this site today? *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3, 4].map(count => (
                <label key={count} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: shiftForm.workerCount === count ? '#9333ea20' : '#1a1a1a',
                  border: `1px solid ${shiftForm.workerCount === count ? '#9333ea' : '#3a3a3a'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  <input
                    type="radio"
                    name="workerCount"
                    value={count}
                    checked={shiftForm.workerCount === count}
                    onChange={() => handleWorkerCountChange(count)}
                    style={{ marginRight: '12px', cursor: 'pointer' }}
                  />
                  <span style={{ color: 'white', fontSize: '14px' }}>
                    {count} worker{count > 1 ? 's' : ''}
                    {count >= 3 && <span style={{ color: '#f59e0b', fontSize: '12px', marginLeft: '8px' }}>(requires approval)</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 24-Hour Balance Display - DISABLED */}

          {/* Dynamic Worker Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {shiftForm.workers.map((worker, index) => (
              <div key={index} style={{
                padding: '16px',
                backgroundColor: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px'
              }}>
                <div style={{ color: '#9333ea', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
                  Worker {index + 1}
                </div>

                {/* Staff Selection */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                    Staff *
                  </label>
                  <select
                    value={worker.staffId}
                    onChange={(e) => updateWorker(index, 'staffId', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#0a0a0a',
                      color: 'white',
                      border: '1px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select staff...</option>
                    <option value="BANK" style={{ color: '#f59e0b', fontWeight: 'bold' }}>🏦 BANK (Placeholder)</option>
                    {staff.filter((s: any) => s.status === 'Active').map((s: any) => {
                      const isAgency = 'agencyName' in s;
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} {isAgency ? `(${(s as any).agencyName})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Duration Input */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                      Hours *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={worker.hours}
                      onChange={(e) => updateWorker(index, 'hours', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#0a0a0a',
                        color: 'white',
                        border: '1px solid #3a3a3a',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                      Minutes *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={worker.minutes}
                      onChange={(e) => updateWorker(index, 'minutes', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#0a0a0a',
                        color: 'white',
                        border: '1px solid #3a3a3a',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Start Time */}
                <div>
                  <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={worker.startTime}
                    onChange={(e) => updateWorker(index, 'startTime', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#0a0a0a',
                      color: 'white',
                      border: '1px solid #3a3a3a',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Notes (Optional)
            </label>
            <textarea
              value={shiftForm.notes}
              onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
              placeholder="Add any notes..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
            <button
              onClick={() => setShowAssignShift(false)}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#3a3a3a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAssignShift}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#9333ea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Assign Shifts
            </button>
          </div>
        </div>
      </Modal>

      {/* 24-Hour Approval Modal */}
      <Modal isOpen={show24HrApproval} onClose={() => setShow24HrApproval(false)} title="24-Hour Shift Approval Required">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundColor: '#f59e0b20',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #f59e0b40'
          }}>
            <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Manager Approval Required
            </div>
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>
              This 24-hour shift requires authorization from an admin or site manager before it can be assigned.
            </div>
          </div>

          {pending24HrShift && (
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid #3a3a3a'
            }}>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Shift Details
              </div>
              <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.8' }}>
                <div>Staff: {pending24HrShift.staffName}</div>
                <div>Site: {pending24HrShift.siteName}</div>
                <div>Date: {pending24HrShift.date}</div>
                <div>Duration: 24 hours (Day + Night)</div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Approved By (Admin/Manager Name) *
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={approvalForm.approvedBy}
              onChange={(e) => setApprovalForm({ ...approvalForm, approvedBy: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Reason for 24-Hour Shift *
            </label>
            <textarea
              placeholder="e.g., Covering absence, Emergency coverage, Staff shortage"
              value={approvalForm.reason}
              onChange={(e) => setApprovalForm({ ...approvalForm, reason: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => {
                setShow24HrApproval(false);
                setPending24HrShift(null);
                setApprovalForm({ approvedBy: '', reason: '' });
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setShow24HrApproval(false);
                setPending24HrShift(null);
                setApprovalForm({ approvedBy: '', reason: '' });
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#4b5563',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              Reject
            </button>
            <button
              onClick={handleApprove24Hr}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleApprove24Hr();
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              Approve & Assign
            </button>
          </div>
        </div>
      </Modal>


      {/* Non-24-Hour Approval Modal */}
      <Modal isOpen={showNon24HrApproval} onClose={() => setShowNon24HrApproval(false)} title="Non-24-Hour Shift - Admin Approval Required">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundColor: '#ef444420',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #ef444440'
          }}>
            <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              ⚠️ Shifts Do Not Equal 24 Hours
            </div>
            <div style={{ color: '#9ca3af', fontSize: '13px', marginBottom: '12px' }}>
              The combined day and night shifts do not add up to 24 hours. This requires admin approval.
            </div>
            <div style={{ color: 'white', fontSize: '13px', lineHeight: '1.8' }}>
              <div>Day Shift: {non24HrApprovalForm.dayHours.toFixed(2)} hours</div>
              <div>Night Shift: {non24HrApprovalForm.nightHours.toFixed(2)} hours</div>
              <div style={{ fontWeight: '600', color: '#ef4444' }}>Total: {non24HrApprovalForm.totalHours.toFixed(2)} hours (Expected: 24 hours)</div>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Approved By (Admin Name) *
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={non24HrApprovalForm.approvedBy}
              onChange={(e) => setNon24HrApprovalForm({ ...non24HrApprovalForm, approvedBy: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Reason for Non-24-Hour Shift *
            </label>
            <textarea
              placeholder="e.g., Previous shift overtime, Handover period, Special circumstances"
              value={non24HrApprovalForm.reason}
              onChange={(e) => setNon24HrApprovalForm({ ...non24HrApprovalForm, reason: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => {
                setShowNon24HrApproval(false);
                setPendingNon24HrShifts(null);
                setNon24HrApprovalForm({ approvedBy: '', reason: '', totalHours: 0, dayHours: 0, nightHours: 0 });
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#3a3a3a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApproveNon24Hr}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Approve & Assign
            </button>
          </div>
        </div>
      </Modal>

      {/* Duplicate Shift Approval Modal */}
      <Modal isOpen={showDuplicateApproval} onClose={() => setShowDuplicateApproval(false)} title="Multiple Workers - Approval Required">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundColor: '#f59e0b20',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #f59e0b40'
          }}>
            <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              Admin Approval Required
            </div>
            <div style={{ color: '#9ca3af', fontSize: '13px' }}>
              You are assigning multiple workers to the same shift at the same location. This requires admin authorization.
            </div>
          </div>

          {pendingDuplicateShift && (
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '14px',
              borderRadius: '8px',
              border: '1px solid #3a3a3a'
            }}>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Shift Details
              </div>
              <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.8' }}>
                <div>Existing Worker: {pendingDuplicateShift.existing?.staffName || 'None (New Shift)'}</div>
                <div>New Worker: {pendingDuplicateShift.shift.staffName}</div>
                <div>Site: {pendingDuplicateShift.shift.siteName}</div>
                <div>Date: {pendingDuplicateShift.shift.date}</div>
                <div>Shift Type: {pendingDuplicateShift.type}</div>
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Approved By (Admin Name) *
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={approvalForm.approvedBy}
              onChange={(e) => setApprovalForm({ ...approvalForm, approvedBy: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Reason for Multiple Workers *
            </label>
            <textarea
              placeholder="e.g., High workload, Extra coverage needed, Training new staff"
              value={approvalForm.reason}
              onChange={(e) => setApprovalForm({ ...approvalForm, reason: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none',
                minHeight: '80px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => {
                setShowDuplicateApproval(false);
                setPendingDuplicateShift(null);
                setApprovalForm({ approvedBy: '', reason: '' });
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                setShowDuplicateApproval(false);
                setPendingDuplicateShift(null);
                setApprovalForm({ approvedBy: '', reason: '' });
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#4b5563',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              Reject
            </button>
            <button
              onClick={handleApproveDuplicateShift}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleApproveDuplicateShift();
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              Approve & Assign
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Remove Shift">
        {shiftToDelete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              backgroundColor: '#f59e0b20',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #f59e0b40'
            }}>
              <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Are you sure you want to remove this shift?
              </div>
              <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.8' }}>
                <div><strong>Staff:</strong> {shiftToDelete.staffName}</div>
                <div><strong>Site:</strong> {shiftToDelete.siteName}</div>
                <div><strong>Date:</strong> {shiftToDelete.date}</div>
                <div><strong>Shift:</strong> {shiftToDelete.type} ({shiftToDelete.startTime}-{shiftToDelete.endTime})</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setShowDeleteConfirm(false);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#4b5563',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteShift}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleDeleteShift();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                Remove Shift
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Shift Extension Modal */}
      <Modal isOpen={showExtensionModal} onClose={() => setShowExtensionModal(false)} title="Extend Shift">
        {selectedShiftForExtension && (
          <div>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              ⏱️ Extend Shift
            </h2>

            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #3a3a3a'
            }}>
              <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.8' }}>
                <div><strong style={{ color: 'white' }}>Staff:</strong> {selectedShiftForExtension.staffName}</div>
                <div><strong style={{ color: 'white' }}>Site:</strong> {selectedShiftForExtension.siteName}</div>
                <div><strong style={{ color: 'white' }}>Date:</strong> {selectedShiftForExtension.date}</div>
                <div><strong style={{ color: 'white' }}>Shift:</strong> {selectedShiftForExtension.type} ({selectedShiftForExtension.startTime}-{selectedShiftForExtension.endTime})</div>
                <div><strong style={{ color: 'white' }}>Current Duration:</strong> {selectedShiftForExtension.duration} hours</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Extension Hours * <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '400' }}>(0.5 - 12 hours)</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                placeholder="e.g., 2.5"
                value={extensionForm.hours}
                onChange={(e) => setExtensionForm({ ...extensionForm, hours: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: '2px solid #10b981',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              {parseFloat(extensionForm.hours) > 3 && (
                <div style={{ color: '#f59e0b', fontSize: '11px', marginTop: '6px', fontWeight: '600' }}>
                  ⚠️ Extension {'>'}  3 hours requires manager approval
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Reason for Extension {parseFloat(extensionForm.hours) > 3 && '*'}
              </label>
              <textarea
                placeholder="e.g., Covering late arrival, Emergency situation"
                value={extensionForm.reason}
                onChange={(e) => setExtensionForm({ ...extensionForm, reason: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {parseFloat(extensionForm.hours) > 3 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Approved By (Admin/Manager) *
                </label>
                <input
                  type="text"
                  placeholder="e.g., John Smith (Site Manager)"
                  value={extensionForm.approvedBy}
                  onChange={(e) => setExtensionForm({ ...extensionForm, approvedBy: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1a1a1a',
                    color: 'white',
                    border: '2px solid #f59e0b',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>
            )}

            <div style={{
              backgroundColor: '#3b82f620',
              border: '1px solid #3b82f640',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ color: '#3b82f6', fontSize: '12px', lineHeight: '1.6' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>ℹ️ Extension Rules:</div>
                <div>• Extensions under 3 hours: Auto-approved</div>
                <div>• Extensions over 3 hours: Requires manager approval</div>
                <div>• Maximum extension: 12 hours</div>
                <div>• Must maintain 12-hour rest period before next shift</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowExtensionModal(false);
                  setExtensionForm({ hours: '', reason: '', approvedBy: '' });
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  setShowExtensionModal(false);
                  setExtensionForm({ hours: '', reason: '', approvedBy: '' });
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#4b5563',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitExtension}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleSubmitExtension();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                Extend Shift
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Shift Modal */}
      <Modal isOpen={showEditShiftModal} onClose={() => setShowEditShiftModal(false)} title="Edit Shift">
        {editingShift && (
          <div>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              ✏️ Edit Shift
            </h2>

            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              border: '1px solid #3a3a3a'
            }}>
              <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.8' }}>
                <div><strong style={{ color: 'white' }}>Staff:</strong> {editingShift.staffName}</div>
                <div><strong style={{ color: 'white' }}>Site:</strong> {editingShift.siteName}</div>
                <div><strong style={{ color: 'white' }}>Shift Type:</strong> {editingShift.type}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                Date *
              </label>
              <input
                type="date"
                value={editShiftForm.date}
                onChange={(e) => setEditShiftForm({ ...editShiftForm, date: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#1f2937',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                Start Time *
              </label>
              <input
                type="time"
                value={editShiftForm.startTime}
                onChange={(e) => setEditShiftForm({ ...editShiftForm, startTime: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#1f2937',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                End Time *
              </label>
              <input
                type="time"
                value={editShiftForm.endTime}
                onChange={(e) => setEditShiftForm({ ...editShiftForm, endTime: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#1f2937',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowEditShiftModal(false);
                  setEditShiftForm({ date: '', startTime: '', endTime: '' });
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#4b5563',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEditShift}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Split Shift Modal */}
      <Modal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} title="Split Shift">
        {selectedShiftForSplit && (
          <div>
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              ✂️ Split Shift
            </h2>

            <div style={{
              backgroundColor: '#1f2937',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px',
              border: '1px solid #3a3a3a'
            }}>
              <div style={{ color: '#9ca3af', fontSize: '13px', lineHeight: '1.8' }}>
                <div><strong style={{ color: 'white' }}>Current Staff:</strong> {selectedShiftForSplit.staffName}</div>
                <div><strong style={{ color: 'white' }}>Site:</strong> {selectedShiftForSplit.siteName}</div>
                <div><strong style={{ color: 'white' }}>Full Time:</strong> {selectedShiftForSplit.startTime} - {selectedShiftForSplit.endTime}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                Split Time * (When the new staff member takes over)
              </label>
              <input
                type="time"
                value={splitForm.splitTime}
                onChange={(e) => setSplitForm({ ...splitForm, splitTime: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#1f2937',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                New Staff Member *
              </label>
              <select
                value={splitForm.newStaffId}
                onChange={(e) => setSplitForm({ ...splitForm, newStaffId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#1f2937',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="">Select Staff...</option>
                {staff
                  .filter(s => s.status === 'Active' && s.id !== selectedShiftForSplit.staffId)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                Split Notes (Optional)
              </label>
              <textarea
                value={splitForm.notes}
                onChange={(e) => setSplitForm({ ...splitForm, notes: e.target.value })}
                placeholder="Reason for split..."
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#1f2937',
                  border: '1px solid #3a3a3a',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowSplitModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#4b5563',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={executeSplit}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Split Shift
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Unscheduled Punches Section */}
      <div style={{
        marginTop: '40px',
        padding: '20px',
        backgroundColor: '#111827',
        borderRadius: '12px',
        border: '1px solid #374151'
      }}>
        <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚠️</span> Unscheduled Punches
        </h3>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
          The following punches were recorded via QR scan without a pre-scheduled shift slot. Review and approve them for payroll.
        </p>

        {shifts.filter(s => s.id.startsWith('UNSCHED_')).length === 0 ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: '20px', backgroundColor: '#1f2937', borderRadius: '8px', fontStyle: 'italic' }}>
            No unscheduled punches to review.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {shifts.filter(s => s.id.startsWith('UNSCHED_')).map(punch => (
              <div key={punch.id} style={{
                backgroundColor: '#1f2937',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #3a3a3a',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>{punch.staffName}</div>
                  <div style={{ color: '#9ca3af', fontSize: '13px' }}>
                    {punch.siteName} • {punch.date} • {punch.startTime} - {punch.endTime}
                  </div>
                  {punch.notes && (
                    <div style={{ color: '#f59e0b', fontSize: '12px', marginTop: '4px' }}>
                      Note: {punch.notes}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleSplitShift(punch)}
                    style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => confirmDeleteShift(punch)}
                    style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rota;

