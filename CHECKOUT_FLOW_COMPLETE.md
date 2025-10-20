# Complete Checkout Flow - Production Ready

**Status:** ✅ **WORKING END-TO-END**
**Date:** January 20, 2025
**Branch:** `main`

---

## 🎯 Overview

The complete checkout flow from trial signup through password setup is now fully functional in production.

**Live URL:** https://portal.design-rite.com/start-trial

---

## 🔄 The Complete Flow

```
1. User visits portal.design-rite.com/start-trial
2. Selects plan (Starter/Pro, Monthly/Annual)
3. Portal creates Supabase user (unconfirmed email)
4. Redirects to Stripe checkout with user_id in metadata
5. User completes payment with credit card
6. Stripe sends webhook to V4 platform
7. V4 webhook:
   - Creates/updates subscription
   - Detects unconfirmed email
   - Sends Supabase invite email
8. User clicks invite link in email
9. Auth callback (/auth/callback):
   - Verifies invite token
   - Handles session crossover (multiple users)
   - Passes session via URL hash
10. Setup password page (/setup-password):
    - Reads session from URL hash
    - Sets session client-side
    - Displays password form
11. User creates password
12. Redirects to /welcome or /dashboard
13. User can now log in normally
```

---

## 🔧 Technical Implementation

### 1. Portal V2 - User Creation & Checkout

**File:** `src/app/api/stripe/create-public-checkout/route.ts`

**What it does:**
- Checks if user exists in Supabase
- Creates new user if doesn't exist (unconfirmed email)
- Passes `user_id` in Stripe checkout session metadata

```typescript
// Create user in Supabase BEFORE checkout
const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
  email,
  email_confirm: false, // User will confirm via invite email
})

// Pass user_id to Stripe
const session = await stripe.checkout.sessions.create({
  metadata: {
    user_id: authData.user.id,
    tier: tier
  }
})
```

### 2. V4 Webhook - Send Invite Email

**File:** `app/api/stripe/webhook/route.ts` (in design-rite-v4)

**What it does:**
- Receives checkout.session.completed webhook
- Checks if user_id provided in metadata
- Checks if user email is confirmed
- Sends invite email if unconfirmed

```typescript
// Check if user needs invite
const { data: { user } } = await supabase.auth.admin.getUserById(user_id)
const needsInvite = user && !user.email_confirmed_at

if (needsInvite) {
  await supabase.auth.admin.inviteUserByEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_PORTAL_URL}/auth/callback`
  })
}
```

### 3. Auth Callback - Session Transfer via URL Hash

**File:** `src/app/auth/callback/route.ts`

**The Key Innovation:** Pass session via URL hash instead of relying on SSR cookies.

**Why URL Hash?**
- SSR cookies set in route handlers don't propagate to browser
- `NextResponse.redirect()` happens before cookies attach to response
- URL hash is client-side only (not sent to server logs)
- Same pattern used by NextAuth and other major libraries

```typescript
// After verifying token
const sessionData = encodeURIComponent(JSON.stringify({
  access_token: data.session.access_token,
  refresh_token: data.session.refresh_token,
  expires_at: data.session.expires_at,
  user: {
    id: data.user?.id,
    email: data.user?.email
  }
}))

// Redirect with session in URL hash
return NextResponse.redirect(`${origin}/setup-password#session=${sessionData}`)
```

### 4. Setup Password Page - Read Session from Hash

**File:** `src/app/setup-password/page.tsx`

**What it does:**
- Checks URL hash for session data on page load
- Calls `supabase.auth.setSession()` with tokens from URL
- Cleans up hash from browser history
- Displays password form with user email

```typescript
useEffect(() => {
  const hash = window.location.hash
  if (hash && hash.includes('session=')) {
    const sessionParam = hash.split('session=')[1]
    const sessionData = JSON.parse(decodeURIComponent(sessionParam))

    // Set session client-side
    supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token
    }).then(() => {
      // Clean up URL hash
      window.history.replaceState(null, '', window.location.pathname)
      checkUser()
    })
  }
}, [])
```

---

## 🐛 Issues Fixed Along the Way

### Database Issues
1. ✅ **Missing columns** - Added `is_trial`, `max_documents`, `source` to subscriptions table
2. ✅ **Duplicate triggers** - Removed conflicting `on_auth_user_created_subscription` trigger

### Authentication Issues
3. ✅ **localhost:10000 in production** - Fixed origin detection using host header
4. ✅ **Session crossover** - Detect when token user differs from existing session user
5. ✅ **Duplicate token requests** - Handle email scanner duplicate requests gracefully
6. ✅ **localStorage vs cookies** - Removed custom storage config to allow default cookie storage

### The Final Boss
7. ✅ **SSR cookies not propagating** - Switched to URL hash session transfer pattern

---

## 📁 Files Modified (Complete List)

### Portal V2 (`design-rite-portal-v2/`)

**Authentication:**
- `src/app/auth/callback/route.ts` - Session transfer via URL hash
- `src/app/setup-password/page.tsx` - Read hash and set session client-side
- `src/lib/supabase.ts` - Removed custom localStorage config

**Checkout:**
- `src/app/api/stripe/create-public-checkout/route.ts` - User creation before checkout
- `src/app/start-trial/page.tsx` - Trial signup page

**Middleware:**
- `middleware.ts` - Route protection (no changes needed)

### V4 Platform (`design-rite-v4/`)

**Webhook:**
- `app/api/stripe/webhook/route.ts` - Send invite email for portal-created users

### Database (Supabase)

**Migrations:**
- Added `is_trial BOOLEAN` to subscriptions
- Added `max_documents INTEGER` to subscriptions
- Added `source TEXT` to subscriptions
- Removed duplicate trigger `on_auth_user_created_subscription`

---

## 🚀 Deployment

### Portal V2
- **Production:** https://portal.design-rite.com
- **Repository:** https://github.com/DesignMindDev/design-rite-portal-v2
- **Branch:** `main` (auto-deploys to Render)
- **Service:** design-rite-portal-v2 on Render

### V4 Platform
- **Production:** https://design-rite.com
- **Repository:** (private)
- **Branch:** `main`
- **Service:** design-rite-v4 on Render

### Environment Variables Required

**Portal V2:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://aeorianxnxpxveoxzhov.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_APP_URL=https://portal.design-rite.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<stripe-pk>
STRIPE_SECRET_KEY=<stripe-sk>
SUPABASE_SERVICE_KEY=<service-key>
```

**V4 Platform:**
```bash
NEXT_PUBLIC_PORTAL_URL=https://portal.design-rite.com
STRIPE_WEBHOOK_SECRET=<webhook-secret>
SUPABASE_SERVICE_KEY=<service-key>
```

---

## 🧪 Testing

### Manual Test (End-to-End)

1. **Clear browser cookies/cache** (or use incognito)
2. Go to https://portal.design-rite.com/start-trial
3. Select "Starter Monthly" plan
4. Enter email: `test@yourdomain.com`
5. Click "Continue to Checkout"
6. Complete Stripe checkout (test card: `4242 4242 4242 4242`)
7. Check email inbox for invite link
8. Click invite link
9. **Verify browser console logs:**
   ```
   [Setup Password] Found session in URL hash, setting session...
   [Setup Password] ✅ Session set from URL hash for: test@yourdomain.com
   [Setup Password] ✅ User session found: test@yourdomain.com
   ```
10. Create password (meets requirements)
11. Click "Create Password & Continue to Portal"
12. **Verify console logs:**
    ```
    [Setup Password] ✅ Password updated successfully!
    [Setup Password] Redirecting to /welcome...
    ```
13. Should redirect to `/welcome` or `/dashboard`
14. Can now log in normally at `/auth`

### Expected Browser Console Logs (Success)

```
[Setup Password] Found session in URL hash, setting session...
[Setup Password] ✅ Session set from URL hash for: test@example.com
[Setup Password] Checking for user session... (attempt 1)
[Setup Password] Session check: Session found
[Setup Password] ✅ User session found: test@example.com
[Setup Password] Form submitted
[Setup Password] Updating user password...
[Setup Password] ✅ Password updated successfully!
[Setup Password] Redirecting to /welcome...
```

### Expected Server Logs (Render)

```
[Portal Checkout] Creating session for test@example.com, tier: starter
[Portal Checkout] Creating new Supabase user: test@example.com
[Portal Checkout] Created new user: <user-id>
[Checkout] Session created: cs_test_...

[Webhook] Checkout completed - User: <user-id>, Email: test@example.com
[Webhook] User exists but hasn't confirmed email - needs invite
[Webhook] Sending invite email to user <user-id>
[Webhook] ✅ Invite email sent successfully to test@example.com

[Auth Callback] Token verified successfully, user: test@example.com
[Auth Callback] Creating redirect with session tokens in URL hash
[Auth Callback] Invite token verified, redirecting to password setup with session
```

---

## 🔒 Security Considerations

### URL Hash Session Transfer

**Is it secure?**
✅ **YES** - This is the same pattern used by:
- NextAuth.js (cross-domain auth)
- Auth0 (implicit grant flow)
- Many OAuth providers

**Why it's secure:**
- URL hash fragments are **NOT sent to the server** (client-side only)
- Hash is **cleaned from browser history** after reading
- Tokens are **short-lived** (Supabase default: 1 hour)
- Session is **immediately established** on page load
- No different than cookies (which are also client-readable)

**Additional protections:**
- Tokens are URL-encoded
- Session is verified against Supabase on every API call
- User can only set their own password (authenticated session)

---

## 🛠️ Maintenance

### Cleanup Test Users

**Script:** `C:\Users\dkozi\Desktop\nuke-all-test-users.sql`

Run this in Supabase SQL Editor to delete all test users and start fresh:

```sql
-- Delete all @design-rite.com test users
DELETE FROM subscriptions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@design-rite.com'
);
DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@design-rite.com'
);
DELETE FROM profiles WHERE id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@design-rite.com'
);
DELETE FROM auth.users WHERE email LIKE '%@design-rite.com';
```

### Monitoring

**Key metrics to track:**
- Checkout completion rate (Stripe → Email received)
- Email delivery rate (Webhook → User receives email)
- Password setup completion rate (Email → Password set)
- Full funnel conversion (Start trial → Active user)

**Logs to monitor:**
- Portal: Search for `[Portal Checkout]` and `[Auth Callback]`
- V4: Search for `[Webhook]` and email send confirmations
- Browser: Console errors on `/setup-password` page

---

## 📞 Troubleshooting

### User didn't receive invite email

**Check:**
1. Supabase email logs (Project Settings → Auth → Email Templates)
2. V4 webhook logs - Look for "Invite email sent successfully"
3. Email provider spam folder
4. Supabase email quota (free tier: 3 emails/hour)

**Fix:**
- Resend invite manually: Supabase Dashboard → Authentication → Users → Click user → "Send Magic Link"

### Session missing on /setup-password

**Check:**
1. Browser console for `[Setup Password] Found session in URL hash`
2. URL should have `#session=` hash fragment
3. Auth callback logs should show "redirecting to password setup with session"

**Fix:**
- User should click the invite link again (fresh token)
- Clear browser cookies and try again
- Check if URL hash is being stripped by security software

### Password creation fails

**Check:**
1. Browser console for `[Setup Password] Error updating password`
2. Password meets all requirements (8 chars, upper, lower, number, special)
3. Supabase logs for rate limiting or quota issues

**Fix:**
- User should meet password requirements
- Wait a few seconds and try again (rate limiting)
- Check Supabase service status

---

## 🎉 Success Criteria

The checkout flow is considered **fully functional** when:

✅ User can complete Stripe checkout
✅ User receives invite email within 1 minute
✅ User can click invite link and land on password setup page
✅ Password setup page shows user's email (session established)
✅ User can create password successfully
✅ User is redirected to welcome/dashboard
✅ User can log in normally afterwards

**Status:** ✅ **ALL CRITERIA MET** (as of January 20, 2025)

---

## 📚 Related Documentation

- **Stripe Integration:** `STRIPE_SCRIPT_SUMMARY.md` (outdated - can be removed)
- **Supabase Email:** `SUPABASE_EMAIL_TEMPLATE_FIX.md` (outdated - can be removed)
- **Auth Callback:** `AUTH_CALLBACK_IMPLEMENTATION.md` (outdated - superseded by this doc)
- **Password Setup:** `PASSWORD_SETUP_IMPLEMENTATION.md` (outdated - superseded by this doc)
- **Main README:** `README.md` (general project info)

---

**Deployment commits:**
- Session transfer via URL hash: `18aa5325`
- Password form logging: `5dba0dd6`
- All prior fixes: See git history

**Tested and verified by:** Dan Kozich
**Last updated:** January 20, 2025

---

© 2025 Design-Rite Corporation - Portal V2 Checkout Flow
