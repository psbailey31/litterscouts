import { Hono } from 'hono';
import { Env } from '../types';
import { requireAuth, findOrCreateUser } from '../auth';

type AppEnv = { Bindings: Env; Variables: { userId: string } };
export const reportRoutes = new Hono<AppEnv>();

// Upload photo to R2
reportRoutes.post('/upload', requireAuth, async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('photo') as File | null;
  if (!file) return c.json({ error: { code: 'NO_FILE', message: 'No file uploaded', timestamp: new Date().toISOString() } }, 400);

  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `photo-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  await c.env.UPLOADS.put(filename, file.stream(), { httpMetadata: { contentType: file.type } });

  const url = `/uploads/${filename}`;
  // EXIF extraction would need a wasm lib in Workers — skip for now, frontend extracts it
  return c.json({ url, exifData: { latitude: null, longitude: null, timestamp: null } });
});

// Create report
reportRoutes.post('/', requireAuth, async (c) => {
  const body = await c.req.json();
  const { latitude, longitude, locationSource, litterType, quantity, description, photoUrls, photoTimestamp, environmentalConcerns } = body;

  if (!latitude || !longitude) return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Latitude and longitude are required', timestamp: new Date().toISOString() } }, 400);
  if (!photoUrls || photoUrls.length === 0) return c.json({ error: { code: 'VALIDATION_ERROR', message: 'At least one photo is required', timestamp: new Date().toISOString() } }, 400);

  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    'INSERT INTO reports (id, user_id, latitude, longitude, location_source, photo_urls, photo_timestamp, litter_type, quantity, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, dbUserId, latitude, longitude, locationSource, JSON.stringify(photoUrls), photoTimestamp || null, litterType, quantity, description || null).run();

  if (environmentalConcerns?.length) {
    for (const ec of environmentalConcerns) {
      await c.env.DB.prepare(
        'INSERT INTO environmental_concerns (id, report_id, concern_type, severity, description) VALUES (?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), id, ec.type, ec.severity, ec.description).run();
    }
  }

  const report = await c.env.DB.prepare(`
    SELECT r.*, u.id as uid, u.username, u.avatar_url FROM reports r
    JOIN users u ON r.user_id = u.id WHERE r.id = ?
  `).bind(id).first();

  return c.json(report, 201);
});

// Get all reports
reportRoutes.get('/', async (c) => {
  const { startDate, endDate, litterTypes, quantities, verificationStatus, north, south, east, west } = c.req.query();

  let sql = `SELECT r.*, u.id as uid, u.username, u.avatar_url FROM reports r JOIN users u ON r.user_id = u.id WHERE 1=1`;
  const params: any[] = [];

  if (startDate) { sql += ` AND r.created_at >= ?`; params.push(startDate); }
  if (endDate) { sql += ` AND r.created_at <= ?`; params.push(endDate); }
  if (litterTypes) { const types = litterTypes.split(','); sql += ` AND r.litter_type IN (${types.map(() => '?').join(',')})`; params.push(...types); }
  if (quantities) { const qs = quantities.split(','); sql += ` AND r.quantity IN (${qs.map(() => '?').join(',')})`; params.push(...qs); }
  if (verificationStatus) { const vs = verificationStatus.split(','); sql += ` AND r.verification_status IN (${vs.map(() => '?').join(',')})`; params.push(...vs); }
  else { sql += ` AND r.verification_status != 'disputed'`; }
  if (north && south && east && west) { sql += ` AND r.latitude BETWEEN ? AND ? AND r.longitude BETWEEN ? AND ?`; params.push(south, north, west, east); }

  sql += ` ORDER BY r.created_at DESC`;

  const reports = await c.env.DB.prepare(sql).bind(...params).all();
  // Parse JSON fields
  const results = (reports.results as any[]).map(r => ({ ...r, photo_urls: JSON.parse(r.photo_urls || '[]'), latitude: r.latitude, longitude: r.longitude }));
  return c.json(results);
});

// Get single report
reportRoutes.get('/:id', async (c) => {
  const { id } = c.req.param();
  const report = await c.env.DB.prepare(`
    SELECT r.*, u.id as uid, u.username, u.avatar_url FROM reports r
    JOIN users u ON r.user_id = u.id WHERE r.id = ?
  `).bind(id).first();
  if (!report) return c.json({ error: { code: 'RESOURCE_NOT_FOUND', message: 'Report not found', timestamp: new Date().toISOString() } }, 404);

  const concerns = await c.env.DB.prepare('SELECT * FROM environmental_concerns WHERE report_id = ?').bind(id).all();
  const verifications = await c.env.DB.prepare(`
    SELECT v.*, u.id as uid, u.username FROM verifications v JOIN users u ON v.user_id = u.id WHERE v.report_id = ? ORDER BY v.created_at DESC
  `).bind(id).all();

  return c.json({ ...report, photo_urls: JSON.parse((report as any).photo_urls || '[]'), environmentalConcerns: concerns.results, verifications: verifications.results });
});

// Delete report
reportRoutes.delete('/:id', requireAuth, async (c) => {
  const { id } = c.req.param();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const report = await c.env.DB.prepare('SELECT user_id FROM reports WHERE id = ?').bind(id).first<{ user_id: string }>();
  if (!report) return c.json({ error: { code: 'RESOURCE_NOT_FOUND', message: 'Report not found', timestamp: new Date().toISOString() } }, 404);
  if (report.user_id !== dbUserId) return c.json({ error: { code: 'FORBIDDEN', message: 'Not authorized', timestamp: new Date().toISOString() } }, 403);
  await c.env.DB.prepare('DELETE FROM reports WHERE id = ?').bind(id).run();
  return new Response(null, { status: 204 });
});

// Verify report
reportRoutes.post('/:id/verify', requireAuth, async (c) => {
  const { id } = c.req.param();
  const { comment } = await c.req.json();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);

  const existing = await c.env.DB.prepare('SELECT id FROM verifications WHERE report_id = ? AND user_id = ?').bind(id, dbUserId).first();
  if (existing) return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Already verified or disputed', timestamp: new Date().toISOString() } }, 400);

  await c.env.DB.prepare('INSERT INTO verifications (id, report_id, user_id, verification_type, comment) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), id, dbUserId, 'verify', comment || null).run();
  await updateVerificationStatus(c.env.DB, id);

  return c.json({ success: true });
});

// Dispute report
reportRoutes.post('/:id/dispute', requireAuth, async (c) => {
  const { id } = c.req.param();
  const { comment } = await c.req.json();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);

  const existing = await c.env.DB.prepare('SELECT id FROM verifications WHERE report_id = ? AND user_id = ?').bind(id, dbUserId).first();
  if (existing) return c.json({ error: { code: 'VALIDATION_ERROR', message: 'Already verified or disputed', timestamp: new Date().toISOString() } }, 400);

  await c.env.DB.prepare('INSERT INTO verifications (id, report_id, user_id, verification_type, comment) VALUES (?, ?, ?, ?, ?)').bind(crypto.randomUUID(), id, dbUserId, 'dispute', comment || null).run();
  await updateVerificationStatus(c.env.DB, id);

  return c.json({ success: true });
});

// Mark as cleaned
reportRoutes.post('/:id/mark-cleaned', requireAuth, async (c) => {
  const { id } = c.req.param();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const report = await c.env.DB.prepare('SELECT id FROM reports WHERE id = ?').bind(id).first();
  if (!report) return c.json({ error: { code: 'RESOURCE_NOT_FOUND', message: 'Report not found', timestamp: new Date().toISOString() } }, 404);

  await c.env.DB.prepare("UPDATE reports SET cleaned_at = datetime('now'), cleaned_by_user_id = ? WHERE id = ?").bind(dbUserId, id).run();
  return c.json({ success: true });
});

// Helper
async function updateVerificationStatus(db: D1Database, reportId: string) {
  const counts = await db.prepare(`
    SELECT verification_type, COUNT(*) as cnt FROM verifications WHERE report_id = ? GROUP BY verification_type
  `).bind(reportId).all();
  let verifyCount = 0, disputeCount = 0;
  for (const row of counts.results as any[]) {
    if (row.verification_type === 'verify') verifyCount = row.cnt;
    if (row.verification_type === 'dispute') disputeCount = row.cnt;
  }
  let status = 'pending';
  if (disputeCount >= 3) status = 'disputed';
  else if (verifyCount >= 2) status = 'verified';
  await db.prepare('UPDATE reports SET verification_status = ? WHERE id = ?').bind(status, reportId).run();
}
