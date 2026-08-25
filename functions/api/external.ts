import { Hono } from 'hono';
import { Env } from '../types';

export const externalRoutes = new Hono<{ Bindings: Env }>();

// Haversine distance (km)
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Irish beaches with water quality data
const irishBeaches = [
  { name: 'Dollymount Strand', lat: 53.3667, lng: -6.1667, status: 'excellent' },
  { name: 'Seapoint', lat: 53.2889, lng: -6.1333, status: 'excellent' },
  { name: 'Bray South Beach', lat: 53.2000, lng: -6.1000, status: 'good' },
  { name: 'Brittas Bay', lat: 52.9167, lng: -6.0333, status: 'excellent' },
  { name: 'Curracloe Beach', lat: 52.4167, lng: -6.3667, status: 'excellent' },
  { name: 'Tramore Beach', lat: 52.1667, lng: -7.1500, status: 'excellent' },
  { name: 'Inchydoney Beach', lat: 51.6333, lng: -8.9167, status: 'excellent' },
  { name: 'Inch Beach', lat: 52.1333, lng: -10.0000, status: 'excellent' },
  { name: 'Lahinch Beach', lat: 52.9333, lng: -9.3500, status: 'excellent' },
  { name: 'Salthill Beach', lat: 53.2583, lng: -9.0833, status: 'good' },
  { name: 'Keem Bay', lat: 53.9667, lng: -10.2000, status: 'excellent' },
  { name: 'Bundoran Beach', lat: 54.4833, lng: -8.2833, status: 'excellent' },
  { name: 'Portrush West Strand', lat: 55.2000, lng: -6.6667, status: 'excellent' },
];

// Weather
externalRoutes.get('/weather/:lat/:lng', async (c) => {
  const { lat, lng } = c.req.param();
  const apiKey = c.env.OPENWEATHER_API_KEY;
  if (!apiKey) return c.json(null);

  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`);
    if (!res.ok) return c.json(null);
    const data = await res.json() as any;
    return c.json({
      temperature: data.main.temp, feelsLike: data.main.feels_like, humidity: data.main.humidity,
      windSpeed: data.wind.speed, windDirection: data.wind.deg,
      description: data.weather[0].description, icon: data.weather[0].icon,
      timestamp: new Date().toISOString(),
    });
  } catch { return c.json(null); }
});

// Tides (simplified semi-diurnal calculation)
externalRoutes.get('/tides/:lat/:lng', async (c) => {
  const now = new Date();
  // Approximate semi-diurnal tide: 2 highs and 2 lows per day, ~6h12m apart
  const baseHigh = new Date(now);
  baseHigh.setHours(6, 0, 0, 0); // Approximate first high tide

  const extremes = [];
  for (let i = 0; i < 4; i++) {
    const time = new Date(baseHigh.getTime() + i * 6.2 * 60 * 60 * 1000);
    if (time.getTime() > now.getTime() && time.getTime() < now.getTime() + 24 * 60 * 60 * 1000) {
      extremes.push({ type: i % 2 === 0 ? 'High' : 'Low', time: time.toISOString(), height: i % 2 === 0 ? 4.2 : 1.1 });
    }
  }

  return c.json({ extremes, nextTide: extremes[0] || null, timestamp: new Date().toISOString() });
});

// Water quality
externalRoutes.get('/water-quality/:lat/:lng', async (c) => {
  const lat = parseFloat(c.req.param('lat'));
  const lng = parseFloat(c.req.param('lng'));

  let nearest = null;
  let minDist = Infinity;
  for (const beach of irishBeaches) {
    const d = haversine(lat, lng, beach.lat, beach.lng);
    if (d < minDist && d < 20) { minDist = d; nearest = beach; }
  }

  if (!nearest) return c.json({ status: 'unknown', source: 'EU Bathing Water Quality', timestamp: new Date().toISOString() });
  return c.json({ status: nearest.status, source: 'EU Bathing Water Quality (2024)', timestamp: new Date().toISOString() });
});

// Beach quality (placeholder)
externalRoutes.get('/beach-quality/:lat/:lng', async (c) => {
  return c.json({ rating: 'none', awards: [], facilities: [], accessibility: 'unknown', timestamp: new Date().toISOString() });
});

// Biodiversity
externalRoutes.get('/biodiversity/:lat/:lng', async (c) => {
  const { lat, lng } = c.req.param();
  try {
    const res = await fetch(`https://api.gbif.org/v1/occurrence/search?decimalLatitude=${parseFloat(lat) - 0.05},${parseFloat(lat) + 0.05}&decimalLongitude=${parseFloat(lng) - 0.05},${parseFloat(lng) + 0.05}&limit=20&country=IE&hasCoordinate=true`);
    if (!res.ok) return c.json({ species: [], marineProtectedArea: false, habitatTypes: ['Coastal'], source: 'GBIF', timestamp: new Date().toISOString() });
    const data = await res.json() as any;

    const speciesMap = new Map();
    for (const r of data.results || []) {
      if (r.species && !speciesMap.has(r.scientificName)) {
        speciesMap.set(r.scientificName, { name: r.vernacularName || r.species, scientificName: r.scientificName, category: r.kingdom || 'Unknown' });
      }
    }

    return c.json({ species: Array.from(speciesMap.values()).slice(0, 10), marineProtectedArea: false, habitatTypes: ['Coastal', 'Intertidal Zone'], source: 'GBIF', timestamp: new Date().toISOString() });
  } catch { return c.json({ species: [], marineProtectedArea: false, habitatTypes: ['Coastal'], source: 'GBIF', timestamp: new Date().toISOString() }); }
});

// All environmental data
externalRoutes.get('/all/:lat/:lng', async (c) => {
  const { lat, lng } = c.req.param();
  const base = new URL(c.req.url).origin;

  const [weather, tides, waterQuality, beachQuality, biodiversity] = await Promise.all([
    fetch(`${base}/api/external/weather/${lat}/${lng}`).then(r => r.json()).catch(() => null),
    fetch(`${base}/api/external/tides/${lat}/${lng}`).then(r => r.json()).catch(() => null),
    fetch(`${base}/api/external/water-quality/${lat}/${lng}`).then(r => r.json()).catch(() => null),
    fetch(`${base}/api/external/beach-quality/${lat}/${lng}`).then(r => r.json()).catch(() => null),
    fetch(`${base}/api/external/biodiversity/${lat}/${lng}`).then(r => r.json()).catch(() => null),
  ]);

  return c.json({ weather, tides, waterQuality, beachQuality, biodiversity, location: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, timestamp: new Date().toISOString() });
});
