import { calculatePayForPeriod } from './src/services/payrollAuditService';
import { sendDailyPayrollReport } from './src/services/emailService';
import dotenv from 'dotenv';
import { pool } from './src/db';

dotenv.config();

async function run() {
    const START = '2025-12-14';
    const END = '2026-01-14';
    const EMAIL = 'laurenalecia@ecelsia.co.uk';

    console.log(`🔍 Auditing payroll from ${START} to ${END}...`);

    try {
        const result = await calculatePayForPeriod(START, END);

        // Calculate totals for email
        let totalCost = 0;
        let totalHours = 0;
        let staffCount = 0;
        let breakdownText = "";

        result.staffSummary.forEach(s => {
            if (s.totalHours > 0) {
                staffCount++;
                totalCost += s.totalPay;
                totalHours += s.totalHours;
                breakdownText += `${s.staffName.padEnd(20)} | ${s.totalHours.toFixed(1).padStart(5)}h | £${s.totalPay.toFixed(2).padStart(8)}\n`;
            }
        });

        // Console Output for immediate verification
        console.log('\n==========================================');
        console.log('AUDIT SUMMARY');
        console.log('==========================================');
        console.log(breakdownText);
        console.log('------------------------------------------');
        console.log(`Total Staff: ${staffCount}`);
        console.log(`Total Hours: ${totalHours.toFixed(2)}`);
        console.log(`Total Cost:  £${totalCost.toFixed(2)}`);
        console.log('==========================================\n');

        const reportData = {
            date: `${START} to ${END}`,
            staffCount,
            totalHours,
            totalCost: totalCost.toFixed(2),
            breakdownText
        };

        console.log(`📧 Sending email to ${EMAIL}...`);
        await sendDailyPayrollReport(EMAIL, reportData);
        console.log('✅ Email sent successfully.');

    } catch (error) {
        console.error('❌ Error running audit:', error);
    } finally {
        if (pool) await pool.end();
    }
}

run();
