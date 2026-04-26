import prisma from '../config/database';
import { notificationService } from './notificationService';

interface EventFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  latitude?: number;
  longitude?: number;
  radius?: number;
}

interface CreateEventData {
  organizerId: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName: string;
  scheduledDate: Date;
  duration: number;
  equipmentProvided?: boolean;
  requiredItems?: string[];
}

interface UpdateEventData {
  title?: string;
  description?: string;
  scheduledDate?: Date;
  duration?: number;
  status?: 'upcoming' | 'completed' | 'cancelled';
  litterCollected?: number;
  photos?: string[];
  equipmentProvided?: boolean;
  requiredItems?: string[];
}

export const eventService = {
  async getEvents(filters: EventFilters = {}) {
    const where: any = {};

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      where.scheduledDate = {};
      if (filters.startDate) {
        where.scheduledDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.scheduledDate.lte = filters.endDate;
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        scheduledDate: 'asc',
      },
      include: {
        organizer: {
          select: {
            id: true,
            clerkId: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    // Map to frontend format
    return events.map((event) => ({
      id: event.id,
      organizerId: event.organizerId,
      organizerClerkId: event.organizer.clerkId,
      title: event.title,
      description: event.description,
      latitude: parseFloat(event.latitude.toString()),
      longitude: parseFloat(event.longitude.toString()),
      locationName: event.locationName,
      scheduledDate: event.scheduledDate,
      duration: event.duration,
      status: event.status || 'upcoming',
      participantCount: event._count.registrations,
      litterCollected: event.litterCollected ? parseFloat(event.litterCollected.toString()) : undefined,
      photos: event.photos ? (Array.isArray(event.photos) ? event.photos : []) : undefined,
      equipmentProvided: (event as any).equipmentProvided || false,
      requiredItems: (event as any).requiredItems ? (Array.isArray((event as any).requiredItems) ? (event as any).requiredItems : []) : [],
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));
  },

  async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            clerkId: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) return null;

    return {
      id: event.id,
      organizerId: event.organizerId,
      organizerClerkId: event.organizer.clerkId,
      title: event.title,
      description: event.description,
      latitude: parseFloat(event.latitude.toString()),
      longitude: parseFloat(event.longitude.toString()),
      locationName: event.locationName,
      scheduledDate: event.scheduledDate,
      duration: event.duration,
      status: event.status || 'upcoming',
      participantCount: event._count.registrations,
      litterCollected: event.litterCollected ? parseFloat(event.litterCollected.toString()) : undefined,
      photos: event.photos ? (Array.isArray(event.photos) ? event.photos : []) : undefined,
      equipmentProvided: (event as any).equipmentProvided || false,
      requiredItems: (event as any).requiredItems ? (Array.isArray((event as any).requiredItems) ? (event as any).requiredItems : []) : [],
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  },

  async createEvent(data: CreateEventData) {
    const createdEvent = await prisma.event.create({
      data: {
        organizerId: data.organizerId,
        title: data.title,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        locationName: data.locationName,
        scheduledDate: data.scheduledDate,
        duration: data.duration,
        status: 'upcoming',
        participantCount: 0,
        equipmentProvided: data.equipmentProvided ?? false,
        requiredItems: data.requiredItems?.length ? data.requiredItems : undefined,
      },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    const eventResponse = {
      id: createdEvent.id,
      organizerId: createdEvent.organizerId,
      title: createdEvent.title,
      description: createdEvent.description,
      latitude: parseFloat(createdEvent.latitude.toString()),
      longitude: parseFloat(createdEvent.longitude.toString()),
      locationName: createdEvent.locationName,
      scheduledDate: createdEvent.scheduledDate,
      duration: createdEvent.duration,
      status: createdEvent.status || 'upcoming',
      participantCount: createdEvent._count.registrations,
      litterCollected: createdEvent.litterCollected ? parseFloat(createdEvent.litterCollected.toString()) : undefined,
      photos: createdEvent.photos ? (Array.isArray(createdEvent.photos) ? createdEvent.photos : []) : undefined,
      equipmentProvided: (createdEvent as any).equipmentProvided || false,
      requiredItems: (createdEvent as any).requiredItems ? (Array.isArray((createdEvent as any).requiredItems) ? (createdEvent as any).requiredItems : []) : [],
      createdAt: createdEvent.createdAt,
      updatedAt: createdEvent.updatedAt,
    };

    // Trigger notifications asynchronously (don't wait for completion)
    notificationService.notifyNewEvent(createdEvent.id).catch(error => {
      console.error('Error sending event notifications:', error);
    });

    return eventResponse;
  },

  async updateEvent(id: string, data: UpdateEventData) {
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.scheduledDate !== undefined) updateData.scheduledDate = data.scheduledDate;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.litterCollected !== undefined) updateData.litterCollected = data.litterCollected;
    if (data.photos !== undefined) updateData.photos = data.photos;

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return {
      id: event.id,
      organizerId: event.organizerId,
      title: event.title,
      description: event.description,
      latitude: parseFloat(event.latitude.toString()),
      longitude: parseFloat(event.longitude.toString()),
      locationName: event.locationName,
      scheduledDate: event.scheduledDate,
      duration: event.duration,
      status: event.status || 'upcoming',
      participantCount: event._count.registrations,
      litterCollected: event.litterCollected ? parseFloat(event.litterCollected.toString()) : undefined,
      photos: event.photos ? (Array.isArray(event.photos) ? event.photos : []) : undefined,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  },

  async deleteEvent(id: string) {
    await prisma.event.delete({
      where: { id },
    });
  },

  async registerForEvent(eventId: string, userId: string) {
    // Check if already registered
    const existing = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existing) {
      throw new Error('User is already registered for this event');
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        userId,
        eventId,
      },
    });

    return {
      id: registration.id,
      userId: registration.userId,
      eventId: registration.eventId,
      registeredAt: registration.registeredAt || new Date(),
      attended: registration.attended || false,
    };
  },

  async unregisterFromEvent(eventId: string, userId: string) {
    await prisma.eventRegistration.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });
  },

  async getEventRegistrations(eventId: string) {
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return registrations.map((reg) => ({
      id: reg.id,
      userId: reg.userId,
      eventId: reg.eventId,
      registeredAt: reg.registeredAt || new Date(),
      attended: reg.attended || false,
      user: reg.user,
    }));
  },

  async isUserRegistered(eventId: string, userId: string): Promise<boolean> {
    const registration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    return !!registration;
  },

  async completeEvent(eventId: string, data: { litterCollected: number; photos?: string[] }) {
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: 'completed',
        litterCollected: data.litterCollected,
        photos: data.photos || [],
      },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    return {
      id: event.id,
      organizerId: event.organizerId,
      title: event.title,
      description: event.description,
      latitude: parseFloat(event.latitude.toString()),
      longitude: parseFloat(event.longitude.toString()),
      locationName: event.locationName,
      scheduledDate: event.scheduledDate,
      duration: event.duration,
      status: event.status || 'upcoming',
      participantCount: event._count.registrations,
      litterCollected: event.litterCollected ? parseFloat(event.litterCollected.toString()) : undefined,
      photos: event.photos ? (Array.isArray(event.photos) ? event.photos : []) : undefined,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  },

  async getEventAttendees(eventId: string) {
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            clerkId: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        registeredAt: 'asc',
      },
    });

    return registrations.map((reg) => ({
      id: reg.id,
      userId: reg.userId,
      eventId: reg.eventId,
      registeredAt: reg.registeredAt || new Date(),
      attended: reg.attended || false,
      litterCollected: reg.litterCollected ? parseFloat(reg.litterCollected.toString()) : undefined,
      contributionNote: reg.contributionNote || undefined,
      user: reg.user,
    }));
  },

  async updateAttendeeStatus(
    eventId: string,
    userId: string,
    data: {
      attended?: boolean;
      litterCollected?: number;
      contributionNote?: string;
    }
  ) {
    const registration = await prisma.eventRegistration.update({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      data: {
        attended: data.attended,
        litterCollected: data.litterCollected,
        contributionNote: data.contributionNote,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      id: registration.id,
      userId: registration.userId,
      eventId: registration.eventId,
      registeredAt: registration.registeredAt || new Date(),
      attended: registration.attended || false,
      litterCollected: registration.litterCollected ? parseFloat(registration.litterCollected.toString()) : undefined,
      contributionNote: registration.contributionNote || undefined,
      user: registration.user,
    };
  },

  async bulkUpdateAttendees(
    eventId: string,
    attendees: Array<{
      userId: string;
      attended: boolean;
      litterCollected?: number;
      contributionNote?: string;
    }>
  ) {
    const updates = await Promise.all(
      attendees.map((attendee) =>
        prisma.eventRegistration.update({
          where: {
            userId_eventId: {
              userId: attendee.userId,
              eventId,
            },
          },
          data: {
            attended: attendee.attended,
            litterCollected: attendee.litterCollected,
            contributionNote: attendee.contributionNote,
          },
        })
      )
    );

    return updates;
  },

  async checkInAttendee(eventId: string, userId: string) {
    // Check if user is registered
    let registration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // If not registered, register them now (walk-in)
    if (!registration) {
      registration = await prisma.eventRegistration.create({
        data: {
          userId,
          eventId,
          attended: true, // Check them in immediately
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      });

      return {
        success: true,
        username: registration.user.username,
        firstName: registration.user.firstName,
        lastName: registration.user.lastName,
        wasWalkIn: true, // Flag to indicate this was a walk-in registration
        attendee: {
          id: registration.id,
          userId: registration.userId,
          eventId: registration.eventId,
          registeredAt: registration.registeredAt || new Date(),
          attended: registration.attended || false,
          user: registration.user,
        },
      };
    }

    if (registration.attended) {
      throw new Error('User is already checked in');
    }

    // Update attendance for pre-registered user
    const updated = await prisma.eventRegistration.update({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      data: {
        attended: true,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      success: true,
      username: updated.user.username,
      firstName: updated.user.firstName,
      lastName: updated.user.lastName,
      wasWalkIn: false,
      attendee: {
        id: updated.id,
        userId: updated.userId,
        eventId: updated.eventId,
        registeredAt: updated.registeredAt || new Date(),
        attended: updated.attended || false,
        user: updated.user,
      },
    };
  },
};
