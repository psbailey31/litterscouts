// External environmental data service
import { apiClient } from './api';
import type {
  WeatherData,
  TideData,
  WaterQualityData,
  BeachQualityData,
  BiodiversityData,
  ExternalEnvironmentalData,
} from '@/types';

export const externalDataService = {
  /**
   * Fetch weather data for a location
   */
  async getWeather(latitude: number, longitude: number): Promise<WeatherData | null> {
    try {
      const data = await apiClient.get<WeatherData>(
        `/external/weather/${latitude}/${longitude}`
      );
      return data;
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      return null;
    }
  },

  /**
   * Fetch tide information for a location
   */
  async getTides(latitude: number, longitude: number): Promise<TideData | null> {
    try {
      const data = await apiClient.get<TideData>(
        `/external/tides/${latitude}/${longitude}`
      );
      return data;
    } catch (error) {
      console.error('Failed to fetch tide data:', error);
      return null;
    }
  },

  /**
   * Fetch water quality data for a location
   */
  async getWaterQuality(latitude: number, longitude: number): Promise<WaterQualityData | null> {
    try {
      const data = await apiClient.get<WaterQualityData>(
        `/external/water-quality/${latitude}/${longitude}`
      );
      return data;
    } catch (error) {
      console.error('Failed to fetch water quality data:', error);
      return null;
    }
  },

  /**
   * Fetch beach quality rating for a location
   */
  async getBeachQuality(latitude: number, longitude: number): Promise<BeachQualityData | null> {
    try {
      const data = await apiClient.get<BeachQualityData>(
        `/external/beach-quality/${latitude}/${longitude}`
      );
      return data;
    } catch (error) {
      console.error('Failed to fetch beach quality data:', error);
      return null;
    }
  },

  /**
   * Fetch marine biodiversity information for a location
   */
  async getBiodiversity(latitude: number, longitude: number): Promise<BiodiversityData | null> {
    try {
      const data = await apiClient.get<BiodiversityData>(
        `/external/biodiversity/${latitude}/${longitude}`
      );
      return data;
    } catch (error) {
      console.error('Failed to fetch biodiversity data:', error);
      return null;
    }
  },

  /**
   * Fetch all available external environmental data for a location
   */
  async getAllEnvironmentalData(
    latitude: number,
    longitude: number
  ): Promise<ExternalEnvironmentalData> {
    const [weather, tides, waterQuality, beachQuality, biodiversity] = await Promise.all([
      this.getWeather(latitude, longitude),
      this.getTides(latitude, longitude),
      this.getWaterQuality(latitude, longitude),
      this.getBeachQuality(latitude, longitude),
      this.getBiodiversity(latitude, longitude),
    ]);

    return {
      weather: weather || undefined,
      tides: tides || undefined,
      waterQuality: waterQuality || undefined,
      beachQuality: beachQuality || undefined,
      biodiversity: biodiversity || undefined,
    };
  },
};
