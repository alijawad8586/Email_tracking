import { gmail_v1 } from 'googleapis'
import { google } from 'googleapis'

export class GmailAPIClient {
  private service: gmail_v1.Gmail

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2()
    auth.setCredentials({
      access_token: accessToken,
    })

    this.service = google.gmail({ version: 'v1', auth })
  }

  /**
   * Fetch emails from Gmail
   */
  async getMessages(query?: string, pageToken?: string, maxResults = 10) {
    try {
      const response = await this.service.users.messages.list({
        userId: 'me',
        q: query || '',
        pageToken,
        maxResults,
      })

      return {
        messages: response.data.messages || [],
        nextPageToken: response.data.nextPageToken || null,
      }
    } catch (error) {
      console.error('Error fetching Gmail messages:', error)
      throw new Error('Failed to fetch Gmail messages')
    }
  }

  /**
   * Get single message detail
   */
  async getMessageDetail(messageId: string) {
    try {
      const response = await this.service.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      })

      return response.data
    } catch (error) {
      console.error('Error fetching message detail:', error)
      throw new Error('Failed to fetch message detail')
    }
  }

  /**
   * Send an email
   */
  async sendMessage(to: string, subject: string, body: string) {
    try {
      const email = [
        `From: me`,
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        '',
        body,
      ].join('\n')

      const encodedEmail = Buffer.from(email).toString('base64')

      const response = await this.service.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
        },
      })

      return response.data
    } catch (error) {
      console.error('Error sending email:', error)
      throw new Error('Failed to send email')
    }
  }

  /**
   * Reply to a message in a thread
   */
  async replyToMessage(threadId: string, to: string, subject: string, body: string) {
    try {
      const email = [
        `From: me`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `In-Reply-To: <${threadId}@mail.gmail.com>`,
        `References: <${threadId}@mail.gmail.com>`,
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        '',
        body,
      ].join('\n')

      const encodedEmail = Buffer.from(email).toString('base64')

      const response = await this.service.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail,
          threadId,
        },
      })

      return response.data
    } catch (error) {
      console.error('Error sending reply:', error)
      throw new Error('Failed to send reply')
    }
  }

  /**
   * Get entire thread conversation
   */
  async getThread(threadId: string) {
    try {
      const response = await this.service.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full',
      })

      return response.data
    } catch (error) {
      console.error('Error fetching thread:', error)
      throw new Error('Failed to fetch thread')
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string) {
    try {
      await this.service.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      })
    } catch (error) {
      console.error('Error marking message as read:', error)
      throw new Error('Failed to mark message as read')
    }
  }

  /**
   * Get attachments metadata
   */
  async getAttachments(messageId: string, attachmentId: string) {
    try {
      const response = await this.service.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId,
      })

      return response.data
    } catch (error) {
      console.error('Error fetching attachment:', error)
      throw new Error('Failed to fetch attachment')
    }
  }
}
