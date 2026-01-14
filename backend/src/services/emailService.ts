import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test email configuration on startup
export async function testEmailConnection() {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
}

// Send shift reminder email
export async function sendShiftReminder(to: string, staffName: string, shift: any) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Social Care System" <noreply@socialcare.com>',
    to,
    subject: `Shift Reminder: ${shift.shiftType} at ${shift.site}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Shift Reminder</h2>
        <p>Hi <strong>${staffName}</strong>,</p>
        <p>This is a reminder that you have a shift today:</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Site:</strong> ${shift.site}</p>
          <p style="margin: 5px 0;"><strong>Shift Type:</strong> ${shift.shiftType}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${shift.startTime} - ${shift.endTime}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(shift.date).toLocaleDateString()}</p>
        </div>
        <p>Please remember to clock in when you arrive.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated message from Social Care Management System.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Shift reminder sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send shift reminder to ${to}:`, error);
    return false;
  }
}

// Send coverage gap alert to admin
export async function sendCoverageGapAlert(to: string, gaps: any[]) {
  const gapsList = gaps.map(gap => `
    <li style="margin: 10px 0;">
      <strong>${gap.site}</strong> - ${gap.shiftType} on ${new Date(gap.date).toLocaleDateString()}
      ${gap.status === 'declined' ? '<span style="color: #ef4444;">(DECLINED)</span>' : '<span style="color: #f59e0b;">(UNASSIGNED)</span>'}
    </li>
  `).join('');

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Social Care System" <noreply@socialcare.com>',
    to,
    subject: `⚠️ Coverage Gaps Detected - ${gaps.length} Shift${gaps.length > 1 ? 's' : ''} Need Attention`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">⚠️ Coverage Gaps Alert</h2>
        <p>The following shifts require immediate attention:</p>
        <ul style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444;">
          ${gapsList}
        </ul>
        <p><strong>Action Required:</strong> Please assign staff to these shifts or find replacements as soon as possible.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated alert from Social Care Management System.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Coverage gap alert sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send coverage gap alert to ${to}:`, error);
    return false;
  }
}

// Send late clock-in alert
export async function sendLateClockInAlert(to: string, lateShifts: any[]) {
  const lateList = lateShifts.map(shift => `
    <li style="margin: 10px 0;">
      <strong>${shift.staffName}</strong> - ${shift.shiftType} at ${shift.site}
      <br><span style="color: #6b7280; font-size: 12px;">Expected: ${shift.startTime}, Current time: ${new Date().toLocaleTimeString()}</span>
    </li>
  `).join('');

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Social Care System" <noreply@socialcare.com>',
    to,
    subject: `🔔 Late Clock-In Alert - ${lateShifts.length} Staff Member${lateShifts.length > 1 ? 's' : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">🔔 Late Clock-In Alert</h2>
        <p>The following staff members have not clocked in for their shifts:</p>
        <ul style="background-color: #fffbeb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          ${lateList}
        </ul>
        <p><strong>Action Required:</strong> Please contact these staff members to verify their attendance.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated alert from Social Care Management System.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Late clock-in alert sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send late clock-in alert to ${to}:`, error);
    return false;
  }
}

// Send declined shift alert
export async function sendDeclinedShiftAlert(to: string, shift: any) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Social Care System" <noreply@socialcare.com>',
    to,
    subject: `🚨 URGENT: Shift Declined - ${shift.site} ${shift.shiftType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">🚨 Shift Declined</h2>
        <p><strong>${shift.staffName}</strong> has declined their shift:</p>
        <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
          <p style="margin: 5px 0;"><strong>Site:</strong> ${shift.site}</p>
          <p style="margin: 5px 0;"><strong>Shift Type:</strong> ${shift.shiftType}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(shift.date).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${shift.startTime} - ${shift.endTime}</p>
          ${shift.declineReason ? `<p style="margin: 5px 0;"><strong>Reason:</strong> ${shift.declineReason}</p>` : ''}
        </div>
        <p style="color: #ef4444; font-weight: bold;">⚠️ 24-HOUR COVERAGE AT RISK</p>
        <p><strong>Action Required:</strong> Please find a replacement immediately.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated alert from Social Care Management System.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Declined shift alert sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send declined shift alert to ${to}:`, error);
    return false;
  }
}

// Send weekly payroll report
export async function sendWeeklyPayrollReport(to: string, staffName: string, payrollData: any) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Social Care System" <noreply@socialcare.com>',
    to,
    subject: `Weekly Payroll Report - Week of ${payrollData.weekStart}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #8b5cf6;">Weekly Payroll Report</h2>
        <p>Hi <strong>${staffName}</strong>,</p>
        <p>Here is your payroll summary for the week of ${payrollData.weekStart}:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #8b5cf6;">Hours Breakdown</h3>
          <p style="margin: 5px 0;"><strong>Total Hours:</strong> ${payrollData.totalHours}h</p>
          <p style="margin: 5px 0;"><strong>First 20 Hours:</strong> ${payrollData.first20Hours}h @ £${payrollData.standardRate}/h</p>
          <p style="margin: 5px 0;"><strong>After 20 Hours:</strong> ${payrollData.after20Hours}h @ £${payrollData.enhancedRate}/h</p>
          <p style="margin: 5px 0;"><strong>Night Hours:</strong> ${payrollData.nightHours}h @ £${payrollData.nightRate}/h</p>
          
          <h3 style="margin-top: 20px; color: #8b5cf6;">Pay Breakdown</h3>
          <p style="margin: 5px 0;"><strong>Standard Pay:</strong> £${payrollData.standardPay}</p>
          <p style="margin: 5px 0;"><strong>Enhanced Pay:</strong> £${payrollData.enhancedPay}</p>
          <p style="margin: 5px 0;"><strong>Night Pay:</strong> £${payrollData.nightPay}</p>
          <p style="margin: 15px 0 5px 0; font-size: 18px; color: #8b5cf6;"><strong>Total Pay:</strong> £${payrollData.totalPay}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated report from Social Care Management System.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Payroll report sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send payroll report to ${to}:`, error);
    return false;
  }
}

// Send shift audit alert
export async function sendShiftAuditAlert(to: string, auditData: any) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Social Care System" <noreply@socialcare.com>',
    to,
    subject: `💰 Shift Audit: ${auditData.staffName} - ${auditData.date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">💰 Shift Cost Audit</h2>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${auditData.staffName}</h3>
          <p style="margin: 5px 0;"><strong>Site:</strong> ${auditData.site}</p>
          <p style="margin: 5px 0;"><strong>Shift:</strong> ${auditData.shiftType} (${auditData.startTime} - ${auditData.endTime})</p>
          <p style="margin: 5px 0;"><strong>Duration:</strong> ${auditData.duration} hrs</p>
        </div>

        <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
           <h3 style="color: #059669; margin-top: 0;">Financial Breakdown</h3>
           <p style="font-size: 1.25em; font-weight: bold; margin: 10px 0;">Total Cost: £${auditData.cost}</p>
           <p style="white-space: pre-wrap; background: #ecfdf5; padding: 10px; border-radius: 4px;">${auditData.breakdown}</p>
        </div>

        <div style="margin-top: 20px; font-size: 0.9em; color: #6b7280;">
          <p><strong>Raw Rate Data (at time of calculation):</strong></p>
          <ul>
            <li>Standard: £${auditData.rawRates.standard}</li>
            <li>Enhanced: ${auditData.rawRates.enhanced || 'N/A'}</li>
            <li>Night: ${auditData.rawRates.night || 'N/A'}</li>
          </ul>
        </div>

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated verification alert.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Shift audit alert sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send shift audit alert to ${to}:`, error);
    return false;
  }
}


