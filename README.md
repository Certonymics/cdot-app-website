# cdot.app

Built with [Astro](https://astro.build). Ships **zero client-side framework
code**. The JavaScript that is there is small, hand-written and inline in each
page: the header menus and store dropdowns, the Email page's feature carousel and
scroll-driven steps, the contact and node-signup forms, and the C-Layer network
map.

## Running it

```bash
npm install
npm run dev      # http://localhost:4321
```

| Command | Does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built `dist/` |
| `npm run check` | Type-check every `.astro` and `.js` file (`astro check`, strict) |

`dist/` is plain static HTML/CSS/JS — deployable to any static host.

## Deploying

**This site requires a build step.** `dist/` is gitignored, and there is no
`index.html` at the repo root, so a host configured to serve the repository root
verbatim will 404. Whatever the host, it needs:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | **22.12.0 or later** — pinned in `.nvmrc` |

The site is fronted by Cloudflare and served from the apex, `cdot.app`;
`www.cdot.app` 301-redirects to it. `astro.config.mjs` sets `site` to the apex
to match, because `site` is what generates the `canonical` and `og:url` tags — if
they name a hostname that redirects, crawlers are told the canonical URL is one
the server itself disavows. **Keep `site` in step with whichever hostname actually
serves the page.**

Astro 7 requires Node >= 22.12.0, which is newer than some hosts default to, so
`.nvmrc` pins it. Cloudflare Pages reads that file; keeping the version in the
repo rather than a dashboard field means the requirement travels with the code.

Production is the Cloudflare Pages project **`cdot-app-website`** (Workers & Pages ->
filter by Pages, not Workers - Pages projects do not appear under Workers). It
builds the `main` branch and also gives every other branch its own preview URL,
which is the cheap way to check a change before merging.

**Resources are read from Sanity at build time.** The articles live in the
c.Email Sanity project (`3blzrr9d`, dataset `production`, public-read - no token
needed) and are authored in that project's Studio, which stays in
`c.email-website/studio`. Publishing an article does not change this repo, so the
site only picks it up on the next build: wire a Sanity webhook to a Cloudflare
Pages deploy hook (Pages project -> Settings -> Builds -> Deploy hooks). A build
that cannot reach Sanity, or that gets zero articles, **fails on purpose** rather
than deploy an empty Resources section and silently drop its URLs from the
sitemap; set `ALLOW_EMPTY_CMS=1` to override. See `src/lib/sanity.js`.

**Headers and the Content-Security-Policy.** `public/_headers` sets the response
headers Cloudflare Pages applies: `nosniff`, a referrer policy, a permissions
policy, `frame-ancestors 'none'`, HSTS, and long-lived caching for the hashed
`/_astro/*` files. The policy that restricts scripts and requests is written
into each page by `scripts/csp.mjs`, which `npm run build` runs after
`astro build` (so the Cloudflare build command stays `npm run build`). It hashes
every inline script and style on the page, so a script injected into a page does
not run. Three things to know:

- Astro's own `security.csp` is **not** used: it hashes only the scripts Astro
  processes, not `is:inline` ones, so it would have blocked every script here.
- Adding a third-party host (an analytics script, an embed, a new API) means
  adding it to `STATIC_DIRECTIVES` in `scripts/csp.mjs`, or the browser refuses
  it. The build fails if a page loads something from another origin or contains
  an inline `style=""` or event handler, so this cannot slip through unnoticed.
- The hashes match exact text, so keep Cloudflare's **Rocket Loader** (and the
  old Auto Minify) switched off for this site; either rewrites inline scripts
  after the build and makes them stop running. Cloudflare's Email Address
  Obfuscation and Web Analytics beacon are fine to leave off too; the beacon's
  script would be blocked.

Predecessor note: this repo previously held a hand-written `index.html` at the
root with no build step. If a deploy starts 404ing after a change, check the
host's build configuration before the code.

## Structure

```
src/
  layouts/Layout.astro        <head>, JSON-LD, header + footer shell
  pages/index.astro           home page body + the two inline scripts
  components/
    Header.astro              logo lockup + tagline + nav
    Footer.astro              logo + registered address
    LogoSymbol.astro          inline <symbol id="cdot-logo"> sprite
  styles/
    tokens.css                BRAND TOKENS — see below
    global.css                everything else
public/
  assets/                     logos, favicon, earth-texture.jpg (map)
```

To add a page, drop a `.astro` file in `src/pages/` and wrap it in `Layout`.
Header and footer come along automatically.

## Brand tokens

`brand/palette.json` is the canonical brand definition. `src/styles/tokens.css`
derives from it. Brand blue is **`#566AFD`** — the same value as the logo SVG
fill and as `primary-500` in the `tailwind.config.js` of `Cdot site (main)`,
`c.email-website`, and cma's `desktop/ui`.

Those four definitions are still **copies, not a shared package**, so they can
drift. To catch that:

```bash
npm run brand:check
```

It verifies every consumer against `brand/palette.json` and flags near-miss
hexes — a colour close enough to the brand blue to be a typo rather than a
deliberate palette step. Exits non-zero on drift, so it can gate CI or a
pre-commit hook. Sibling repos that aren't checked out are skipped, not failed.

The real fix is one shared package all four repos import; that needs a decision
on where it lives.

Fonts are **Geist** for body, **Host Grotesk** for display headings (H1/H2), and
**Geist Mono** for figures — all self-hosted via `@fontsource` (no third-party
font CDN). Note this site has diverged from the siblings, which still use Inter
and Darker Grotesque.

## The C-Layer map

`index.astro` carries a vanilla port of the c.Email `NetworkMapCore` component
(`c.email-website/src/components/NetworkMapCore.jsx`) — same projection, same
sampling, same interactions, restyled dark and written without React/Tailwind,
which this site does not use. **Keep the two in step when either changes.**

The continents are sampled at runtime from `public/assets/earth-texture.jpg`
and the dot field is re-drawn for the current view, so the dots stay a constant
screen size instead of scaling and blurring. That is why the land `<canvas>`
sits *outside* `#maplayer`: only the node markers are CSS-transformed.

The texture is downscaled to 2048x1024 (492 KB) from c.Email's 4096x2048
(1.4 MB). The dot grid samples ~230 columns, so 2048 is still oversampled at
maximum zoom; going below ~1024 would start to look blocky when zoomed in.

`getImageData` on the texture requires it to be same-origin — keep it served
from `/assets/`, not a CDN. The read is wrapped so a future CDN move warns to
the console instead of leaving a silently blank map.

The texture fetch is deferred by an `IntersectionObserver` on `#mapvp`
(`rootMargin: 200px`), because it is ~480 KB and would otherwise compete for
bandwidth with the CSS and fonts the hero needs. Observing fires immediately if
the map is already in view, so `/#network` deep links still work. The RGBA
buffer is reduced to a 1-byte-per-pixel land mask and dropped — retaining the
full `ImageData` would hold 8 MB for the life of the page, and the ocean test
moves out of the repaint loop as a side effect.

The map script lives at `public/assets/map.js` and loads with `defer`. It is a
self-contained IIFE that reads DOM ids directly, so it stays out of Astro's
module graph either way; serving it from `public/` rather than inlining keeps the
page's prose dominant in the markup, which matters for naive text extractors.
`defer` guarantees the elements it queries have parsed.

**Wheel zoom requires ctrl/cmd, and touch pans on two fingers only.** Without
that the map swallows every scroll crossing it and the page cannot be scrolled
past - on mobile, with `touch-action:none`, a reader could get stuck on it
entirely. `.mapvp` uses `touch-action:pan-y` so vertical page scroll always
survives. Don't "fix" the map by making it zoom on a bare wheel event.

The map is keyboard operable: `#mapvp` is focusable, arrows pan, `+`/`-` zoom,
`0` resets. Focusing a node while zoomed in re-centres it, since a focus ring
drawn outside the viewport is invisible.

## Contact form

The only form is on `/contact` (`contact.astro`), handled by
`src/components/ContactFormScript.astro`. It has a "What is your enquiry about?"
selector and posts to **c.Email's script**
(`c.email-website/scripts/contact-form.gs`), which routes by type to support@,
press@ or info@. cDot inherited that form from c.Email, so enquiries land in
**c.Email's sheet**. The type values in `contact.astro` must match that script's
`ROUTING` keys or it rejects them.

The script behind it lives in `c.email-website/scripts/contact-form.gs`, which
is the canonical copy: edit it there, paste it into Google, then deploy a **new
version** of the existing deployment (a "new deployment" changes the URL and
breaks both sites). The same applies to the other three form scripts, which are
kept in their own repos - cdot-world (cdot.world's contact form),
certonym.org (its contact form) and c.email-website (`clayer-signup.gs`, the
C-layer node signup that `/network` also posts to).

The homepage used to have its own form; it was replaced by a call to action, and
the cDot script it posted to now serves only cdot.world.

Each `/exec` URL is public by design - the scripts only append rows and have no
`doGet`, so holding the URL grants no read access.

Two things that bite: any edit to the `.gs` needs *Deploy > Manage deployments >
new version* or the live endpoint keeps running the old code; and the mail scope
must be granted by running `testEmail` in the editor once, which a web request
cannot trigger itself. Skip it and enquiries save to the sheet while nobody is
notified.

## Crawler policy

`src/pages/robots.txt.js` (a generated endpoint, so the `Sitemap:` line follows
`site` in `astro.config.mjs`) deliberately splits two things people conflate: retrieval
and training. Search/citation agents (`OAI-SearchBot`, `ChatGPT-User`,
`Claude-SearchBot`, `Claude-User`, `PerplexityBot`) are **allowed**, so
assistants can read the page and link back to it. Training crawlers and opt-out
tokens (`GPTBot`, `ClaudeBot`, `CCBot`, `Google-Extended`,
`Applebot-Extended`, `Meta-ExternalAgent`, `Bytespider`) are **disallowed**.

Two things to keep straight if you edit it. `Google-Extended` and
`Applebot-Extended` are not crawlers and have no effect on Google or Apple
search ranking - Googlebot and Applebot are separate and still allowed. And
robots.txt is a request, not enforcement: it states intent and well-behaved
operators honour it, but nothing stops a scraper.

## llms.txt

`/llms.txt` is a plain-text summary of the site for language models, generated by
`src/pages/llms.txt.js`. Its URLs follow `site`, the chains come from
`src/lib/chains.js`, and the Resources articles are listed from Sanity on every
build. What is still hand-written is the prose about the site itself (what cDot
is, how it works, one line per page): update it when a page's purpose changes.
It is an informal convention, not a standard that search engines rank on.

## External dependencies

The site is self-hosted apart from one first-party API call:

| Reference | What it is | Fetched at runtime? |
|---|---|---|
| `map.c-layer.certonym.org` | Live C-Layer node data for the network map (own infrastructure) | Yes — degrades to static copy on failure |
| `3blzrr9d.api.sanity.io` | Resources articles (c.Email Sanity project) | **Build time only** — never from a visitor's browser |
| `cdn.sanity.io` | Resources article images | **Build time only** — downloaded and re-served from `/_astro/` |
| `cdot.app` | Own canonical / `og:url` | No |
| `www.w3.org`, `schema.org` | XML namespace + JSON-LD `@context` identifiers | No — never requested |

| `script.google.com` | Contact-form endpoint (own Apps Script deployment) | Yes — on submit only |

No font CDN, no analytics, no tag manager, no third-party scripts or
stylesheets. Fonts are self-hosted via `@fontsource`, all three variable (one
file per subset for the whole weight axis): Geist for body, Host Grotesk for
display headings, and Geist Mono for figures and technical values.

## Known gaps

- **`og.png` is generated, not designed.** `public/assets/og.png` was composed
  from the logo SVG with cairosvg (see git history) so link previews work now.
  It is deliberately plain - logo, tagline, strapline on the brand gradient. A
  designed replacement is welcome; keep it 1200x630 and the tags will pick it up.
- **No `sameAs` in the JSON-LD.** There are no external profiles yet. Add
  LinkedIn / X / GitHub / Companies House URLs when they exist - this is how a
  search engine reconciles "cDot" with a real registered entity.

## Structured data

JSON-LD is built in `src/lib/schema.js`. `Layout.astro` puts a small `@graph` on
every page - the `Organization` (Certonymity Ltd, with support and press
contacts), the `WebSite`, and for an indexable page the `WebPage` and its
`BreadcrumbList` - and each page adds only what is true of it through the
layout's `extraSchema` prop:

- **Homepage:** the cDot `SoftwareApplication`, with the store links as `installUrl`.
- **`/network`:** the same, plus one `SoftwareApplication` per chain, linked by
  `isPartOf` / `hasPart`. Each chain carries its specifications as
  `PropertyValue` entries (numeric `value`, `unitText`), so throughput and
  finality are machine-comparable instead of buried in prose.
- **Email, Identity and developers pages:** a `FAQPage`, generated from the same
  array the page renders, so the markup and the visible questions cannot disagree.
- **Articles:** an `Article`, with Resources in the breadcrumb.
- **404:** the organisation and website only; it is not a destination.

**The chain figures are written once, in `src/lib/chains.js`.** The network
page's cards, the `PropertyValue` entries here and `/llms.txt` all read it, so
changing a figure there changes all three.

There is no `sameAs` yet: it should list the organisation's real external
profiles (LinkedIn, Companies House, GitHub) and none are published, so it is
deliberately absent rather than guessed.
