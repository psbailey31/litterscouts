import { Router } from 'express';
import { eventController } from '../controllers/eventController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEvent);
router.get('/:id/registrations', eventController.getEventRegistrations);
router.get('/:id/attendees', eventController.getEventAttendees);

// Protected routes (require authentication)
router.post('/', requireAuth, eventController.createEvent);
router.patch('/:id', requireAuth, eventController.updateEvent);
router.delete('/:id', requireAuth, eventController.deleteEvent);
router.post('/:id/register', requireAuth, eventController.registerForEvent);
router.delete('/:id/register', requireAuth, eventController.unregisterFromEvent);
router.get('/:id/registration-status', requireAuth, eventController.getRegistrationStatus);
router.post('/:id/complete', requireAuth, eventController.completeEvent);
router.patch('/:id/attendees/:attendeeId', requireAuth, eventController.updateAttendeeStatus);
router.post('/:id/attendees/bulk', requireAuth, eventController.bulkUpdateAttendees);
router.post('/:id/checkin', requireAuth, eventController.checkInAttendee);

export default router;
