import { Hono } from 'hono';
import { Env } from '../types';
import { requireAuth, findOrCreateUser } from '../auth';

type AppEnv = { Bindings: Env; Variables: { userId: string } };
export const userRoutes = new Hono<AppEnv>();

// Helper to convert snake_case DB row to camelCase for frontend
function formatUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    firstName: u.first_name,
    lastName: u.last_name,
    avatarUrl: u.avatar_url,
    impactScore: u.impact_score || 0,
    notificationEmail: !!u.notification_email,
    notificationInApp: !!u.notification_in_app,
    areasOfInterest: JSON.parse(u.areas_of_interest || '[]'),
    clerkId: u.clerk_id,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  };
}

// Get user profile
userRoutes.get('/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const isClerkId = id.startsWith('user_');

    if (isClerkId) {
      await findOrCreateUser(c.env.DB, id, c.env.CLERK_SECRET_KEY);
    }

    const user = await c.env.DB.prepare(
      `SELECT * FROM users WHERE ${isClerkId ? 'clerk_id' : 'id'} = ?`
    ).bind(id).first();
    if (!user) return c.json({ error: 'User not found' }, 404);

    const u = user as any;
    const reportCount = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM reports WHERE user_id = ?').bind(u.id).first<{ cnt: number }>();
    const eventCount = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM event_registrations WHERE user_id = ? AND attended = 1').bind(u.id).first<{ cnt: number }>();
    const organizedCount = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM events WHERE organizer_id = ?').bind(u.id).first<{ cnt: number }>();

    return c.json({
      ...formatUser(u),
      reportCount: reportCount?.cnt || 0,
      eventCount: eventCount?.cnt || 0,
      totalLitterCollected: 0,
      stats: { reportsSubmitted: reportCount?.cnt || 0, eventsAttended: eventCount?.cnt || 0, eventsOrganized: organizedCount?.cnt || 0 },
    });
  } catch (e: any) {
    console.error('GET /users/:id error:', e.message);
    return c.json({ error: { code: 'INTERNAL_ERROR', message: e.message, timestamp: new Date().toISOString() } }, 500);
  }
});

// Update profile
userRoutes.patch('/:id', requireAuth, async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const sets: string[] = [];
    const params: any[] = [];

    if (body.firstName !== undefined) { sets.push('first_name = ?'); params.push(body.firstName); }
    if (body.lastName !== undefined) { sets.push('last_name = ?'); params.push(body.lastName); }
    if (body.username !== undefined) { sets.push('username = ?'); params.push(body.username); }
    if (body.email !== undefined) { sets.push('email = ?'); params.push(body.email || null); }
    sets.push("updated_at = datetime('now')");
    params.push(id);

    if (sets.length > 1) {
      await c.env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...params).run();
    }
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
    return c.json(formatUser(user));
  } catch (e: any) {
    return c.json({ error: { code: 'INTERNAL_ERROR', message: e.message, timestamp: new Date().toISOString() } }, 500);
  }
});

// User's reports
userRoutes.get('/:id/reports', async (c) => {
  try {
    const { id } = c.req.param();
    const isClerkId = id.startsWith('user_');
    let dbId = id;
    if (isClerkId) { dbId = await findOrCreateUser(c.env.DB, id, c.env.CLERK_SECRET_KEY); }

    const reports = await c.env.DB.prepare('SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC').bind(dbId).all();
    return c.json((reports.results as any[]).map(r => ({
      ...r,
      photoUrls: JSON.parse(r.photo_urls || '[]'),
      litterType: r.litter_type,
      locationSource: r.location_source,
      verificationStatus: r.verification_status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      submittedAt: r.submitted_at,
      cleanedAt: r.cleaned_at,
      userId: r.user_id,
    })));
  } catch (e: any) {
    return c.json([], 200);
  }
});

// User's events
userRoutes.get('/:id/events', async (c) => {
  try {
    const { id } = c.req.param();
    const isClerkId = id.startsWith('user_');
    let dbId = id;
    if (isClerkId) { dbId = await findOrCreateUser(c.env.DB, id, c.env.CLERK_SECRET_KEY); }

    const registered = await c.env.DB.prepare(`
      SELECT e.*, er.registered_at, er.attended FROM event_registrations er
      JOIN events e ON er.event_id = e.id WHERE er.user_id = ? ORDER BY er.registered_at DESC
    `).bind(dbId).all();
    const organized = await c.env.DB.prepare('SELECT * FROM events WHERE organizer_id = ? ORDER BY created_at DESC').bind(dbId).all();

    return c.json({ registered: registered.results, organized: organized.results });
  } catch (e: any) {
    return c.json({ registered: [], organized: [] }, 200);
  }
});

// Activity timeline
userRoutes.get('/:id/activity', async (c) => {
  try {
    const { id } = c.req.param();
    const isClerkId = id.startsWith('user_');
    let dbId = id;
    if (isClerkId) { dbId = await findOrCreateUser(c.env.DB, id, c.env.CLERK_SECRET_KEY); }

    const reports = await c.env.DB.prepare('SELECT id, created_at, litter_type, quantity, latitude, longitude, description FROM reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').bind(dbId).all();
    const events = await c.env.DB.prepare(`
      SELECT e.id, e.title, e.scheduled_date, e.latitude, e.longitude, e.location_name, e.status, er.registered_at
      FROM event_registrations er JOIN events e ON er.event_id = e.id WHERE er.user_id = ? ORDER BY er.registered_at DESC LIMIT 50
    `).bind(dbId).all();

    const activities = [
      ...(reports.results as any[]).map(r => ({ id: r.id, type: 'report', timestamp: r.created_at, title: `Reported ${r.litter_type} litter`, location: { latitude: r.latitude, longitude: r.longitude } })),
      ...(events.results as any[]).map(e => ({ id: e.id, type: 'event_attended', timestamp: e.registered_at, title: e.title, location: { latitude: e.latitude, longitude: e.longitude, locationName: e.location_name } })),
    ].sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

    return c.json(activities);
  } catch (e: any) {
    return c.json([], 200);
  }
});

// Update notification preferences
userRoutes.patch('/:id/preferences', requireAuth, async (c) => {
  try {
    const { id } = c.req.param();
    const body = await c.req.json();
    const sets: string[] = [];
    const params: any[] = [];

    if (body.notificationEmail !== undefined) { sets.push('notification_email = ?'); params.push(body.notificationEmail ? 1 : 0); }
    if (body.notificationInApp !== undefined) { sets.push('notification_in_app = ?'); params.push(body.notificationInApp ? 1 : 0); }
    if (body.areasOfInterest !== undefined) { sets.push('areas_of_interest = ?'); params.push(JSON.stringify(body.areasOfInterest)); }
    params.push(id);

    if (sets.length) {
      await c.env.DB.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).bind(...params).run();
    }
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
    return c.json(formatUser(user));
  } catch (e: any) {
    return c.json({ error: { code: 'INTERNAL_ERROR', message: e.message, timestamp: new Date().toISOString() } }, 500);
  }
});

// Calculate impact score
userRoutes.post('/:id/calculate-impact', async (c) => {
  try {
    const { id } = c.req.param();
    const reports = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM reports WHERE user_id = ?').bind(id).first<{ cnt: number }>();
    const attended = await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM event_registrations WHERE user_id = ? AND attended = 1').bind(id).first<{ cnt: number }>();
    const organized = await c.env.DB.prepare("SELECT COUNT(*) as cnt FROM events WHERE organizer_id = ? AND status = 'completed'").bind(id).first<{ cnt: number }>();

    const score = (reports?.cnt || 0) * 10 + (attended?.cnt || 0) * 20 + (organized?.cnt || 0) * 50;
    await c.env.DB.prepare('UPDATE users SET impact_score = ? WHERE id = ?').bind(score, id).run();
    return c.json({ impactScore: score });
  } catch (e: any) {
    return c.json({ impactScore: 0 }, 200);
  }
});
