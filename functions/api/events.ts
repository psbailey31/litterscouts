import { Hono } from 'hono';
import { Env } from '../types';
import { requireAuth, findOrCreateUser } from '../auth';

type AppEnv = { Bindings: Env; Variables: { userId: string } };
export const eventRoutes = new Hono<AppEnv>();

// Get all events
eventRoutes.get('/', async (c) => {
  const { status, startDate, endDate } = c.req.query();
  let sql = `SELECT e.*, u.id as uid, u.clerk_id as organizer_clerk_id, u.username, u.first_name, u.last_name, u.avatar_url,
    (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as participant_count
    FROM events e JOIN users u ON e.organizer_id = u.id WHERE 1=1`;
  const params: any[] = [];

  if (status && status !== 'all') { sql += ` AND e.status = ?`; params.push(status); }
  if (startDate) { sql += ` AND e.scheduled_date >= ?`; params.push(startDate); }
  if (endDate) { sql += ` AND e.scheduled_date <= ?`; params.push(endDate); }
  sql += ` ORDER BY e.scheduled_date ASC`;

  const events = await c.env.DB.prepare(sql).bind(...params).all();
  const results = (events.results as any[]).map(e => ({
    ...e, photos: JSON.parse(e.photos || 'null'), required_items: JSON.parse(e.required_items || '[]'),
    equipment_provided: !!e.equipment_provided,
  }));
  return c.json(results);
});

// Get single event
eventRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const event = await c.env.DB.prepare(`
    SELECT e.*, u.id as uid, u.clerk_id as organizer_clerk_id, u.username, u.first_name, u.last_name, u.avatar_url,
    (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as participant_count
    FROM events e JOIN users u ON e.organizer_id = u.id WHERE e.id = ?
  `).bind(id).first();
  if (!event) return c.json({ code: 'EVENT_NOT_FOUND', message: 'Event not found', timestamp: new Date().toISOString() }, 404);
  return c.json({ ...event, photos: JSON.parse((event as any).photos || 'null'), required_items: JSON.parse((event as any).required_items || '[]'), equipment_provided: !!(event as any).equipment_provided });
});

// Create event
eventRoutes.post('/', requireAuth, async (c) => {
  const body = await c.req.json();
  const { title, description, latitude, longitude, locationName, scheduledDate, duration, equipmentProvided, requiredItems } = body;
  if (!title || !description || !latitude || !longitude || !locationName || !scheduledDate || !duration) {
    return c.json({ code: 'VALIDATION_ERROR', message: 'Missing required fields', timestamp: new Date().toISOString() }, 400);
  }
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    'INSERT INTO events (id, organizer_id, title, description, latitude, longitude, location_name, scheduled_date, duration, equipment_provided, required_items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, dbUserId, title, description, parseFloat(latitude), parseFloat(longitude), locationName, scheduledDate, parseInt(duration), equipmentProvided ? 1 : 0, JSON.stringify(requiredItems || [])).run();

  const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
  return c.json(event, 201);
});

// Update event
eventRoutes.patch('/:id', requireAuth, async (c) => {
  const { id } = c.req.param();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const event = await c.env.DB.prepare('SELECT organizer_id FROM events WHERE id = ?').bind(id).first<{ organizer_id: string }>();
  if (!event) return c.json({ code: 'EVENT_NOT_FOUND', message: 'Event not found', timestamp: new Date().toISOString() }, 404);
  if (event.organizer_id !== dbUserId) return c.json({ code: 'FORBIDDEN', message: 'Only organizer can update', timestamp: new Date().toISOString() }, 403);

  const body = await c.req.json();
  const sets: string[] = [];
  const params: any[] = [];
  if (body.title !== undefined) { sets.push('title = ?'); params.push(body.title); }
  if (body.description !== undefined) { sets.push('description = ?'); params.push(body.description); }
  if (body.scheduledDate !== undefined) { sets.push('scheduled_date = ?'); params.push(body.scheduledDate); }
  if (body.duration !== undefined) { sets.push('duration = ?'); params.push(body.duration); }
  if (body.status !== undefined) { sets.push('status = ?'); params.push(body.status); }
  if (body.litterCollected !== undefined) { sets.push('litter_collected = ?'); params.push(body.litterCollected); }
  if (body.photos !== undefined) { sets.push('photos = ?'); params.push(JSON.stringify(body.photos)); }
  sets.push("updated_at = datetime('now')");
  params.push(id);

  await c.env.DB.prepare(`UPDATE events SET ${sets.join(', ')} WHERE id = ?`).bind(...params).run();
  const updated = await c.env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
  return c.json(updated);
});

// Delete event
eventRoutes.delete('/:id', requireAuth, async (c) => {
  const { id } = c.req.param();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const event = await c.env.DB.prepare('SELECT organizer_id FROM events WHERE id = ?').bind(id).first<{ organizer_id: string }>();
  if (!event) return c.json({ code: 'EVENT_NOT_FOUND', message: 'Event not found', timestamp: new Date().toISOString() }, 404);
  if (event.organizer_id !== dbUserId) return c.json({ code: 'FORBIDDEN', message: 'Only organizer can delete', timestamp: new Date().toISOString() }, 403);
  await c.env.DB.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
  return new Response(null, { status: 204 });
});

// Register
eventRoutes.post('/:id/register', requireAuth, async (c) => {
  const { id } = c.req.param();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const existing = await c.env.DB.prepare('SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?').bind(dbUserId, id).first();
  if (existing) return c.json({ code: 'ALREADY_REGISTERED', message: 'Already registered', timestamp: new Date().toISOString() }, 409);
  const regId = crypto.randomUUID();
  await c.env.DB.prepare('INSERT INTO event_registrations (id, user_id, event_id) VALUES (?, ?, ?)').bind(regId, dbUserId, id).run();
  return c.json({ id: regId, userId: dbUserId, eventId: id }, 201);
});

// Unregister
eventRoutes.delete('/:id/register', requireAuth, async (c) => {
  const { id } = c.req.param();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  await c.env.DB.prepare('DELETE FROM event_registrations WHERE user_id = ? AND event_id = ?').bind(dbUserId, id).run();
  return new Response(null, { status: 204 });
});

// Registration status
eventRoutes.get('/:id/registration-status', requireAuth, async (c) => {
  const { id } = c.req.param();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const reg = await c.env.DB.prepare('SELECT id FROM event_registrations WHERE user_id = ? AND event_id = ?').bind(dbUserId, id).first();
  return c.json({ registered: !!reg });
});

// Get registrations
eventRoutes.get('/:id/registrations', async (c) => {
  const { id } = c.req.param();
  const regs = await c.env.DB.prepare(`
    SELECT er.*, u.id as uid, u.username, u.first_name, u.last_name, u.avatar_url
    FROM event_registrations er JOIN users u ON er.user_id = u.id WHERE er.event_id = ?
  `).bind(id).all();
  return c.json(regs.results);
});

// Get attendees
eventRoutes.get('/:id/attendees', async (c) => {
  const { id } = c.req.param();
  const attendees = await c.env.DB.prepare(`
    SELECT er.*, u.id as uid, u.clerk_id, u.username, u.first_name, u.last_name, u.avatar_url
    FROM event_registrations er JOIN users u ON er.user_id = u.id WHERE er.event_id = ? ORDER BY er.registered_at ASC
  `).bind(id).all();
  return c.json(attendees.results);
});

// Complete event
eventRoutes.post('/:id/complete', requireAuth, async (c) => {
  const { id } = c.req.param();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const event = await c.env.DB.prepare('SELECT organizer_id FROM events WHERE id = ?').bind(id).first<{ organizer_id: string }>();
  if (!event) return c.json({ code: 'EVENT_NOT_FOUND', message: 'Event not found', timestamp: new Date().toISOString() }, 404);
  if (event.organizer_id !== dbUserId) return c.json({ code: 'FORBIDDEN', message: 'Only organizer can complete', timestamp: new Date().toISOString() }, 403);

  const { litterCollected, photos } = await c.req.json();
  await c.env.DB.prepare("UPDATE events SET status = 'completed', litter_collected = ?, photos = ? WHERE id = ?")
    .bind(parseFloat(litterCollected), JSON.stringify(photos || []), id).run();
  const updated = await c.env.DB.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
  return c.json(updated);
});

// Update attendee
eventRoutes.patch('/:id/attendees/:attendeeId', requireAuth, async (c) => {
  const { id, attendeeId } = c.req.param();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const event = await c.env.DB.prepare('SELECT organizer_id FROM events WHERE id = ?').bind(id).first<{ organizer_id: string }>();
  if (!event || event.organizer_id !== dbUserId) return c.json({ code: 'FORBIDDEN', message: 'Not authorized', timestamp: new Date().toISOString() }, 403);

  const { attended, litterCollected, contributionNote } = await c.req.json();
  await c.env.DB.prepare('UPDATE event_registrations SET attended = ?, litter_collected = ?, contribution_note = ? WHERE event_id = ? AND user_id = ?')
    .bind(attended ? 1 : 0, litterCollected || null, contributionNote || null, id, attendeeId).run();
  return c.json({ success: true });
});

// Bulk update attendees
eventRoutes.post('/:id/attendees/bulk', requireAuth, async (c) => {
  const { id } = c.req.param();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const event = await c.env.DB.prepare('SELECT organizer_id FROM events WHERE id = ?').bind(id).first<{ organizer_id: string }>();
  if (!event || event.organizer_id !== dbUserId) return c.json({ code: 'FORBIDDEN', message: 'Not authorized', timestamp: new Date().toISOString() }, 403);

  const { attendees } = await c.req.json();
  for (const a of attendees) {
    await c.env.DB.prepare('UPDATE event_registrations SET attended = ?, litter_collected = ?, contribution_note = ? WHERE event_id = ? AND user_id = ?')
      .bind(a.attended ? 1 : 0, a.litterCollected || null, a.contributionNote || null, id, a.userId).run();
  }
  return c.json({ success: true });
});

// Check-in attendee
eventRoutes.post('/:id/checkin', requireAuth, async (c) => {
  const { id } = c.req.param();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const event = await c.env.DB.prepare('SELECT organizer_id FROM events WHERE id = ?').bind(id).first<{ organizer_id: string }>();
  if (!event || event.organizer_id !== dbUserId) return c.json({ code: 'FORBIDDEN', message: 'Only organizer can check in', timestamp: new Date().toISOString() }, 403);

  const { clerkUserId } = await c.req.json();
  if (!clerkUserId) return c.json({ code: 'VALIDATION_ERROR', message: 'clerkUserId required', timestamp: new Date().toISOString() }, 400);

  const attendeeUserId = await findOrCreateUser(c.env.DB, clerkUserId, c.env.CLERK_SECRET_KEY);
  const reg = await c.env.DB.prepare('SELECT id, attended FROM event_registrations WHERE user_id = ? AND event_id = ?').bind(attendeeUserId, id).first<{ id: string; attended: number }>();

  if (reg && reg.attended) return c.json({ code: 'ALREADY_CHECKED_IN', message: 'Already checked in', timestamp: new Date().toISOString() }, 409);

  let wasWalkIn = false;
  if (!reg) {
    await c.env.DB.prepare('INSERT INTO event_registrations (id, user_id, event_id, attended) VALUES (?, ?, ?, 1)').bind(crypto.randomUUID(), attendeeUserId, id).run();
    wasWalkIn = true;
  } else {
    await c.env.DB.prepare('UPDATE event_registrations SET attended = 1 WHERE user_id = ? AND event_id = ?').bind(attendeeUserId, id).run();
  }

  const user = await c.env.DB.prepare('SELECT username, first_name, last_name FROM users WHERE id = ?').bind(attendeeUserId).first();
  return c.json({ success: true, username: (user as any)?.username, firstName: (user as any)?.first_name, wasWalkIn });
});
