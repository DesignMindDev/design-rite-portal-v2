# 🚀 Production Monitoring - Quick Start

## Get Started in 3 Minutes

### Step 1: Start the Portal (Required)

**IMPORTANT:** The production monitor needs the Portal API running to fetch health data.

```bash
cd "C:\Users\dkozi\Design-Rite Corp\design-rite-portal-v2"
npm run dev
```

Portal runs on: **http://localhost:3001**

### Step 2: Open the Production Monitor

```bash
cd "C:\Users\dkozi\Design-Rite Corp"
python -m http.server 8080
```

Then open in browser:
**http://localhost:8080/.claude/production-monitor.html**

### Step 3: What You'll See

**4 Main Tabs:**

1. **🌐 Services** - Health status of all 6 services
   - Main Platform (V4)
   - Portal (V2)
   - MCP Harvester
   - Spatial Studio (planned)
   - Creative Studio (planned)
   - Super Agent (optional)

2. **💾 Database** - Supabase metrics
   - Total connections
   - Active connections
   - Slow queries
   - Average query time

3. **⚠️ Errors** - Last 24 hours
   - Severity levels (Critical/High/Medium/Low)
   - Service identification
   - Error messages and timestamps

4. **🚀 Deployments** - Recent deployments
   - Live deployment status
   - Commit information
   - Deploy timestamps

### Step 4: Enable Auto-Refresh

Click the **"Auto-Refresh: OFF"** button to enable automatic updates every 30 seconds.

---

## 🔍 What Each Status Means

### Service Health Colors

- **🟢 Green (Healthy)**: Response time <500ms, all good
- **🟡 Amber (Degraded)**: Response time 500-1000ms, slow but working
- **🔴 Red (Down)**: Timeout or error, service not responding
- **⚫ Gray (Planned)**: Service not yet deployed

### Database Metrics

- **Total Connections**: Total database connections (target: <50)
- **Active Now**: Active connections in last 5 minutes
- **Slow Queries**: Queries taking >3 seconds (target: <5)
- **Avg Query Time**: Average execution time (target: <500ms)

### Error Severity

- **🔴 Critical**: Database/connection/timeout/fatal errors → Immediate action
- **🟠 High**: Failed operations/exceptions → Fix within hours
- **🟡 Medium**: Warnings/deprecations/slow operations → Fix within days
- **⚫ Low**: Info/general notices → Monitor

---

## 🎛️ Portal Admin Dashboard

**Alternative monitoring interface integrated into Portal V2:**

1. Go to: **http://localhost:3001/admin/super**
2. Click the **"Monitoring"** tab
3. See real-time service health, database metrics, and errors

**Features:**
- Same data as production monitor
- Integrated with admin dashboard
- Role-based access (super_admin only)
- Alert preferences configuration

---

## 📊 Monitoring via Render API

**The portal can also fetch live data from Render.com:**

**Endpoint:** `GET /api/admin/render?action=services`

**Actions:**
- `services` - Get all Render services
- `deployments` - Get recent deployments
- `service-details` - Get detailed service info

---

## 🚀 Deploying New Services

### Spatial Studio (Next to Deploy)

1. **Create Render Service:**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect `design-rite-spatial-studio` repo
   - Name: `spatial-studio-api`
   - Runtime: Python 3.11

2. **Environment Variables:**
   ```env
   SUPABASE_URL=https://aeorianxnxpxveoxzhov.supabase.co
   SUPABASE_KEY=<service-role-key>
   OPENAI_API_KEY=<openai-key>
   PORT=8000
   ```

3. **Build Settings:**
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Test:**
   ```bash
   curl https://spatial-studio-api.onrender.com/health
   ```

### Creative Studio (After Spatial Studio)

Same process, different repo: `design-rite-creative-studio`

---

## 🔐 API Keys You Need

**Render API Key (for deployments):**
```
rnd_6o7BYWraBuvow4iZbDpJov4y7gJQ
```

**Add to Portal .env:**
```env
RENDER_API_KEY=rnd_6o7BYWraBuvow4iZbDpJov4y7gJQ
```

---

## 💰 Current vs. Future Costs

**Current Monthly Cost:**
- Main Platform: $25 (Standard)
- Portal: $25 (Standard)
- MCP Harvester: $7 (Starter)
- **Total: $57/month**

**After Full Deployment:**
- Main Platform: $25 (Standard)
- Portal: $25 (Standard)
- MCP Harvester: $7 (Starter)
- Spatial Studio: $25 (Standard)
- Creative Studio: $7 (Starter)
- **Total: $89/month**

**Supabase:** Free tier (upgrade to Pro $25 when needed)

**Grand Total:** ~$89-114/month for complete platform

---

## 🎯 What to Do Next

### Today:
1. ✅ Open production monitor and verify all current services show green
2. ✅ Enable auto-refresh
3. ✅ Check Portal admin monitoring tab

### This Week:
1. 🚧 Deploy Spatial Studio to Render
2. 🚧 Deploy Creative Studio to Render
3. 🚧 Update monitoring dashboards with new service URLs
4. ✅ Test all health endpoints

### This Month:
1. 📊 Review performance baselines
2. 🔔 Set up email alerts for critical errors
3. 📈 Monitor usage patterns and optimize
4. 💪 Decide on Super Agent deployment (optional)

---

## 🆘 Quick Troubleshooting

### Monitor shows all services as "Down" or "Offline"

**Problem:** Portal API not running or not accessible

**Solution (FIXED - October 24, 2025):**
1. The production monitor now uses the Portal monitoring API (server-side checks)
2. Ensure Portal V2 is running: `cd design-rite-portal-v2 && npm run dev`
3. Portal must be on port 3001 for localhost, or https://portal.design-rite.com for production
4. Check browser console for API errors

**Why this happened:**
- Direct browser health checks are blocked by CORS (Cross-Origin Resource Sharing)
- The Portal API performs server-side health checks which bypass CORS
- This is the correct architecture for production monitoring

**Alternative:** Use the Portal admin dashboard at http://localhost:3001/admin/super → Monitoring tab, which always uses server-side checks.

### Portal monitoring shows "Loading..."

**Problem:** API endpoint not responding

**Solutions:**
1. Check Portal is running: http://localhost:3001
2. Verify you're signed in as super_admin
3. Check console for errors
4. Try clicking "Refresh" button

### Render deployment failed

**Solutions:**
1. Check Render logs in dashboard
2. Verify environment variables are set
3. Check build command is correct
4. Try deploying with cache cleared

---

## 📚 Full Documentation

**Comprehensive guides:**
- `RENDER_SERVICES_SETUP.md` - Complete Render setup guide
- `PRODUCTION_MONITORING_COMPLETE.md` - Portal monitoring system docs
- `MONITORING_QUICK_START.md` - Portal monitoring quick start

**Location:**
- `C:\Users\dkozi\Design-Rite Corp\`

---

## ✅ Success Checklist

- [ ] Production monitor opens and loads
- [ ] All current services show status (healthy/down)
- [ ] Database metrics display
- [ ] Error log shows (or "No Errors")
- [ ] Deployments list shows recent deploys
- [ ] Auto-refresh button works
- [ ] Portal admin monitoring tab accessible
- [ ] Render API key configured in Portal .env
- [ ] Ready to deploy Spatial Studio
- [ ] Ready to deploy Creative Studio

---

**Status:** 🟢 All Systems Operational
**Monitoring:** ✅ Active and Ready
**Next Deployment:** 🚧 Spatial Studio

🎉 **You're all set to monitor and deploy!**
