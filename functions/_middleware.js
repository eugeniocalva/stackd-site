// Opens the site in the visitor's language on arrival (Cloudflare Pages Function).
//
// Runs only on the four English root pages — "/", "/support", "/privacy",
// "/terms" — as listed in /_routes.json; every other file is served straight
// from Pages without invoking this. Rules (docs/site-i18n-plan.md in the app
// repo, decisions D1, D2, D5):
//
//   - GET/HEAD only.
//   - Coming from a page of this same site (Referer with our own origin)?
//     Serve the page as asked. That is how choosing English in the language
//     menu sticks, without a cookie: the site promises it sets none.
//   - Otherwise take the visitor's languages from Accept-Language in order of
//     preference (q-weights; regional tags count as their base language:
//     pt-BR -> pt, fr-CH -> fr), and pick the first one the site has. If that
//     is not English, redirect (302) to the same page in that language.
//   - No Accept-Language (crawlers, scripts) means English.
//
// The browser's language is read for this one decision and not stored.
//
// Cloudflare does not apply the rules in /_headers to responses a Function
// produces, so the same security headers are set here. Keep SECURITY_HEADERS
// equal to the "/*" block of /_headers; tools/site/redirect-check.cjs in the
// app repo fails when they differ.
//
// Neither this folder nor /_routes.json is published as a static file: the
// Pages upload skips "functions" and "_routes.json".

export const LANGS = ['en', 'fr', 'it', 'es', 'pt'];
const PAGES = { '/': '', '/support': 'support', '/privacy': 'privacy', '/terms': 'terms' };

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
};

// The first of the visitor's languages, in their order of preference, that
// the site is written in; 'en' when there is none.
export function pickLang(acceptLanguage) {
  if (!acceptLanguage) return 'en';
  const prefs = acceptLanguage.split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().split(';');
      const qp = params.map(p => p.trim()).find(p => p.startsWith('q='));
      const q = qp ? Number(qp.slice(2)) : 1;
      return { base: tag.trim().toLowerCase().split('-')[0], q: Number.isFinite(q) ? q : 0, i };
    })
    .filter(p => p.base && p.base !== '*' && p.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  const hit = prefs.find(p => LANGS.includes(p.base));
  return hit ? hit.base : 'en';
}

// The URL to send this request to, or null to serve it as asked.
export function redirectFor(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  const url = new URL(request.url);
  if (!(url.pathname in PAGES)) return null;

  const referer = request.headers.get('Referer');
  if (referer) {
    try { if (new URL(referer).origin === url.origin) return null; } catch { /* not a URL: ignore it */ }
  }

  const lang = pickLang(request.headers.get('Accept-Language'));
  if (lang === 'en') return null;
  return `${url.origin}/${lang}/${PAGES[url.pathname]}${url.search}`;
}

const withHeaders = (response) => {
  const out = new Response(response.body, response);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!out.headers.has(k)) out.headers.set(k, v);
  }
  // The same URL answers differently by language and origin of the visit.
  out.headers.set('Vary', 'Accept-Language, Referer');
  return out;
};

export async function onRequest({ request, next }) {
  const target = redirectFor(request);
  if (target) {
    return withHeaders(new Response(null, {
      status: 302,
      headers: { Location: target, 'Cache-Control': 'no-store' }
    }));
  }
  return withHeaders(await next());
}
