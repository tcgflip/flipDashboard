const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const PROTECTED_PAGES = ['/app.html', '/data.json', '/holdings.json'];
const PROTECTED_API = ['/api/identify', '/api/lookup-price'];

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

    if (url.pathname === '/api/identify' && request.method === 'POST') {
      return handleIdentify(request, env);
    }

    if (url.pathname === '/api/lookup-price' && request.method === 'POST') {
      return handleLookupPrice(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

// ---- Binder Scan: card identification (Claude vision) ----

const IDENTIFY_PROMPT =
  'This photo shows one or more Pokémon cards (a binder page, a stack, or a table spread). ' +
  'Identify EVERY distinct card you can see. Reply with ONLY a JSON array, no other text, ' +
  'each item shaped exactly like: {"name": string, "set": string or null, "number": string or null, ' +
  '"rarity": string or null, "variant": "holofoil" or "reverseHolofoil" or "normal" or null, "confidence": "high" or "medium" or "low"}. ' +
  'If you cannot make out a card at all, omit it rather than guessing wildly.';

async function handleIdentify(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !body.image || !body.mediaType) return json({ error: 'Bad request' }, 400);
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'Card identification is not configured yet (missing API key).' }, 500);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: body.mediaType, data: body.image } },
          { type: 'text', text: IDENTIFY_PROMPT }
        ]
      }]
    })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    return json({ error: errBody?.error?.message || `Identification failed (${res.status})` }, 502);
  }

  const data = await res.json();
  const textBlock = (data.content || []).find(b => b.type === 'text');
  if (!textBlock) return json({ error: 'No response text from model' }, 502);

  let raw = textBlock.text.trim();
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) raw = fenceMatch[1].trim();
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start === -1 || end === -1) return json({ error: 'Could not parse card list from response' }, 502);

  try {
    const cards = JSON.parse(raw.slice(start, end + 1));
    return json({ cards });
  } catch (e) {
    return json({ error: 'Could not parse card list from response' }, 502);
  }
}

// ---- Binder Scan: price lookup (Scrydex) ----

async function handleLookupPrice(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !body.name) return json({ error: 'Bad request' }, 400);
  if (!env.SCRYDEX_API_KEY || !env.Scrydex_Team_ID) {
    return json({ error: 'Price lookup is not configured yet (missing Scrydex credentials).' }, 500);
  }
  const headers = { 'X-Api-Key': env.SCRYDEX_API_KEY, 'X-Team-ID': env.Scrydex_Team_ID };

  // A card read off a photo often carries the full printed fraction, e.g.
  // "201/165" — Scrydex's `number` field is only ever the local number
  // ("201"), never the set total, so that has to be stripped first.
  const numOnly = body.number ? String(body.number).split('/')[0].trim().replace(/^0+(?=\d)/, '') : null;
  const setQ = body.set ? ` expansion.name:"${body.set}"` : '';
  const numQ = numOnly ? ` number:"${numOnly}"` : '';
  const nameQ = `name:"${body.name}"`;

  let list = [];
  // Number + set alone is the most reliable match — it doesn't depend on
  // getting the card's name text exactly right at all.
  if (!list.length && setQ && numQ) list = await fetchScrydexCards(`number:"${numOnly}"${setQ}`, headers);
  if (!list.length && setQ && numQ) list = await fetchScrydexCards(nameQ + setQ + numQ, headers);
  if (!list.length && setQ) list = await fetchScrydexCards(nameQ + setQ, headers);
  if (!list.length && numQ) list = await fetchScrydexCards(nameQ + numQ, headers);
  if (!list.length) list = await fetchScrydexCards(nameQ, headers);
  if (!list.length) {
    const searchText = [body.name, body.set, numOnly].filter(Boolean).join(' ');
    const searchUrl = `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(searchText)}`;
    return json({ marketPrice: null, priceLabel: null, tcgUrl: searchUrl });
  }

  let match = list[0];
  if (numOnly) {
    const numMatch = list.find(c => c.number === numOnly);
    if (numMatch) match = numMatch;
  }

  const variants = match.variants || [];
  // The AI's guessed variant ("holofoil", "reverseHolofoil", "normal") is a
  // rough hint, not an exact match against Scrydex's more granular variant
  // names (e.g. "unlimitedHolofoil") — prefer a substring hit, otherwise
  // just take whichever variant actually has priced data.
  let variant = body.variant
    ? variants.find(v => v.name && v.name.toLowerCase().includes(String(body.variant).toLowerCase()))
    : null;
  if (!variant) variant = variants.find(v => Array.isArray(v.prices) && v.prices.length);
  if (!variant) variant = variants[0];

  const prices = (variant && variant.prices) || [];
  const raw = prices.filter(p => p.type === 'raw');
  const conditionOrder = ['NM', 'LP', 'MP', 'HP', 'DM'];
  let chosen = null;
  for (const cond of conditionOrder) {
    chosen = raw.find(p => p.condition === cond && typeof p.market === 'number');
    if (chosen) break;
  }
  if (!chosen) chosen = raw.find(p => typeof p.market === 'number');
  if (!chosen) return json({ marketPrice: null, priceLabel: null, tcgUrl: null });

  const priceLabel = [variant.name, chosen.condition].filter(Boolean).join(' · ');
  return json({ marketPrice: chosen.market, priceLabel, tcgUrl: null });
}

async function fetchScrydexCards(q, headers) {
  const url = `https://api.scrydex.com/pokemon/v1/en/cards?include=prices&page_size=5&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  return data && data.data ? data.data : [];
}

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

  if (!env.GOOGLE_CLIENT_SECRET) {
    return redirectWithError(url, 'auth_failed', clearState, 'secret_not_bound');
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
  if (!tokenRes.ok) {
    const detail = await tokenRes.json().catch(() => null);
    return redirectWithError(url, 'auth_failed', clearState, `token:${detail?.error || tokenRes.status}:secretlen${env.GOOGLE_CLIENT_SECRET.length}`);
  }
  const tokens = await tokenRes.json();

  // Google's tokeninfo endpoint verifies the id_token's signature/expiry server-side
  // and hands back its claims, so the Worker never has to do JWT verification itself.
  const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`);
  if (!infoRes.ok) {
    const detail = await infoRes.json().catch(() => null);
    return redirectWithError(url, 'auth_failed', clearState, `tokeninfo:${detail?.error_description || infoRes.status}`);
  }
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

function redirectWithError(url, code, extraCookie, detail) {
  const params = new URLSearchParams({ error: code });
  if (detail) params.set('detail', detail);
  const headers = new Headers({ Location: `${url.origin}/?${params}` });
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
