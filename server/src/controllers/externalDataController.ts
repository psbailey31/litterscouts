import { Request, Response } from 'express';
import {
  getWeatherData,
  getTideData,
  getWaterQualityData,
  getBeachQualityData,
  getBiodiversityData,
  getAllEnvironmentalData,
} from '../services/externalDataService';

/**
 * Get weather data for a location
 * GET /api/external/weather/:lat/:lng
 */
export const getWeather = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Invalid latitude or longitude',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Coordinates out of valid range',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const weatherData = await getWeatherData(latitude, longitude);

    if (!weatherData) {
      return res.status(200).json({
        temperature: null,
        feelsLike: null,
        humidity: null,
        windSpeed: null,
        windDirection: null,
        description: 'Weather data unavailable',
        icon: null,
        timestamp: new Date().toISOString(),
        note: 'OpenWeatherMap API key may need activation (can take a few hours)',
      });
    }

    res.json(weatherData);
  } catch (error) {
    console.error('Error in getWeather controller:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch weather data',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Get tide data for a location
 * GET /api/external/tides/:lat/:lng
 */
export const getTides = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Invalid latitude or longitude',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Coordinates out of valid range',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const tideData = await getTideData(latitude, longitude);

    if (!tideData) {
      return res.status(503).json({
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: 'Tide data temporarily unavailable',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json(tideData);
  } catch (error) {
    console.error('Error in getTides controller:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch tide data',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Get water quality data for a location
 * GET /api/external/water-quality/:lat/:lng
 */
export const getWaterQuality = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Invalid latitude or longitude',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Coordinates out of valid range',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const waterQualityData = await getWaterQualityData(latitude, longitude);

    if (!waterQualityData) {
      return res.status(503).json({
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: 'Water quality data temporarily unavailable',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json(waterQualityData);
  } catch (error) {
    console.error('Error in getWaterQuality controller:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch water quality data',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Get beach quality data for a location
 * GET /api/external/beach-quality/:lat/:lng
 */
export const getBeachQuality = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Invalid latitude or longitude',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Coordinates out of valid range',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const beachQualityData = await getBeachQualityData(latitude, longitude);

    if (!beachQualityData) {
      return res.status(503).json({
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: 'Beach quality data temporarily unavailable',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      data: beachQualityData,
      location: { latitude, longitude },
    });
  } catch (error) {
    console.error('Error in getBeachQuality controller:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch beach quality data',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Get biodiversity data for a location
 * GET /api/external/biodiversity/:lat/:lng
 */
export const getBiodiversity = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Invalid latitude or longitude',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Coordinates out of valid range',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const biodiversityData = await getBiodiversityData(latitude, longitude);

    if (!biodiversityData) {
      return res.status(503).json({
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: 'Biodiversity data temporarily unavailable',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json(biodiversityData);
  } catch (error) {
    console.error('Error in getBiodiversity controller:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch biodiversity data',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Get all environmental data for a location
 * GET /api/external/all/:lat/:lng
 */
export const getAllData = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Invalid latitude or longitude',
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Coordinates out of valid range',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const allData = await getAllEnvironmentalData(latitude, longitude);

    res.json(allData);
  } catch (error) {
    console.error('Error in getAllData controller:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch environmental data',
        timestamp: new Date().toISOString(),
      },
    });
  }
};
