import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { calculateDistance } from '../utils/spatial';
import { emailService } from './emailService';

interface AreaOfInterest {
  lat: number;
  lng: number;
  radius: number; // in kilometers
}

interface CreateNotificationData {
  userId: string;
  type: 'new_report' | 'new_event' | 'event_reminder' | 'report_verified' | 'report_disputed';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: 'report' | 'event';
  latitude?: number;
  longitude?: number;
}

export class NotificationService {
  /**
   * Create a notification for a specific user
   */
  async createNotification(data: CreateNotificationData) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        latitude: data.latitude,
        longitude: data.longitude,
        read: false,
        emailSent: false,
      },
    });

    return notification;
  }

  /**
   * Find users interested in a specific location
   * Returns users who have areas of interest that include the given location
   */
  async findInterestedUsers(latitude: number, longitude: number): Promise<string[]> {
    // Get all users with notification preferences enabled and areas of interest
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { notificationEmail: true },
          { notificationInApp: true },
        ],
        areasOfInterest: {
          not: Prisma.JsonNull,
        },
      },
      select: {
        id: true,
        areasOfInterest: true,
      },
    });

    const interestedUserIds: string[] = [];

    for (const user of users) {
      if (!user.areasOfInterest) continue;

      try {
        const areasOfInterest: AreaOfInterest[] = 
          typeof user.areasOfInterest === 'string'
            ? JSON.parse(user.areasOfInterest)
            : user.areasOfInterest as any;

        // Check if the location falls within any of the user's areas of interest
        for (const area of areasOfInterest) {
          const distance = await calculateDistance(
            latitude,
            longitude,
            area.lat,
            area.lng
          );

          // If within radius, add user to interested list
          if (distance <= area.radius) {
            interestedUserIds.push(user.id);
            break; // No need to check other areas for this user
          }
        }
      } catch (error) {
        console.error(`Error parsing areasOfInterest for user ${user.id}:`, error);
      }
    }

    return interestedUserIds;
  }

  /**
   * Notify users about a new report
   */
  async notifyNewReport(reportId: string) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    const latitude = Number(report.latitude);
    const longitude = Number(report.longitude);

    // Find interested users
    const interestedUserIds = await this.findInterestedUsers(latitude, longitude);

    // Filter out the report creator
    const recipientIds = interestedUserIds.filter(id => id !== report.userId);

    if (recipientIds.length === 0) {
      return [];
    }

    // Create notifications for all interested users
    const notifications = await Promise.all(
      recipientIds.map(userId =>
        this.createNotification({
          userId,
          type: 'new_report',
          title: 'New Litter Report in Your Area',
          message: `${report.user.username} reported ${report.litterType} litter near your area of interest.`,
          relatedId: reportId,
          relatedType: 'report',
          latitude,
          longitude,
        })
      )
    );

    // Send email notifications asynchronously
    this.sendEmailNotifications(notifications).catch(error => {
      console.error('Error sending email notifications:', error);
    });

    return notifications;
  }

  /**
   * Notify users about a new event
   */
  async notifyNewEvent(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const latitude = Number(event.latitude);
    const longitude = Number(event.longitude);

    // Find interested users
    const interestedUserIds = await this.findInterestedUsers(latitude, longitude);

    // Filter out the event organizer
    const recipientIds = interestedUserIds.filter(id => id !== event.organizerId);

    if (recipientIds.length === 0) {
      return [];
    }

    // Create notifications for all interested users
    const notifications = await Promise.all(
      recipientIds.map(userId =>
        this.createNotification({
          userId,
          type: 'new_event',
          title: 'New Cleanup Event in Your Area',
          message: `${event.organizer.username} organized "${event.title}" at ${event.locationName}.`,
          relatedId: eventId,
          relatedType: 'event',
          latitude,
          longitude,
        })
      )
    );

    // Send email notifications asynchronously
    this.sendEmailNotifications(notifications).catch(error => {
      console.error('Error sending email notifications:', error);
    });

    return notifications;
  }

  /**
   * Notify user about report verification
   */
  async notifyReportVerification(reportId: string, verificationType: 'verify' | 'dispute') {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: {
            id: true,
            notificationEmail: true,
            notificationInApp: true,
          },
        },
      },
    });

    if (!report || !report.user.notificationInApp) {
      return null;
    }

    const type = verificationType === 'verify' ? 'report_verified' : 'report_disputed';
    const title = verificationType === 'verify' 
      ? 'Your Report Was Verified' 
      : 'Your Report Was Disputed';
    const message = verificationType === 'verify'
      ? 'A community member verified your litter report.'
      : 'A community member disputed your litter report.';

    const notification = await this.createNotification({
      userId: report.userId,
      type,
      title,
      message,
      relatedId: reportId,
      relatedType: 'report',
      latitude: Number(report.latitude),
      longitude: Number(report.longitude),
    });

    // Send email notification asynchronously
    this.sendEmailNotifications([notification]).catch(error => {
      console.error('Error sending email notification:', error);
    });

    return notification;
  }

  /**
   * Send event reminders for upcoming events (within 24 hours)
   */
  async sendEventReminders() {
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);

    const upcomingEvents = await prisma.event.findMany({
      where: {
        status: 'upcoming',
        scheduledDate: {
          gte: new Date(),
          lte: tomorrow,
        },
      },
      include: {
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                notificationEmail: true,
                notificationInApp: true,
              },
            },
          },
        },
      },
    });

    const notifications = [];

    for (const event of upcomingEvents) {
      for (const registration of event.registrations) {
        if (!registration.user.notificationInApp) continue;

        // Check if reminder already sent
        const existingReminder = await prisma.notification.findFirst({
          where: {
            userId: registration.userId,
            type: 'event_reminder',
            relatedId: event.id,
          },
        });

        if (existingReminder) continue;

        const notification = await this.createNotification({
          userId: registration.userId,
          type: 'event_reminder',
          title: 'Event Reminder',
          message: `"${event.title}" is happening soon at ${event.locationName}!`,
          relatedId: event.id,
          relatedType: 'event',
          latitude: Number(event.latitude),
          longitude: Number(event.longitude),
        });

        notifications.push(notification);
      }
    }

    // Send email notifications asynchronously
    if (notifications.length > 0) {
      this.sendEmailNotifications(notifications).catch(error => {
        console.error('Error sending email reminders:', error);
      });
    }

    return notifications;
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return notifications;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
      data: {
        read: true,
      },
    });

    return notification.count > 0;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return result.count;
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return count;
  }

  /**
   * Delete old notifications (older than 30 days)
   */
  async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
        read: true,
      },
    });

    return result.count;
  }

  /**
   * Send email notifications using email service
   * Gracefully handles users without email addresses
   */
  private async sendEmailNotifications(notifications: any[]) {
    // Get user emails for notifications
    const userIds = [...new Set(notifications.map(n => n.userId))];
    
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        notificationEmail: true,
        email: { not: null }, // Only get users with email addresses
      },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    for (const notification of notifications) {
      const user = userMap.get(notification.userId);
      
      if (!user) {
        // User doesn't have email or has email notifications disabled
        console.log(`[Notification] Skipping email for user ${notification.userId} (no email address or disabled)`);
        continue;
      }

      if (!user.email) {
        // Extra safety check - should not happen due to query filter
        console.log(`[Notification] Skipping email for user ${user.id} (email is null)`);
        continue;
      }

      try {
        // Send email using email service
        const success = await emailService.sendNotificationEmail(
          user.email,
          user.firstName,
          notification.title,
          notification.message,
          notification.relatedType,
          notification.relatedId
        );

        if (success) {
          // Mark as email sent
          await prisma.notification.update({
            where: { id: notification.id },
            data: { emailSent: true },
          });
        }
      } catch (error) {
        console.error(`Error sending email to ${user.email}:`, error);
      }
    }
  }
}

export const notificationService = new NotificationService();
