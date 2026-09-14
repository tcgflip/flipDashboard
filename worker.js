export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/state' && request.method === 'GET') {
      return json(await getState(env));
    }

    if (url.pathname === '/api/toggle' && request.method === 'POST') {
      const key = request.headers.get('X-Admin-Key');
      if (!key || key !== env.ADMIN_KEY) {
        return json({ error: 'Unauthorized' }, 401);
      }
      const body = await request.json().catch(() => null);
      if (!body || !['sealed', 'rawSingles', 'slabs'].includes(body.type) || typeof body.value !== 'boolean') {
        return json({ error: 'Bad request' }, 400);
      }
      const state = await getState(env);
      state[body.type] = body.value;
      await env.STATE_KV.put('productTypes', JSON.stringify(state));
      return json(state);
    }

    return env.ASSETS.fetch(request);
  }
};

async function getState(env) {
  const stored = await env.STATE_KV.get('productTypes');
  return stored ? JSON.parse(stored) : { sealed: true, rawSingles: true, slabs: true };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
