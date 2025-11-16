# Social Care Management System - Database Recovery Guide

**Date:** November 16, 2025  
**System:** Social Care Management System  
**Environment:** Production (Render.com)

---

## Executive Summary

This document provides comprehensive guidance for recovering from database schema issues and maintaining the Social Care Management System in production.

### Critical Issue Resolved (Nov 16, 2025)

**Problem:** Staff API was failing with "Failed to fetch staff" error, causing data loss and preventing staff management operations.

**Root Cause:** Database schema mismatch between code expectations and actual database structure:
- Database had `full_name` column, code expected `name`
- Missing columns: `site`, `status`, `standard_rate`, `enhanced_rate`, `night_rate`, `rates`, `pension`, `deductions`, `tax`, `updated_at`
- Automation agents had incorrect import paths (missing `.js` extensions)

**Resolution:** Created and deployed schema fix endpoints that:
1. Renamed `full_name` to `name`
2. Added all missing columns with appropriate defaults
3. Set NOT NULL constraints on required fields
4. Fixed TypeScript/JavaScript import paths for ES modules

---

## System Architecture

### Backend
- **URL:** https://social-care-backend.onrender.com
- **Framework:** Express.js + TypeScript
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL (hosted on Render)
- **Deployment:** Automatic via GitHub push to `main` branch

### Frontend
- **URL:** https://social-care-frontend.onrender.com
- **Framework:** React + Vite
- **Deployment:** Automatic via GitHub push to `main` branch

### Repository
- **GitHub:** https://github.com/rudybnb/social-care-project

---

## Database Schema

### Staff Table (Current Schema)

```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  email TEXT,
  weekly_hours INTEGER DEFAULT 0,
  site TEXT NOT NULL DEFAULT 'All Sites',
  status TEXT NOT NULL DEFAULT 'Active',
  standard_rate DECIMAL(10,2) NOT NULL DEFAULT 12.50,
  enhanced_rate TEXT DEFAULT '—',
  night_rate TEXT DEFAULT '—',
  rates TEXT NOT NULL DEFAULT '£12.50/h',
  pension TEXT DEFAULT '—',
  deductions TEXT DEFAULT '£0.00',
  tax TEXT DEFAULT '—',
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Shifts Table (Current Schema)

```sql
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  site_id UUID REFERENCES sites(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  staff_status TEXT,
  decline_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Recovery Procedures

### 1. Database Schema Verification

**Check if staff table exists and has correct columns:**

```bash
curl -X POST https://social-care-backend.onrender.com/api/create-staff-table \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Staff table verified and updated",
  "action": "updated",
  "columns": ["id", "username", "password", "role", "name", ...]
}
```

### 2. Fix Schema Mismatch

**If columns are missing or incorrectly named:**

```bash
curl -X POST https://social-care-backend.onrender.com/api/fix-staff-schema \
  -H "Content-Type: application/json"
```

**This endpoint will:**
- Rename `full_name` to `name` if needed
- Add all missing columns
- Update NULL values to defaults
- Set NOT NULL constraints

### 3. Run Startup Migrations

**The backend automatically runs migrations on startup:**

```bash
# Check backend logs on Render dashboard
# Look for these messages:
# ✅ Migration 1: Ensuring shifts table has staff_status columns... complete
# ✅ Migration 2: Ensuring staff table has all required columns... complete
# ✅ Migration 3: Ensuring timestamp columns exist... complete
# ✅ All migrations completed successfully!
```

### 4. Verify API Functionality

**Test health endpoint:**
```bash
curl https://social-care-backend.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-16T22:00:00.000Z",
  "database": "connected"
}
```

**Test staff API:**
```bash
curl https://social-care-backend.onrender.com/api/staff
```

**Expected Response:** Array of staff objects (not an error)

### 5. Add Staff Member via API

**If frontend is not working, use direct API call:**

```bash
curl -X POST https://social-care-backend.onrender.com/api/staff \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "password": "temp123",
    "role": "Worker",
    "site": "All Sites",
    "rates": "£12.50/h"
  }'
```

---

## Common Issues and Solutions

### Issue 1: "Failed to fetch staff" Error

**Symptoms:**
- Frontend shows error when accessing Directory page
- Staff API returns `{"error":"Failed to fetch staff"}`

**Diagnosis:**
```bash
# Check if table exists
curl -X POST https://social-care-backend.onrender.com/api/create-staff-table \
  -H "Content-Type: application/json"
```

**Solution:**
```bash
# Fix schema
curl -X POST https://social-care-backend.onrender.com/api/fix-staff-schema \
  -H "Content-Type: application/json"
```

### Issue 2: Module Import Errors

**Symptoms:**
- Backend fails to start
- Error: `Cannot find module '/opt/render/project/src/backend/dist/schema'`

**Cause:** Missing `.js` extensions in TypeScript imports for ES modules

**Solution:**
Ensure all imports in TypeScript files include `.js` extension:

```typescript
// ❌ Wrong
import { staff } from '../schema';

// ✅ Correct
import { staff } from '../schema.js';
```

### Issue 3: Frontend Form Fails to Add Staff

**Symptoms:**
- "Failed to add staff member. Please try again." error
- API works but frontend doesn't

**Diagnosis:**
```bash
# Test API directly
curl -X POST https://social-care-backend.onrender.com/api/staff \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","role":"Worker","site":"All Sites","rates":"£12.50/h"}'
```

**Solution:**
- If API works: Frontend issue (check browser console for errors)
- If API fails: Backend issue (check Render logs)

### Issue 4: Data Not Persisting

**Symptoms:**
- Staff added but disappears after refresh
- Database connection issues

**Diagnosis:**
```bash
# Check database connection
curl https://social-care-backend.onrender.com/api/health
```

**Solution:**
1. Verify `DATABASE_URL` environment variable is set in Render dashboard
2. Check database is not full (Render free tier has 1GB limit)
3. Verify database credentials are correct

---

## Maintenance Tasks

### Weekly Tasks

1. **Backup Database**
   - Use Render dashboard to create manual backup
   - Or use `pg_dump` with DATABASE_URL

2. **Check Logs**
   - Review Render backend logs for errors
   - Check for failed migrations

3. **Verify API Health**
   ```bash
   curl https://social-care-backend.onrender.com/api/health
   ```

### Monthly Tasks

1. **Review Database Size**
   - Check Render dashboard for storage usage
   - Clean up old/unused data if needed

2. **Update Dependencies**
   ```bash
   cd backend && npm outdated
   cd frontend && npm outdated
   ```

3. **Test All CRUD Operations**
   - Add/Edit/Delete staff
   - Add/Edit/Delete shifts
   - Verify data persistence

---

## Emergency Contacts

- **Developer:** Rudy (rudybnb@yahoo.co.uk)
- **Hosting:** Render.com Support
- **Repository:** https://github.com/rudybnb/social-care-project

---

## Deployment Process

### Backend Deployment

1. Make changes to backend code
2. Commit and push to GitHub:
   ```bash
   git add -A
   git commit -m "Description of changes"
   git push origin main
   ```
3. Render automatically detects push and deploys
4. Wait 2-3 minutes for deployment
5. Check logs in Render dashboard
6. Verify health endpoint

### Frontend Deployment

1. Make changes to frontend code
2. Commit and push to GitHub:
   ```bash
   git add -A
   git commit -m "Description of changes"
   git push origin main
   ```
3. Render automatically detects push and deploys
4. Wait 2-3 minutes for deployment
5. Test in browser

---

## Database Migration Endpoints

### Available Endpoints

1. **POST /api/create-staff-table**
   - Creates staff table if it doesn't exist
   - Adds missing columns to existing table
   - Returns current column list

2. **POST /api/fix-staff-schema**
   - Renames `full_name` to `name`
   - Adds all missing columns
   - Updates NULL values
   - Sets NOT NULL constraints

3. **POST /api/admin/migrate-login**
   - Adds `email`, `username`, `password`, `weekly_hours` columns
   - Legacy endpoint (use fix-staff-schema instead)

4. **POST /api/admin/migrate-staff-status**
   - Adds `staff_status` and `decline_reason` to shifts table
   - Legacy endpoint

---

## Current System Status (Nov 16, 2025)

✅ **Backend:** Running and healthy  
✅ **Frontend:** Running and accessible  
✅ **Database:** Connected and schema fixed  
✅ **Staff API:** Working correctly  
✅ **Data Persistence:** Verified working  
✅ **Migrations:** All completed successfully  

**Staff Count:** 3 (System Administrator, Test Worker, Rudy Diedericks)  
**Shifts Count:** 0 (ready for production data)

---

## Next Steps for Production Launch

1. ✅ Database schema fixed
2. ✅ Staff CRUD operations verified
3. ⚠️  Frontend form issue (minor - API works)
4. 📋 Import production staff data
5. 📋 Import historical shift data
6. 📋 Configure email notifications (SMTP settings)
7. 📋 Set up automated backups
8. 📋 Configure monitoring/alerts

---

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-16 | 1.0 | Initial recovery guide created | Manus AI |

---

**End of Document**

