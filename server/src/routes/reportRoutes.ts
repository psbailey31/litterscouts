import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Photo upload endpoint (protected)
router.post('/upload', requireAuth, upload.single('photo'), reportController.uploadPhoto.bind(reportController));

// Report CRUD endpoints
router.post('/', requireAuth, reportController.createReport.bind(reportController));
router.get('/', reportController.getReports.bind(reportController));
router.get('/:id', reportController.getReportById.bind(reportController));
router.delete('/:id', requireAuth, reportController.deleteReport.bind(reportController));

// Verification endpoints
router.post('/:id/verify', requireAuth, reportController.verifyReport.bind(reportController));
router.post('/:id/dispute', requireAuth, reportController.disputeReport.bind(reportController));

// Cleanup tracking
router.post('/:id/mark-cleaned', requireAuth, reportController.markAsCleaned.bind(reportController));

export default router;
