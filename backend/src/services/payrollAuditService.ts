
import { db } from '../db.js';
import { shifts, staff } from '../schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface AuditResult {
    period: { start: string; end: string };
    staffSummary: StaffAuditSummary[];
    fullReport: string;
}

interface StaffAuditSummary {
    staffName: string;
    totalPay: number;
    totalHours: number;
    weeks: any[];
    notes: string[]; // Unique notes/reasons for this period
}

export async function calculatePayForPeriod(startDate: string, endDate: string): Promise<AuditResult> {
    const allStaff = await db.select().from(staff);

    // Fetch shifts
    const rangeShifts = await db.select().from(shifts)
        .where(and(
            gte(shifts.date, startDate),
            lte(shifts.date, endDate)
        ));

    const staffShifts: Record<string, typeof rangeShifts> = {};
    for (const shift of rangeShifts) {
        if (!shift.staffId) continue;
        if (!staffShifts[shift.staffId]) staffShifts[shift.staffId] = [];
        staffShifts[shift.staffId].push(shift);
    }

    let report = `# Payroll Audit Report\n**Period:** ${startDate} to ${endDate}\n\n`;
    const summaries: StaffAuditSummary[] = [];

    for (const person of allStaff) {
        const myShifts = staffShifts[person.id] || [];
        if (myShifts.length === 0) continue;

        // SKIP placeholders
        if (person.name === 'Bank Management' || person.name === 'Agency') continue;

        let personTotalPay = 0;
        let personTotalHours = 0;

        report += `## 👤 ${person.name} (${person.role})\n`;
        report += `**Source Rates** (from DB 'staff' table):\n`;
        report += `- Standard: £${person.standardRate}\n`;
        report += `- Enhanced: ${person.enhancedRate !== '—' ? '£' + person.enhancedRate : 'N/A'}\n`;
        report += `- Night:    ${person.nightRate !== '—' ? '£' + person.nightRate : 'N/A'}\n\n`;

        // Bucket by Monday-starts
        const weeks: Record<string, typeof rangeShifts> = {};
        for (const shift of myShifts) {
            const date = new Date(shift.date);
            const day = date.getDay(); // 0=Sun, 1=Mon
            // Calculate previous Monday
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(date);
            monday.setDate(diff);
            const mondayStr = monday.toISOString().split('T')[0];

            if (!weeks[mondayStr]) weeks[mondayStr] = [];
            weeks[mondayStr].push(shift);
        }

        const weekSummaries = [];

        // Sort weeks
        const sortedWeeks = Object.keys(weeks).sort();

        for (const weekStart of sortedWeeks) {
            const weeklyShifts = weeks[weekStart];
            report += `### 📅 Week Starting ${weekStart}\n`;

            let dayHours = 0;
            let nightHours = 0;
            const logEntries: string[] = [];

            // Sort shifts by date and time
            weeklyShifts.sort((a, b) => {
                // Primary sort: Date
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                // Secondary sort: Start Time
                return a.startTime.localeCompare(b.startTime);
            });

            // 0. Deduplicate / Handle Overlaps
            const processedShifts: typeof weeklyShifts = [];
            const warnings: string[] = [];

            for (const shift of weeklyShifts) {
                if (processedShifts.length === 0) {
                    processedShifts.push(shift);
                    continue;
                }

                const last = processedShifts[processedShifts.length - 1];

                // Check overlap
                // Only if same date (logic simplified for daily shifts, overnight needs care but we sorted by date)
                if (last.date === shift.date) {
                    const lastStart = new Date(`${last.date}T${last.startTime}:00`);
                    let lastEnd = new Date(`${last.date}T${last.endTime}:00`);
                    if (lastEnd < lastStart) lastEnd.setDate(lastEnd.getDate() + 1);

                    const currStart = new Date(`${shift.date}T${shift.startTime}:00`);
                    let currEnd = new Date(`${shift.date}T${shift.endTime}:00`);
                    if (currEnd < currStart) currEnd.setDate(currEnd.getDate() + 1);

                    // If overlap: Start of current < End of last
                    // (Assuming sorted by start time)
                    if (currStart < lastEnd) {
                        // OVERLAP DETECTED
                        warnings.push(`⚠️ Overlap: ${shift.date} [${last.startTime}-${last.endTime}] vs [${shift.startTime}-${shift.endTime}]`);

                        // Decide providing the "better" shift
                        // 1. Clocked Out wins
                        const lastScore = (last.clockedOut ? 4 : 0) + (last.clockedIn ? 2 : 0);
                        const currScore = (shift.clockedOut ? 4 : 0) + (shift.clockedIn ? 2 : 0);

                        if (currScore > lastScore) {
                            // Replace last with current
                            processedShifts.pop();
                            processedShifts.push(shift);
                            warnings.push(`   -> Kept [${shift.startTime}-${shift.endTime}] (better status)`);
                        } else if (currScore < lastScore) {
                            // Keep last, ignore current
                            warnings.push(`   -> Kept [${last.startTime}-${last.endTime}] (better status)`);
                        } else {
                            // Same status, keep Longest
                            const lastDur = lastEnd.getTime() - lastStart.getTime();
                            const currDur = currEnd.getTime() - currStart.getTime();
                            if (currDur > lastDur) {
                                processedShifts.pop();
                                processedShifts.push(shift);
                                warnings.push(`   -> Kept [${shift.startTime}-${shift.endTime}] (longer)`);
                            } else {
                                warnings.push(`   -> Kept [${last.startTime}-${last.endTime}] (longer/first)`);
                            }
                        }
                    } else {
                        processedShifts.push(shift);
                    }
                } else {
                    processedShifts.push(shift);
                }
            }

            // Print warnings to report
            if (warnings.length > 0) {
                warnings.forEach(w => report += `> ${w}\n`);
                // Also add to weekSummaries or notes if needed?
                // We'll trust the report text for now.
            }

            // 1. Tally Hours (Using Processed Shifts)
            for (const shift of processedShifts) {
                // Determine duration based on Scheduled Times (startTime / endTime)
                // Format: HH:MM. Date: YYYY-MM-DD.

                let hours = 0;
                let timeStr = "Invalid Time";

                try {
                    const start = new Date(`${shift.date}T${shift.startTime}:00`);
                    let end = new Date(`${shift.date}T${shift.endTime}:00`);

                    // Handle overnight shifts (if end < start, assume next day)
                    if (end < start) {
                        end.setDate(end.getDate() + 1);
                    }

                    const durationMs = end.getTime() - start.getTime();
                    hours = durationMs / (1000 * 60 * 60);

                    // Cap/Fix potential weird data
                    if (hours < 0) hours = 0;

                    // Formatting for report
                    const formatTime = (t: string) => t.substring(0, 5); // HH:MM
                    timeStr = `[${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}]`;

                } catch (e) {
                    timeStr = "Error parsing time";
                    hours = 0;
                }

                // Check if Night
                const isNight = shift.type?.toLowerCase().includes('night');

                if (isNight) {
                    nightHours += hours;
                    logEntries.push(`  - ${shift.date} (${shift.type}) ${timeStr}: ${hours.toFixed(2)}h -> **Night Rate**`);
                } else {
                    dayHours += hours;
                    logEntries.push(`  - ${shift.date} (${shift.type}) ${timeStr}: ${hours.toFixed(2)}h -> **Day Logic**`);
                }
            }

            // 2. Calculate Pay
            const standardRate = parseFloat(person.standardRate as string) || 0;
            const enhancedRateStub = (person.enhancedRate && person.enhancedRate !== '—') ? person.enhancedRate : person.standardRate;
            const enhancedRate = parseFloat(enhancedRateStub as string) || 0;

            const nightRateStub = (person.nightRate && person.nightRate !== '—') ? person.nightRate : person.standardRate;
            const nightRate = parseFloat(nightRateStub as string) || 0;

            const first20 = Math.min(dayHours, 20);
            const after20 = Math.max(dayHours - 20, 0);

            const standardPay = first20 * standardRate;
            const enhancedPay = after20 * enhancedRate;
            const nightPay = nightHours * nightRate;
            const totalWeekPay = standardPay + enhancedPay + nightPay;

            personTotalPay += totalWeekPay;
            personTotalHours += (dayHours + nightHours);

            // Add to report
            logEntries.forEach(l => report += l + '\n');
            report += `\n**Calculation (Based on Scheduled Times):**\n`;
            report += `- Day Hours: ${dayHours.toFixed(2)}h\n`;
            report += `  - Standard (First 20h): ${first20.toFixed(2)}h * £${standardRate} = £${standardPay.toFixed(2)}\n`;
            report += `  - Enhanced (Rest):      ${after20.toFixed(2)}h * £${enhancedRate} = £${enhancedPay.toFixed(2)}\n`;
            report += `- Night Hours:            ${nightHours.toFixed(2)}h * £${nightRate} = £${nightPay.toFixed(2)}\n`;
            report += `**Week Total:** £${totalWeekPay.toFixed(2)}\n\n`;

            weekSummaries.push({ weekStart, totalWeekPay, dayHours, nightHours });
        }

        const uniqueNotes = new Set<string>();
        myShifts.forEach(s => {
            if (s.notes) uniqueNotes.add(s.notes);
            if (s.declineReason) uniqueNotes.add(`Declined: ${s.declineReason}`);
        });

        report += `**Total Period Pay: £${personTotalPay.toFixed(2)}** (${personTotalHours.toFixed(2)} hours)\n`;
        report += `---\n\n`;
        summaries.push({
            staffName: person.name,
            totalPay: personTotalPay,
            totalHours: personTotalHours,
            weeks: weekSummaries,
            notes: Array.from(uniqueNotes)
        });
    }

    return {
        period: { start: startDate, end: endDate },
        staffSummary: summaries,
        fullReport: report
    };
}

// Single shift verification (for the Agent)
export async function auditSingleShift(shiftId: string) {
    // Logic: 
    // 1. Fetch shift
    // 2. Fetch staff
    // 3. Determine Rate used for THIS shift.
    // Note: This is tricky because "Enhanced" depends on other shifts in the week.
    // If we want a true audit of "How much did THIS shift cost", we need to know if it fell into the 'First 20' or 'After 20' bucket.
    // Implementation: 
    //   - Fetch all shifts for that week for that staff.
    //   - Re-simulate the week accumulation up to this shift?
    //   - OR, just explain the rule applied.

    // For now, let's just dump the raw rates and the logical categorization.

    const shift = await db.select().from(shifts).where(eq(shifts.id, shiftId)).limit(1).then(r => r[0]);
    if (!shift) throw new Error("Shift not found");

    const person = await db.select().from(staff).where(eq(staff.id, shift.staffId)).limit(1).then(r => r[0]);

    // Get Week Context
    const date = new Date(shift.date);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);
    const mondayStr = monday.toISOString().split('T')[0];
    const nextMonday = new Date(monday);
    nextMonday.setDate(monday.getDate() + 7);
    const nextMondayStr = nextMonday.toISOString().split('T')[0];

    const weekShifts = await db.select().from(shifts)
        .where(and(
            eq(shifts.staffId, shift.staffId),
            gte(shifts.date, mondayStr),
            lte(shifts.date, nextMondayStr) // strict less than?
        ));

    // Calculate position of this shift
    // Sort by date/time
    weekShifts.sort((a, b) => {
        const dtA = new Date(`${a.date}T${a.startTime}`);
        const dtB = new Date(`${b.date}T${b.startTime}`);
        return dtA.getTime() - dtB.getTime();
    });

    let accumulatedDayHours = 0;
    let shiftCost = 0;
    let breakdown = "";

    // Re-run simulation
    for (const s of weekShifts) {
        // Calculate duration from Scheduled Times for ACCURACY with new rule
        let hours = 0;
        try {
            const start = new Date(`${s.date}T${s.startTime}:00`);
            let end = new Date(`${s.date}T${s.endTime}:00`);
            if (end < start) end.setDate(end.getDate() + 1);
            hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            if (hours < 0) hours = 0;
        } catch (e) {
            hours = s.duration || 0; // Fallback
        }

        const isTargetShift = s.id === shift.id;
        const isNight = s.type?.toLowerCase().includes('night');

        if (isNight) {
            const nightRateStub = (person.nightRate && person.nightRate !== '—') ? person.nightRate : person.standardRate;
            const nightRate = parseFloat(nightRateStub as string) || 0;
            const cost = hours * nightRate;
            if (isTargetShift) {
                shiftCost = cost;
                breakdown = `${hours.toFixed(2)}h @ Night Rate (£${nightRate})`;
            }
        } else {
            // Day
            const previousHours = accumulatedDayHours;
            accumulatedDayHours += hours;

            if (isTargetShift) {
                const standardRate = parseFloat(person.standardRate as string) || 0;
                const enhancedRateStub = (person.enhancedRate && person.enhancedRate !== '—') ? person.enhancedRate : person.standardRate;
                const enhancedRate = parseFloat(enhancedRateStub as string) || 0;

                // How much of THIS shift is in the first 20?
                const shiftStartHour = previousHours;
                const shiftEndHour = accumulatedDayHours;

                // Overlap with [0, 20] interval
                const standardOverlap = Math.max(0, Math.min(shiftEndHour, 20) - Math.max(shiftStartHour, 0));
                const enhancedOverlap = hours - standardOverlap;

                shiftCost = (standardOverlap * standardRate) + (enhancedOverlap * enhancedRate);
                breakdown = `${standardOverlap.toFixed(2)}h @ Standard (£${standardRate}) + ${enhancedOverlap.toFixed(2)}h @ Enhanced (£${enhancedRate})`;

                if (enhancedOverlap > 0) {
                    breakdown += `\n(Shift pushed total Day hours from ${previousHours.toFixed(1)} to ${accumulatedDayHours.toFixed(1)}, crossing 20h threshold)`;
                }
            }
        }
    }

    return {
        staffName: person.name,
        site: shift.siteName,
        shiftType: shift.type,
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        duration: shift.duration,
        cost: shiftCost.toFixed(2),
        breakdown: breakdown,
        rawRates: {
            standard: person.standardRate,
            enhanced: person.enhancedRate,
            night: person.nightRate
        }
    };
}
