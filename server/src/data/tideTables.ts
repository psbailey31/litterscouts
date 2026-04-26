/**
 * Static tide tables for major Irish coastal locations
 * 
 * Data source: Based on typical Irish coastal tide patterns
 * Note: These are approximate patterns. For production, use official tide tables
 * from the Irish Marine Institute or UK Hydrographic Office.
 * 
 * Irish tides are semi-diurnal (2 high tides and 2 low tides per day)
 * Average tidal range: 3-5 meters on the Atlantic coast, 2-4 meters on the Irish Sea
 */

export interface TideStation {
  name: string;
  latitude: number;
  longitude: number;
  region: string;
  // Time offset in hours from high tide at reference point (Dublin)
  highTideOffset: number;
  // Average tidal range in meters
  meanRange: number;
  springRange: number;
  neapRange: number;
}

/**
 * Major Irish tide stations
 * Coordinates are approximate center points for coastal areas
 */
export const TIDE_STATIONS: TideStation[] = [
  // East Coast (Irish Sea)
  {
    name: 'Dublin Bay',
    latitude: 53.3498,
    longitude: -6.2603,
    region: 'Dublin',
    highTideOffset: 0, // Reference point
    meanRange: 3.4,
    springRange: 4.1,
    neapRange: 2.7,
  },
  {
    name: 'Howth',
    latitude: 53.3881,
    longitude: -6.0631,
    region: 'Dublin',
    highTideOffset: 0.1,
    meanRange: 3.2,
    springRange: 3.9,
    neapRange: 2.5,
  },
  {
    name: 'Dun Laoghaire',
    latitude: 53.2941,
    longitude: -6.1337,
    region: 'Dublin',
    highTideOffset: -0.05,
    meanRange: 3.5,
    springRange: 4.2,
    neapRange: 2.8,
  },
  {
    name: 'Bray',
    latitude: 53.2026,
    longitude: -6.0983,
    region: 'Wicklow',
    highTideOffset: -0.15,
    meanRange: 3.3,
    springRange: 4.0,
    neapRange: 2.6,
  },
  {
    name: 'Wicklow',
    latitude: 52.9808,
    longitude: -6.0422,
    region: 'Wicklow',
    highTideOffset: -0.25,
    meanRange: 3.4,
    springRange: 4.1,
    neapRange: 2.7,
  },
  {
    name: 'Arklow',
    latitude: 52.7979,
    longitude: -6.1436,
    region: 'Wicklow',
    highTideOffset: -0.3,
    meanRange: 3.2,
    springRange: 3.8,
    neapRange: 2.6,
  },
  
  // Southeast Coast
  {
    name: 'Wexford',
    latitude: 52.3369,
    longitude: -6.4633,
    region: 'Wexford',
    highTideOffset: -0.5,
    meanRange: 3.1,
    springRange: 3.7,
    neapRange: 2.5,
  },
  {
    name: 'Rosslare',
    latitude: 52.2515,
    longitude: -6.3419,
    region: 'Wexford',
    highTideOffset: -0.55,
    meanRange: 3.0,
    springRange: 3.6,
    neapRange: 2.4,
  },
  
  // South Coast
  {
    name: 'Waterford',
    latitude: 52.2593,
    longitude: -7.1101,
    region: 'Waterford',
    highTideOffset: -1.0,
    meanRange: 3.5,
    springRange: 4.3,
    neapRange: 2.7,
  },
  {
    name: 'Cork Harbour',
    latitude: 51.8503,
    longitude: -8.2944,
    region: 'Cork',
    highTideOffset: -1.5,
    meanRange: 3.8,
    springRange: 4.6,
    neapRange: 3.0,
  },
  {
    name: 'Kinsale',
    latitude: 51.7058,
    longitude: -8.5308,
    region: 'Cork',
    highTideOffset: -1.6,
    meanRange: 3.6,
    springRange: 4.4,
    neapRange: 2.8,
  },
  
  // Southwest Coast (Atlantic)
  {
    name: 'Bantry Bay',
    latitude: 51.6833,
    longitude: -9.4500,
    region: 'Cork',
    highTideOffset: -2.0,
    meanRange: 3.9,
    springRange: 4.8,
    neapRange: 3.0,
  },
  {
    name: 'Dingle',
    latitude: 52.1408,
    longitude: -10.2683,
    region: 'Kerry',
    highTideOffset: -2.5,
    meanRange: 4.2,
    springRange: 5.1,
    neapRange: 3.3,
  },
  {
    name: 'Tralee Bay',
    latitude: 52.2708,
    longitude: -9.9167,
    region: 'Kerry',
    highTideOffset: -2.3,
    meanRange: 4.0,
    springRange: 4.9,
    neapRange: 3.1,
  },
  
  // West Coast (Atlantic)
  {
    name: 'Galway Bay',
    latitude: 53.2707,
    longitude: -9.0568,
    region: 'Galway',
    highTideOffset: -3.0,
    meanRange: 4.5,
    springRange: 5.5,
    neapRange: 3.5,
  },
  {
    name: 'Clifden',
    latitude: 53.4889,
    longitude: -10.0200,
    region: 'Galway',
    highTideOffset: -3.2,
    meanRange: 4.3,
    springRange: 5.3,
    neapRange: 3.3,
  },
  {
    name: 'Sligo Bay',
    latitude: 54.2697,
    longitude: -8.5994,
    region: 'Sligo',
    highTideOffset: -3.5,
    meanRange: 4.4,
    springRange: 5.4,
    neapRange: 3.4,
  },
  
  // Northwest Coast
  {
    name: 'Donegal Bay',
    latitude: 54.6333,
    longitude: -8.4333,
    region: 'Donegal',
    highTideOffset: -3.8,
    meanRange: 4.2,
    springRange: 5.2,
    neapRange: 3.2,
  },
  {
    name: 'Malin Head',
    latitude: 55.3686,
    longitude: -7.3661,
    region: 'Donegal',
    highTideOffset: -4.0,
    meanRange: 3.8,
    springRange: 4.7,
    neapRange: 2.9,
  },
  
  // North Coast
  {
    name: 'Portrush',
    latitude: 55.2008,
    longitude: -6.6522,
    region: 'Antrim',
    highTideOffset: -4.2,
    meanRange: 3.5,
    springRange: 4.3,
    neapRange: 2.7,
  },
  {
    name: 'Belfast Lough',
    latitude: 54.6597,
    longitude: -5.6697,
    region: 'Belfast',
    highTideOffset: -1.0,
    meanRange: 3.3,
    springRange: 4.0,
    neapRange: 2.6,
  },
];

/**
 * Find the nearest tide station to given coordinates
 */
export function findNearestStation(latitude: number, longitude: number): TideStation {
  let nearest = TIDE_STATIONS[0];
  let minDistance = Number.MAX_VALUE;

  for (const station of TIDE_STATIONS) {
    const distance = calculateDistance(
      latitude,
      longitude,
      station.latitude,
      station.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = station;
    }
  }

  return nearest;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate tide times for a given date and station
 * Based on semi-diurnal tide patterns (2 high, 2 low per day)
 * 
 * Reference: Dublin high tide occurs approximately at:
 * - Morning: 6:00 AM + lunar day offset
 * - Evening: 6:30 PM + lunar day offset
 * 
 * Lunar day is ~24h 50min, so tides shift ~50 minutes later each day
 */
export function calculateTideTimes(
  station: TideStation,
  date: Date = new Date()
): Array<{ type: 'High' | 'Low'; time: Date; height: number }> {
  const tides: Array<{ type: 'High' | 'Low'; time: Date; height: number }> = [];

  // Calculate days since reference date (Jan 1, 2024 - known new moon)
  const referenceDate = new Date('2024-01-01T00:00:00Z');
  const daysSinceReference = Math.floor(
    (date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Lunar day is 24h 50min, so tides shift 50 minutes per day
  const minutesShift = (daysSinceReference * 50) % (24 * 60);

  // Base high tide times for Dublin (reference point)
  const morningHighTide = 6 * 60; // 6:00 AM in minutes
  const eveningHighTide = 18.5 * 60; // 6:30 PM in minutes

  // Apply station offset and daily shift
  const stationOffsetMinutes = station.highTideOffset * 60;

  // Calculate 4 tide times (2 high, 2 low) for the day
  const highTide1Minutes = morningHighTide + stationOffsetMinutes + minutesShift;
  const highTide2Minutes = eveningHighTide + stationOffsetMinutes + minutesShift;

  // Low tides occur approximately 6 hours after high tides
  const lowTide1Minutes = highTide1Minutes + 6 * 60;
  const lowTide2Minutes = highTide2Minutes + 6 * 60;

  // Determine if it's spring or neap tide (simplified - based on lunar cycle)
  const lunarCycle = daysSinceReference % 29.5;
  const isSpringTide = lunarCycle < 2 || (lunarCycle > 13 && lunarCycle < 17);
  const range = isSpringTide ? station.springRange : station.neapRange;

  // Create tide objects
  const addTide = (minutes: number, type: 'High' | 'Low', dayOffset: number = 0) => {
    const tideDate = new Date(date);
    tideDate.setHours(0, 0, 0, 0);
    tideDate.setMinutes(minutes + dayOffset * 24 * 60);

    const height = type === 'High' ? range : 0.5; // Low tide ~0.5m

    tides.push({ type, time: tideDate, height });
  };

  // Add tides, handling day boundaries
  if (highTide1Minutes < 24 * 60) {
    addTide(highTide1Minutes, 'High');
  } else {
    addTide(highTide1Minutes - 24 * 60, 'High', 1);
  }

  if (lowTide1Minutes < 24 * 60) {
    addTide(lowTide1Minutes, 'Low');
  } else {
    addTide(lowTide1Minutes - 24 * 60, 'Low', 1);
  }

  if (highTide2Minutes < 24 * 60) {
    addTide(highTide2Minutes, 'High');
  } else {
    addTide(highTide2Minutes - 24 * 60, 'High', 1);
  }

  if (lowTide2Minutes < 24 * 60) {
    addTide(lowTide2Minutes, 'Low');
  } else {
    addTide(lowTide2Minutes - 24 * 60, 'Low', 1);
  }

  // Sort by time
  tides.sort((a, b) => a.time.getTime() - b.time.getTime());

  return tides;
}
