# Design-Rite Portal V2

> Customer portal for Design-Rite security system proposal platform. Handles authentication, subscriptions, document management, and seamless integration with the main Design-Rite platform.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account and project

### Installation

```bash
# Clone the repository
git clone https://github.com/DesignMindDev/design-rite-portal-v2.git

# Navigate to project directory
cd design-rite-portal-v2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to view the portal.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Authentication Flow](#authentication-flow)
- [Cross-Platform Integration](#cross-platform-integration)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🌟 Overview

Design-Rite Portal V2 is a Next.js-based customer portal that provides:

- **Authentication & Account Management** - Secure sign-in/sign-up with password reset
- **Subscription Management** - Tiered access control (Free, Pro, Enterprise)
- **Document Management** - Upload and organize security-related files
- **Business Tools** - Generate invoices, reports, and professional documents
- **Analytics Dashboard** - Track usage and performance metrics
- **Cross-Platform Session Transfer** - Seamless integration with main Design-Rite platform

**Main Platform Integration**: The portal works in tandem with the main Design-Rite platform (v4) to provide a complete security proposal ecosystem.

---

## ✨ Features

### Authentication & Security
- ✅ Email/password authentication via Supabase
- ✅ Password reset workflow with email verification
- ✅ Session management with automatic refresh
- ✅ Role-based access control (7 user roles)
- ✅ Protected routes with middleware
- ✅ Cross-domain session transfer to main platform

### User Management
- ✅ User profiles with company information
- ✅ Subscription tier management (Free, Pro, Enterprise)
- ✅ Usage tracking and limits
- ✅ Employee access with admin features

### Core Features
- 📄 **Document Manager** - Upload, organize, and share files
- 🔧 **Business Tools** - Generate invoices and reports
- ⚡ **Voltage Calculator** - Cable voltage drop calculations (Pro)
- 📊 **Analytics** - Usage metrics and insights
- 🎨 **Theme Customization** - Personalize UI appearance
- 👤 **Profile Management** - Update account settings

### Cross-Platform Integration
- 🔄 Seamless session transfer to Design-Rite v4 workspace
- 🔙 Return navigation from v4 back to portal
- 🔐 Secure token-based authentication between platforms

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: Sonner

**Backend:**
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with PKCE flow
- **Storage**: Supabase Storage (for documents)

**Deployment:**
- **Platform**: Render
- **Production URL**: https://portal.design-rite.com
- **Main Platform**: https://design-rite.com

### Key Design Patterns

1. **Server Components by Default** - Use 'use client' only when needed
2. **Protected Route Pattern** - `ProtectedLayout` wrapper for authenticated pages
3. **Custom Hook Pattern** - `useAuth` hook for authentication state
4. **Session Transfer Pattern** - URL hash encoding for cross-domain auth

---

## 🔐 Authentication Flow

### Standard Sign-In Flow

```
1. User navigates to /auth
   ↓
2. Enters credentials (email/password)
   ↓
3. Supabase validates credentials
   ↓
4. Session created with JWT tokens
   ↓
5. Redirected to /welcome page
   ↓
6. User chooses action (workspace, dashboard, etc.)
```

### Password Reset Flow

```
1. User clicks "Forgot Password" on /auth
   ↓
2. Enters email on /forgot-password
   ↓
3. Receives reset email from Supabase
   ↓
4. Clicks link → /reset-password?token=...
   ↓
5. Enters new password (min 6 chars)
   ↓
6. Password updated via Supabase
   ↓
7. Redirected to /dashboard
```

### Cross-Platform Session Transfer

```
1. User authenticated in Portal
   ↓
2. Clicks "Go to Workspace" or "AI Security Platform"
   ↓
3. Portal gets current session from Supabase
   ↓
4. Encodes access_token & refresh_token
   ↓
5. Redirects to v4: /workspace#auth={encodedTokens}
   ↓
6. V4 extracts tokens from URL hash
   ↓
7. V4 calls setSession() with tokens
   ↓
8. User authenticated in V4 workspace
```

---

## 🔄 Cross-Platform Integration

### Portal → V4 (Main Platform)

**Entry Points:**
1. **Welcome Page** - "Go to Workspace" button
2. **Dashboard** - "AI Security Platform" card

**Implementation:**
```typescript
const handleWorkspace = async () => {
  // Get current session
  const session = await authHelpers.getCurrentSession()

  // Encode tokens
  const authData = {
    access_token: session.access_token,
    refresh_token: session.refresh_token
  }
  const encodedAuth = encodeURIComponent(JSON.stringify(authData))

  // Redirect to v4 with tokens in URL hash
  window.location.href = `${v4URL}/workspace#auth=${encodedAuth}`
}
```

### V4 → Portal

**Entry Points:**
1. **Workspace** - "Back to Portal Dashboard" button
2. **Workspace** - "Sign Out" button (redirects to portal)

**Navigation:**
- Direct links back to `portal.design-rite.com/dashboard`
- Sign out redirects to portal auth page

---

## 📁 Project Structure

```
design-rite-portal-v2/
├── src/
│   ├── app/                          # Next.js app directory
│   │   ├── auth/                     # Authentication pages
│   │   │   └── page.tsx             # Sign in/sign up page
│   │   ├── forgot-password/         # Password reset request
│   │   │   └── page.tsx
│   │   ├── reset-password/          # Set new password
│   │   │   └── page.tsx
│   │   ├── change-password/         # Change password (logged in)
│   │   │   └── page.tsx
│   │   ├── welcome/                 # Post-login welcome screen
│   │   │   └── page.tsx
│   │   ├── dashboard/               # Main dashboard
│   │   │   └── page.tsx
│   │   ├── documents/               # Document management
│   │   │   └── page.tsx
│   │   ├── business-tools/          # Invoice/report generation
│   │   │   └── page.tsx
│   │   ├── voltage/                 # Voltage calculator (Pro)
│   │   │   └── page.tsx
│   │   ├── analytics/               # Usage analytics
│   │   │   └── page.tsx
│   │   ├── theme/                   # Theme customization
│   │   │   └── page.tsx
│   │   ├── subscription/            # Subscription management
│   │   │   └── page.tsx
│   │   ├── profile/                 # Profile settings
│   │   │   └── page.tsx
│   │   ├── transfer-session/        # Admin dashboard redirect
│   │   │   └── page.tsx
│   │   ├── layout.tsx               # Root layout
│   │   └── globals.css              # Global styles
│   ├── components/                   # React components
│   │   ├── Sidebar.tsx              # Main navigation sidebar
│   │   ├── ProtectedLayout.tsx      # Auth wrapper
│   │   └── [other components]
│   ├── hooks/                        # Custom React hooks
│   │   └── useAuth.ts               # Authentication hook
│   ├── lib/                          # Utilities and clients
│   │   └── supabase.ts              # Supabase client & helpers
│   └── types/                        # TypeScript types
├── supabase/                         # Database migrations & schema
│   ├── 00_fresh_start_2025_10_13.sql
│   └── [other migration files]
├── public/                           # Static assets
├── .env.example                      # Environment variable template
├── .env.local                        # Local environment (not committed)
├── next.config.js                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json                      # Dependencies
└── README.md                         # This file
```

---

## 🗄️ Database Schema

### Core Tables

**profiles**
```sql
- id (uuid, FK to auth.users)
- email (text)
- full_name (text)
- company (text)
- avatar_url (text, optional)
- created_at (timestamp)
- updated_at (timestamp)
```

**user_roles**
```sql
- user_id (uuid, FK to profiles.id)
- role (enum: super_admin, admin, manager, developer, contractor, user, guest)
- domain_override (boolean) - Allow non @design-rite.com emails admin access
- created_at (timestamp)
- updated_at (timestamp)
```

**subscriptions**
```sql
- user_id (uuid, FK to profiles.id)
- tier (enum: free, starter, professional, enterprise)
- status (enum: active, trialing, canceled, expired)
- max_documents (integer)
- trial_start (timestamp)
- trial_end (timestamp)
- is_trial (boolean)
- source (text) - How subscription was created
- created_at (timestamp)
- updated_at (timestamp)
```

### Role Hierarchy

1. **super_admin** - Full platform control
2. **admin** - Manage standard users
3. **manager** - Team lead features
4. **developer** - Technical access
5. **contractor** - Limited employee access
6. **user** - Standard customer
7. **guest** - Trial/limited access

---

## 🔧 Environment Variables

Create `.env.local` in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Main Platform URL (optional)
NEXT_PUBLIC_MAIN_PLATFORM_URL=https://design-rite.com

# Development Settings (optional)
NODE_ENV=development
```

**Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

**Optional Variables:**
- `NEXT_PUBLIC_MAIN_PLATFORM_URL` - Main platform URL (defaults to design-rite.com)

---

## 💻 Development

### Running Locally

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

**Development URLs:**
- Portal: http://localhost:3001
- Main Platform (v4): http://localhost:3000

### Key Development Files

**Authentication Hook** (`src/hooks/useAuth.ts`):
```typescript
const { user, profile, userRole, isEmployee, loading, signIn, signOut } = useAuth()
```

**Supabase Client** (`src/lib/supabase.ts`):
```typescript
import { supabase, authHelpers } from '@/lib/supabase'

// Sign in
await authHelpers.signIn(email, password)

// Get current session
const session = await authHelpers.getCurrentSession()

// Sign out
await authHelpers.signOut()
```

**Protected Routes**:
```typescript
import ProtectedLayout from '@/components/ProtectedLayout'

export default function MyPage() {
  return (
    <ProtectedLayout>
      {/* Your page content */}
    </ProtectedLayout>
  )
}
```

---

## 🚀 Deployment

### Deploying to Render

1. **Create New Web Service**
   - Connect GitHub repository
   - Branch: `main`
   - Root directory: `/`

2. **Build Settings**
   ```
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Environment Variables**
   - Add all variables from `.env.local`
   - Set `NODE_ENV=production`

4. **Custom Domain** (optional)
   - Add custom domain: `portal.design-rite.com`
   - Update DNS records as instructed

### Database Migration

Run migrations in Supabase SQL Editor:

```sql
-- Run in order:
-- 1. supabase/00_fresh_start_2025_10_13.sql
-- 2. Any additional migration files
```

### Post-Deployment Checklist

- ✅ Test authentication flow
- ✅ Verify session transfer to main platform
- ✅ Check password reset email delivery
- ✅ Test all protected routes
- ✅ Verify Supabase RLS policies
- ✅ Test subscription tier logic

---

## 🤝 Contributing

### Development Workflow

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Commit with descriptive message
   ```bash
   git commit -m "feat: add new feature description"
   ```

4. Push and create pull request
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

## 📝 License

© 2025 Design-Rite Corp. All rights reserved.

---

## 🔗 Related Projects

- [Design-Rite V4](https://github.com/DesignMindDev/design-rite-v4) - Main security proposal platform
- Supabase Project - Shared database between portal and main platform

---

## 📞 Support

For issues or questions:
- Create an issue in GitHub
- Contact: support@design-rite.com
- Documentation: https://docs.design-rite.com

---

**Built with ❤️ by the Design-Rite team**
