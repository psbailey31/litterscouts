import { Router } from 'express';
import { userController } from '../controllers/userController';
import { requireAuth } from '../middleware/auth';

const router = Router();

// User profile endpoints
router.get('/:id', userController.getUserProfile.bind(userController));
router.patch('/:id', requireAuth, userController.updateUserProfile.bind(userController));

// User reports and events
router.get('/:id/reports', userController.getUserReports.bind(userController));
router.get('/:id/events', userController.getUserEvents.bind(userController));
router.get('/:id/activity', userController.getUserActivity.bind(userController));

// Notification preferences
router.patch('/:id/preferences', requireAuth, userController.updateNotificationPreferences.bind(userController));

// Impact score calculation
router.post('/:id/calculate-impact', userController.calculateImpactScore.bind(userController));

export default router;
