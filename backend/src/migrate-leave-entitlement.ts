import { Request, Response } from 'express';
import { db } from './db.js';
import { staff, leaveBalances } from './schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { calculateAccruedLeave } from './utils/leaveAccrual.js';

export async function migrateLeaveEntitlement(req: Request, res: Response) {
    if (!db) {
        return res.status(500).json({ error: 'Database not configured' });
    }

    try {
        console.log('🚀 Starting leave entitlement migration (14 -> 28 days)...');

        // Get all leave balances for the current year
        const currentYear = new Date().getFullYear();
        const existingBalances = await db
            .select()
            .from(leaveBalances)
            .where(eq(leaveBalances.year, currentYear));

        console.log(`Found ${existingBalances.length} balances to migrate.`);

        let migratedCount = 0;

        for (const balance of existingBalances) {
            // Get staff to recalculate accrual
            const [staffMember] = await db
                .select()
                .from(staff)
                .where(eq(staff.id, balance.staffId))
                .limit(1);

            if (!staffMember) {
                console.log(`⚠️ Staff member ${balance.staffId} not found for balance ${balance.id}. Skipping.`);
                continue;
            }

            const newHoursAccrued = staffMember.startDate ? calculateAccruedLeave(staffMember.startDate) : 0;
            const newTotalEntitlement = 224;
            const newHoursRemaining = newTotalEntitlement - balance.hoursUsed;

            await db
                .update(leaveBalances)
                .set({
                    totalEntitlement: newTotalEntitlement,
                    hoursAccrued: newHoursAccrued,
                    hoursRemaining: newHoursRemaining,
                    updatedAt: new Date()
                })
                .where(eq(leaveBalances.id, balance.id));

            console.log(`✅ Migrated ${staffMember.name}: ${balance.totalEntitlement}h -> ${newTotalEntitlement}h, Accrued: ${balance.hoursAccrued}h -> ${newHoursAccrued}h`);
            migratedCount++;
        }

        res.json({
            success: true,
            message: 'Leave entitlement migration completed successfully',
            details: {
                totalBalances: existingBalances.length,
                migratedCount,
                newEntitlementDays: 28,
                newEntitlementHours: 224
            }
        });
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        res.status(500).json({
            error: 'Migration failed',
            details: error.message
        });
    }
}
