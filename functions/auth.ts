import { Context, Next } from 'hono';
import { Env } from './types';

/**
 * Verify Clerk JWT token.
 * Decodes the JWT and extracts the user ID (sub claim).
 * The token is issued by Clerk's frontend SDK which handles the actual auth flow.
 */
export async function requireAuth(c: Context<{ Bindings: Env; Variables: { userId: string } }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'No authorization token provided', timestamp: new Date().toISOString() } }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Decode JWT payload
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');

    // Base64url decode the payload
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const payload = JSON.parse(atob(padded));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    // Check that sub (user ID) exists
    if (!payload.sub) {
      throw new Error('No subject in token');
    }

    // Set user ID (sub claim is the Clerk user ID)
    c.set('userId', payload.sub);
    await next();
  } catch (error: any) {
    console.error('Auth error:', error.message);
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication failed', timestamp: new Date().toISOString() } }, 401);
  }
}

/**
 * Find or create user in D1 from Clerk ID.
 */
export async function findOrCreateUser(db: D1Database, clerkId: string, clerkSecretKey: string): Promise<string> {
  // Check if exists
  const existing = await db.prepare('SELECT id FROM users WHERE clerk_id = ?').bind(clerkId).first<{ id: string }>();
  if (existing) return existing.id;

  // Fetch from Clerk API
  let username = `user${clerkId.substring(5, 13)}`;
  let email: string | null = null;
  let firstName: string | null = null;
  let lastName: string | null = null;
  let avatarUrl: string | null = null;

  try {
    const clerkRes = await fetch(`https://api.clerk.dev/v1/users/${clerkId}`, {
      headers: { Authorization: `Bearer ${clerkSecretKey}` },
    });

    if (clerkRes.ok) {
      const clerkUser = await clerkRes.json() as any;
      username = clerkUser.username || username;
      email = clerkUser.email_addresses?.[0]?.email_address || null;
      firstName = clerkUser.first_name || null;
      lastName = clerkUser.last_name || null;
      avatarUrl = clerkUser.image_url || null;
    }
  } catch (e) {
    console.error('Clerk API fetch failed:', e);
  }

  const id = crypto.randomUUID();
  await db.prepare(
    'INSERT INTO users (id, clerk_id, email, username, first_name, last_name, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, clerkId, email, username, firstName, lastName, avatarUrl).run();

  return id;
}
