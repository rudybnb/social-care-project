import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { getSites, getStaff, subscribeToSitesChange, Site as SharedSite, StaffMember, getShifts, setShifts as setSharedShifts, subscribeToDataChange, addShift, getAllWorkers } from '../data/sharedData';

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
  approved24HrBy?: string;
  notes?: string;
  extended?: boolean;
  extensionHours?: number;
  extensionReason?: string;
  extensionApprovedBy?: string;
  extensionApprovalRequired?: boolean;
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

  // Subscribe to shift changes from other components
  useEffect(() => {
    const unsubscribe = subscribeToDataChange(() => {
      setShifts(getShifts());
    });
    return unsubscribe;
  }, []);

  // Sync local shifts to shared data whenever they change
  useEffect(() => {
    setSharedShifts(shifts);
  }, [shifts]);

  const [showAssignShift, setShowAssignShift] = useState(false);
  const [show24HrApproval, setShow24HrApproval] = useState(false);
  const [pending24HrShift, setPending24HrShift] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState(0);

  const [shiftForm, setShiftForm] = useState({
    dayStaffId: '',
    nightStaffId: '',
    siteId: '',
    date: '',
    is24Hour: false,
    notes: ''
  });

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

    // NEW RULE: No past date assignments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftDate = new Date(newShift.date);
    shiftDate.setHours(0, 0, 0, 0);
    
    if (shiftDate < today) {
      errors.push(`INVALID DATE: Cannot assign shifts to past dates. Selected date: ${newShift.date}`);
    }

    // R1: No same-shift duplication
    const duplicateShift = shifts.find(s => 
      s.date === newShift.date && 
      s.siteId === newShift.siteId && 
      s.type === newShift.type
    );
    if (duplicateShift) {
      errors.push(`CONFLICT: ${duplicateShift.staffName} is already assigned to ${newShift.type} shift at this site on this date.`);
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

    // R3: 24-hour shift requires admin approval
    if (newShift.is24Hour && !newShift.approved24HrBy) {
      errors.push(`24-hour shifts require admin or site manager approval.`);
    }

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

  const handleAssignShift = async () => {
    // NEW RULE: Must assign both Day and Night shifts together
    if (!shiftForm.dayStaffId || !shiftForm.nightStaffId || !shiftForm.siteId || !shiftForm.date) {
      alert('Please fill in all required fields\n\nYou must assign BOTH Day and Night shifts to complete the 24-hour cycle.');
      return;
    }

    // Check if same worker assigned to both shifts
    if (shiftForm.dayStaffId === shiftForm.nightStaffId && !shiftForm.is24Hour) {
      alert('ERROR: Same worker cannot work both Day and Night shifts unless it\'s a 24-hour shift approved by admin.');
      return;
    }

    const dayStaff = staff.find(s => String(s.id) === String(shiftForm.dayStaffId));
    const nightStaff = staff.find(s => String(s.id) === String(shiftForm.nightStaffId));
    const selectedSite = sites.find(s => String(s.id) === String(shiftForm.siteId));

    if (!dayStaff || !nightStaff || !selectedSite) {
      alert('Invalid staff or site selection');
      return;
    }

    // CHECK IF DAY SHIFT HAS ALREADY PASSED (for same-day assignments)
    const shiftDate = new Date(shiftForm.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftDateOnly = new Date(shiftDate);
    shiftDateOnly.setHours(0, 0, 0, 0);
    
    // If assigning for today and current time is past 20:00 (8pm)
    if (shiftDateOnly.getTime() === today.getTime()) {
      const currentHour = new Date().getHours();
      if (currentHour >= 20) {
        alert(`❌ CANNOT ASSIGN DAY SHIFT\n\nIt is currently ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.\n\nDay shifts (08:00-20:00) have already finished for today.\n\nYou can only assign Night shifts (20:00-08:00) for today.`);
        return;
      }
    }
    
    // AGENCY WORKER VALIDATION
    
    // Check day staff if they're an agency worker
    const isDayAgency = 'agencyName' in dayStaff;
    
    // VALIDATE HOURLY RATE FOR DAY STAFF (if agency)
    if (isDayAgency) {
      const hourlyRate = dayStaff.hourlyRate?.trim();
      if (!hourlyRate || hourlyRate === '' || hourlyRate === '0' || hourlyRate === '0.00') {
        alert(`❌ CANNOT ASSIGN ${dayStaff.name}\n\nThis agency worker does not have an hourly rate configured.\n\nPlease set their hourly rate in the Directory before assigning shifts.`);
        return;
      }
      
      // Validate it's a valid number
      const rateNum = parseFloat(hourlyRate);
      if (isNaN(rateNum) || rateNum <= 0) {
        alert(`❌ CANNOT ASSIGN ${dayStaff.name}\n\nThis agency worker has an invalid hourly rate: "${hourlyRate}"\n\nPlease update their hourly rate in the Directory.`);
        return;
      }
    }
    if (isDayAgency && dayStaff.startDate) {
      const startDate = new Date(dayStaff.startDate);
      const endDate = dayStaff.endDate ? new Date(dayStaff.endDate) : null;
      
      if (shiftDate < startDate) {
        alert(`❌ CANNOT ASSIGN ${dayStaff.name}\n\nThis agency worker's contract starts on ${new Date(dayStaff.startDate).toLocaleDateString('en-GB')}.\n\nShift date (${shiftDate.toLocaleDateString('en-GB')}) is before their start date.`);
        return;
      }
      
      if (endDate && shiftDate > endDate) {
        alert(`❌ CANNOT ASSIGN ${dayStaff.name}\n\nThis agency worker's contract ended on ${endDate.toLocaleDateString('en-GB')}.\n\nShift date (${shiftDate.toLocaleDateString('en-GB')}) is after their end date.`);
        return;
      }
    }
    
    // Check night staff if they're an agency worker
    const isNightAgency = 'agencyName' in nightStaff;
    
    // VALIDATE HOURLY RATE FOR NIGHT STAFF (if agency)
    if (isNightAgency) {
      const hourlyRate = nightStaff.hourlyRate?.trim();
      if (!hourlyRate || hourlyRate === '' || hourlyRate === '0' || hourlyRate === '0.00') {
        alert(`❌ CANNOT ASSIGN ${nightStaff.name}\n\nThis agency worker does not have an hourly rate configured.\n\nPlease set their hourly rate in the Directory before assigning shifts.`);
        return;
      }
      
      // Validate it's a valid number
      const rateNum = parseFloat(hourlyRate);
      if (isNaN(rateNum) || rateNum <= 0) {
        alert(`❌ CANNOT ASSIGN ${nightStaff.name}\n\nThis agency worker has an invalid hourly rate: "${hourlyRate}"\n\nPlease update their hourly rate in the Directory.`);
        return;
      }
    }
    if (isNightAgency && nightStaff.startDate) {
      const startDate = new Date(nightStaff.startDate);
      const endDate = nightStaff.endDate ? new Date(nightStaff.endDate) : null;
      
      if (shiftDate < startDate) {
        alert(`❌ CANNOT ASSIGN ${nightStaff.name}\n\nThis agency worker's contract starts on ${new Date(nightStaff.startDate).toLocaleDateString('en-GB')}.\n\nShift date (${shiftDate.toLocaleDateString('en-GB')}) is before their start date.`);
        return;
      }
      
      if (endDate && shiftDate > endDate) {
        alert(`❌ CANNOT ASSIGN ${nightStaff.name}\n\nThis agency worker's contract ended on ${endDate.toLocaleDateString('en-GB')}.\n\nShift date (${shiftDate.toLocaleDateString('en-GB')}) is after their end date.`);
        return;
      }
    }

    // Create Day shift
    const dayShift: Shift = {
      id: `SHIFT_DAY_${Date.now()}`,
      staffId: shiftForm.dayStaffId,
      staffName: dayStaff.name,
      siteId: shiftForm.siteId,
      siteName: selectedSite.name,
      siteColor: selectedSite.color,
      date: shiftForm.date,
      type: 'Day',
      startTime: '08:00',
      endTime: '20:00',
      duration: 12,
      is24Hour: false,
      notes: shiftForm.notes
    };

    // Create Night shift
    const nightShift: Shift = {
      id: `SHIFT_NIGHT_${Date.now()}`,
      staffId: shiftForm.nightStaffId,
      staffName: nightStaff.name,
      siteId: shiftForm.siteId,
      siteName: selectedSite.name,
      siteColor: selectedSite.color,
      date: shiftForm.date,
      type: 'Night',
      startTime: '20:00',
      endTime: '08:00',
      duration: 12,
      is24Hour: false,
      notes: shiftForm.notes
    };

    // If 24-hour shift (same worker), require approval
    if (shiftForm.is24Hour && shiftForm.dayStaffId === shiftForm.nightStaffId) {
      const combined24HrShift = {
        ...dayShift,
        is24Hour: true,
        duration: 24,
        endTime: '08:00',
        nightShift: nightShift
      };
      setPending24HrShift(combined24HrShift);
      setShow24HrApproval(true);
      return;
    }

    // Validate Day shift
    const dayValidation = validateShift(dayShift);
    if (!dayValidation.valid) {
      alert(`CANNOT ASSIGN DAY SHIFT:\n\n${dayValidation.errors.join('\n\n')}`);
      return;
    }

    // Validate Night shift
    const nightValidation = validateShift(nightShift);
    if (!nightValidation.valid) {
      alert(`CANNOT ASSIGN NIGHT SHIFT:\n\n${nightValidation.errors.join('\n\n')}`);
      return;
    }

    // Both shifts valid, assign them
    console.log('Creating shifts:', { dayShift, nightShift });
    console.log('Current shifts before:', shifts);
    
    // Add shifts to shared data store
    await addShift(dayShift);
    await addShift(nightShift);
    
    // Update local state
    const newShifts = [...shifts, dayShift, nightShift];
    console.log('New shifts after:', newShifts);
    setShifts(newShifts);
    setShowAssignShift(false);
    setShiftForm({
      dayStaffId: '',
      nightStaffId: '',
      siteId: '',
      date: '',
      is24Hour: false,
      notes: ''
    });
    alert(`24-HOUR CYCLE COMPLETED!\n\nDay Shift: ${dayStaff.name}\nNight Shift: ${nightStaff.name}\nSite: ${selectedSite.name}\nDate: ${shiftForm.date}`);
  };

  const handleApprove24Hr = () => {
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

    setShifts([...shifts, approvedShift]);
    setShow24HrApproval(false);
    setShowAssignShift(false);
    setPending24HrShift(null);
    setApprovalForm({ approvedBy: '', reason: '' });
    setShiftForm({
      dayStaffId: '',
      nightStaffId: '',
      siteId: '',
      date: '',
      is24Hour: false,
      notes: ''
    });
    alert(`24-hour shift approved and assigned!\n\nApproved by: ${approvalForm.approvedBy}`);
  };

  const handleDeleteShift = () => {
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
        `3 = Cancel removal\n\n` +
        `Enter 1, 2, or 3:`
      );

      if (choice === '1') {
        // Remove shift and open assignment modal pre-filled
        setShifts(shifts.filter(s => s.id !== shiftToDelete.id));
        setShiftForm({
          dayStaffId: shiftToDelete.type === 'Day' ? '' : oppositeShift.staffId,
          nightStaffId: shiftToDelete.type === 'Night' ? '' : oppositeShift.staffId,
          siteId: shiftToDelete.siteId,
          date: shiftToDelete.date,
          is24Hour: false,
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
        setShifts(shifts.filter(s => s.id !== shiftToDelete.id && s.id !== oppositeShift.id));
        setShowDeleteConfirm(false);
        setShiftToDelete(null);
        setShow24HrApproval(true);
        return;
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

  const getShiftForSlot = (date: string, siteId: string, type: 'Day' | 'Night') => {
    console.log('🔍 getShiftForSlot called:', { date, siteId, type });
    console.log('📋 All shifts:', shifts);
    const matchingShifts = shifts.filter(s => {
      const dateMatch = s.date === date;
      const siteMatch = String(s.siteId) === String(siteId);
      const typeMatch = s.type === type;
      console.log(`  Checking shift ${s.id}:`, { 
        shiftDate: s.date, 
        dateMatch, 
        shiftSiteId: s.siteId, 
        siteMatch, 
        shiftType: s.type, 
        typeMatch,
        allMatch: dateMatch && siteMatch && typeMatch
      });
      return dateMatch && siteMatch && typeMatch;
    });
    console.log('✅ Matching shifts found:', matchingShifts);
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

  const handleSubmitExtension = () => {
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
    const updatedShifts = shifts.map(s => {
      if (s.id === selectedShiftForExtension.id) {
        return {
          ...s,
          extended: true,
          extensionHours,
          extensionReason: extensionForm.reason || 'Extension requested',
          extensionApprovedBy: requiresApproval ? extensionForm.approvedBy : 'Auto-approved (<3hrs)',
          extensionApprovalRequired: requiresApproval,
          duration: s.duration + extensionHours
        };
      }
      return s;
    });

    setShifts(updatedShifts);
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
                          {/* Coverage Badge */}
                          {(() => {
                            const dayShift = getShiftForSlot(date, site.id, 'Day');
                            const nightShift = getShiftForSlot(date, site.id, 'Night');
                            const coverage = (dayShift ? 1 : 0) + (nightShift ? 1 : 0);
                            const bgColor = coverage === 2 ? '#10b98120' : coverage === 1 ? '#f59e0b20' : '#ef444420';
                            const textColor = coverage === 2 ? '#10b981' : coverage === 1 ? '#f59e0b' : '#ef4444';
                            return (
                              <div style={{
                                marginTop: '6px',
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
                                  backgroundColor: `${site.color}20`,
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  border: `1px solid ${site.color}40`,
                                  marginBottom: '6px'
                                }}>
                                  <div style={{ 
                                    color: shift.staffName && staff.find(s => s.name === shift.staffName && 'agencyName' in s) ? '#10b981' : 'white', 
                                    fontSize: '12px', 
                                    fontWeight: '600', 
                                    marginBottom: '2px' 
                                  }}>
                                    {shift.staffName}
                                    {shift.staffName && staff.find(s => s.name === shift.staffName && 'agencyName' in s) && (
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
                                  </div>
                                  <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                                    08:00-20:00
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
                                  backgroundColor: `${site.color}20`,
                                  padding: '6px 8px',
                                  borderRadius: '6px',
                                  border: `1px solid ${site.color}40`,
                                  marginBottom: '6px'
                                }}>
                                  <div style={{ 
                                    color: shift.staffName && staff.find(s => s.name === shift.staffName && 'agencyName' in s) ? '#10b981' : 'white', 
                                    fontSize: '12px', 
                                    fontWeight: '600', 
                                    marginBottom: '2px' 
                                  }}>
                                    {shift.staffName}
                                    {shift.staffName && staff.find(s => s.name === shift.staffName && 'agencyName' in s) && (
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
                                  </div>
                                  <div style={{ color: '#9ca3af', fontSize: '10px' }}>
                                    20:00-08:00
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
      <Modal isOpen={showAssignShift} onClose={() => setShowAssignShift(false)} title="Assign 24-Hour Cycle (Day + Night)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            backgroundColor: '#9333ea20',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #9333ea40'
          }}>
            <div style={{ color: '#9333ea', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>
              24-Hour Cycle Required
            </div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>
              You must assign BOTH Day and Night shifts (with different workers) to complete the 24-hour coverage.
            </div>
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Day Shift Staff (08:00-20:00) *
            </label>
            <select
              value={shiftForm.dayStaffId}
              onChange={(e) => setShiftForm({ ...shiftForm, dayStaffId: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #fbbf2440',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Select Day shift staff...</option>
              {staff.filter(s => s.status === 'Active').map(s => {
                // Check if this is an agency worker (has agencyName property)
                const isAgency = 'agencyName' in s;
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} {isAgency ? '(AGENCY)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Night Shift Staff (20:00-08:00) *
            </label>
            <select
              value={shiftForm.nightStaffId}
              onChange={(e) => setShiftForm({ ...shiftForm, nightStaffId: e.target.value })}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: 'white',
                border: '1px solid #6366f140',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Select Night shift staff...</option>
              {staff.filter(s => s.status === 'Active').map(s => {
                // Check if this is an agency worker (has agencyName property)
                const isAgency = 'agencyName' in s;
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} {isAgency ? '(AGENCY)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

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
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Select site...</option>
              {sites.filter(s => s.status === 'Active').map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

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
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>



          <div style={{
            backgroundColor: '#f59e0b20',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #f59e0b40'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={shiftForm.is24Hour}
                onChange={(e) => setShiftForm({ ...shiftForm, is24Hour: e.target.checked })}
                style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '600' }}>
                24-Hour Shift (Requires Manager Approval)
              </span>
            </label>
          </div>

          <div>
            <label style={{ display: 'block', color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Notes
            </label>
            <textarea
              value={shiftForm.notes}
              onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
              placeholder="Optional notes..."
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
              onClick={() => setShowAssignShift(false)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setShowAssignShift(false);
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
              onClick={handleAssignShift}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleAssignShift();
              }}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#9333ea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation'
              }}
            >
              Assign Shift
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
    </div>
  );
};

export default Rota;

