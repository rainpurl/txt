// Pages Function: /api/beacon
// Page-close save. sendBeacon can't set headers so auth + id come in the body.

function safeId(id) {
  return String(id || '').replace(/[^a-z0-9-_]/gi, '').slice(0, 80);
}

export const onRequestPost = async ({ request, env }) => {
  const expected = env.PASSPHRASE || 'rain';
  const body = await request.json().catch(() => ({}));
  if (body._auth !== expected) {
    return new Response('unauthorized', { status: 401 });
  }
  const id = safeId(body.id);
  if (!id) return new Response('bad id', { status: 400 });
  const existing = await env.TXT.get('doc:' + id, 'json');
  const now = Date.now();
  const doc = {
    id,
    content: String(body.content || ''),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await env.TXT.put('doc:' + id, JSON.stringify(doc));
  return new Response(null, { status: 204 });
};
