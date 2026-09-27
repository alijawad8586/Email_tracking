# Email Lead Tracker - Deployment Guide

Complete step-by-step guide to deploy the Email Lead Tracker application to production on Vercel.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Supabase Setup](#step-1-supabase-setup)
3. [Step 2: Google Cloud Configuration](#step-2-google-cloud-configuration)
4. [Step 3: OpenAI API Setup](#step-3-openai-api-setup)
5. [Step 4: GitHub Setup](#step-4-github-setup)
6. [Step 5: Vercel Deployment](#step-5-vercel-deployment)
7. [Step 6: Post-Deployment Configuration](#step-6-post-deployment-configuration)
8. [Verification Checklist](#verification-checklist)

---

## Prerequisites

- GitHub account (https://github.com)
- Supabase account (https://supabase.com)
- Google Cloud account (https://cloud.google.com)
- OpenAI account (https://openai.com)
- Vercel account (https://vercel.com)
- Git installed locally
- Node.js 18+ installed

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: email-lead-tracker
   - **Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
   - **Organization**: Select or create
4. Click "Create new project"
5. Wait for project to initialize (2-3 minutes)

### 1.2 Retrieve API Keys

Once project is created:

1. Go to **Settings** → **API**
2. Copy these values:
   - `URL` → Save as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → Save as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → Save as `SUPABASE_SERVICE_ROLE_KEY`

Example:
```
NEXT_PUBLIC_SUPABASE_URL=https://aaaabbbbccccdddd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.3 Run Database Migrations

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy entire contents of `supabase/migrations/001_init_schema.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Wait for completion (should see green checkmark)

Verify tables created:
- Go to **Table Editor**
- Should see: user_profiles, emails, email_replies, leads, lead_activities, followups

---

## Step 2: Google Cloud Configuration

### 2.1 Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click project dropdown at top
3. Click "NEW PROJECT"
4. Name: "Email Lead Tracker"
5. Click "CREATE"
6. Wait for creation

### 2.2 Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search for and enable each:
   - **Gmail API** - Click → Enable
   - **Google+ API** - Click → Enable
   - **People API** - Click → Enable

### 2.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted for consent screen:
   - Click "Configure Consent Screen"
   - Choose "External"
   - Fill in:
     - **App name**: Email Lead Tracker
     - **User support email**: your-email@gmail.com
     - **Developer contact**: your-email@gmail.com
   - Click "Save and Continue"
   - Click "Save and Continue" (skip scopes for now)
   - Click "Save and Continue"
   - Click "Back to Dashboard"

4. Back on Credentials page, click "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Name: "Email Lead Tracker Web"
7. **Authorized JavaScript origins**:
   - Add: `http://localhost:3000`
   - Add: `https://yourdomain.com` (update later with Vercel URL)
8. **Authorized redirect URIs**:
   - Add: `http://localhost:3000/api/auth/google/callback`
   - Add: `https://yourdomain.com/api/auth/google/callback` (update later)
9. Click "CREATE"
10. Copy shown credentials:
    - **Client ID** → Save as `GOOGLE_CLIENT_ID`
    - **Client Secret** → Save as `GOOGLE_CLIENT_SECRET`

Example:
```
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
```

---

## Step 3: OpenAI API Setup

### 3.1 Create OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Name: "Email Lead Tracker"
4. Copy the key immediately (you won't see it again!)
5. Save as `OPENAI_API_KEY`

Example:
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 4: GitHub Setup

### 4.1 Create GitHub Repository

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: email-tracker
   - **Description**: AI-powered email lead tracking system
   - **Visibility**: Private (recommended)
   - **Initialize**: Skip (we'll push existing code)
3. Click "Create repository"

### 4.2 Push Code to GitHub

```bash
cd /home/user/alijawad8586/email_tracking

# Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/email-tracker.git

# Rename branch to main if needed
git branch -M main

# Push code
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

Verify: Go to your GitHub repository, should see all files.

---

## Step 5: Vercel Deployment

### 5.1 Deploy from GitHub

1. Go to https://vercel.com/new
2. Click "Continue with GitHub" (if not already logged in)
3. Search for "email-tracker" repository
4. Click "Import"

### 5.2 Configure Project

1. **Project settings**:
   - Root Directory: `./`
   - Framework: Next.js (should auto-detect)
   - Build Command: `npm run build`
   - Output Directory: `.next`

2. **Environment Variables**:
   - Click "Environment Variables"
   - Add these from Step 1-3:
     ```
     NEXT_PUBLIC_SUPABASE_URL=...
     NEXT_PUBLIC_SUPABASE_ANON_KEY=...
     SUPABASE_SERVICE_ROLE_KEY=...
     GOOGLE_CLIENT_ID=...
     GOOGLE_CLIENT_SECRET=...
     OPENAI_API_KEY=...
     ENCRYPTION_KEY=0123456789abcdef0123456789abcdef01234567
     NEXTAUTH_SECRET=generate-random-string-here
     NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
     ```

   **Generate values**:
   - `ENCRYPTION_KEY`: Run `openssl rand -hex 16` (or use any 32 char string)
   - `NEXTAUTH_SECRET`: Run `openssl rand -hex 32` (or any random string)

3. Click "Deploy"
4. Wait for deployment (5-10 minutes)

### 5.3 Get Vercel URL

After deployment completes:

1. Go to Deployment Details
2. Copy the **Deployment URL** (something like `https://email-tracker-abc123.vercel.app`)
3. Save this as your production domain

---

## Step 6: Post-Deployment Configuration

### 6.1 Update Google OAuth Redirect URI

1. Go back to Google Cloud Console
2. **APIs & Services** → **Credentials**
3. Click on your OAuth client ID
4. Update **Authorized redirect URIs**:
   - Change: `https://yourdomain.com/api/auth/google/callback`
   - To: `https://your-vercel-domain.vercel.app/api/auth/google/callback`
5. Click "Save"
6. Click "Save" again on the OAuth consent screen if prompted

### 6.2 Update Vercel Environment Variables

1. Go to Vercel Dashboard
2. Select your project
3. **Settings** → **Environment Variables**
4. Update:
   - `GOOGLE_REDIRECT_URI` → `https://your-vercel-domain.vercel.app/api/auth/google/callback`
   - `NEXT_PUBLIC_APP_URL` → `https://your-vercel-domain.vercel.app`
5. Redeploy: **Deployments** → Click latest → **Redeploy**

### 6.3 Custom Domain (Optional)

To use a custom domain like `emailtracker.yourcompany.com`:

1. Vercel Dashboard → Select project → **Settings** → **Domains**
2. Enter your custom domain
3. Follow DNS configuration instructions
4. Update Google OAuth URIs with custom domain
5. Update Vercel env vars with custom domain

---

## Verification Checklist

Test your deployed application:

### ✅ Pre-Launch Checks

- [ ] Vercel deployment shows "Ready"
- [ ] No environment variable errors
- [ ] Database tables created in Supabase
- [ ] Google OAuth credentials configured
- [ ] OpenAI API key valid

### ✅ Functional Tests

Open your Vercel domain:

1. [ ] **Login Page Loads** - https://your-domain/login
   - Google login button visible
   - No console errors

2. [ ] **Google OAuth Flow**
   - Click "Sign in with Google"
   - Redirects to Google consent screen
   - After consent, returns to dashboard
   - User email displayed

3. [ ] **Dashboard Access**
   - Dashboard loads without errors
   - Shows "0" for all metrics (expected on new account)
   - Sidebar navigation works
   - Logout button functions

4. [ ] **Settings Page**
   - Navigate to /settings
   - "Connect Gmail" button visible

5. [ ] **Database Connection**
   - Check Supabase SQL Editor
   - Run: `SELECT COUNT(*) FROM user_profiles;`
   - Should see your user in the table

6. [ ] **Error Handling**
   - Try logging in twice
   - Should handle gracefully
   - Check browser console for errors

### ✅ Security Checks

- [ ] All environment variables hidden (not in logs)
- [ ] HTTPS enforced (URL shows 🔒)
- [ ] No sensitive data in browser console
- [ ] JWT cookie is HTTP-only

---

## Troubleshooting

### Issue: "OAuth redirect URI mismatch"

**Fix**: 
- Ensure Google OAuth URI exactly matches Vercel domain
- Go to Google Cloud Console, update the redirect URI
- Verify there are no trailing slashes or typos

### Issue: "Supabase connection failed"

**Fix**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check Supabase project is active
- Ensure anon key has proper permissions
- Run migrations if not done

### Issue: "OpenAI API error"

**Fix**:
- Verify API key is correct and has credits
- Check rate limits aren't exceeded
- Ensure API key is enabled in OpenAI dashboard

### Issue: "Build failed on Vercel"

**Fix**:
- Check build logs: **Deployments** → Click build → **Logs**
- Common issues:
  - Missing environment variables
  - TypeScript errors (check `.next/errors`)
  - Dependency conflicts (npm audit)

### Issue: "Database migration failed"

**Fix**:
- Go to Supabase SQL Editor
- Try running migration again
- Check for error messages
- Ensure you have proper permissions

---

## Post-Deployment Maintenance

### Weekly Tasks

- [ ] Check Vercel Analytics for performance
- [ ] Monitor OpenAI API usage
- [ ] Review error logs in browser console

### Monthly Tasks

- [ ] Backup Supabase database
- [ ] Review security settings
- [ ] Update dependencies: `npm update`
- [ ] Check for outdated API versions

### Quarterly Tasks

- [ ] Review and rotate secrets
- [ ] Audit user access logs
- [ ] Performance optimization
- [ ] Feature planning

---

## Getting Help

If deployment fails:

1. **Check Vercel Logs**:
   - Deployments → Latest → Logs
   - Look for specific error messages

2. **Check Supabase Status**:
   - https://supabase.status.page.io
   - Make sure all systems are operational

3. **Check Google OAuth**:
   - Open browser DevTools → Network
   - Check OAuth redirect request
   - Verify redirect URI matches exactly

4. **Enable Debug Mode**:
   - Add `DEBUG=*` to environment variables
   - Redeploy and check logs

---

## Next: Feature Development

Once deployed, you can:

1. Implement Gmail sync
2. Build email inbox UI
3. Add AI reply generation
4. Implement lead tracking
5. Add analytics dashboard
6. Create follow-up system

---

**Deployment Status**: Ready for production!

For production hardening, also consider:
- Setting up monitoring/alerts
- Configuring backups
- Setting up staging environment
- Implementing CI/CD pipeline
