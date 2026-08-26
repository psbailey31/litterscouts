import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';
import { Env } from '../types';
import { reportRoutes } from './reports';
import { eventRoutes } from './events';
import { userRoutes } from './users';
import { analyticsRoutes } from './analytics';
import { notificationRoutes } from './notifications';
import { externalRoutes } from './external';

type AppEnv = { Bindings: Env; Variables: { userId: string } };

const app = new Hono<AppEnv>().basePath('/api');

// CORS
app.use('*', cors({
  origin: ['https://litterscouts.psbailey.uk', 'http://localhost:5200'],
  credentials: true,
}));

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err.message, err.stack);
  return c.json({ error: { code: 'INTERNAL_ERROR', message: err.message, timestamp: new Date().toISOString() } }, 500);
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Mount routes
app.route('/reports', reportRoutes);
app.route('/events', eventRoutes);
app.route('/users', userRoutes);
app.route('/analytics', analyticsRoutes);
app.route('/notifications', notificationRoutes);
app.route('/external', externalRoutes);

// Pages Function handler
export const onRequest = handle(app);

// Cron trigger handler
export async function scheduled(event: ScheduledEvent, env: Env) {
  const db = env.DB;

  switch (event.cron) {
    case '*/5 * * * *': {
      // Hotspot calculation
      await db.prepare("DELETE FROM hotspots WHERE calculated_at < datetime('now', '-1 hour')").run();
      const hotspots = await db.prepare(`
        SELECT AVG(latitude) as lat, AVG(longitude) as lng, COUNT(*) as cnt,
          AVG(CASE WHEN quantity='minimal' THEN 1 WHEN quantity='moderate' THEN 2 WHEN quantity='significant' THEN 3 WHEN quantity='severe' THEN 4 ELSE 0 END) as sev,
          MAX(created_at) as last_date
        FROM reports WHERE created_at >= datetime('now', '-30 days')
        GROUP BY ROUND(latitude, 3), ROUND(longitude, 3) HAVING cnt >= 5
      `).all();
      for (const h of hotspots.results as any[]) {
        await db.prepare(
          'INSERT INTO hotspots (id, latitude, longitude, radius, report_count, severity_score, last_report_date) VALUES (?, ?, ?, 500, ?, ?, ?)'
        ).bind(crypto.randomUUID(), h.lat, h.lng, h.cnt, h.cnt * h.sev, h.last_date).run();
      }
      break;
    }
    case '*/10 * * * *': {
      // Event reminders — notify registered users about events in next 24h
      const upcoming = await db.prepare(`
        SELECT e.id, e.title, e.location_name, e.latitude, e.longitude
        FROM events e WHERE e.status = 'upcoming'
        AND e.scheduled_date >= datetime('now') AND e.scheduled_date <= datetime('now', '+24 hours')
      `).all();
      for (const evt of upcoming.results as any[]) {
        const regs = await db.prepare(
          'SELECT user_id FROM event_registrations WHERE event_id = ?'
        ).bind(evt.id).all();
        for (const reg of regs.results as any[]) {
          const exists = await db.prepare(
            "SELECT id FROM notifications WHERE user_id = ? AND type = 'event_reminder' AND related_id = ?"
          ).bind(reg.user_id, evt.id).first();
          if (!exists) {
            await db.prepare(
              'INSERT INTO notifications (id, user_id, type, title, message, related_id, related_type, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(crypto.randomUUID(), reg.user_id, 'event_reminder', 'Event Reminder',
              `"${evt.title}" is happening soon at ${evt.location_name}!`,
              evt.id, 'event', evt.latitude, evt.longitude).run();
          }
        }
      }
      break;
    }
    case '0 2 * * *': {
      // Cleanup old read notifications (>30 days)
      await db.prepare("DELETE FROM notifications WHERE read = 1 AND created_at < datetime('now', '-30 days')").run();
      break;
    }
  }
}
