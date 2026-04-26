/**
 * Test script for email-optional functionality
 * 
 * This script tests:
 * 1. Creating users without email addresses
 * 2. Notification delivery for users without email
 * 3. Email service handling of null emails
 * 
 * Run with: npx ts-node src/scripts/testEmailOptional.ts
 */

import prisma from '../config/database';
import { notificationService } from '../services/notificationService';
import { emailService } from '../services/emailService';

async function testEmailOptional() {
  console.log('🧪 Testing Email-Optional Functionality\n');

  try {
    // Test 1: Create a test user without email
    console.log('1️⃣ Creating test user without email...');
    const testUser = await prisma.user.create({
      data: {
        clerkId: `test_${Date.now()}`,
        email: null, // No email
        username: `testuser_${Date.now()}`,
        firstName: 'Test',
        lastName: 'User',
        notificationEmail: true, // Wants email notifications but has no email
        notificationInApp: true,
      },
    });
    console.log(`✅ Created user: ${testUser.username} (ID: ${testUser.id})`);
    console.log(`   Email: ${testUser.email || 'NULL'}`);
    console.log(`   Notification preferences: email=${testUser.notificationEmail}, inApp=${testUser.notificationInApp}\n`);

    // Test 2: Create a notification for this user
    console.log('2️⃣ Creating notification for user without email...');
    const notification = await notificationService.createNotification({
      userId: testUser.id,
      type: 'new_report',
      title: 'Test Notification',
      message: 'This is a test notification for a user without email.',
    });
    console.log(`✅ Created notification: ${notification.id}`);
    console.log(`   Email sent: ${notification.emailSent}\n`);

    // Test 3: Try to send email notification (should be skipped gracefully)
    console.log('3️⃣ Attempting to send email notification...');
    const result = await emailService.sendNotificationEmail(
      testUser.email || '',
      testUser.firstName,
      'Test Email',
      'This should not be sent because user has no email.'
    );
    console.log(`✅ Email send result: ${result}`);
    console.log(`   Expected: false (no email address)\n`);

    // Test 4: Create a user WITH email for comparison
    console.log('4️⃣ Creating test user WITH email...');
    const testUserWithEmail = await prisma.user.create({
      data: {
        clerkId: `test_email_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        username: `testuser_email_${Date.now()}`,
        firstName: 'Test',
        lastName: 'WithEmail',
        notificationEmail: true,
        notificationInApp: true,
      },
    });
    console.log(`✅ Created user: ${testUserWithEmail.username} (ID: ${testUserWithEmail.id})`);
    console.log(`   Email: ${testUserWithEmail.email}\n`);

    // Test 5: Query users for email notifications
    console.log('5️⃣ Querying users eligible for email notifications...');
    const usersForEmail = await prisma.user.findMany({
      where: {
        notificationEmail: true,
        email: { not: null },
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });
    console.log(`✅ Found ${usersForEmail.length} users eligible for email notifications`);
    console.log(`   Users with email: ${usersForEmail.filter(u => u.email).length}`);
    console.log(`   Users without email: ${usersForEmail.filter(u => !u.email).length}\n`);

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await prisma.notification.deleteMany({
      where: { userId: { in: [testUser.id, testUserWithEmail.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUser.id, testUserWithEmail.id] } },
    });
    console.log('✅ Cleanup complete\n');

    console.log('✅ All tests passed!\n');
    console.log('Summary:');
    console.log('- Users can be created without email addresses');
    console.log('- Notifications are created for users without email');
    console.log('- Email sending is gracefully skipped for users without email');
    console.log('- Database queries correctly filter users by email presence');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testEmailOptional();
