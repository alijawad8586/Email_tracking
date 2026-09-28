# Email Lead Tracker 📧

Production-ready AI-powered Email Auto-Reply + Lead Management System built with Next.js, Supabase, and OpenAI.

**Status**: Development/Deployment-Ready

## 🎯 Core Features

- ✅ **Gmail Integration** - Read, send, and manage emails through Gmail API
- ✅ **AI Email Classification** - Automatically categorize incoming emails
- ✅ **Lead Tracking** - CRM-style lead management with scoring and status
- ✅ **AI Reply Generation** - Generate professional replies using OpenAI GPT
- ✅ **Follow-up Management** - Schedule and track lead follow-ups
- ✅ **Analytics Dashboard** - Real-time metrics and insights
- ✅ **Secure Authentication** - Google OAuth + JWT tokens
- ✅ **Row-Level Security** - Database-enforced per-user data isolation

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Next.js Server Actions & API Routes |
| Database | Supabase (PostgreSQL) with RLS |
| Auth | Google OAuth 2.0 + JWT |
| AI | OpenAI API |
| Email | Gmail API |
| Deploy | Vercel |

## 📋 Prerequisites

Before setup, ensure you have:

1. **Supabase Account** - https://supabase.com (free tier works)
2. **Google Cloud Project** - With Gmail API enabled
3. **OpenAI API Key** - https://platform.openai.com
4. **Vercel Account** - https://vercel.com (for deployment)

## 🚀 Quick Start

### Local Development

```bash
# 1. Clone and install
git clone https://github.com/alijawad8586/email_tracking.git
cd email_tracking
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Set up Supabase
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_ID
supabase migration up

# 4. Run development server
npm run dev
# Open http://localhost:3000
```

### Vercel Deployment

```bash
# Method 1: GitHub + Vercel Dashboard
git push origin main  # Push to GitHub
# Then import at https://vercel.com/new

# Method 2: Vercel CLI
npm install -g vercel
vercel deploy
```

After deployment, update Google OAuth redirect URI to your Vercel URL.

## 🔧 Configuration

### Required Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=XXX
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# OpenAI
OPENAI_API_KEY=sk-proj-XXX

# Security
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef (32 chars)
NEXTAUTH_SECRET=change-me-to-random-string
```

## 📚 Project Structure

```
src/
├── app/                 # Next.js pages & API routes
│   ├── api/            # API endpoints
│   ├── login/          # Authentication
│   ├── dashboard/      # Main dashboard
│   ├── emails/         # Email inbox
│   ├── leads/          # Lead management
│   ├── followups/      # Follow-up tracking
│   └── settings/       # Configuration
├── lib/                # Utilities & clients
│   ├── auth/           # Google OAuth & JWT
│   ├── db/             # Supabase client
│   ├── gmail/          # Gmail API wrapper
│   ├── ai/             # OpenAI integration
│   └── utils/          # Helpers
├── server/             # Server-only code
│   ├── actions/        # Next.js Server Actions
│   └── services/       # Business logic
└── types/              # TypeScript definitions

supabase/
└── migrations/         # Database schema
```

## 🗄️ Database Schema

| Table | Purpose |
|-------|---------|
| `user_profiles` | User accounts & Gmail credentials |
| `emails` | Gmail messages with classifications |
| `email_replies` | Sent replies & AI generation history |
| `leads` | Lead tracking & scoring |
| `lead_activities` | Timeline of all interactions |
| `followups` | Scheduled reminders |

All tables enforce Row-Level Security (RLS).

## 🔒 Security

- **Encryption**: Sensitive tokens encrypted at rest
- **Authentication**: HTTP-only JWT cookies
- **Authorization**: Database-level RLS policies
- **Validation**: Input sanitization on all endpoints
- **HTTPS**: Required in production
- **Audit**: SQL audit logs available

## 📖 Documentation

- [Full Setup Guide](./docs/SETUP.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## 🚧 Development

### Build
```bash
npm run build
npm run start
```

### Testing
```bash
npm run test
npm run test:e2e
```

### Code Quality
```bash
npm run lint
npm run type-check
```

## 📋 Next Steps

- [ ] Connect Supabase project
- [ ] Set up Google OAuth credentials
- [ ] Add OpenAI API key
- [ ] Run database migrations
- [ ] Test Gmail connection
- [ ] Deploy to Vercel

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📄 License

MIT License - see LICENSE file

## 📞 Support

- Issues: GitHub Issues
- Email: support@emailtracker.dev
- Docs: https://emailtracker.dev/docs

---

**Built with ❤️ using Next.js, Supabase, and OpenAI**
