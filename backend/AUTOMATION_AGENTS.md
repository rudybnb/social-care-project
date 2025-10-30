# Automation Agents

This document describes the automation agents built into the Social Care Management System.

## Overview

The system includes 5 automated agents that run on schedule to monitor shifts, send reminders, and generate reports.

## Configuration

### Required Environment Variables

Add these to your `.env` file or Render environment variables:

```env
# Email Configuration (Required for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Social Care System <noreply@socialcare.com>"

# Admin Email (Receives all alerts)
ADMIN_EMAIL=admin@socialcare.com
```

### Gmail Setup

If using Gmail:
1. Enable 2-factor authentication
2. Generate an "App Password" at https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASS`

## Active Agents

### 1. Daily Shift Reminder Agent
- **Schedule:** Every day at 7:00 AM
- **Purpose:** Sends email reminders to staff about their shifts today
- **Recipients:** All staff with shifts today
- **Email includes:** Site, shift type, time range, date

### 2. Coverage Gap Monitor
- **Schedule:** Every hour
- **Purpose:** Checks for unassigned or declined shifts in the next 7 days
- **Recipients:** Admin email
- **Alert includes:** List of gaps with site, shift type, date, and status

### 3. Late Clock-In Detector
- **Schedule:** Every 15 minutes
- **Purpose:** Detects staff who haven't clocked in 15+ minutes after shift start
- **Recipients:** Admin email
- **Alert includes:** Staff name, site, shift type, expected start time

### 4. Weekly Payroll Reporter
- **Schedule:** Every Friday at 5:00 PM
- **Purpose:** Sends weekly payroll summaries to all staff
- **Recipients:** All active staff members
- **Report includes:** 
  - Total hours worked
  - First 20 hours, after 20 hours, night hours breakdown
  - Pay rates and total pay

### 5. Tomorrow Coverage Check
- **Schedule:** Every day at 6:00 PM
- **Purpose:** Checks if tomorrow's shifts are fully covered
- **Recipients:** Admin email
- **Alert includes:** List of unassigned or declined shifts for tomorrow

### 6. Declined Shift Alert (Event-Based)
- **Trigger:** When staff declines a shift
- **Purpose:** Immediately alerts admin of declined shift
- **Recipients:** Admin email
- **Alert includes:** Staff name, site, shift type, date, decline reason

## Testing

### Test Email Configuration

```bash
curl http://localhost:4000/api/health
```

Check server logs for:
```
✅ Email service is ready
```

Or:
```
⚠️  Email service not configured
```

### Manual Testing

You can test agents by temporarily changing the cron schedule in `automationAgents.ts`:

```typescript
// Test every minute instead of 7 AM
cron.schedule('* * * * *', async () => {
  await sendDailyShiftReminders();
});
```

## Logs

All agents log their activity to the console:

```
🤖 Initializing automation agents...
✅ Email service is ready
✅ All automation agents initialized
📋 Active agents:
   - Daily Shift Reminders (7:00 AM)
   - Coverage Gap Monitor (Every hour)
   - Late Clock-In Detector (Every 15 min)
   - Weekly Payroll Reports (Friday 5:00 PM)
   - Tomorrow Coverage Check (6:00 PM)
```

During execution:
```
🔔 Running: Daily Shift Reminder Agent
✅ Sent 3 shift reminders for today

🔍 Running: Coverage Gap Monitor
⚠️  Found 2 coverage gaps

⏰ Running: Late Clock-In Detector
⚠️  Found 1 late clock-ins
```

## Troubleshooting

### Emails not sending

1. Check environment variables are set correctly
2. Verify SMTP credentials
3. Check server logs for email errors
4. Test with a simple email client using same credentials

### Agent not running

1. Check server logs for initialization messages
2. Verify cron syntax is correct
3. Check server timezone (agents use server time)

### Wrong timezone

Agents use the server's timezone. To change:

```typescript
// Set timezone before initializing agents
process.env.TZ = 'Europe/London';
```

## Customization

### Change Schedule

Edit `automationAgents.ts`:

```typescript
// Change from 7 AM to 8 AM
cron.schedule('0 8 * * *', async () => {
  await sendDailyShiftReminders();
});
```

### Change Admin Email

Set in environment variables:

```env
ADMIN_EMAIL=manager@socialcare.com
```

### Add New Agent

1. Create agent function in `automationAgents.ts`
2. Add cron schedule in `initializeAgents()`
3. Add logging for monitoring

Example:

```typescript
// New agent: Send monthly reports
cron.schedule('0 9 1 * *', async () => {
  console.log('📊 Running: Monthly Report Generator');
  await generateMonthlyReports();
});
```

## Email Templates

Email templates are defined in `emailService.ts`. To customize:

1. Edit the HTML in the respective function
2. Change colors, fonts, layout as needed
3. Test with real email addresses

## Performance

- Agents run in background, don't block API requests
- Database queries are optimized with indexes
- Email sending is non-blocking
- Failed emails don't crash the server

## Security

- SMTP credentials stored in environment variables
- Emails sent from configured sender address
- No sensitive data in email logs
- Staff emails only sent to verified addresses

