import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { eventService } from '../services/eventService';
import prisma from '../config/database';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Helper to find or create user from Clerk ID
async function findOrCreateUser(clerkId: string): Promise<string> {
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
    
    user = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser.emailAddresses[0]?.emailAddress || null,
        username: clerkUser.username || `user_${clerkId.substring(0, 8)}`,
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

export const eventController = {
  // Get all events with optional filters
  async getEvents(req: AuthRequest, res: Response) {
    try {
      const { status, startDate, endDate, latitude, longitude, radius } = req.query;

      const filters: any = {};
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (latitude && longitude) {
        filters.latitude = parseFloat(latitude as string);
        filters.longitude = parseFloat(longitude as string);
        if (radius) filters.radius = parseFloat(radius as string);
      }

      const events = await eventService.getEvents(filters);
      res.json(events);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      res.status(500).json({
        code: 'FETCH_EVENTS_ERROR',
        message: 'Failed to fetch events',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Get single event by ID
  async getEvent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const event = await eventService.getEventById(id);

      if (!event) {
        return res.status(404).json({
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found',
          timestamp: new Date().toISOString(),
        });
      }

      res.json(event);
    } catch (error: any) {
      console.error('Error fetching event:', error);
      res.status(500).json({
        code: 'FETCH_EVENT_ERROR',
        message: 'Failed to fetch event',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Create new event
  async createEvent(req: AuthRequest, res: Response) {
    try {
      const clerkId = req.userId;
      if (!clerkId) {
        return res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
      }

      // Find or create user in database
      const userId = await findOrCreateUser(clerkId);

      const { title, description, latitude, longitude, locationName, scheduledDate, duration, equipmentProvided, requiredItems } = req.body;

      // Validation
      if (!title || !description || !latitude || !longitude || !locationName || !scheduledDate || !duration) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          timestamp: new Date().toISOString(),
        });
      }

      const eventData = {
        organizerId: userId,
        title,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        locationName,
        scheduledDate: new Date(scheduledDate),
        duration: parseInt(duration),
        equipmentProvided: equipmentProvided !== undefined ? Boolean(equipmentProvided) : false,
        requiredItems: Array.isArray(requiredItems) ? requiredItems : [],
      };

      const event = await eventService.createEvent(eventData);
      res.status(201).json(event);
    } catch (error: any) {
      console.error('Error creating event:', error);
      res.status(500).json({
        code: 'CREATE_EVENT_ERROR',
        message: 'Failed to create event',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Update event
  async updateEvent(req: AuthRequest, res: Response) {
    try {
      const clerkId = req.userId;
      if (!clerkId) {
        return res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
      }

      const userId = await findOrCreateUser(clerkId);

      const { id } = req.params;
      const event = await eventService.getEventById(id);

      if (!event) {
        return res.status(404).json({
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found',
          timestamp: new Date().toISOString(),
        });
      }

      // Check if user is the organizer
      if (event.organizerId !== userId) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'Only the event organizer can update this event',
          timestamp: new Date().toISOString(),
        });
      }

      const updatedEvent = await eventService.updateEvent(id, req.body);
      res.json(updatedEvent);
    } catch (error: any) {
      console.error('Error updating event:', error);
      res.status(500).json({
        code: 'UPDATE_EVENT_ERROR',
        message: 'Failed to update event',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Delete event
  async deleteEvent(req: AuthRequest, res: Response) {
    try {
      const clerkId = req.userId;
      if (!clerkId) {
        return res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
      }

      const userId = await findOrCreateUser(clerkId);

      const { id } = req.params;
      const event = await eventService.getEventById(id);

      if (!event) {
        return res.status(404).json({
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found',
          timestamp: new Date().toISOString(),
        });
      }

      // Check if user is the organizer
      if (event.organizerId !== userId) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'Only the event organizer can delete this event',
          timestamp: new Date().toISOString(),
        });
      }

      await eventService.deleteEvent(id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      res.status(500).json({
        code: 'DELETE_EVENT_ERROR',
        message: 'Failed to delete event',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Register for event
  async registerForEvent(req: AuthRequest, res: Response) {
    try {
      const clerkId = req.userId;
      if (!clerkId) {
        return res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
      }

      const userId = await findOrCreateUser(clerkId);

      const { id } = req.params;
      const registration = await eventService.registerForEvent(id, userId);
      res.status(201).json(registration);
    } catch (error: any) {
      console.error('Error registering for event:', error);
      
      if (error.message.includes('already registered')) {
        return res.status(409).json({
          code: 'ALREADY_REGISTERED',
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(500).json({
        code: 'REGISTER_EVENT_ERROR',
        message: 'Failed to register for event',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Unregister from event
  async unregisterFromEvent(req: AuthRequest, res: Response) {
    try {
      const clerkId = req.userId;
      if (!clerkId) {
        return res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
      }

      const userId = await findOrCreateUser(clerkId);

      const { id } = req.params;
      await eventService.unregisterFromEvent(id, userId);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error unregistering from event:', error);
      res.status(500).json({
        code: 'UNREGISTER_EVENT_ERROR',
        message: 'Failed to unregister from event',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Get event registrations
  async getEventRegistrations(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const registrations = await eventService.getEventRegistrations(id);
      res.json(registrations);
    } catch (error: any) {
      console.error('Error fetching event registrations:', error);
      res.status(500).json({
        code: 'FETCH_REGISTRATIONS_ERROR',
        message: 'Failed to fetch event registrations',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Check registration status
  async getRegistrationStatus(req: AuthRequest, res: Response) {
    try {
      const clerkId = req.userId;
      if (!clerkId) {
        return res.json({ registered: false });
      }

      const userId = await findOrCreateUser(clerkId);

      const { id } = req.params;
      const isRegistered = await eventService.isUserRegistered(id, userId);
      res.json({ registered: isRegistered });
    } catch (error: any) {
      console.error('Error checking registration status:', error);
      res.status(500).json({
        code: 'CHECK_REGISTRATION_ERROR',
        message: 'Failed to check registration status',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Complete event
  async completeEvent(req: AuthRequest, res: Response) {
    try {
      const clerkId = req.userId;
      if (!clerkId) {
        return res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
      }

      const userId = await findOrCreateUser(clerkId);

      const { id } = req.params;
      const event = await eventService.getEventById(id);

      if (!event) {
        return res.status(404).json({
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found',
          timestamp: new Date().toISOString(),
        });
      }

      // Check if user is the organizer
      if (event.organizerId !== userId) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'Only the event organizer can complete this event',
          timestamp: new Date().toISOString(),
        });
      }

      const { litterCollected, photos } = req.body;

      // Validation
      if (litterCollected === undefined || litterCollected === null) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'litterCollected is required',
          timestamp: new Date().toISOString(),
        });
      }

      const completedEvent = await eventService.completeEvent(id, {
        litterCollected: parseFloat(litterCollected),
        photos: photos || [],
      });

      res.json(completedEvent);
    } catch (error: any) {
      console.error('Error completing event:', error);
      res.status(500).json({
        code: 'COMPLETE_EVENT_ERROR',
        message: 'Failed to complete event',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Get event attendees
  async getEventAttendees(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const attendees = await eventService.getEventAttendees(id);
      res.json(attendees);
    } catch (error: any) {
      console.error('Error fetching event attendees:', error);
      res.status(500).json({
        code: 'FETCH_ATTENDEES_ERROR',
        message: 'Failed to fetch event attendees',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Update attendee status
  async updateAttendeeStatus(req: AuthRequest, res: Response) {
    try {
      const clerkId = req.userId;
      if (!clerkId) {
        return res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
      }

      const userId = await findOrCreateUser(clerkId);
      const { id, attendeeId } = req.params;
      const event = await eventService.getEventById(id);

      if (!event) {
        return res.status(404).json({
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found',
          timestamp: new Date().toISOString(),
        });
      }

      // Check if user is the organizer
      if (event.organizerId !== userId) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'Only the event organizer can update attendee status',
          timestamp: new Date().toISOString(),
        });
      }

      const { attended, litterCollected, contributionNote } = req.body;

      const updatedAttendee = await eventService.updateAttendeeStatus(id, attendeeId, {
        attended,
        litterCollected: litterCollected !== undefined ? parseFloat(litterCollected) : undefined,
        contributionNote,
      });

      res.json(updatedAttendee);
    } catch (error: any) {
      console.error('Error updating attendee status:', error);
      res.status(500).json({
        code: 'UPDATE_ATTENDEE_ERROR',
        message: 'Failed to update attendee status',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // Bulk update attendees
  async bulkUpdateAttendees(req: AuthRequest, res: Response) {
    try {
      const clerkId = req.userId;
      if (!clerkId) {
        return res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
      }

      const userId = await findOrCreateUser(clerkId);
      const { id } = req.params;
      const event = await eventService.getEventById(id);

      if (!event) {
        return res.status(404).json({
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found',
          timestamp: new Date().toISOString(),
        });
      }

      // Check if user is the organizer
      if (event.organizerId !== userId) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'Only the event organizer can update attendees',
          timestamp: new Date().toISOString(),
        });
      }

      const { attendees } = req.body;

      if (!Array.isArray(attendees)) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'attendees must be an array',
          timestamp: new Date().toISOString(),
        });
      }

      await eventService.bulkUpdateAttendees(id, attendees);

      // Fetch updated attendees
      const updatedAttendees = await eventService.getEventAttendees(id);
      res.json(updatedAttendees);
    } catch (error: any) {
      console.error('Error bulk updating attendees:', error);
      res.status(500).json({
        code: 'BULK_UPDATE_ATTENDEES_ERROR',
        message: 'Failed to bulk update attendees',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },

  // QR Code Check-in
  async checkInAttendee(req: AuthRequest, res: Response) {
    try {
      const organizerClerkId = req.userId;
      if (!organizerClerkId) {
        return res.status(401).json({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          timestamp: new Date().toISOString(),
        });
      }

      const organizerId = await findOrCreateUser(organizerClerkId);
      const { id } = req.params;
      const { clerkUserId } = req.body;

      if (!clerkUserId) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          message: 'clerkUserId is required',
          timestamp: new Date().toISOString(),
        });
      }

      // Verify event exists and user is organizer
      const event = await eventService.getEventById(id);
      if (!event) {
        return res.status(404).json({
          code: 'EVENT_NOT_FOUND',
          message: 'Event not found',
          timestamp: new Date().toISOString(),
        });
      }

      if (event.organizerId !== organizerId) {
        return res.status(403).json({
          code: 'FORBIDDEN',
          message: 'Only the event organizer can check in attendees',
          timestamp: new Date().toISOString(),
        });
      }

      // Find or create the attendee user
      const attendeeUserId = await findOrCreateUser(clerkUserId);

      // Check in the attendee (will auto-register if not registered)
      const result = await eventService.checkInAttendee(id, attendeeUserId);

      res.json(result);
    } catch (error: any) {
      console.error('Error checking in attendee:', error);

      if (error.message.includes('already checked in')) {
        return res.status(409).json({
          code: 'ALREADY_CHECKED_IN',
          message: error.message,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(500).json({
        code: 'CHECKIN_ERROR',
        message: 'Failed to check in attendee',
        details: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },
};
