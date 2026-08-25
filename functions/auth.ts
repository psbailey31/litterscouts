import { Context, Next } from 'hono';
import { Env } from './types';

/**
 * Verify Clerk JWT token. Clerk tokens are JWTs signed with your instance's public key.
 * For Workers, we verify using the JWKS endpoint.
 */
export async function requireAuth(c: Context<{ Bindings: Env; Variables: { userId: string } }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'No authorization token provided', timestamp: new Date().toISOString() } }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Decode JWT payload without verification first to get issuer
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid token format');

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    // Verify with Clerk JWKS
    const issuer = payload.iss; // e.g. https://clerk.litterscouts.psbailey.uk
    const jwksUrl = `${issuer}/.well-known/jwks.json`;

    const jwksResponse = await fetch(jwksUrl);
    if (!jwksResponse.ok) throw new Error('Failed to fetch JWKS');

    const jwks = await jwksResponse.json() as { keys: JsonWebKey[] };
    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));

    // Find the matching key
    const key = (jwks.keys as any[]).find((k: any) => k.kid === header.kid);
    if (!key) throw new Error('No matching key found');

    // Import key and verify signature
    const cryptoKey = await crypto.subtle.importKey(
      'jwk',
      key,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = Uint8Array.from(atob(parts[2].replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const dataBytes = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);

    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signatureBytes, dataBytes);
    if (!valid) throw new Error('Invalid signature');

    // Set user ID (sub claim is the Clerk user ID)
    c.set('userId', payload.sub);
    await next();
  } catch (error: any) {
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
  const clerkRes = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
    headers: { Authorization: `Bearer ${clerkSecretKey}` },
  });

  if (!clerkRes.ok) throw new Error('Failed to fetch user from Clerk');

  const clerkUser = await clerkRes.json() as any;
  const id = crypto.randomUUID();
  const username = clerkUser.username || `user${clerkId.substring(5, 13)}`;

  await db.prepare(
    'INSERT INTO users (id, clerk_id, email, username, first_name, last_name, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id,
    clerkId,
    clerkUser.email_addresses?.[0]?.email_address || null,
    username,
    clerkUser.first_name,
    clerkUser.last_name,
    clerkUser.image_url
  ).run();

  return id;
}
