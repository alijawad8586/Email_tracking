export interface UserProfile {
  id: string
  google_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  timezone: string
  gmail_connected: boolean
  total_leads_count: number
  total_emails_processed: number
  created_at: string
  updated_at: string
}

export interface Email {
  id: string
  user_id: string
  gmail_message_id: string
  gmail_thread_id: string
  sender_email: string
  sender_name: string | null
  subject: string
  body_plain: string | null
  body_html: string | null
  received_at: string
  is_read: boolean
  classification: 'lead' | 'inquiry' | 'support' | 'spam' | 'other' | null
  ai_summary: string | null
  importance_score: number
  needs_reply: boolean
  has_reply: boolean
  attachments: Attachment[] | null
  labels: string[] | null
  created_at: string
  updated_at: string
}

export interface Attachment {
  id: string
  filename: string
  mimeType: string
  size: number
}

export interface EmailReply {
  id: string
  email_id: string
  user_id: string
  body_plain: string
  body_html: string | null
  ai_generated: boolean
  ai_generation_prompt: string | null
  sent_at: string | null
  gmail_message_id: string | null
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  user_id: string
  email: string
  name: string
  company: string | null
  phone: string | null
  source: 'email' | 'manual' | 'import'
  status: 'new' | 'contacted' | 'engaged' | 'qualified' | 'closed_won' | 'closed_lost'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  lead_score: number
  notes: string | null
  tags: string[] | null
  next_followup_date: string | null
  first_email_id: string | null
  last_email_id: string | null
  total_emails: number
  last_interaction: string
  created_at: string
  updated_at: string
}

export interface LeadActivity {
  id: string
  lead_id: string
  user_id: string
  activity_type: 'email_sent' | 'email_received' | 'call' | 'note' | 'status_change'
  email_id: string | null
  email_reply_id: string | null
  description: string
  metadata: Record<string, any> | null
  created_at: string
}

export interface Followup {
  id: string
  lead_id: string
  user_id: string
  scheduled_for: string
  followup_type: 'email' | 'call' | 'meeting' | 'reminder'
  description: string
  is_completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface EmailClassification {
  classification: string
  confidence: number
  reasoning: string
}

export interface AIReplyResponse {
  reply: string
  tone: string
  confidence: number
}
