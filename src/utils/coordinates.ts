/**
 * Utility functions for coordinate validation and manipulation
 */

import type { Coordinates } from '@/types';

// Ireland bounding box for coordinate validation
export const IRELAND_BOUNDS = {
  minLat: 51.4,
  maxLat: 55.4,
  minLng: -10.5,
  maxLng: -5.5,
};

/**
 * Validates if coordinates are within Ireland's boundaries
 */
export function isWithinIreland(lat: number, lng: number): boolean {
  return (
    lat >= IRELAND_BOUNDS.minLat &&
    lat <= IRELAND_BOUNDS.maxLat &&
    lng >= IRELAND_BOUNDS.minLng &&
    lng <= IRELAND_BOUNDS.maxLng
  );
}

/**
 * Validates if coordinates object is within Ireland's boundaries
 */
export function validateIrelandCoordinates(coords: Coordinates): boolean {
  return isWithinIreland(coords.latitude, coords.longitude);
}

/**
 * Calculates the distance between two coordinates in meters using the Haversine formula
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Formats coordinates for display
 */
export function formatCoordinates(coords: Coordinates, precision: number = 6): string {
  return `${coords.latitude.toFixed(precision)}, ${coords.longitude.toFixed(precision)}`;
}

/**
 * Gets accuracy label based on accuracy value in meters
 */
export function getAccuracyLabel(accuracy: number): string {
  if (accuracy < 10) return 'Excellent';
  if (accuracy < 50) return 'Good';
  if (accuracy < 100) return 'Fair';
  return 'Poor';
}
