import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';

const router = Router();

// Analytics endpoints
router.get('/summary', analyticsController.getSummary.bind(analyticsController));
router.get('/trends', analyticsController.getTrends.bind(analyticsController));
router.get('/comparison', analyticsController.getComparison.bind(analyticsController));
router.get('/export', analyticsController.exportCSV.bind(analyticsController));
router.get('/aggregated', analyticsController.getAggregatedData.bind(analyticsController));

// Hotspot endpoints
router.get('/hotspots', analyticsController.getHotspots.bind(analyticsController));
router.get('/hotspots/:id', analyticsController.getHotspotDetails.bind(analyticsController));
router.post('/hotspots/calculate', analyticsController.calculateHotspots.bind(analyticsController));

export default router;
