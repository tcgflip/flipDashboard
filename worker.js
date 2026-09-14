export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/state' && request.method === 'GET') {
      return json(await getState(env));
    }

    if (url.pathname === '/api/card-image' && request.method === 'GET') {
      const name = url.searchParams.get('name');
      const set = url.searchParams.get('set') || '';
      if (!name) return json({ image: null });
      const q = set ? `name:"${name}" set.name:"${set}"` : `name:"${name}"`;
      try {
        const apiRes = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encodeURIComponent(q)}&pageSize=1`);
        if (!apiRes.ok) return json({ image: null });
        const data = await apiRes.json();
        const card = data.data && data.data[0];
        return json({ image: card ? card.images.small : null });
      } catch (e) {
        return json({ image: null });
      }
    }

    if (url.pathname === '/api/toggle') {
      if (request.method === 'GET') {
        return Response.redirect(url.origin + '/', 302);
      }
      if (request.method === 'POST') {
        const body = await request.json().catch(() => null);
        if (!body || !['sealed', 'rawSingles', 'slabs'].includes(body.type) || typeof body.value !== 'boolean') {
          return json({ error: 'Bad request' }, 400);
        }
        const state = await getState(env);
        state[body.type] = body.value;
        await env.STATE_KV.put('productTypes', JSON.stringify(state));
        return json(state);
      }
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
