import { Hono } from 'hono';
import { Env } from '../types';
import { requireAuth, findOrCreateUser } from '../auth';

type AppEnv = { Bindings: Env; Variables: { userId: string } };
export const notificationRoutes = new Hono<AppEnv>();

// All routes require auth
notificationRoutes.use('*', requireAuth);

// Get notifications
notificationRoutes.get('/', async (c) => {
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const unreadOnly = c.req.query('unreadOnly') === 'true';
  const sql = unreadOnly
    ? 'SELECT * FROM notifications WHERE user_id = ? AND read = 0 ORDER BY created_at DESC LIMIT 50'
    : 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50';
  const notifications = await c.env.DB.prepare(sql).bind(dbUserId).all();
  return c.json(notifications.results);
});

// Unread count
notificationRoutes.get('/unread-count', async (c) => {
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const result = await c.env.DB.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0').bind(dbUserId).first<{ count: number }>();
  return c.json({ count: result?.count || 0 });
});

// Mark as read
notificationRoutes.patch('/:id/read', async (c) => {
  const { id } = c.req.param();
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  await c.env.DB.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').bind(id, dbUserId).run();
  return c.json({ success: true });
});

// Mark all as read
notificationRoutes.patch('/read-all', async (c) => {
  const dbUserId = await findOrCreateUser(c.env.DB, c.get('userId'), c.env.CLERK_SECRET_KEY);
  const result = await c.env.DB.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').bind(dbUserId).run();
  return c.json({ count: result.meta.changes });
});
