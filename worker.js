const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const PROTECTED_PAGES = ['/app.html', '/data.json', '/holdings.json'];
const PROTECTED_API = ['/api/state', '/api/toggle', '/api/price', '/api/card-image'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const session = await getSession(request, env);

    if (PROTECTED_PAGES.includes(url.pathname) && !session) {
      return Response.redirect(url.origin + '/', 302);
    }
    if (PROTECTED_API.includes(url.pathname) && !session) {
      return json({ error: 'Unauthorized' }, 401);
    }

    if (url.pathname === '/api/session' && request.method === 'GET') {
      return json(session ? { authenticated: true, email: session.email } : { authenticated: false });
    }

    if (url.pathname === '/api/auth/login' && request.method === 'GET') {
      return startGoogleLogin(url, env);
    }

    if (url.pathname === '/api/auth/callback' && request.method === 'GET') {
      return handleGoogleCallback(request, url, env);
    }

    if (url.pathname === '/api/auth/logout') {
      return logout(request, url, env);
    }

    if (url.pathname === '/api/state' && request.method === 'GET') {
      const [productTypes, maxPrice] = await Promise.all([getState(env), getMaxPrice(env)]);
      return json({ productTypes, maxPrice });
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

    if (url.pathname === '/api/toggle' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body || !['sealed', 'rawSingles', 'slabs'].includes(body.type) || typeof body.value !== 'boolean') {
        return json({ error: 'Bad request' }, 400);
      }
      const state = await getState(env);
      state[body.type] = body.value;
      await env.STATE_KV.put('productTypes', JSON.stringify(state));
      return json(state);
    }

    if (url.pathname === '/api/price' && request.method === 'POST') {
      const body = await request.json().catch(() => null);
      if (!body || (body.maxPrice !== null && (typeof body.maxPrice !== 'number' || body.maxPrice <= 0))) {
        return json({ error: 'Bad request' }, 400);
      }
      await env.STATE_KV.put('maxPrice', JSON.stringify(body.maxPrice));
      return json({ maxPrice: body.maxPrice });
    }

    return env.ASSETS.fetch(request);
  }
};

// ---- Google OAuth ----

function startGoogleLogin(url, env) {
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.OAUTH_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email',
    access_type: 'online',
    prompt: 'select_account',
    state
  });
  const headers = new Headers({ Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
  headers.append('Set-Cookie', cookie('oauth_state', state, { maxAge: 600 }));
  return new Response(null, { status: 302, headers });
}

async function handleGoogleCallback(request, url, env) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = getCookie(request, 'oauth_state');
  const clearState = cookie('oauth_state', '', { expirePast: true });

  if (!code || !state || state !== savedState) {
    return redirectWithError(url, 'invalid_state', clearState);
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.OAUTH_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });
  if (!tokenRes.ok) return redirectWithError(url, 'auth_failed', clearState);
  const tokens = await tokenRes.json();

  // Google's tokeninfo endpoint verifies the id_token's signature/expiry server-side
  // and hands back its claims, so the Worker never has to do JWT verification itself.
  const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`);
  if (!infoRes.ok) return redirectWithError(url, 'auth_failed', clearState);
  const claims = await infoRes.json();

  const allowed = env.ALLOWED_EMAILS.split(',').map(e => e.trim().toLowerCase());
  const email = (claims.email || '').toLowerCase();
  if (claims.aud !== env.GOOGLE_CLIENT_ID || claims.email_verified !== 'true' || !allowed.includes(email)) {
    return redirectWithError(url, 'not_authorized', clearState);
  }

  const sessionId = crypto.randomUUID();
  await env.STATE_KV.put(`session:${sessionId}`, JSON.stringify({ email: claims.email }), {
    expirationTtl: SESSION_MAX_AGE
  });

  const headers = new Headers({ Location: url.origin + '/app.html' });
  headers.append('Set-Cookie', cookie('session', sessionId, { maxAge: SESSION_MAX_AGE }));
  headers.append('Set-Cookie', clearState);
  return new Response(null, { status: 302, headers });
}

async function logout(request, url, env) {
  const sessionId = getCookie(request, 'session');
  if (sessionId) await env.STATE_KV.delete(`session:${sessionId}`);
  const headers = new Headers({ Location: url.origin + '/' });
  headers.append('Set-Cookie', cookie('session', '', { expirePast: true }));
  return new Response(null, { status: 302, headers });
}

async function getSession(request, env) {
  const sessionId = getCookie(request, 'session');
  if (!sessionId) return null;
  const raw = await env.STATE_KV.get(`session:${sessionId}`);
  return raw ? JSON.parse(raw) : null;
}

function redirectWithError(url, code, extraCookie) {
  const headers = new Headers({ Location: `${url.origin}/?error=${code}` });
  if (extraCookie) headers.append('Set-Cookie', extraCookie);
  return new Response(null, { status: 302, headers });
}

// ---- Cookies ----

function getCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  const match = header.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function cookie(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax'];
  if (opts.expirePast) parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  else if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join('; ');
}

// ---- Strategy state ----

async function getState(env) {
  const stored = await env.STATE_KV.get('productTypes');
  return stored ? JSON.parse(stored) : { sealed: true, rawSingles: true, slabs: true };
}

async function getMaxPrice(env) {
  const stored = await env.STATE_KV.get('maxPrice');
  return stored ? JSON.parse(stored) : null;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
