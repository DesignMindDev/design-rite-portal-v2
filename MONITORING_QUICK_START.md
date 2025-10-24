# 🚀 Production Monitoring - Quick Start Guide

## Get Started in 2 Minutes

### Step 1: Start the Portal

```bash
cd "C:\Users\dkozi\Design-Rite Corp\design-rite-portal-v2"
npm run dev
```

Portal runs on: **http://localhost:3001**

### Step 2: Navigate to Monitoring Dashboard

1. Open browser: http://localhost:3001/admin/super
2. Sign in as **super_admin** user
3. Click the **"Monitoring"** tab

### Step 3: View Real-Time Metrics

You'll see 4 sections:

**1. Service Health Status** (4 services)
- Main Platform (V4)
- Portal (V2)
- MCP Harvester
- Supabase

**2. Database Performance** (4 metrics)
- Total Connections
- Active Connections
- Slow Queries
- Avg Query Time

**3. Recent Errors & Alerts** (last 24 hours)
- Error severity badges
- Service identification
- Error counts
- Timestamps

**4. Alert Preferences** (toggles)
- In-App Notifications
- Email Alerts
- Slack Integration (coming soon)

---

## 🧪 Quick Test

### Test 1: Verify Service Health

**Expected:** All 4 services show status
- **Green badge**: Healthy (response <500ms)
- **Amber badge**: Degraded (response 500-1000ms)
- **Red badge**: Down (timeout/error)

### Test 2: Check Database Metrics

**Expected:** All metrics show numbers (not zeros)
- Total Connections: ~50
- Active Connections: varies
- Slow Queries: 0-5
- Avg Query Time: <500ms

### Test 3: Review Error Logs

**Expected:** Either:
- List of recent errors with severity badges
- OR "No Errors Detected" message with green checkmark

### Test 4: Refresh Data

1. Click **"Refresh"** button (top right)
2. See spinner animation
3. Data updates within 2-3 seconds

---

## 🔍 What to Look For

### Healthy System ✅

- All services: **Green badges**
- Response times: **<500ms**
- Uptime: **>99%**
- Slow queries: **0**
- Errors: **"No Errors Detected"**

### Warning Signs ⚠️

- Any service: **Amber badge** (degraded)
- Response times: **500-1000ms**
- Uptime: **95-99%**
- Slow queries: **1-5**
- Errors: **Medium severity**

### Critical Issues 🚨

- Any service: **Red badge** (down)
- Response times: **>1000ms** or timeout
- Uptime: **<95%**
- Slow queries: **>5**
- Errors: **High or Critical severity**

---

## 🐛 Troubleshooting

### "No monitoring data" message

**Fix:**
1. Check console for errors
2. Verify you're signed in as super_admin
3. Try clicking "Load Monitoring Data" button

### Services showing as "Down"

**Fix:**
1. Verify services are running:
   - Main Platform: http://localhost:3000
   - Portal: http://localhost:3001
   - MCP Harvester: http://localhost:8000
2. Check health endpoints:
   ```bash
   curl http://localhost:3000/api/health
   curl http://localhost:3001/api/health
   curl http://localhost:8000/health
   ```

### API returns 401 Unauthorized

**Fix:**
1. Sign out and sign in again
2. Check your user role in Supabase:
   ```sql
   SELECT * FROM user_roles WHERE user_id = 'your-user-id';
   ```
3. Role must be: `super_admin`, `admin`, or employee role

---

## 📁 Files Changed

**Frontend:**
- `src/app/admin/super/page.tsx` - Added Monitoring tab

**Backend:**
- `src/app/api/admin/monitoring/route.ts` - New monitoring API
- `src/app/api/health/route.ts` - New health check endpoint

**Documentation:**
- `PRODUCTION_MONITORING_COMPLETE.md` - Full implementation details
- `MONITORING_QUICK_START.md` - This file

---

## 🎯 Next Steps

1. **Test Thoroughly**: Try all features in development
2. **Deploy to Staging**: Test with real production data
3. **Set Up Alerts**: Configure email notifications
4. **Monitor Daily**: Check dashboard each morning
5. **Iterate**: Add features based on team feedback

---

## 📞 Need Help?

**Check Documentation:**
- Full details: `PRODUCTION_MONITORING_COMPLETE.md`
- Main platform: `design-rite-v4/CLAUDE.md`
- Portal docs: `design-rite-portal-v2/CLAUDE.md`

**Common Issues:**
- Authentication: Check `useAuth` hook
- API errors: Check console logs
- Database: Verify Supabase service key

---

**Happy Monitoring!** 🎉

The system is production-ready and provides comprehensive visibility into your platform's health.
