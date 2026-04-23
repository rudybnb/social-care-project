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

// Send daily payroll report
export async function sendDailyPayrollReport(to: string, reportData: any) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Social Care System" <noreply@socialcare.com>',
    to,
    subject: `📅 Daily Payroll Report - ${reportData.date}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">📅 Daily Payroll Report</h2>
        <p style="color: #6b7280; margin-bottom: 20px;">Report for <strong>${reportData.date}</strong></p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4338ca;">Summary</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Total Staff Worked:</span>
            <strong>${reportData.staffCount}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Total Hours:</span>
            <strong>${reportData.totalHours.toFixed(1)} hrs</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 1.1em; border-top: 1px solid #d1d5db; padding-top: 10px; margin-top: 10px;">
            <span>Total Cost:</span>
            <strong>£${reportData.totalCost}</strong>
          </div>
        </div>

        <div style="margin-top: 30px;">
           <h3 style="border-bottom: 2px solid #e5e7eb; padding-bottom: 5px;">Staff Breakdown</h3>
           <pre style="background: #ffffff; font-family: monospace; white-space: pre-wrap; color: #374151;">${reportData.breakdownText}</pre>
        </div>

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          This is an automated daily report sent to ${to}.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Daily payroll report sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send daily payroll report to ${to}:`, error);
    return false;
  }
}

// Send Remittance Advice
export async function sendRemittanceAdvice(to: string, data: any) {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"Social Care System" <noreply@socialcare.com>',
    to,
    subject: `Remittance Advice - ${data.paymentNo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333;">
        <!-- Header -->
        <div style="margin-bottom: 30px; display: flex; align-items: center;">
          <img src="https://social-care-frontend.onrender.com/quotes/logo.png" alt="Eclesia Family Centre Logo" style="height: 60px; object-fit: contain;" />
        </div>

        <h2 style="color: #2b74b8; margin-bottom: 30px;">REMITTANCE ADVICE</h2>

        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <!-- From Section -->
          <div style="flex: 1;">
            <h3 style="color: #2b74b8; margin: 0 0 10px 0;">From:</h3>
            <p style="margin: 0; line-height: 1.5; color: #2b74b8; font-weight: bold;">
              Eclesia Family Centre Ltd<br>
              65 Nickelby Close<br>
              London<br>
              SE28 8LY
            </p>
          </div>
          
          <!-- Payment Summary Box -->
          <div style="border: 2px solid #ef4444; padding: 20px; width: 300px;">
            <p style="margin: 0 0 15px 0; color: #2b74b8; font-weight: bold;">Payment Total: £${data.paymentTotal}</p>
            <table style="width: 100%; font-size: 14px;">
              <tr><td style="padding-bottom: 5px;">Payment No:</td><td>${data.paymentNo}</td></tr>
              <tr><td style="padding-bottom: 5px;">Payment Date:</td><td>${data.paymentDate}</td></tr>
              <tr><td style="padding-bottom: 5px;">Vendor:</td><td>${data.vendorId || ''}</td></tr>
              <tr><td>Site Name:</td><td>${data.siteName || ''}</td></tr>
            </table>
          </div>
        </div>

        <!-- To Section -->
        <div style="border: 2px solid #ef4444; padding: 20px; width: 300px; margin-bottom: 30px;">
          <h3 style="color: #2b74b8; margin: 0 0 10px 0;">To:</h3>
          <p style="margin: 0; line-height: 1.5;">
            ${data.payeeName}<br>
            ${data.payeeAddress.replace(/\\n/g, '<br>')}
          </p>
        </div>

        <!-- Payment Details Table -->
        <h3 style="color: #2b74b8; margin: 0 0 10px 0;">Payment Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 2px solid #ef4444;">
          <tr>
            <td style="border: 1px solid #ccc; padding: 10px;">Payment Date</td>
            <td style="border: 1px solid #ccc; padding: 10px;">${data.paymentDate}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ccc; padding: 10px;">Payment Method</td>
            <td style="border: 1px solid #ccc; padding: 10px;">Bank Transfer</td>
          </tr>
        </table>

        <!-- Bank Details -->
        <div style="margin-bottom: 30px;">
          <p style="margin: 0 0 10px 0;">Bank Details (Payee):</p>
          <p style="margin: 0; line-height: 1.5;">
            ${data.payeeName}<br>
            ${data.bankName}<br>
            Account Number: ${data.accountNumber}<br>
            Sort Code: ${data.sortCode}
          </p>
        </div>

        <!-- Work Summary Table -->
        <h3 style="color: #2b74b8; margin: 0 0 10px 0;">Work Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #ccc;">
          <tr style="background-color: #f9f9f9;">
            <th style="border: 1px solid #ccc; padding: 10px; text-align: left;">Description of Work</th>
            <th style="border: 1px solid #ccc; padding: 10px; text-align: left;">Dates Covered</th>
            <th style="border: 1px solid #ccc; padding: 10px; text-align: left;">Hours Worked</th>
            <th style="border: 1px solid #ccc; padding: 10px; text-align: left;">Hourly Rate (£)</th>
            <th style="border: 1px solid #ccc; padding: 10px; text-align: left;">Total (£)</th>
          </tr>
          <tr>
            <td style="border: 1px solid #ccc; padding: 10px;">${data.description}</td>
            <td style="border: 1px solid #ccc; padding: 10px;">${data.datesCovered}</td>
            <td style="border: 1px solid #ccc; padding: 10px;">${data.hoursWorked}</td>
            <td style="border: 1px solid #ccc; padding: 10px;">£${data.hourlyRate}</td>
            <td style="border: 1px solid #ccc; padding: 10px;">£${data.paymentTotal}</td>
          </tr>
        </table>

        <p style="margin: 0 0 40px 0;">Payment Total: £${data.paymentTotal}</p>

        <!-- Footer -->
        <div style="border-top: 1px solid #ccc; padding-top: 20px; font-size: 12px; line-height: 1.5;">
          1<br>
          Eclesia Family Center 65 Nickelby Clise SE28 8LY For general payment queries, please call 02035092366, quoting your Payment Reference Number from this remittance advice. If you have not received your payment within 3 working days from the date of this remittance, please contact the Payments Team For general payment queries, please call 02035092366, quoting your Payment Reference number from this remittance advice.
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Remittance Advice sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send Remittance Advice to ${to}:`, error);
    return false;
  }
}
