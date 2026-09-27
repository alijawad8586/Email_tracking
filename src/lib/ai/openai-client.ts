import { OpenAI } from 'openai'

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY not configured')
}

// Groq is OpenAI-compatible, using their API format
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

export interface EmailClassificationResult {
  classification: string
  confidence: number
  reasoning: string
  leadScore?: number
}

export interface AIReplyResult {
  reply: string
  tone: string
}

/**
 * Classify an email using AI
 */
export async function classifyEmail(
  subject: string,
  body: string,
  senderName: string | null,
  senderEmail: string
): Promise<EmailClassificationResult> {
  const prompt = `Analyze this email and classify it. Return a JSON response with "classification" (one of: "lead", "inquiry", "support", "spam", "other"), "confidence" (0-100), and "reasoning".

From: ${senderName ? senderName + ' <' + senderEmail + '>' : senderEmail}
Subject: ${subject}

Body:
${body}

JSON Response:`

  try {
    const response = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768', // Fast Groq model for classification
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const result = JSON.parse(content)

    // Validate classification
    const validClassifications = ['lead', 'inquiry', 'support', 'spam', 'other']
    if (!validClassifications.includes(result.classification)) {
      result.classification = 'other'
    }

    return {
      classification: result.classification,
      confidence: Math.min(100, Math.max(0, result.confidence || 50)),
      reasoning: result.reasoning || 'No reasoning provided',
      leadScore: result.leadScore || 0,
    }
  } catch (error) {
    console.error('Error classifying email:', error)
    throw new Error('Failed to classify email')
  }
}

/**
 * Generate an AI reply to an email
 */
export async function generateReply(
  subject: string,
  emailBody: string,
  senderName: string | null,
  senderEmail: string,
  tone: string = 'professional',
  businessContext: string = ''
): Promise<AIReplyResult> {
  const toneGuidance = {
    professional: 'professional, concise, and business-appropriate',
    friendly: 'warm, approachable, and personal',
    enthusiastic: 'excited and engaged',
  }[tone] || 'professional and courteous'

  const contextPart = businessContext ? `\nBusiness Context: ${businessContext}\n` : ''

  const prompt = `Generate a professional email reply to the following incoming email.
The reply should be ${toneGuidance}, and should not exceed 150 words.
${contextPart}
Incoming Email From: ${senderName ? senderName + ' <' + senderEmail + '>' : senderEmail}
Subject: ${subject}

Body:
${emailBody}

Generate only the reply body (no "To:", "Subject:", or "From:" headers). Return as plain text.`

  try {
    const response = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768', // Fast Groq model for reply generation
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const reply = response.choices[0]?.message?.content
    if (!reply) {
      throw new Error('No response from OpenAI')
    }

    return {
      reply: reply.trim(),
      tone,
    }
  } catch (error) {
    console.error('Error generating reply:', error)
    throw new Error('Failed to generate reply')
  }
}

/**
 * Summarize an email thread
 */
export async function summarizeThread(emails: Array<{ subject: string; body: string; sender: string }>): Promise<string> {
  const emailsText = emails
    .map((email) => `From: ${email.sender}\nSubject: ${email.subject}\n${email.body}`)
    .join('\n---\n')

  const prompt = `Summarize this email thread in 2-3 sentences, focusing on the key points and action items:

${emailsText}

Summary:`

  try {
    const response = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768', // Fast Groq model for summarization
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 200,
    })

    const summary = response.choices[0]?.message?.content
    if (!summary) {
      throw new Error('No response from OpenAI')
    }

    return summary.trim()
  } catch (error) {
    console.error('Error summarizing thread:', error)
    throw new Error('Failed to summarize thread')
  }
}

/**
 * Extract lead information from email
 */
export async function extractLeadInfo(subject: string, body: string, senderName: string | null, senderEmail: string) {
  const prompt = `Extract lead information from this email. Return a JSON object with these fields:
- name (string or null)
- company (string or null)
- phone (string or null)
- website (string or null)
- budget (string or null)
- requirements (string or null)
- urgency (string: "low", "medium", "high" or null)

If information is not available, use null.

Email:
From: ${senderName ? senderName + ' <' + senderEmail + '>' : senderEmail}
Subject: ${subject}

Body:
${body}

JSON Response:`

  try {
    const response = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768', // Fast Groq model for lead extraction
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 400,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    return JSON.parse(content)
  } catch (error) {
    console.error('Error extracting lead info:', error)
    throw new Error('Failed to extract lead information')
  }
}
