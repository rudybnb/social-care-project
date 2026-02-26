import { Request, Response } from 'express';
import { db } from './db.js';
import { staff, leaveBalances } from './schema.js';
import { eq, and } from 'drizzle-orm';
import { calculateAccruedLeave } from './utils/leaveAccrual.js';

export async function initializeLeaveBalances(req: Request, res: Response) {
    if (!db) {
        return res.status(500).json({ error: 'Database not configured' });
    }

    try {
        console.log('🚀 Initializing leave balances for all staff...');
        const allStaff = await db.select().from(staff);
        const currentYear = new Date().getFullYear();

        let createdCount = 0;
        let updatedCount = 0;

        for (const member of allStaff) {
            // Check if balance exists for this year
            const [existingBalance] = await db
                .select()
                .from(leaveBalances)
                .where(
                    and(
                        eq(leaveBalances.staffId, member.id),
                        eq(leaveBalances.year, currentYear)
                    )
                )
                .limit(1);

            const hoursAccrued = member.startDate ? calculateAccruedLeave(member.startDate) : 0;

            if (!existingBalance) {
                // Create new balance
                await db.insert(leaveBalances).values({
                    staffId: member.id,
                    staffName: member.name,
                    year: currentYear,
                    totalEntitlement: 112,
                    hoursAccrued: hoursAccrued,
                    hoursUsed: 0,
                    hoursRemaining: 112 - 0,
                    carryOverFromPrevious: 0,
                    carryOverToNext: 0
                });
                console.log(`✅ Created leave balance for ${member.name}`);
                createdCount++;
            } else {
                // Update accrued hours if it's 0 or needs refresh
                if (existingBalance.hoursAccrued !== hoursAccrued) {
                    await db
                        .update(leaveBalances)
                        .set({
                            hoursAccrued: hoursAccrued,
                            updatedAt: new Date()
                        })
                        .where(eq(leaveBalances.id, existingBalance.id));
                    console.log(`✅ Updated leave accrual for ${member.name}: ${hoursAccrued}h`);
                    updatedCount++;
                }
            }
        }

        res.json({
            success: true,
            message: 'Leave balances initialized successfully',
            details: {
                totalStaff: allStaff.length,
                created: createdCount,
                updated: updatedCount,
                year: currentYear
            }
        });
    } catch (error: any) {
        console.error('❌ Error initializing leave balances:', error.message);
        res.status(500).json({
            error: 'Failed to initialize leave balances',
            details: error.message
        });
    }
}
