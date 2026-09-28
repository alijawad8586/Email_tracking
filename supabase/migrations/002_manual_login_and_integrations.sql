-- Manual (email/password) accounts have no Google ID
ALTER TABLE public.user_profiles ALTER COLUMN google_id DROP NOT NULL;

-- User-managed third-party API connections (keys stored encrypted)
CREATE TABLE IF NOT EXISTS public.api_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  base_url TEXT NOT NULL,
  auth_type VARCHAR(20) NOT NULL DEFAULT 'bearer' CHECK (auth_type IN ('bearer', 'header', 'query', 'none')),
  auth_name VARCHAR(100),
  api_key_encrypted TEXT,
  notes TEXT,
  last_test_status VARCHAR(50),
  last_tested_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_integrations_user_id ON public.api_integrations(user_id);

ALTER TABLE public.api_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own integrations"
  ON public.api_integrations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
