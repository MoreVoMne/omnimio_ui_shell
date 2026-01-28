const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const rootEnvPath = path.resolve(__dirname, '../../.env.local');
const tokenPath = path.resolve(__dirname, '../../.shopify-token.json');
const draftsPath = path.resolve(__dirname, '../../.wizard-drafts.json');

const loadEnv = () => {
  if (!fs.existsSync(rootEnvPath)) return;
  const content = fs.readFileSync(rootEnvPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    if (!key) return;
    const value = rest.join('=');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

loadEnv();

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const SHOPIFY_ADMIN_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-07';
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES || 'read_products';

let accessToken = null;
let oauthState = null;
let tokenMeta = {
  shop: SHOPIFY_STORE_DOMAIN || null,
  actor_id: null,
  actor_email: null,
  expires_at: null,
};

const loadToken = () => {
  if (!fs.existsSync(tokenPath)) return;
  try {
    const stored = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    if (stored && stored.access_token) {
      accessToken = stored.access_token;
      tokenMeta = {
        shop: stored.shop || SHOPIFY_STORE_DOMAIN || null,
        actor_id: stored.actor_id || stored.associated_user?.id || null,
        actor_email: stored.actor_email || stored.associated_user?.email || null,
        expires_at: stored.expires_at || null,
      };
    }
  } catch (error) {
    // Ignore invalid token file in dev.
  }
};

const persistToken = (token, meta) => {
  accessToken = token;
  tokenMeta = {
    shop: meta.shop || SHOPIFY_STORE_DOMAIN || null,
    actor_id: meta.actor_id || null,
    actor_email: meta.actor_email || null,
    expires_at: meta.expires_at || null,
  };
  fs.writeFileSync(
    tokenPath,
    JSON.stringify(
      {
        access_token: token,
        shop: tokenMeta.shop,
        actor_id: tokenMeta.actor_id,
        actor_email: tokenMeta.actor_email,
        expires_at: tokenMeta.expires_at,
      },
      null,
      2
    )
  );
};

loadToken();

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(payload));
};

const sendHtml = (res, status, html) => {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(html);
};

const loadDraftStore = () => {
  if (!fs.existsSync(draftsPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(draftsPath, 'utf8'));
  } catch (error) {
    return {};
  }
};

const saveDraftStore = (store) => {
  fs.writeFileSync(draftsPath, JSON.stringify(store, null, 2));
};

const readRequestBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });

const getBaseUrl = (req) => {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  return `${proto}://${host}`;
};

const makeDraftKey = (productId, variantId) => (variantId ? `${productId}::${variantId}` : productId);

const parseDraftKey = (key) => {
  const [productId, variantId] = key.split('::');
  return { productId, variantId: variantId || null };
};

const getIdentity = () => {
  if (!accessToken) return null;
  if (tokenMeta.expires_at && Date.now() > tokenMeta.expires_at) {
    accessToken = null;
    return null;
  }
  const tenantId = tokenMeta.shop || SHOPIFY_STORE_DOMAIN;
  if (!tenantId) return null;
  const actorId = tokenMeta.actor_id ? `shopify:${tokenMeta.actor_id}` : `shopify:${tenantId}`;
  return { tenantId, actorId };
};

const verifyHmac = (params) => {
  const { hmac, ...rest } = params;
  if (!hmac) return false;
  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('&');
  const digest = crypto.createHmac('sha256', SHOPIFY_CLIENT_SECRET).update(message).digest('hex');
  const received = Buffer.from(hmac, 'utf8');
  const expected = Buffer.from(digest, 'utf8');
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(received, expected);
};

const fetchProducts = async () => {
  const shopDomain = tokenMeta.shop || SHOPIFY_STORE_DOMAIN;
  if (!shopDomain) {
    throw new Error('Missing shop domain');
  }
  const url = `https://${shopDomain}/admin/api/${SHOPIFY_ADMIN_API_VERSION}/products.json?fields=id,title,product_type,tags,variants,images&limit=50`;
  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': accessToken,
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Shopify API error ${response.status}: ${body}`);
  }
  const data = await response.json();
  const products = (data.products || []).map((product) => ({
    id: String(product.id),
    title: product.title,
    price: product.variants?.[0]?.price ?? '0.00',
    category: product.product_type || 'Uncategorized',
    tags: product.tags ? product.tags.split(',').map((tag) => tag.trim()) : [],
    variants: product.variants ? product.variants.length : 0,
    variantOptions: product.variants
      ? product.variants.map((variant) => ({
          id: String(variant.id),
          title: variant.title,
          sku: variant.sku ?? null,
        }))
      : [],
    hasCustomization: false,
    image: product.images?.[0]?.src ?? null,
  }));
  return products;
};

const server = http.createServer(async (req, res) => {
  const baseUrl = getBaseUrl(req);
  const url = new URL(req.url, baseUrl);
  const params = Object.fromEntries(url.searchParams.entries());

  if (req.method === 'GET' && url.pathname === '/api/health') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/api/shopify/status') {
    return sendJson(res, 200, { connected: Boolean(accessToken) });
  }

  if (req.method === 'GET' && url.pathname === '/') {
    if (accessToken) {
      return sendHtml(
        res,
        200,
        '<h2>Shopify connected.</h2><p>You can close this tab and return to the wizard.</p>'
      );
    }
    const shop = params.shop || SHOPIFY_STORE_DOMAIN;
    if (shop) {
      const redirectUrl = new URL('/api/shopify/auth', baseUrl);
      redirectUrl.searchParams.set('shop', shop);
      res.writeHead(302, { Location: redirectUrl.toString() });
      return res.end();
    }
    return sendHtml(
      res,
      200,
      '<h2>Omnimio API</h2><p>Use /api/shopify/auth?shop=your-store.myshopify.com to connect Shopify.</p>'
    );
  }

  if (req.method === 'GET' && url.pathname === '/api/shopify/auth') {
    if (!SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) {
      return sendJson(res, 500, { error: 'Missing Shopify credentials' });
    }
    const shop = params.shop || SHOPIFY_STORE_DOMAIN;
    if (!shop) {
      return sendJson(res, 400, { error: 'Missing shop domain' });
    }
    oauthState = crypto.randomBytes(16).toString('hex');
    const redirectUri = `${baseUrl}/api/shopify/callback`;
    const installUrl = new URL(`https://${shop}/admin/oauth/authorize`);
    installUrl.searchParams.set('client_id', SHOPIFY_CLIENT_ID);
    installUrl.searchParams.set('scope', SHOPIFY_SCOPES);
    installUrl.searchParams.set('redirect_uri', redirectUri);
    installUrl.searchParams.set('state', oauthState);
    installUrl.searchParams.set('grant_options[]', 'per-user');
    res.writeHead(302, { Location: installUrl.toString() });
    return res.end();
  }

  if (req.method === 'GET' && url.pathname === '/api/shopify/callback') {
    if (!SHOPIFY_CLIENT_SECRET || !SHOPIFY_CLIENT_ID) {
      return sendJson(res, 500, { error: 'Missing Shopify credentials' });
    }
    if (!verifyHmac(params)) {
      return sendJson(res, 400, { error: 'Invalid HMAC' });
    }
    if (params.state !== oauthState) {
      return sendJson(res, 400, { error: 'Invalid state' });
    }
    const shop = params.shop || SHOPIFY_STORE_DOMAIN;
    if (!shop || !params.code) {
      return sendJson(res, 400, { error: 'Missing shop or code' });
    }
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code: params.code,
      }),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      return sendJson(res, 500, { error: 'Failed to get access token', details: tokenData });
    }
    const expiresAt = tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null;
    persistToken(tokenData.access_token, {
      shop,
      actor_id: tokenData.associated_user?.id,
      actor_email: tokenData.associated_user?.email,
      expires_at: expiresAt,
    });
    return sendHtml(
      res,
      200,
      '<h2>Shopify connected.</h2><p>You can return to the wizard and reload products.</p>'
    );
  }

  if (url.pathname === '/api/wizard/draft' && (req.method === 'GET' || req.method === 'DELETE')) {
    const identity = getIdentity();
    if (!identity) {
      return sendJson(res, 401, { error: 'Not connected to Shopify' });
    }
    const productId = params.product_id || params.productId;
    const variantId = params.variant_id || params.variantId || null;
    if (!productId) {
      return sendJson(res, 400, { error: 'Missing product_id' });
    }
    const store = loadDraftStore();
    const tenantStore = store[identity.tenantId] || {};
    const actorStore = tenantStore[identity.actorId] || {};
    const draftKey = makeDraftKey(productId, variantId);
    if (req.method === 'GET') {
      const draft = actorStore[draftKey];
      if (!draft) {
        return sendJson(res, 404, { error: 'Draft not found' });
      }
      return sendJson(res, 200, { draft });
    }
    if (req.method === 'DELETE') {
      if (actorStore[draftKey]) {
        delete actorStore[draftKey];
        tenantStore[identity.actorId] = actorStore;
        store[identity.tenantId] = tenantStore;
        saveDraftStore(store);
      }
      return sendJson(res, 200, { ok: true });
    }
  }

  if (req.method === 'GET' && url.pathname === '/api/wizard/drafts') {
    const identity = getIdentity();
    if (!identity) {
      return sendJson(res, 401, { error: 'Not connected to Shopify' });
    }
    const store = loadDraftStore();
    const tenantStore = store[identity.tenantId] || {};
    const actorStore = tenantStore[identity.actorId] || {};
    const drafts = Object.keys(actorStore).map(parseDraftKey);
    return sendJson(res, 200, { drafts });
  }

  if (req.method === 'POST' && url.pathname === '/api/wizard/draft') {
    const identity = getIdentity();
    if (!identity) {
      return sendJson(res, 401, { error: 'Not connected to Shopify' });
    }
    const body = await readRequestBody(req);
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      return sendJson(res, 400, { error: 'Invalid JSON' });
    }
    const productId =
      payload.product_id ||
      payload.productId ||
      payload.product_ref?.external_id ||
      payload.productRef?.externalId;
    const variantId =
      payload.variant_id ||
      payload.variantId ||
      payload.product_ref?.variant_id ||
      payload.productRef?.variantId ||
      payload.draft?.variantId ||
      null;
    if (!productId) {
      return sendJson(res, 400, { error: 'Missing product_id' });
    }
    const store = loadDraftStore();
    const tenantStore = store[identity.tenantId] || {};
    const actorStore = tenantStore[identity.actorId] || {};
    const draftKey = makeDraftKey(productId, variantId);
    actorStore[draftKey] = {
      ...payload.draft,
      variantId,
      updatedAt: new Date().toISOString(),
    };
    tenantStore[identity.actorId] = actorStore;
    store[identity.tenantId] = tenantStore;
    saveDraftStore(store);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'GET' && url.pathname === '/api/shopify/products') {
    if (!accessToken) {
      return sendJson(res, 401, { error: 'Not connected to Shopify' });
    }
    try {
      const products = await fetchProducts();
      return sendJson(res, 200, { products });
    } catch (error) {
      return sendJson(res, 500, { error: 'Failed to fetch products', details: error.message });
    }
  }

  return sendJson(res, 404, { error: 'Not found' });
});

const port = process.env.PORT || 3000;
const host = process.env.HOST || '127.0.0.1';
server.listen(port, host, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://${host}:${port}`);
});
