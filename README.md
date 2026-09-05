# stackd-site

Public website for **Stack'd Development Studio** and the Stack'd app.

Plain static HTML and CSS. No build step, no JavaScript, no dependencies.
The repo root is the site root.

| File | Purpose |
|---|---|
| `index.html` | Studio + app landing page |
| `privacy.html` | Privacy Policy (store listings link here) |
| `terms.html` | Terms of Use |
| `support.html` | Support / FAQ (store listings link here) |
| `404.html` | Not-found page (Cloudflare Pages serves it automatically) |
| `_headers` | Cloudflare Pages response headers (CSP, caching) |
| `_redirects` | Keeps `/og-src/*` off the published site |
| `sitemap.xml` | Four canonical, extensionless URLs |
| `styles.css` | All styles; palette and fonts mirror the app's `src/styles/variables.css` |
| `fonts/` | Self-hosted Inter + Manrope, copied from the app repo |
| `img/` | App icon and phone screenshots |

## Screenshots

`img/*-dark.webp` and `img/*-light.webp` are real captures of the app at
390×844 @2x, seeded with example data. They are produced by a Playwright
script that runs against the app's dev server (`npm run dev` in the Stackd
repo, port 3000). Re-capture them after a visible UI change.

## Link previews

`img/og.png` is 1200×630 and is referenced by an **absolute** URL in every page's
`og:image`; crawlers cannot resolve a relative one. Each page also carries a
`canonical` link and `og:url` in the extensionless form, because Cloudflare Pages
308-redirects `/privacy.html` to `/privacy`.

The image is rendered from `og-src/og.html` by `og-src/make-og.cjs` (Playwright at
2x, downsampled with sharp), using the same fonts, palette and phone screenshot
as the site. Cloudflare Pages publishes dot-directories like any other, so
`_redirects` 404s `/og-src/*` to keep it off the site. Run it with the app repo's
node_modules on NODE_PATH. Re-render
it if the headline or the hero screenshot changes.

## Contact links: keep the `email_off` markers

Every `mailto:` anchor is wrapped in `<!--email_off-->` … `<!--/email_off-->`.

Cloudflare's Email Address Obfuscation (Scrape Shield, on by default) rewrites
`mailto:` links into `/cdn-cgi/l/email-protection#…` and injects
`email-decode.min.js` to undo it in the browser. The CSP in `_headers` sets
`script-src 'none'`, so that script is blocked and the address renders as the
literal text `[email protected]`. The markers opt each link out.

Wrap any new `mailto:` link the same way. Alternatively, turn the feature off for
the whole zone under Security → Settings → Email Address Obfuscation, but the
markers are kept so the site is correct either way — and so the address stays
readable to store reviewers and crawlers that do not run JavaScript.

## Deploy (Cloudflare Pages)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick `eugeniocalva/stackd-site`, production branch `main`.
3. Build settings: framework preset **None**, build command *empty*,
   build output directory `/`.
4. After the first deploy, **Custom domains → Set up a custom domain** and
   add the purchased domain (Cloudflare adds the DNS records if the zone is
   on Cloudflare).

Every push to `main` redeploys. Pull requests get preview URLs.

## Before going live

- Confirm the Google Play URL once the listing is public:
  `https://play.google.com/store/apps/details?id=com.stackd.finance`.
