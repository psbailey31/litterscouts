import prisma from '../config/database';
import { clerkClient } from '@clerk/clerk-sdk-node';

export interface UpdateUserProfileData {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
}

export interface UpdateNotificationPreferencesData {
  notificationEmail?: boolean;
  notificationInApp?: boolean;
  areasOfInterest?: Array<{
    lat: number;
    lng: number;
    radius: number;
  }>;
}

export class UserService {
  /**
   * Find or create user from Clerk ID
   */
  async findOrCreateUser(clerkId: string): Promise<string> {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (user) {
      return user.id;
    }

    // User doesn't exist, fetch from Clerk and create
    try {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      
      // Generate a clean username from Clerk ID (remove 'user_' prefix if present)
      const cleanClerkId = clerkId.startsWith('user_') ? clerkId.substring(5) : clerkId;
      const defaultUsername = clerkUser.username || `user${cleanClerkId.substring(0, 8)}`;
      
      user = await prisma.user.create({
        data: {
          clerkId,
          email: clerkUser.emailAddresses[0]?.emailAddress || null,
          username: defaultUsername,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          avatarUrl: clerkUser.imageUrl,
        },
        select: { id: true },
      });

      return user.id;
    } catch (error) {
      console.error('Error creating user from Clerk:', error);
      throw new Error('Failed to create user');
    }
  }

  /**
   * Get user profile by database ID or Clerk ID
   */
  async getUserProfile(userId: string) {
    // Check if this is a Clerk ID (starts with 'user_')
    const isClerkId = userId.startsWith('user_');
    
    // If it's a Clerk ID, ensure the user exists in our database
    if (isClerkId) {
      await this.findOrCreateUser(userId);
    }
    
    const user = await prisma.user.findUnique({
      where: isClerkId ? { clerkId: userId } : { id: userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        impactScore: true,
        notificationEmail: true,
        notificationInApp: true,
        areasOfInterest: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reports: true,
            eventRegistrations: {
              where: { attended: true },
            },
            organizedEvents: true,
          },
        },
        eventRegistrations: {
          where: {
            attended: true,
            litterCollected: {
              not: null,
            },
          },
          select: {
            litterCollected: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Parse areasOfInterest from JSON string if it exists
    let areasOfInterest = [];
    if (user.areasOfInterest) {
      try {
        areasOfInterest = typeof user.areasOfInterest === 'string' 
          ? JSON.parse(user.areasOfInterest) 
          : user.areasOfInterest;
      } catch (e) {
        console.error('Error parsing areasOfInterest:', e);
      }
    }

    // Calculate total litter collected across all attended events
    const totalLitterCollected = user.eventRegistrations.reduce((sum, reg) => {
      return sum + (reg.litterCollected ? Number(reg.litterCollected) : 0);
    }, 0);

    return {
      ...user,
      areasOfInterest,
      reportCount: user._count.reports,
      eventCount: user._count.eventRegistrations,
      totalLitterCollected,
      stats: {
        reportsSubmitted: user._count.reports,
        eventsAttended: user._count.eventRegistrations,
        eventsOrganized: user._count.organizedEvents,
      },
    };
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, data: UpdateUserProfileData) {
    // Check if username is being changed and if it's already taken
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          id: { not: userId },
        },
      });

      if (existingUser) {
        throw new Error('Username already taken');
      }
    }

    // Check if email is being changed and if it's already taken
    if (data.email !== undefined) {
      // Allow setting email to null or empty string
      if (data.email && data.email.trim() !== '') {
        const existingUser = await prisma.user.findFirst({
          where: {
            email: data.email,
            id: { not: userId },
          },
        });

        if (existingUser) {
          throw new Error('Email already in use');
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email !== undefined ? (data.email.trim() === '' ? null : data.email) : undefined,
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        impactScore: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  /**
   * Get user's reports by database ID or Clerk ID
   */
  async getUserReports(userId: string) {
    // Check if this is a Clerk ID and convert to database ID
    const isClerkId = userId.startsWith('user_');
    let dbUserId = userId;
    
    if (isClerkId) {
      // Ensure user exists in database
      dbUserId = await this.findOrCreateUser(userId);
    }
    
    const reports = await prisma.report.findMany({
      where: { userId: dbUserId },
      include: {
        environmentalConcerns: true,
        verifications: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reports;
  }

  /**
   * Get user's events (both registered and organized) by database ID or Clerk ID
   */
  async getUserEvents(userId: string) {
    // Check if this is a Clerk ID and convert to database ID
    const isClerkId = userId.startsWith('user_');
    let dbUserId = userId;
    
    if (isClerkId) {
      // Ensure user exists in database
      dbUserId = await this.findOrCreateUser(userId);
    }
    
    // Get events user has registered for
    const registeredEvents = await prisma.eventRegistration.findMany({
      where: { userId: dbUserId },
      include: {
        event: {
          include: {
            organizer: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
    });

    // Get events user has organized
    const organizedEvents = await prisma.event.findMany({
      where: { organizerId: dbUserId },
      include: {
        organizer: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        registrations: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      registered: registeredEvents.map(reg => ({
        ...reg.event,
        registeredAt: reg.registeredAt,
        attended: reg.attended,
      })),
      organized: organizedEvents,
    };
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    data: UpdateNotificationPreferencesData
  ) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        notificationEmail: data.notificationEmail,
        notificationInApp: data.notificationInApp,
        areasOfInterest: data.areasOfInterest ? JSON.stringify(data.areasOfInterest) : undefined,
      },
      select: {
        id: true,
        notificationEmail: true,
        notificationInApp: true,
        areasOfInterest: true,
      },
    });

    // Parse areasOfInterest from JSON string
    let areasOfInterest = [];
    if (updatedUser.areasOfInterest) {
      try {
        areasOfInterest = typeof updatedUser.areasOfInterest === 'string' 
          ? JSON.parse(updatedUser.areasOfInterest) 
          : updatedUser.areasOfInterest;
      } catch (e) {
        console.error('Error parsing areasOfInterest:', e);
      }
    }

    return {
      ...updatedUser,
      areasOfInterest,
    };
  }

  /**
   * Get user's activity timeline
   */
  async getUserActivity(userId: string) {
    // Check if this is a Clerk ID and convert to database ID
    const isClerkId = userId.startsWith('user_');
    let dbUserId = userId;
    
    if (isClerkId) {
      // Ensure user exists in database
      dbUserId = await this.findOrCreateUser(userId);
    }

    // Get user's reports
    const reports = await prisma.report.findMany({
      where: { userId: dbUserId },
      select: {
        id: true,
        createdAt: true,
        litterType: true,
        quantity: true,
        latitude: true,
        longitude: true,
        description: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Get user's event registrations
    const eventRegistrations = await prisma.eventRegistration.findMany({
      where: { userId: dbUserId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            description: true,
            scheduledDate: true,
            latitude: true,
            longitude: true,
            locationName: true,
            status: true,
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
      take: 50,
    });

    // Get user's organized events
    const organizedEvents = await prisma.event.findMany({
      where: { organizerId: dbUserId },
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        scheduledDate: true,
        latitude: true,
        longitude: true,
        locationName: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Combine and format activities
    const activities = [
      ...reports.map(report => ({
        id: report.id,
        type: 'report' as const,
        timestamp: report.createdAt || new Date(),
        title: `Reported ${report.litterType} litter`,
        description: report.description || `${report.quantity} amount of ${report.litterType}`,
        location: {
          latitude: Number(report.latitude),
          longitude: Number(report.longitude),
        },
      })),
      ...eventRegistrations.map(reg => {
        const activityType: 'event_attended' = 'event_attended';
        return {
          id: reg.event.id,
          type: activityType,
          timestamp: reg.registeredAt || new Date(),
          title: reg.event.title,
          description: reg.event.description,
          location: {
            latitude: Number(reg.event.latitude),
            longitude: Number(reg.event.longitude),
            locationName: reg.event.locationName,
          },
        };
      }),
      ...organizedEvents.map(event => {
        const activityType: 'event_created' | 'event_completed' = 
          event.status === 'completed' ? 'event_completed' : 'event_created';
        return {
          id: event.id,
          type: activityType,
          timestamp: event.createdAt || new Date(),
          title: event.title,
          description: event.description,
          location: {
            latitude: Number(event.latitude),
            longitude: Number(event.longitude),
            locationName: event.locationName,
          },
        };
      }),
    ];

    // Sort by timestamp descending
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return activities;
  }

  /**
   * Calculate and update user impact score
   * Impact score = (reports * 10) + (events attended * 20) + (events organized * 50)
   */
  async calculateImpactScore(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            reports: true,
            eventRegistrations: {
              where: { attended: true },
            },
            organizedEvents: {
              where: { status: 'completed' },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const impactScore =
      user._count.reports * 10 +
      user._count.eventRegistrations * 20 +
      user._count.organizedEvents * 50;

    // Update the impact score
    await prisma.user.update({
      where: { id: userId },
      data: { impactScore },
    });

    return impactScore;
  }
}

export const userService = new UserService();
