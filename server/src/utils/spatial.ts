/**
 * Spatial utility functions for PostgreSQL (no PostGIS required).
 * Uses Haversine formula on lat/lng columns instead of spatial types.
 */

import prisma from '../config/database';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Haversine distance calculation — pure math, no DB dependency.
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculate distance between two points (async wrapper for compatibility).
 */
export async function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> {
  return haversineDistance(lat1, lon1, lat2, lon2);
}

/**
 * Validate if coordinates are within Irish boundaries.
 */
export function isWithinIreland(latitude: number, longitude: number): boolean {
  return latitude >= 51.4 && latitude <= 55.4 && longitude >= -10.5 && longitude <= -5.5;
}

/**
 * Find reports within a radius using Haversine in PostgreSQL.
 */
export async function findReportsNearby(latitude: number, longitude: number, radiusMeters: number, limit: number = 50) {
  return prisma.$queryRaw<Array<{ id: string; user_id: string; latitude: number; longitude: number; litter_type: string; quantity: string; distance: number }>>`
    SELECT id, user_id, latitude, longitude, litter_type, quantity,
      (${EARTH_RADIUS_METERS} * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(latitude - ${latitude}) / 2), 2) +
        COS(RADIANS(${latitude})) * COS(RADIANS(latitude)) *
        POWER(SIN(RADIANS(longitude - ${longitude}) / 2), 2)
      ))) AS distance
    FROM reports
    HAVING distance <= ${radiusMeters}
    ORDER BY distance
    LIMIT ${limit}
  `;
}

/**
 * Find events within a radius.
 */
export async function findEventsNearby(latitude: number, longitude: number, radiusMeters: number, limit: number = 50) {
  return prisma.$queryRaw<Array<{ id: string; title: string; location_name: string; latitude: number; longitude: number; scheduled_date: Date; distance: number }>>`
    SELECT id, title, location_name, latitude, longitude, scheduled_date,
      (${EARTH_RADIUS_METERS} * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(latitude - ${latitude}) / 2), 2) +
        COS(RADIANS(${latitude})) * COS(RADIANS(latitude)) *
        POWER(SIN(RADIANS(longitude - ${longitude}) / 2), 2)
      ))) AS distance
    FROM events
    WHERE status = 'upcoming'
    HAVING distance <= ${radiusMeters}
    ORDER BY distance
    LIMIT ${limit}
  `;
}

/**
 * Calculate hotspots by grid-based clustering (replaces ST_GeoHash).
 * Groups reports into ~150m grid cells using ROUND(lat/lng, 3).
 */
export async function calculateHotspots() {
  return prisma.$queryRaw<Array<{ center_lat: number; center_lng: number; report_count: number; avg_severity: number; last_report_date: Date }>>`
    SELECT
      AVG(latitude) AS center_lat,
      AVG(longitude) AS center_lng,
      COUNT(*)::int AS report_count,
      AVG(CASE
        WHEN quantity = 'minimal' THEN 1
        WHEN quantity = 'moderate' THEN 2
        WHEN quantity = 'significant' THEN 3
        WHEN quantity = 'severe' THEN 4
        ELSE 0
      END) AS avg_severity,
      MAX(created_at) AS last_report_date
    FROM reports
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY ROUND(latitude::numeric, 3), ROUND(longitude::numeric, 3)
    HAVING COUNT(*) >= 5
    ORDER BY report_count DESC, avg_severity DESC
  `;
}

/**
 * Find reports within a bounding box.
 */
export async function findReportsInBounds(minLat: number, maxLat: number, minLng: number, maxLng: number) {
  return prisma.$queryRaw<Array<{ id: string; latitude: number; longitude: number; litter_type: string; quantity: string; created_at: Date }>>`
    SELECT id, latitude, longitude, litter_type, quantity, created_at
    FROM reports
    WHERE latitude BETWEEN ${minLat} AND ${maxLat}
      AND longitude BETWEEN ${minLng} AND ${maxLng}
    ORDER BY created_at DESC
  `;
}

/**
 * Update hotspots table with calculated data.
 */
export async function updateHotspotsTable() {
  await prisma.$executeRaw`DELETE FROM hotspots WHERE calculated_at < NOW() - INTERVAL '1 hour'`;

  const hotspots = await calculateHotspots();

  for (const h of hotspots) {
    const severityScore = h.report_count * h.avg_severity;
    await prisma.$executeRaw`
      INSERT INTO hotspots (id, latitude, longitude, radius, report_count, severity_score, last_report_date)
      VALUES (gen_random_uuid(), ${h.center_lat}, ${h.center_lng}, 500, ${h.report_count}, ${severityScore}, ${h.last_report_date})
    `;
  }

  return hotspots.length;
}

export default {
  haversineDistance,
  calculateDistance,
  findReportsNearby,
  findEventsNearby,
  calculateHotspots,
  isWithinIreland,
  findReportsInBounds,
  updateHotspotsTable,
};
