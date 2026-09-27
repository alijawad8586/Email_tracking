-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  timezone VARCHAR(63) DEFAULT 'UTC',
  gmail_access_token_encrypted TEXT,
  gmail_refresh_token_encrypted TEXT,
  gmail_token_expires_at TIMESTAMP WITH TIME ZONE,
  gmail_connected BOOLEAN DEFAULT FALSE,
  last_gmail_sync TIMESTAMP WITH TIME ZONE,
  total_leads_count INT DEFAULT 0,
  total_emails_processed INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emails table
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  gmail_message_id VARCHAR(255) NOT NULL,
  gmail_thread_id VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255),
  subject TEXT NOT NULL,
  body_plain TEXT,
  body_html TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  classification VARCHAR(50),
  ai_summary TEXT,
  importance_score INT DEFAULT 0,
  needs_reply BOOLEAN DEFAULT FALSE,
  has_reply BOOLEAN DEFAULT FALSE,
  attachments JSONB,
  labels JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, gmail_message_id)
);

-- Email replies table
CREATE TABLE IF NOT EXISTS public.email_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  body_plain TEXT NOT NULL,
  body_html TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_generation_prompt TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  gmail_message_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(20),
  source VARCHAR(50) DEFAULT 'email',
  status VARCHAR(50) DEFAULT 'new',
  priority VARCHAR(50) DEFAULT 'medium',
  lead_score INT DEFAULT 0,
  value DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  notes TEXT,
  tags JSONB,
  next_followup_date DATE,
  first_email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  last_email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  total_emails INT DEFAULT 1,
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Lead activities table
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  email_id UUID REFERENCES public.emails(id) ON DELETE SET NULL,
  email_reply_id UUID REFERENCES public.email_replies(id) ON DELETE SET NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Followups table
CREATE TABLE IF NOT EXISTS public.followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  followup_type VARCHAR(50) NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_emails_user_received ON public.emails(user_id, received_at DESC);
CREATE INDEX idx_emails_classification ON public.emails(user_id, classification);
CREATE INDEX idx_emails_needs_reply ON public.emails(user_id, needs_reply);
CREATE INDEX idx_emails_gmail_message_id ON public.emails(user_id, gmail_message_id);
CREATE INDEX idx_leads_user_status ON public.leads(user_id, status);
CREATE INDEX idx_leads_next_followup ON public.leads(user_id, next_followup_date);
CREATE INDEX idx_lead_activities_lead ON public.lead_activities(lead_id, created_at DESC);
CREATE INDEX idx_followups_scheduled ON public.followups(user_id, scheduled_for);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for emails
CREATE POLICY "Users can view their own emails"
  ON public.emails FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emails"
  ON public.emails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emails"
  ON public.emails FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for email_replies
CREATE POLICY "Users can view their own email replies"
  ON public.email_replies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email replies"
  ON public.email_replies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email replies"
  ON public.email_replies FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for leads
CREATE POLICY "Users can view their own leads"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
  ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON public.leads FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for lead_activities
CREATE POLICY "Users can view their own lead activities"
  ON public.lead_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lead activities"
  ON public.lead_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for followups
CREATE POLICY "Users can view their own followups"
  ON public.followups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own followups"
  ON public.followups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own followups"
  ON public.followups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own followups"
  ON public.followups FOR DELETE
  USING (auth.uid() = user_id);
