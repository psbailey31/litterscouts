/**
 * Quick test script for email service
 */

import dotenv from 'dotenv';
import { emailService } from '../services/emailService';

dotenv.config();

async function testEmail() {
  console.log('📧 Testing Email Service with Mailgun\n');

  console.log('Configuration:');
  console.log(`  API Key: ${process.env.AHASEND_API_KEY?.substring(0, 30)}...`);
  console.log(`  Account ID: ${process.env.AHASEND_ACCOUNT_ID}`);
  console.log(`  From: ${process.env.FROM_EMAIL}`);
  console.log('');

  // Test 1: Send a simple test email
  console.log('1️⃣ Sending test email...');
  const testEmail = process.env.TEST_EMAIL || 'psbailey31@gmail.com';
  
  const success = await emailService.sendEmail({
    to: testEmail,
    subject: 'Litter Scouts - Test Email',
    text: 'This is a test email from Litter Scouts. If you received this, email notifications are working correctly!',
  });

  if (success) {
    console.log(`✅ Test email sent successfully to ${testEmail}`);
    console.log('   Check your inbox (and spam folder)');
  } else {
    console.log(`❌ Failed to send test email to ${testEmail}`);
  }
  console.log('');

  // Test 2: Send a formatted notification email
  console.log('2️⃣ Sending formatted notification email...');
  const notificationSuccess = await emailService.sendNotificationEmail(
    testEmail,
    'Test User',
    'New Litter Report in Your Area',
    'A new plastic litter report was submitted near Dublin city center. The report indicates a significant amount of plastic waste.',
    'report',
    'test-report-123'
  );

  if (notificationSuccess) {
    console.log(`✅ Notification email sent successfully to ${testEmail}`);
    console.log('   Check your inbox for a formatted notification');
  } else {
    console.log(`❌ Failed to send notification email to ${testEmail}`);
  }
  console.log('');

  console.log('✅ Email testing completed!');
  console.log('');
  console.log('Note: Make sure you have a valid AhaSend API key configured');
  console.log('Get your API key from: https://ahasend.com/');
}

testEmail().catch(console.error);
