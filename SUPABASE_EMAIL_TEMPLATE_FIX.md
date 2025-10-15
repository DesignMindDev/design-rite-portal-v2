# Supabase Email Template Fix - Password Reset Redirect Issue

## Problem
Password reset emails redirect to `/forgot-password` instead of `/reset-password`

## Root Cause
The Supabase "Reset Password" email template has a hardcoded redirect URL that overrides the `redirectTo` parameter in our code.

## Solution Steps

### 1. Navigate to Email Templates
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/aeorianxnxpxveoxzhov
2. Click **Authentication** in left sidebar
3. Click **Email Templates** tab

### 2. Edit "Reset Password" Template
Find the template named **"Reset Password"** or **"Confirm recovery"**

### 3. Update Template Code
Look for this line in the template:
```html
<a href="{{ .SiteURL }}/forgot-password">Reset Password</a>
```

**Change it to:**
```html
<a href="{{ .ConfirmationURL }}">Reset Password</a>
```

### 4. Alternative: Full Template Replacement
If the template looks complex, replace it with this clean version:

```html
<h2>Reset your password</h2>

<p>Hi there,</p>

<p>We received a request to reset your password. Click the link below to set a new password:</p>

<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>

<p>This link will expire in 1 hour.</p>

<p>If you didn't request this, you can safely ignore this email.</p>

<p>Thanks,<br>The Design-Rite Team</p>
```

### 5. Key Variables to Use
- ✅ `{{ .ConfirmationURL }}` - Contains the full redirect URL with token
- ❌ `{{ .SiteURL }}/forgot-password` - Hardcoded URL (don't use this)

### 6. Save and Test
1. Click **Save** in Supabase
2. Go to http://localhost:3001/forgot-password
3. Enter email: `dan@design-rite.com`
4. Click "Send Reset Link"
5. Check email - link should now go to `/reset-password` with token

## Expected Flow After Fix
1. User enters email at `/forgot-password`
2. Receives email with link: `http://localhost:3001/reset-password#access_token=...`
3. Clicks link → Lands on `/reset-password` page
4. Enters new password → Redirected to `/dashboard`

## Current Code (Working Correctly)
File: `C:/Users/dkozi/Projects/design-rite-portal-v2/src/app/forgot-password/page.tsx:22`

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`, // ✅ Correct
})
```

## Test Credentials
- **Email**: dan@design-rite.com
- **Password**: TestPassword123! (after reset)
