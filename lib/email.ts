/**
 * Email Service
 * Supports multiple email providers: Resend, SendGrid, and SMTP
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email using configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const provider = process.env.EMAIL_PROVIDER || 'resend';

  try {
    switch (provider) {
      case 'resend':
        return await sendWithResend(options);
      case 'sendgrid':
        return await sendWithSendGrid(options);
      case 'smtp':
        return await sendWithSMTP(options);
      default:
        console.error('Unknown email provider:', provider);
        return { success: false, error: 'Unknown email provider' };
    }
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email using Resend (Recommended)
 */
async function sendWithResend(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Resend API error:', data);
    return { success: false, error: data.message || 'Failed to send email' };
  }

  return { success: true, messageId: data.id };
}

/**
 * Send email using SendGrid
 */
async function sendWithSendGrid(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.error('SENDGRID_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: options.to }],
      }],
      from: {
        email: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
        name: process.env.EMAIL_FROM_NAME || 'Your App',
      },
      subject: options.subject,
      content: [
        {
          type: 'text/html',
          value: options.html,
        },
        ...(options.text ? [{
          type: 'text/plain',
          value: options.text,
        }] : []),
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('SendGrid API error:', error);
    return { success: false, error: 'Failed to send email' };
  }

  const messageId = response.headers.get('x-message-id');
  return { success: true, messageId: messageId || undefined };
}

/**
 * Send email using SMTP (Nodemailer)
 */
async function sendWithSMTP(options: EmailOptions): Promise<EmailResult> {
  // Note: This requires nodemailer to be installed
  // For now, return not implemented
  console.error('SMTP provider requires nodemailer package');
  return { success: false, error: 'SMTP not implemented. Use Resend or SendGrid.' };
}

/**
 * Email Templates
 */

export function getPasswordResetEmail(resetLink: string, expiresInMinutes: number = 60): { subject: string; html: string; text: string } {
  const subject = 'Reset Your Password';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 2px solid #EAB308;
    }
    .header h1 {
      color: #1f2937;
      margin: 0;
      font-size: 28px;
    }
    .content {
      padding: 30px 0;
    }
    .content p {
      margin: 0 0 15px;
      color: #4b5563;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(to right, #EAB308, #F59E0B);
      color: #000000 !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      background: linear-gradient(to right, #F59E0B, #EAB308);
    }
    .link-box {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      word-break: break-all;
    }
    .link-box p {
      margin: 0;
      font-size: 12px;
      color: #6b7280;
    }
    .link-box a {
      color: #3b82f6;
      text-decoration: none;
    }
    .warning {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning p {
      margin: 0;
      color: #92400e;
      font-size: 14px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    .footer p {
      margin: 5px 0;
      font-size: 12px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Reset Your Password</h1>
    </div>
    
    <div class="content">
      <p>Hello,</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </div>
      
      <div class="link-box">
        <p>Or copy and paste this link into your browser:</p>
        <a href="${resetLink}">${resetLink}</a>
      </div>
      
      <div class="warning">
        <p><strong>⏰ This link will expire in ${expiresInMinutes} minutes.</strong></p>
      </div>
      
      <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      
      <p>For security reasons, this link can only be used once.</p>
    </div>
    
    <div class="footer">
      <p>This is an automated message, please do not reply to this email.</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Reset Your Password

We received a request to reset your password.

Click this link to reset your password:
${resetLink}

This link will expire in ${expiresInMinutes} minutes.

If you didn't request a password reset, you can safely ignore this email.

---
This is an automated message, please do not reply.
  `;

  return { subject, html, text };
}

export function getWelcomeEmail(displayName: string): { subject: string; html: string; text: string } {
  const subject = 'Welcome to Our Platform!';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .button { display: inline-block; padding: 12px 24px; background: #EAB308; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome, ${displayName}!</h1>
    </div>
    <p>Thank you for joining us! Your account has been successfully created.</p>
    <p>You can now start using all the features of our platform.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">Get Started</a>
    </div>
    <p>If you have any questions, feel free to reach out to our support team.</p>
  </div>
</body>
</html>
  `;

  const text = `Welcome, ${displayName}!\n\nThank you for joining us! Your account has been successfully created.\n\nGet started: ${process.env.NEXT_PUBLIC_APP_URL}`;

  return { subject, html, text };
}

export function getPasswordChangedEmail(displayName: string): { subject: string; html: string; text: string } {
  const subject = 'Your Password Has Been Changed';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h2>🔐 Password Changed</h2>
    <p>Hello ${displayName},</p>
    <p>This is to confirm that your password has been successfully changed.</p>
    <div class="warning">
      <p><strong>If you didn't make this change, please contact our support team immediately.</strong></p>
    </div>
    <p>For your security, all active sessions have been logged out.</p>
  </div>
</body>
</html>
  `;

  const text = `Password Changed\n\nHello ${displayName},\n\nYour password has been successfully changed.\n\nIf you didn't make this change, please contact support immediately.`;

  return { subject, html, text };
}
