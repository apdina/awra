/**
 * Test Email Sending
 * Usage: tsx scripts/test-email.ts <your-email@example.com>
 */

import { sendEmail, getPasswordResetEmail } from '../lib/email';

const testEmail = process.argv[2];

if (!testEmail) {
  console.error('❌ Please provide an email address');
  console.error('Usage: tsx scripts/test-email.ts your-email@example.com');
  process.exit(1);
}

async function testEmailSending() {
  console.log('📧 Testing email service...\n');

  // Check configuration
  console.log('Configuration:');
  console.log('  Provider:', process.env.EMAIL_PROVIDER || 'not set');
  console.log('  From:', process.env.EMAIL_FROM || 'not set');
  console.log('  API Key:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('');

  if (!process.env.EMAIL_PROVIDER) {
    console.error('❌ EMAIL_PROVIDER not set in .env');
    console.log('\nAdd to .env:');
    console.log('  EMAIL_PROVIDER=resend');
    console.log('  RESEND_API_KEY=re_your_key_here');
    console.log('  EMAIL_FROM=noreply@yourdomain.com');
    process.exit(1);
  }

  // Generate test email
  const resetLink = 'http://localhost:3000/reset-password?token=test-token-123';
  const template = getPasswordResetEmail(resetLink, 60);

  console.log('📨 Sending test email to:', testEmail);
  console.log('');

  try {
    const result = await sendEmail({
      to: testEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('   Message ID:', result.messageId);
      console.log('');
      console.log('📬 Check your inbox at:', testEmail);
      console.log('   (Don\'t forget to check spam folder)');
    } else {
      console.error('❌ Failed to send email');
      console.error('   Error:', result.error);
      console.log('');
      console.log('💡 Troubleshooting:');
      console.log('   1. Verify API key is correct');
      console.log('   2. Check email provider dashboard');
      console.log('   3. Verify EMAIL_FROM is set');
      console.log('   4. Check console for detailed errors');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('💡 Make sure you have:');
    console.log('   1. Set EMAIL_PROVIDER in .env');
    console.log('   2. Set RESEND_API_KEY (or SENDGRID_API_KEY)');
    console.log('   3. Set EMAIL_FROM');
  }
}

testEmailSending().catch(console.error);
