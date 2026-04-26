import axios from 'axios';

// AhaSend API configuration (v2)
const AHASEND_API_KEY = process.env.AHASEND_API_KEY || 'aha-sk-GbzRp0nqVCgmQVw0FN47HNHdFNjR055cQCY1L-l5BSBV9_EmE1-NGHPbR2e2gaR2';
const AHASEND_ACCOUNT_ID = process.env.AHASEND_ACCOUNT_ID || '8a14f9a5-6e6d-47c9-b5d6-a687265b36a3';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Beach Litter Platform <noreply@psbailey.uk>';

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class EmailService {
  /**
   * Send an email using AhaSend REST API
   */
  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      // Parse from email to separate email and name
      const fromMatch = FROM_EMAIL.match(/^(.+?)\s*<(.+)>$/);
      const fromEmail = fromMatch ? fromMatch[2] : FROM_EMAIL;
      const fromName = fromMatch ? fromMatch[1].trim() : undefined;

      const payload = {
        from: {
          email: fromEmail,
          ...(fromName && { name: fromName }),
        },
        recipients: [
          {
            email: data.to,
          },
        ],
        subject: data.subject,
        text_content: data.text,
        html_content: data.html || this.generateHtmlFromText(data.text),
      };

      console.log('[Email] Sending request to AhaSend API v2...');
      console.log('[Email] API Key:', AHASEND_API_KEY.substring(0, 30) + '...');
      console.log('[Email] Endpoint:', `/v2/accounts/${AHASEND_ACCOUNT_ID}/messages`);

      const response = await axios.post(
        `https://api.ahasend.com/v2/accounts/${AHASEND_ACCOUNT_ID}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${AHASEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log(`[Email] Successfully sent to ${data.to}:`, response.data);
      return true;
    } catch (error: any) {
      console.error(`[Email] Failed to send to ${data.to}:`, error.response?.data || error.message);
      if (error.response) {
        console.error('[Email] Response status:', error.response.status);
        console.error('[Email] Response headers:', error.response.headers);
      }
      return false;
    }
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(
    to: string,
    firstName: string | null,
    title: string,
    message: string,
    relatedType?: 'report' | 'event',
    relatedId?: string
  ): Promise<boolean> {
    // Validate email address exists
    if (!to || to.trim() === '') {
      console.log('[Email] Skipping notification - no email address provided');
      return false;
    }

    const greeting = firstName ? `Hi ${firstName}` : 'Hi';
    
    const text = `
${greeting},

${title}

${message}

${relatedType && relatedId ? `View details: ${this.getDetailsUrl(relatedType, relatedId)}` : ''}

---
Litter Scouts
To manage your notification preferences, visit your profile settings.
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .message { background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
    .button { display: inline-block; padding: 12px 24px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏖️ Beach Litter Platform</h1>
    </div>
    <div class="content">
      <p>${greeting},</p>
      <div class="message">
        <h2>${title}</h2>
        <p>${message}</p>
      </div>
      ${relatedType && relatedId ? `
        <a href="${this.getDetailsUrl(relatedType, relatedId)}" class="button">View Details</a>
      ` : ''}
    </div>
    <div class="footer">
      <p>Litter Scouts</p>
      <p>To manage your notification preferences, visit your profile settings.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail({
      to,
      subject: title,
      text,
      html,
    });
  }

  /**
   * Generate basic HTML from plain text
   */
  private generateHtmlFromText(text: string): string {
    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    ${text.split('\n').map(line => `<p>${line}</p>`).join('')}
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Get URL for viewing details
   */
  private getDetailsUrl(type: 'report' | 'event', id: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (type === 'report') {
      return `${baseUrl}/map?reportId=${id}`;
    } else {
      return `${baseUrl}/events?eventId=${id}`;
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      // Send a test email to verify configuration
      const testEmail = process.env.TEST_EMAIL || 'test@example.com';
      
      const success = await this.sendEmail({
        to: testEmail,
        subject: 'Litter Scouts - Email Test',
        text: 'This is a test email from Litter Scouts. If you received this, email notifications are working correctly!',
      });

      return success;
    } catch (error: any) {
      console.error('[Email] Connection test failed:', error.message);
      return false;
    }
  }
}

export const emailService = new EmailService();
