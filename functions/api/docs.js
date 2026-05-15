// Pages Function: handles /api/docs (list)
// Bindings required:
//   TXT          (KV namespace)
//   PASSPHRASE   (env var, defaults to "rain")

const TITLE_LEN = 60;

function extractTitle(html) {
  const text = String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
  const firstLine = (text.split('\n').find(l => l.trim()) || '').trim();
  return firstLine.slice(0, TITLE_LEN);
}

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

export const onRequestGet = async ({ request, env }) => {
  if (!checkAuth(request, env)) return unauthorized();
  const list = await env.TXT.list({ prefix: 'doc:' });
  const docs = await Promise.all(list.keys.map(async (k) => {
    const data = await env.TXT.get(k.name, 'json');
    if (!data) return null;
    return {
      id: data.id,
      title: extractTitle(data.content),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }));
  const filtered = docs.filter(Boolean).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return Response.json(filtered);
};
