import { Router } from 'express';
import {
  getWeather,
  getTides,
  getWaterQuality,
  getBeachQuality,
  getBiodiversity,
  getAllData,
} from '../controllers/externalDataController';

const router = Router();

/**
 * External data routes
 * All routes are public (no authentication required)
 */

// Get weather data for a location
router.get('/weather/:lat/:lng', getWeather);

// Get tide data for a location
router.get('/tides/:lat/:lng', getTides);

// Get water quality data for a location
router.get('/water-quality/:lat/:lng', getWaterQuality);

// Get beach quality data for a location
router.get('/beach-quality/:lat/:lng', getBeachQuality);

// Get biodiversity data for a location
router.get('/biodiversity/:lat/:lng', getBiodiversity);

// Get all environmental data for a location
router.get('/all/:lat/:lng', getAllData);

export default router;
