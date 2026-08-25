import { Env } from '../types';

// Serve files from R2 at /uploads/*
export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const key = url.pathname.replace('/uploads/', '');

  if (!key) {
    return new Response('Not found', { status: 404 });
  }

  const object = await context.env.UPLOADS.get(key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
};
