// Pages Function: handles /api/docs/:id (get, put, delete)
// Bindings required:
//   TXT          (KV namespace)
//   PASSPHRASE   (env var, defaults to "rain")

function unauthorized() {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  });
}

function checkAuth(request, env) {
  const expected = env.PASSPHRASE || 'rain';
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return token === expected;
}

function safeId(id) {
  return String(id || '').replace(/[^a-z0-9-_]/gi, '').slice(0, 80);
}

export const onRequestGet = async ({ request, env, params }) => {
  if (!checkAuth(request, env)) return unauthorized();
  const id = safeId(params.id);
  if (!id) return new Response('bad id', { status: 400 });
  const data = await env.TXT.get('doc:' + id, 'json');
  if (!data) return new Response('not found', { status: 404 });
  return Response.json(data);
};

export const onRequestPut = async ({ request, env, params }) => {
  if (!checkAuth(request, env)) return unauthorized();
  const id = safeId(params.id);
  if (!id) return new Response('bad id', { status: 400 });
  const body = await request.json().catch(() => ({}));
  const existing = await env.TXT.get('doc:' + id, 'json');
  const now = Date.now();
  const doc = {
    id,
    content: String(body.content || ''),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await env.TXT.put('doc:' + id, JSON.stringify(doc));
  return Response.json(doc);
};

export const onRequestDelete = async ({ request, env, params }) => {
  if (!checkAuth(request, env)) return unauthorized();
  const id = safeId(params.id);
  if (!id) return new Response('bad id', { status: 400 });
  await env.TXT.delete('doc:' + id);
  return new Response(null, { status: 204 });
};
