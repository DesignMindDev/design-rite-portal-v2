# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Design-Rite Portal V2 is a Next.js 15 customer portal for the Design-Rite security proposal platform. It handles user authentication, subscription management, document storage, and provides seamless session transfer to the main Design-Rite platform (v4).

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server (localhost:3001)
npm run build        # Production build
npm start            # Run production server
npm run lint         # Run ESLint
```

### Important Ports
- **Portal (this project)**: `localhost:3001`
- **Main Platform (v4)**: `localhost:3000` (separate repository)
- **Why different ports**: Portal and main platform run simultaneously during development for cross-platform testing

## Architecture Overview

### Core Technology Stack
- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with PKCE flow
- **Storage Key**: `design-rite-portal-auth` (different from main platform)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Lucide icons
- **Notifications**: Sonner (toast)
- **Type Safety**: TypeScript with strict mode

### Cross-Platform Integration

**Critical**: This portal works in tandem with the main Design-Rite v4 platform. They share the same Supabase project but use different storage keys to maintain separate sessions.

**Session Transfer Pattern**:
```typescript
// Portal encodes session tokens and passes via URL hash
const authData = {
  access_token: session.access_token,
  refresh_token: session.refresh_token
}
const encodedAuth = encodeURIComponent(JSON.stringify(authData))
window.location.href = `${mainPlatformUrl}/workspace#auth=${encodedAuth}`

// Main platform (v4) receives and establishes session
await authHelpers.setSessionFromHash()
```

### Path Aliases
TypeScript path aliases are configured in `tsconfig.json`:
- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/lib/*` → `./src/lib/*`
- `@/hooks/*` → `./src/hooks/*`

## Application Structure

### 1. Authentication System

**Pages**:
- `/auth` - Sign in / Sign up
- `/forgot-password` - Request password reset
- `/reset-password` - Set new password from email link
- `/change-password` - Change password when logged in
- `/welcome` - Post-login landing page with action cards

**Key Files**:
- `src/hooks/useAuth.ts` - Authentication hook with state management
- `src/lib/supabase.ts` - Supabase client and auth helpers
- `src/components/ProtectedLayout.tsx` - Auth wrapper for protected pages

**Auth Hook Usage**:
```typescript
const { user, profile, userRole, isEmployee, loading, signIn, signOut, refresh } = useAuth()

// Check if user is employee
if (isEmployee) {
  // Show admin features
}

// Sign in
await signIn(email, password)

// Sign out
await signOut()
```

**Important Auth Notes**:
- ALWAYS use the existing `supabase` client from `@/lib/supabase`
- NEVER create new Supabase client instances (causes "Multiple GoTrueClient" warnings)
- Use `authHelpers.getCurrentSession()` to get current session
- Storage key is `design-rite-portal-auth` (different from main platform)

### 2. Main Portal Pages

**Dashboard** (`/dashboard`):
- Welcome message and quick stats
- Feature cards grid (AI Platform, Documents, Business Tools, etc.)
- Employee access notice
- Upgrade CTA for non-employees
- **Key Feature**: "AI Security Platform" card uses `handleWorkspace()` to transfer session to v4

**Sidebar Navigation** (`src/components/Sidebar.tsx`):
- **Back to Welcome** button (purple gradient, top of nav)
- Standard navigation items (Dashboard, Documents, Tools, etc.)
- Employee-only "Admin Dashboard" button
- Sign out button at bottom
- Collapsible on desktop, mobile-friendly drawer

**Welcome Page** (`/welcome`):
- Post-login landing with action cards
- "Go to Workspace" - Launches v4 workspace with session transfer
- "My Portal" - Navigate to dashboard
- "Upgrade Plan" - Go to subscription page
- "Back to Test Page" - Testing link (development)

### 3. Session Transfer Implementation

**From Portal to V4**:
```typescript
// Located in: src/app/welcome/page.tsx and src/app/dashboard/page.tsx
const handleWorkspace = async () => {
  try {
    console.log('[Portal] Starting workspace redirect...')
    toast.info('Launching Workspace...', { duration: 1500 })

    if (!user) {
      toast.error('Session not found. Please sign in again.')
      return
    }

    // IMPORTANT: Use existing client, don't create new one
    const { authHelpers } = await import('@/lib/supabase')
    const session = await authHelpers.getCurrentSession()

    if (!session) {
      toast.error('Session not found. Please sign in again.')
      return
    }

    console.log('[Portal] Session found, encoding tokens...')

    // Encode tokens in URL hash
    const authData = {
      access_token: session.access_token,
      refresh_token: session.refresh_token
    }
    const encodedAuth = encodeURIComponent(JSON.stringify(authData))

    // Redirect to v4 workspace
    const mainPlatformUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://design-rite.com'

    const workspaceUrl = `${mainPlatformUrl}/workspace#auth=${encodedAuth}`

    console.log('[Portal] Redirecting to:', workspaceUrl)
    window.location.href = workspaceUrl
  } catch (error) {
    console.error('[Portal] Error transferring session:', error)
    toast.error('Failed to launch workspace. Please try again.')
  }
}
```

### 4. Protected Routes Pattern

**Always wrap protected pages**:
```typescript
import ProtectedLayout from '@/components/ProtectedLayout'

export default function MyProtectedPage() {
  return (
    <ProtectedLayout>
      {/* Your page content */}
    </ProtectedLayout>
  )
}
```

**How it works**:
- Checks authentication on mount
- Shows loading spinner while checking
- Redirects to `/auth` if not authenticated
- Renders content with `<Sidebar />` if authenticated

### 5. Key API Patterns

**Supabase Client Usage**:
```typescript
import { supabase, authHelpers } from '@/lib/supabase'

// Query data
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()

// Auth operations
const session = await authHelpers.getCurrentSession()
const user = await authHelpers.getCurrentUser()
await authHelpers.signIn(email, password)
await authHelpers.signOut()
```

**Database Tables**:
- `profiles` - User profile data (id, email, full_name, company)
- `user_roles` - Role assignments (role, domain_override)
- `subscriptions` - Subscription tiers (tier, status, trial_end)
- Additional tables: documents, business_tools, analytics, etc.

### 6. User Roles & Permissions

**Role Hierarchy**:
1. `super_admin` - Full platform control
2. `admin` - Manage standard users
3. `manager` - Team lead features
4. `developer` - Technical access
5. `contractor` - Limited employee access
6. `user` - Standard customer
7. `guest` - Trial/limited access

**Employee Detection**:
```typescript
const { isEmployee } = useAuth()

// isEmployee = true if role is: super_admin, admin, manager, developer, or contractor
if (isEmployee) {
  // Show employee features
  // Display "Employee" badge
  // Show Admin Dashboard link
}
```

## Development Guidelines

### 1. Component Patterns

**Use Server Components by Default**:
```typescript
// Only add 'use client' when necessary
export default function MyComponent() {
  // This is a server component
}

// Add 'use client' for:
'use client' // Hooks, event handlers, browser APIs
export default function InteractiveComponent() {
  const [state, setState] = useState()
  // ...
}
```

### 2. Authentication Checks

**Check auth before sensitive operations**:
```typescript
const { user, loading } = useAuth()

if (loading) {
  return <LoadingSpinner />
}

if (!user) {
  router.push('/auth')
  return null
}

// Proceed with authenticated operations
```

### 3. Cross-Platform Navigation

**To V4 Workspace**:
- Use `handleWorkspace()` pattern (never direct links)
- Always encode session tokens
- Include console.log for debugging
- Show toast notifications for UX

**From V4 Back to Portal**:
- Direct links are OK (v4 handles this)
- Portal URLs: `/dashboard`, `/welcome`, `/auth`

### 4. Toast Notifications

```typescript
import { toast } from 'sonner'

// Success
toast.success('Operation completed!')

// Error
toast.error('Something went wrong')

// Info
toast.info('Loading...', { duration: 1500 })

// Custom
toast('Custom message', {
  description: 'Additional details',
  duration: 2000,
  icon: '👀'
})
```

### 5. Styling with Tailwind

**Use utility classes**:
```typescript
<div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-all">
  {/* Content */}
</div>
```

**Common patterns**:
- Primary colors: `text-primary`, `bg-primary`, `border-primary`
- Purple accent: `from-purple-500 to-purple-600` (gradients)
- Hover effects: `hover:shadow-xl`, `hover:scale-105`, `hover:-translate-y-1`
- Transitions: `transition-all duration-300`

## Common Gotchas

1. **Multiple Supabase Clients**: NEVER create new Supabase clients. Always import from `@/lib/supabase`.

2. **Session Transfer**: Always use URL hash encoding, never query parameters (security).

3. **Port Configuration**: Portal is 3001, main platform is 3000. Update both if changing.

4. **Storage Keys**: Portal uses `design-rite-portal-auth`, v4 uses different key. This is intentional.

5. **Environment Variables**: Always check `process.env.NODE_ENV` for dev vs production URLs.

6. **Protected Routes**: Always wrap authenticated pages with `<ProtectedLayout>`.

7. **Role Checks**: Use `isEmployee` from `useAuth`, not manual role checks.

8. **Cross-Domain Auth**: Both platforms share Supabase project but maintain separate sessions.

## File Organization Principles

- **`src/app/`**: Next.js pages and route handlers
- **`src/components/`**: Reusable React components
- **`src/hooks/`**: Custom React hooks (useAuth, etc.)
- **`src/lib/`**: Utilities, clients, and helpers
- **`src/types/`**: TypeScript type definitions
- **`supabase/`**: Database migrations and schema SQL files
- **`public/`**: Static assets

## Environment Variables

**Required**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Optional**:
```bash
NEXT_PUBLIC_MAIN_PLATFORM_URL=https://design-rite.com
NODE_ENV=development
```

**Important**:
- All `NEXT_PUBLIC_*` vars are exposed to browser
- Never put secrets in `NEXT_PUBLIC_*` variables
- Use server-side env vars for sensitive data

## Deployment

**Platform**: Render (render.com)

**Build Settings**:
```
Build Command: npm install && npm run build
Start Command: npm start
Port: 3001
```

**Pre-Deployment Checklist**:
- ✅ Update environment variables in Render
- ✅ Run Supabase migrations
- ✅ Test authentication flow
- ✅ Verify session transfer to v4
- ✅ Test password reset emails
- ✅ Check RLS policies in Supabase

## Testing Strategy

**Manual Testing Flow**:
1. Sign in at `/auth`
2. Land on `/welcome`
3. Click "Go to Workspace" → Should transfer to v4
4. In v4, click "Back to Portal Dashboard" → Should return
5. Test "Sign Out" → Should redirect to portal auth
6. Test password reset flow
7. Verify all protected routes redirect when not authenticated

## Documentation References

- **Main Platform (v4)**: `design-rite-v4/CLAUDE.md`
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind Docs**: https://tailwindcss.com/docs

## Getting Help

**Common Issues**:
- "Multiple GoTrueClient" warning → Using wrong Supabase client
- Session not transferring → Check URL encoding and hash format
- 401 errors → Check RLS policies in Supabase
- Page not protected → Wrap with `<ProtectedLayout>`

**For Questions**:
- Check this CLAUDE.md file
- Check README.md for setup instructions
- Review existing implementations in codebase
- Check console logs for debugging info

---

**Last Updated**: 2025-01-13 (Portal V2 with cross-platform auth)

**Current Commits**:
- Portal: `407df4c0` - Bidirectional navigation with v4
- V4: `b874bab` - Complete cross-platform auth flow
