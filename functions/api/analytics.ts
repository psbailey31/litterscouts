import { Hono } from 'hono';
import { Env } from '../types';

type AppEnv = { Bindings: Env; Variables: { userId: string } };
export const analyticsRoutes = new Hono<AppEnv>();

// Summary
analyticsRoutes.get('/summary', async (c) => {
  const { startDate, endDate } = c.req.query();
  let dateFilter = '';
  const params: any[] = [];
  if (startDate) { dateFilter = ' AND created_at >= ?'; params.push(startDate); }
  if (endDate) { dateFilter += ' AND created_at <= ?'; params.push(endDate); }

  const totalReports = await c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM reports WHERE 1=1${dateFilter}`).bind(...params).first<{ cnt: number }>();
  const totalEvents = await c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM events WHERE 1=1${dateFilter}`).bind(...params).first<{ cnt: number }>();
  const totalUsers = await c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM users WHERE 1=1${dateFilter}`).bind(...params).first<{ cnt: number }>();
  const verifiedReports = await c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM reports WHERE verification_status = 'verified'${dateFilter}`).bind(...params).first<{ cnt: number }>();
  const cleanedReports = await c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM reports WHERE cleaned_at IS NOT NULL${dateFilter}`).bind(...params).first<{ cnt: number }>();

  const byType = await c.env.DB.prepare(`SELECT litter_type, COUNT(*) as cnt FROM reports WHERE 1=1${dateFilter} GROUP BY litter_type`).bind(...params).all();
  const byQuantity = await c.env.DB.prepare(`SELECT quantity, COUNT(*) as cnt FROM reports WHERE 1=1${dateFilter} GROUP BY quantity`).bind(...params).all();

  const litterAgg = await c.env.DB.prepare("SELECT SUM(litter_collected) as total FROM events WHERE status = 'completed'").first<{ total: number }>();

  return c.json({
    totalReports: totalReports?.cnt || 0,
    totalEvents: totalEvents?.cnt || 0,
    totalUsers: totalUsers?.cnt || 0,
    totalLitterCollected: litterAgg?.total || 0,
    reportsByType: Object.fromEntries((byType.results as any[]).map(r => [r.litter_type, r.cnt])),
    reportsByQuantity: Object.fromEntries((byQuantity.results as any[]).map(r => [r.quantity, r.cnt])),
    verifiedReports: verifiedReports?.cnt || 0,
    cleanedReports: cleanedReports?.cnt || 0,
  });
});

// Trends
analyticsRoutes.get('/trends', async (c) => {
  const { startDate, endDate, interval } = c.req.query();
  const fmt = interval === 'month' ? '%Y-%m' : interval === 'week' ? '%Y-W%W' : '%Y-%m-%d';

  const reports = await c.env.DB.prepare(`
    SELECT strftime('${fmt}', created_at) as date, COUNT(*) as count FROM reports
    WHERE created_at >= ? AND created_at <= ? GROUP BY date ORDER BY date
  `).bind(startDate || '2000-01-01', endDate || '2099-12-31').all();

  const events = await c.env.DB.prepare(`
    SELECT strftime('${fmt}', scheduled_date) as date, COUNT(*) as count FROM events
    WHERE scheduled_date >= ? AND scheduled_date <= ? GROUP BY date ORDER BY date
  `).bind(startDate || '2000-01-01', endDate || '2099-12-31').all();

  return c.json({ reports: reports.results, events: events.results });
});

// Comparison
analyticsRoutes.get('/comparison', async (c) => {
  const { currentStart, currentEnd, previousStart, previousEnd } = c.req.query();

  const cur = {
    reports: (await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM reports WHERE created_at BETWEEN ? AND ?').bind(currentStart, currentEnd).first<{ cnt: number }>())?.cnt || 0,
    events: (await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM events WHERE created_at BETWEEN ? AND ?').bind(currentStart, currentEnd).first<{ cnt: number }>())?.cnt || 0,
    users: (await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM users WHERE created_at BETWEEN ? AND ?').bind(currentStart, currentEnd).first<{ cnt: number }>())?.cnt || 0,
  };
  const prev = {
    reports: (await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM reports WHERE created_at BETWEEN ? AND ?').bind(previousStart, previousEnd).first<{ cnt: number }>())?.cnt || 0,
    events: (await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM events WHERE created_at BETWEEN ? AND ?').bind(previousStart, previousEnd).first<{ cnt: number }>())?.cnt || 0,
    users: (await c.env.DB.prepare('SELECT COUNT(*) as cnt FROM users WHERE created_at BETWEEN ? AND ?').bind(previousStart, previousEnd).first<{ cnt: number }>())?.cnt || 0,
  };

  const pct = (c: number, p: number) => p === 0 ? (c > 0 ? 100 : 0) : ((c - p) / p) * 100;

  return c.json({ current: cur, previous: prev, percentageChange: { reports: pct(cur.reports, prev.reports), events: pct(cur.events, prev.events), users: pct(cur.users, prev.users) } });
});

// CSV export
analyticsRoutes.get('/export', async (c) => {
  const reports = await c.env.DB.prepare(`
    SELECT r.id, r.submitted_at, u.username, r.latitude, r.longitude, r.location_source,
    r.litter_type, r.quantity, r.description, r.verification_status, r.cleaned_at
    FROM reports r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC
  `).all();

  const header = 'id,submittedAt,username,latitude,longitude,locationSource,litterType,quantity,description,verificationStatus,cleanedAt\n';
  const rows = (reports.results as any[]).map(r =>
    `${r.id},${r.submitted_at || ''},${r.username},${r.latitude},${r.longitude},${r.location_source},${r.litter_type},${r.quantity},"${(r.description || '').replace(/"/g, '""')}",${r.verification_status},${r.cleaned_at || ''}`
  ).join('\n');

  return new Response(header + rows, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=litterscouts-export.csv' } });
});

// Aggregated data
analyticsRoutes.get('/aggregated', async (c) => {
  const byType = await c.env.DB.prepare('SELECT litter_type as type, COUNT(*) as count FROM reports GROUP BY litter_type').all();
  const byQuantity = await c.env.DB.prepare('SELECT quantity as level, COUNT(*) as count FROM reports GROUP BY quantity').all();
  const byStatus = await c.env.DB.prepare("SELECT COALESCE(verification_status, 'pending') as status, COUNT(*) as count FROM reports GROUP BY verification_status").all();
  return c.json({ litterTypes: byType.results, quantities: byQuantity.results, verificationStatus: byStatus.results });
});

// Hotspots
analyticsRoutes.get('/hotspots', async (c) => {
  const hotspots = await c.env.DB.prepare("SELECT * FROM hotspots WHERE calculated_at >= datetime('now', '-1 hour') ORDER BY severity_score DESC").all();
  return c.json(hotspots.results);
});

// Hotspot detail
analyticsRoutes.get('/hotspots/:id', async (c) => {
  const { id } = c.req.param();
  const hotspot = await c.env.DB.prepare('SELECT * FROM hotspots WHERE id = ?').bind(id).first();
  if (!hotspot) return c.json({ error: 'Hotspot not found' }, 404);
  return c.json(hotspot);
});

// Trigger hotspot recalculation
analyticsRoutes.post('/hotspots/calculate', async (c) => {
  await c.env.DB.prepare("DELETE FROM hotspots WHERE calculated_at < datetime('now', '-1 hour')").run();
  const hotspots = await c.env.DB.prepare(`
    SELECT AVG(latitude) as lat, AVG(longitude) as lng, COUNT(*) as cnt,
      AVG(CASE WHEN quantity='minimal' THEN 1 WHEN quantity='moderate' THEN 2 WHEN quantity='significant' THEN 3 WHEN quantity='severe' THEN 4 ELSE 0 END) as sev,
      MAX(created_at) as last_date
    FROM reports WHERE created_at >= datetime('now', '-30 days')
    GROUP BY ROUND(latitude, 3), ROUND(longitude, 3) HAVING cnt >= 5
  `).all();

  for (const h of hotspots.results as any[]) {
    await c.env.DB.prepare('INSERT INTO hotspots (id, latitude, longitude, radius, report_count, severity_score, last_report_date) VALUES (?, ?, ?, 500, ?, ?, ?)')
      .bind(crypto.randomUUID(), h.lat, h.lng, h.cnt, h.cnt * h.sev, h.last_date).run();
  }
  return c.json({ success: true, hotspotsCalculated: hotspots.results.length });
});
