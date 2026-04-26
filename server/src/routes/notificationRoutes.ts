import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(requireAuth);

// Get user's notifications
router.get('/', notificationController.getNotifications.bind(notificationController));

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead.bind(notificationController));

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllAsRead.bind(notificationController));

export default router;
