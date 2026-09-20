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
  'This photo shows one or more Pokémon cards (a binder page, a stack, a table spread, or graded ' +
  'cards sealed in hard plastic slabs). Identify EVERY distinct card you can see. Reply with ONLY a ' +
  'JSON array, no other text, each item shaped exactly like: {"name": string, "set": string or null, ' +
  '"number": string or null, "rarity": string or null, "variant": "holofoil" or "reverseHolofoil" or ' +
  '"normal" or null, "language": "en" or "ja", "gradingCompany": "PSA" or "BGS" or "CGC" or "SGC" or ' +
  '"TAG" or null, "grade": string or null, "confidence": "high" or "medium" or "low"}. ' +
  'If a card is printed in Japanese, set "language" to "ja" and give "name" and "set" exactly as ' +
  'printed on the card in Japanese (do not translate them to English) — the pricing database indexes ' +
  'Japanese cards by their original Japanese text, not an English translation. Otherwise "language" is "en". ' +
  'If a card is a graded slab (sealed in a hard plastic holder with a printed grading label), read the ' +
  'grading company and the numeric grade off that label exactly (e.g. company "PSA", grade "10" or ' +
  '"9.5") and set "gradingCompany"/"grade" accordingly; for a raw, ungraded card leave both null. ' +
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
    const missing = [!env.SCRYDEX_API_KEY && 'SCRYDEX_API_KEY', !env.Scrydex_Team_ID && 'Scrydex_Team_ID'].filter(Boolean).join(', ');
    return json({ error: `Price lookup is not configured yet (missing ${missing}).` }, 500);
  }
  const headers = { 'X-Api-Key': env.SCRYDEX_API_KEY, 'X-Team-ID': env.Scrydex_Team_ID };
  const lang = body.language === 'ja' ? 'ja' : 'en';
  // A slab (graded card) prices off Scrydex's graded data (by grading
  // company + exact grade), never raw — the two aren't comparable, and a
  // slab's asking price should never be judged against a raw card's price.
  const isGraded = !!(body.gradingCompany && body.grade);

  const imageUrl = (card) => {
    const img = card && card.images && card.images[0];
    return (img && (img.small || img.medium || img.large)) || null;
  };

  // Per project rule: raw cards verify against TCGplayer search results,
  // but a slab's price must verify against eBay's actual sold/completed
  // listings — graded pricing is far more sale-specific, and TCGplayer
  // doesn't reliably reflect what graded copies actually sell for.
  const sourceUrl = (name, setName, number) => {
    if (isGraded) {
      const q = [name, setName, number, body.gradingCompany, body.grade].filter(Boolean).join(' ');
      return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&LH_Sold=1&LH_Complete=1`;
    }
    const q = [name, setName, number].filter(Boolean).join(' ');
    return `https://www.tcgplayer.com/search/pokemon/product?q=${encodeURIComponent(q)}${lang === 'ja' ? '&Language=Japanese' : ''}`;
  };
  const sourceLabel = isGraded ? 'eBay (sold)' : 'TCGplayer';

  // The price-picking function for the current mode (raw vs. graded), used
  // consistently everywhere a variant needs to be checked for pricing.
  const priceForVariant = isGraded
    ? (variant) => {
        const graded = (variant && Array.isArray(variant.prices) ? variant.prices : []).filter(p =>
          p.type === 'graded' &&
          p.company && String(p.company).toUpperCase() === String(body.gradingCompany).toUpperCase() &&
          String(p.grade) === String(body.grade) &&
          typeof p.market === 'number'
        );
        if (!graded.length) return null;
        return { market: graded[0].market, label: `${graded[0].company} ${graded[0].grade}` };
      }
    : (variant) => {
        const raw = (variant && Array.isArray(variant.prices) ? variant.prices : []).filter(p => p.type === 'raw' && typeof p.market === 'number');
        if (!raw.length) return null;
        const conditionOrder = ['NM', 'LP', 'MP', 'HP', 'DM'];
        let chosen = null;
        for (const cond of conditionOrder) {
          chosen = raw.find(p => p.condition === cond);
          if (chosen) break;
        }
        if (!chosen) chosen = raw[0];
        return { market: chosen.market, label: chosen.condition };
      };

  // The list of print variants on a matched card (Master Ball, reverse
  // holofoil, etc.), with which ones actually have pricing in the current
  // mode — used both to auto-pick a variant and to let the UI offer a
  // manual picker when the AI's guessed variant was wrong.
  const variantList = (card) => (card && card.variants || []).map(v => ({
    name: v.name,
    hasPrice: !!priceForVariant(v)
  }));

  try {
    // A manual re-lookup for a specific variant on a card we've already
    // identified — goes straight to the card by its Scrydex id instead of
    // re-running the whole search, since we already know exactly which
    // printing this is; the user is just correcting which variant it is.
    if (body.cardId && body.variant) {
      const card = await fetchScrydexCardById(body.cardId, headers, lang);
      if (!card) return json({ marketPrice: null, priceLabel: null, tcgUrl: null });
      const variant = (card.variants || []).find(v => v.name === body.variant);
      const result = priceForVariant(variant);
      return json({
        marketPrice: result ? result.market : null,
        priceLabel: result ? [body.variant, result.label].filter(Boolean).join(' · ') : null,
        tcgUrl: sourceUrl(card.name, card.expansion && card.expansion.name, card.number), sourceLabel,
        exactMatch: true, imageUrl: imageUrl(card),
        cardId: card.id, variants: variantList(card), selectedVariant: body.variant, language: lang
      });
    }

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
    if (!list.length && setQ && numQ) list = await fetchScrydexCards(`number:"${numOnly}"${setQ}`, headers, 5, lang);
    if (!list.length && setQ && numQ) list = await fetchScrydexCards(nameQ + setQ + numQ, headers, 5, lang);
    if (!list.length && setQ) list = await fetchScrydexCards(nameQ + setQ, headers, 5, lang);
    if (!list.length && numQ) list = await fetchScrydexCards(nameQ + numQ, headers, 5, lang);
    if (!list.length) list = await fetchScrydexCards(nameQ, headers, 10, lang);
    if (!list.length) {
      return json({ marketPrice: null, priceLabel: null, tcgUrl: sourceUrl(body.name, body.set, numOnly), sourceLabel });
    }

    // If a card number was read, prefer candidates that actually match it —
    // but without one (common when the number wasn't legible in the photo),
    // a plain name search can return several unrelated printings, and the
    // first one isn't necessarily the one with usable pricing.
    const numMatches = numOnly ? list.filter(c => c.number === numOnly) : [];
    const candidates = numMatches.length ? numMatches : list;
    // A number+name match pins down the exact printing. Without one, we're
    // walking unrelated candidates hoping one has pricing — that can land
    // on the wrong printing entirely (e.g. a common reprint instead of the
    // actual valuable card), so that result has to be flagged as unverified
    // rather than shown with the same confidence as a pinned match.
    const exactMatch = numMatches.length > 0;

    // A card can have several print variants (holofoil, reverse holofoil,
    // Master Ball, etc.), and not all of them carry pricing in this mode —
    // e.g. a raw card might only have graded/population data for some
    // variants. Check every candidate printing (and every variant on each)
    // instead of committing to the first one, which could turn out to have
    // no pricing at all while another candidate further down the list does.
    const hint = body.variant ? String(body.variant).toLowerCase() : null;
    let pickedVariant = null;
    let matchedCard = null;
    for (const candidate of candidates) {
      const priced = (candidate.variants || []).filter(v => priceForVariant(v));
      if (!priced.length) continue;
      pickedVariant = (hint && priced.find(v => v.name && v.name.toLowerCase().includes(hint))) || priced[0];
      matchedCard = candidate;
      break;
    }

    if (!pickedVariant) {
      const fallbackCard = candidates[0];
      return json({
        marketPrice: null, priceLabel: null,
        tcgUrl: sourceUrl(fallbackCard.name, fallbackCard.expansion && fallbackCard.expansion.name, fallbackCard.number), sourceLabel,
        imageUrl: imageUrl(fallbackCard),
        cardId: fallbackCard.id, variants: variantList(fallbackCard), language: lang
      });
    }

    const result = priceForVariant(pickedVariant);
    const priceLabel = [pickedVariant.name, result.label].filter(Boolean).join(' · ');
    return json({
      marketPrice: result.market, priceLabel,
      tcgUrl: sourceUrl(matchedCard.name, matchedCard.expansion && matchedCard.expansion.name, matchedCard.number), sourceLabel,
      exactMatch, imageUrl: imageUrl(matchedCard),
      cardId: matchedCard.id, variants: variantList(matchedCard), selectedVariant: pickedVariant.name, language: lang
    });
  } catch (err) {
    return json({ error: `Scrydex lookup failed: ${err.message}` }, 502);
  }
}

async function fetchScrydexCards(q, headers, pageSize = 5, lang = 'en') {
  const url = `https://api.scrydex.com/pokemon/v1/${lang}/cards?include=prices&page_size=${pageSize}&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Scrydex API ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json().catch(() => null);
  return data && data.data ? data.data : [];
}

async function fetchScrydexCardById(id, headers, lang = 'en') {
  const url = `https://api.scrydex.com/pokemon/v1/${lang}/cards/${encodeURIComponent(id)}?include=prices`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Scrydex API ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json().catch(() => null);
  return data && data.data ? data.data : null;
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
