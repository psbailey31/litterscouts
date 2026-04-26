/**
 * Test script for notification system
 * Tests notification creation, area-of-interest matching, and email delivery
 */

import dotenv from 'dotenv';
import { notificationService } from '../services/notificationService';
import { emailService } from '../services/emailService';
import prisma from '../config/database';

dotenv.config();

async function testNotificationSystem() {
  console.log('🔔 Testing Notification System\n');

  try {
    // Test 1: Email Service Connection
    console.log('1️⃣ Testing email service connection...');
    const emailConnected = await emailService.testConnection();
    console.log(emailConnected ? '✅ Email service connected' : '❌ Email service failed');
    console.log('');

    // Test 2: Get a test user
    console.log('2️⃣ Finding test user...');
    const testUser = await prisma.user.findFirst({
      where: {
        email: { not: '' },
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        notificationEmail: true,
        notificationInApp: true,
        areasOfInterest: true,
      },
    });

    if (!testUser) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`✅ Found user: ${testUser.username} (${testUser.email})`);
    console.log(`   Email notifications: ${testUser.notificationEmail ? 'enabled' : 'disabled'}`);
    console.log(`   In-app notifications: ${testUser.notificationInApp ? 'enabled' : 'disabled'}`);
    console.log('');

    // Test 3: Create a test notification
    console.log('3️⃣ Creating test notification...');
    const notification = await notificationService.createNotification({
      userId: testUser.id,
      type: 'new_report',
      title: 'Test Notification',
      message: 'This is a test notification from the notification system.',
      latitude: 53.3498,
      longitude: -6.2603,
    });

    console.log(`✅ Notification created: ${notification.id}`);
    console.log('');

    // Test 4: Get user notifications
    console.log('4️⃣ Fetching user notifications...');
    const notifications = await notificationService.getUserNotifications(testUser.id);
    console.log(`✅ Found ${notifications.length} notifications for user`);
    
    if (notifications.length > 0) {
      console.log('   Latest notifications:');
      notifications.slice(0, 3).forEach((n, i) => {
        console.log(`   ${i + 1}. ${n.title} - ${n.read ? 'Read' : 'Unread'}`);
      });
    }
    console.log('');

    // Test 5: Get unread count
    console.log('5️⃣ Getting unread notification count...');
    const unreadCount = await notificationService.getUnreadCount(testUser.id);
    console.log(`✅ Unread notifications: ${unreadCount}`);
    console.log('');

    // Test 6: Mark notification as read
    console.log('6️⃣ Marking notification as read...');
    const marked = await notificationService.markAsRead(notification.id, testUser.id);
    console.log(marked ? '✅ Notification marked as read' : '❌ Failed to mark as read');
    console.log('');

    // Test 7: Test area-of-interest matching
    console.log('7️⃣ Testing area-of-interest matching...');
    
    // Update user with test area of interest (Dublin area)
    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        areasOfInterest: JSON.stringify([
          { lat: 53.3498, lng: -6.2603, radius: 10 }, // Dublin, 10km radius
        ]),
        notificationEmail: true,
        notificationInApp: true,
      },
    });

    // Test location within area (Dublin city center)
    const interestedUsers1 = await notificationService.findInterestedUsers(53.3498, -6.2603);
    console.log(`   Location within area (Dublin): ${interestedUsers1.length} interested users`);
    console.log(`   ${interestedUsers1.includes(testUser.id) ? '✅' : '❌'} Test user is interested`);

    // Test location outside area (Cork)
    const interestedUsers2 = await notificationService.findInterestedUsers(51.8985, -8.4756);
    console.log(`   Location outside area (Cork): ${interestedUsers2.length} interested users`);
    console.log(`   ${!interestedUsers2.includes(testUser.id) ? '✅' : '❌'} Test user is not interested`);
    console.log('');

    // Test 8: Test report notification
    console.log('8️⃣ Testing report notification...');
    const testReport = await prisma.report.findFirst({
      where: {
        userId: { not: testUser.id }, // Different user
      },
      select: { id: true },
    });

    if (testReport) {
      // Temporarily update report location to be within user's area of interest
      await prisma.$executeRaw`
        UPDATE reports 
        SET latitude = 53.3498, longitude = -6.2603,
            location = ST_GeomFromText('POINT(-6.2603 53.3498)', 4326)
        WHERE id = ${testReport.id}
      `;

      const reportNotifications = await notificationService.notifyNewReport(testReport.id);
      console.log(`✅ Created ${reportNotifications.length} report notifications`);
    } else {
      console.log('⚠️  No reports found for testing');
    }
    console.log('');

    // Test 9: Test event notification
    console.log('9️⃣ Testing event notification...');
    const testEvent = await prisma.event.findFirst({
      where: {
        organizerId: { not: testUser.id }, // Different organizer
        status: 'upcoming',
      },
      select: { id: true },
    });

    if (testEvent) {
      // Temporarily update event location to be within user's area of interest
      await prisma.$executeRaw`
        UPDATE events 
        SET latitude = 53.3498, longitude = -6.2603,
            location = ST_GeomFromText('POINT(-6.2603 53.3498)', 4326)
        WHERE id = ${testEvent.id}
      `;

      const eventNotifications = await notificationService.notifyNewEvent(testEvent.id);
      console.log(`✅ Created ${eventNotifications.length} event notifications`);
    } else {
      console.log('⚠️  No events found for testing');
    }
    console.log('');

    // Test 10: Test event reminders
    console.log('🔟 Testing event reminders...');
    const reminders = await notificationService.sendEventReminders();
    console.log(`✅ Sent ${reminders.length} event reminders`);
    console.log('');

    // Test 11: Mark all as read
    console.log('1️⃣1️⃣ Testing mark all as read...');
    const markedCount = await notificationService.markAllAsRead(testUser.id);
    console.log(`✅ Marked ${markedCount} notifications as read`);
    console.log('');

    // Test 12: Send test email directly
    console.log('1️⃣2️⃣ Sending test email...');
    const emailSent = await emailService.sendNotificationEmail(
      testUser.email,
      testUser.firstName,
      'Test Email from Beach Litter Platform',
      'This is a test email to verify that email notifications are working correctly. If you received this, the notification system is functioning properly!',
      'report',
      'test-report-id'
    );
    console.log(emailSent ? '✅ Test email sent successfully' : '❌ Failed to send test email');
    console.log('');

    console.log('✅ All notification tests completed!\n');
    console.log('📧 Check your email inbox for test notifications');
    console.log(`   Email: ${testUser.email}`);

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testNotificationSystem();
