#!/usr/bin/env node
/**
 * SEO / GEO / structure check, run on the built site (dist/) after every build.
 *
 * Nothing here is typed in by hand: titles, descriptions, canonicals, structured
 * data, the sitemap, robots.txt and llms.txt are all generated from the pages and
 * from src/lib. What can still go wrong is the generated output disagreeing with
 * itself - a page missing from the sitemap, a canonical on the wrong domain, an
 * @id that points at nothing, a link to a page that no longer exists. These rules
 * make that a failed build instead of something found in Search Console.
 *
 * Errors fail the build. Warnings print, because they concern content that lives
 * in Sanity (an article's excerpt) and an author should fix those, not a build.
 *
 *   node scripts/check-seo.mjs          checks dist/
 *   node scripts/check-seo.mjs --live   also fetches the sibling sites and checks
 *                                       they still describe the same relationship
 *                                       (network access; never run in the build)
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const live = process.argv.includes("--live");

if (!existsSync(dist)) {
  console.error("check-seo: dist/ not found - run a build first.");
  process.exit(1);
}

/* The site's own origin comes from the build, not from this file. */
const config = readFileSync(join(root, "astro.config.mjs"), "utf8");
const SITE = new URL(config.match(/site:\s*["']([^"']+)["']/)[1]);

/* Sibling sites, from the same constants the pages use. */
const links = readFileSync(join(root, "src/lib/links.js"), "utf8");
const constant = (name) => links.match(new RegExp(`export const ${name} =\\s*"([^"]+)"`))[1];
const CERTONYMITY = new URL(constant("CERTONYMITY_URL"));
const CDOT_WORLD = new URL(constant("CDOT_WORLD_URL"));

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

/* Pages that are not destinations, or are deliberately thin, are exempt from the
   rules that only make sense for indexable content. */
const NOT_IN_LLMS = new Set(["/terms/", "/privacy-policy/", "/support/"]);

const walk = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)],
  );
const read = (p) => readFileSync(join(dist, p), "utf8");
const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attr = (html, re) => {
  const m = html.match(re);
  return m ? decode(m[1]) : undefined;
};

/* --- pages ---------------------------------------------------------------- */
const pages = walk(dist)
  .filter((f) => f.endsWith(".html"))
  .map((f) => {
    const rel = f.slice(dist.length).replace(/\\/g, "/");
    const path = rel === "/404.html" ? "/404.html" : rel.replace(/index\.html$/, "");
    const html = readFileSync(f, "utf8");
    return {
      path,
      html,
      noindex: /<meta name="robots" content="[^"]*noindex/.test(html),
      title: attr(html, /<title>([\s\S]*?)<\/title>/),
      description: attr(html, /<meta name="description" content="([^"]*)"/),
      canonical: attr(html, /<link rel="canonical" href="([^"]*)"/),
    };
  });

const indexable = pages.filter((p) => !p.noindex);
const titles = new Map();
const descriptions = new Map();
const knownIds = new Set();
const graphs = [];

for (const p of pages) {
  const where = p.path;

  if (!p.title) err(where, "no <title>");
  if (!p.description) err(where, "no meta description");
  const h1s = (p.html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) err(where, `${h1s} <h1> elements (want exactly 1)`);
  if (!/<html lang="[a-z-]+"/.test(p.html)) err(where, "<html> has no lang");
  if (!/<meta name="viewport"/.test(p.html)) err(where, "no viewport meta");
  /* View-source is public. Developer commentary belongs in the source, not in what is served (use an Astro comment in a template): scripts/tidy.mjs strips it, so a
     comment here means that step did not run. */
  if (/<!--/.test(p.html)) err(where, "HTML comment in the built page (run scripts/tidy.mjs)");
  for (const m of p.html.matchAll(/<script\b(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/gi)) {
    if (/(^|[^:"'\\])\/\/\s|\/\*/.test(m[1])) err(where, "inline script still contains comments (run scripts/tidy.mjs)");
  }

  /* Articles' titles and excerpts come from Sanity, so those are warnings; for
     every other page they are in this repo and an error. */
  const fromCms = where.startsWith("/blog/") && where !== "/blog/";
  const report = fromCms ? warn : err;
  if (p.description && !p.noindex) {
    if (p.description.length < 70) report(where, `meta description is ${p.description.length} chars (aim for 70-160)`);
    if (p.description.length > 175) report(where, `meta description is ${p.description.length} chars (will be cut off in results)`);
  }
  if (p.title && p.title.length > 70) report(where, `title is ${p.title.length} chars (will be cut off in results)`);

  if (p.noindex) {
    if (p.canonical) err(where, "noindex page names a canonical");
    continue;
  }

  const expected = new URL(where, SITE).href;
  if (p.canonical !== expected) err(where, `canonical is ${p.canonical}, want ${expected}`);
  if (attr(p.html, /<meta property="og:url" content="([^"]*)"/) !== expected) err(where, "og:url does not match the page URL");
  for (const k of ["og:title", "og:description", "og:image", "og:image:alt", "og:type"]) {
    if (!p.html.includes(`property="${k}"`)) err(where, `missing ${k}`);
  }
  if (!p.html.includes('name="twitter:card"')) err(where, "missing twitter:card");

  /* og:image must exist: local ones on disk, remote ones must be https. */
  const og = attr(p.html, /<meta property="og:image" content="([^"]*)"/);
  if (og) {
    const u = new URL(og);
    if (u.origin === SITE.origin) {
      if (!existsSync(join(dist, u.pathname))) err(where, `og:image ${u.pathname} does not exist in the build`);
    } else if (u.protocol !== "https:") err(where, "og:image is not https");
  }

  if (p.title) {
    (titles.get(p.title) ?? titles.set(p.title, []).get(p.title)).push(where);
  }
  if (p.description) {
    (descriptions.get(p.description) ?? descriptions.set(p.description, []).get(p.description)).push(where);
  }

  /* Structured data: every block must parse, and collect the ids it defines. */
  const blocks = [...p.html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  if (blocks.length !== 1) err(where, `${blocks.length} JSON-LD blocks (want 1)`);
  for (const [, body] of blocks) {
    let json;
    try {
      json = JSON.parse(body);
    } catch (e) {
      err(where, `JSON-LD does not parse: ${e.message}`);
      continue;
    }
    const nodes = json["@graph"] ?? [json];
    graphs.push({ where, nodes });
    for (const n of nodes) if (n["@id"]) knownIds.add(n["@id"]);
  }
}

for (const [t, where] of titles) if (where.length > 1) err(where.join(", "), `share the title "${t}"`);
for (const [d, where] of descriptions) if (where.length > 1) err(where.join(", "), "share a meta description");

/* --- structured data ------------------------------------------------------- */
/* An @id reference must resolve to a node defined in the same page's graph, or be
   one of the two deliberate cross-site references: the network and its chains
   live on cdot.world, which defines them. */
const external = (id) => id.startsWith(CDOT_WORLD.origin + "/#");
const refs = (v, out = []) => {
  if (Array.isArray(v)) v.forEach((x) => refs(x, out));
  else if (v && typeof v === "object") {
    const keys = Object.keys(v);
    if (keys.length === 1 && keys[0] === "@id") out.push(v["@id"]);
    else Object.values(v).forEach((x) => refs(x, out));
  }
  return out;
};
for (const { where, nodes } of graphs) {
  const defined = new Set(nodes.map((n) => n["@id"]).filter(Boolean));
  for (const n of nodes) {
    for (const id of refs(n)) {
      if (!defined.has(id) && !external(id)) err(where, `JSON-LD references ${id}, which the page does not define`);
    }
  }
  const org = nodes.find((n) => n["@type"] === "Organization");
  if (!org) err(where, "no Organization in JSON-LD");
  else {
    /* The relationship: Certonymity is the company, on its own domain. */
    if (org.url !== CERTONYMITY.href) err(where, `Organization.url is ${org.url}, want ${CERTONYMITY.href}`);
    const same = [].concat(org.sameAs ?? []);
    if (same.some((s) => s.startsWith(SITE.origin) || s.startsWith(CDOT_WORLD.origin)))
      err(where, "Organization.sameAs lists a product site; sameAs is for the company's own profiles only");
  }
  for (const n of nodes) {
    if (["WebPage", "AboutPage", "ContactPage", "CollectionPage"].includes(n["@type"])) {
      const page = pages.find((p) => p.path === new URL(n.url).pathname);
      if (!page) err(where, `${n["@type"]} url ${n.url} is not a page in the build`);
      else if (n.name !== page.title) err(where, "JSON-LD page name differs from the <title>");
      else if (n.description !== page.description) err(where, "JSON-LD page description differs from the meta description");
    }
  }
}
/* FAQ markup must match the visible questions, or search engines ignore it. */
for (const { where, nodes } of graphs) {
  const faq = nodes.find((n) => n["@type"] === "FAQPage");
  if (!faq) continue;
  const html = pages.find((p) => p.path === where).html;
  for (const q of faq.mainEntity) {
    if (!decode(html).includes(q.name)) err(where, `FAQ question "${q.name}" is in the structured data but not on the page`);
  }
}

/* --- sitemap --------------------------------------------------------------- */
const sitemap = read("sitemap.xml");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const sitemapPaths = new Set(sitemapUrls.map((u) => new URL(u).pathname));
for (const u of sitemapUrls) {
  if (new URL(u).origin !== SITE.origin) err("sitemap.xml", `${u} is not on ${SITE.origin}`);
  if (!pages.some((p) => p.path === new URL(u).pathname)) err("sitemap.xml", `${u} is not a page in the build`);
}
for (const p of indexable) {
  if (!sitemapPaths.has(p.path)) err("sitemap.xml", `${p.path} is indexable but not listed`);
}
for (const p of pages.filter((p) => p.noindex)) {
  if (sitemapPaths.has(p.path)) err("sitemap.xml", `${p.path} is noindex but listed`);
}

/* --- robots.txt ------------------------------------------------------------ */
const robots = read("robots.txt");
const sitemapLine = robots.match(/^Sitemap:\s*(\S+)/m)?.[1];
if (sitemapLine !== new URL("sitemap.xml", SITE).href) err("robots.txt", `Sitemap line is ${sitemapLine}`);
if (!/^User-agent: \*\s*\nAllow: \//m.test(robots)) err("robots.txt", "ordinary crawlers are not allowed");
/* Policy: every crawler is allowed, training crawlers included. The named AI
   crawlers are listed so that someone adding a block for one gets told. */
for (const bot of ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "PerplexityBot",
                   "GPTBot", "ClaudeBot", "CCBot", "Google-Extended", "Applebot-Extended", "Meta-ExternalAgent", "Bytespider"]) {
  if (new RegExp(`User-agent: ${bot}\\s*\\nDisallow: /`).test(robots)) err("robots.txt", `${bot} is blocked; the policy is that every crawler is allowed, training crawlers included`);
}
for (const u of [CDOT_WORLD.href + "llms.txt", CERTONYMITY.href + "llms.txt"]) {
  if (!robots.includes(u)) err("robots.txt", `does not point to ${u}`);
}

/* --- llms.txt -------------------------------------------------------------- */
const llms = read("llms.txt");
if (!llms.startsWith("# ")) err("llms.txt", "does not start with an H1");
for (const u of sitemapUrls) {
  const path = new URL(u).pathname;
  if (NOT_IN_LLMS.has(path)) continue;
  if (!llms.includes(u)) err("llms.txt", `does not mention ${u}`);
}
for (const u of [CDOT_WORLD.href, CERTONYMITY.href, CDOT_WORLD.href + "llms.txt", CERTONYMITY.href + "llms.txt"]) {
  if (!llms.includes(u)) err("llms.txt", `does not link to ${u}`);
}
for (const m of llms.matchAll(/\]\((https:\/\/cdot\.app[^)]*)\)/g)) {
  if (new URL(m[1]).origin !== SITE.origin) err("llms.txt", `${m[1]} is not on ${SITE.origin}`);
}
if (!llms.includes(constant("COMPANY_NUMBER"))) err("llms.txt", "does not state the company number");

/* --- internal links and images --------------------------------------------- */
const exists = (path) => {
  const clean = path.split("#")[0].split("?")[0];
  if (clean === "") return true;
  const f = join(dist, clean);
  if (clean.endsWith("/")) return existsSync(join(f, "index.html"));
  return existsSync(f) && statSync(f).isFile();
};
for (const p of pages) {
  const html = p.html;
  for (const m of html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)) {
    const href = decode(m[1]);
    if (/^(mailto:|tel:|#|javascript:)/.test(href)) continue;
    let path;
    if (href.startsWith("/")) path = href;
    else if (href.startsWith(SITE.origin)) path = new URL(href).pathname + new URL(href).hash;
    else continue;
    if (!exists(path)) err(p.path, `link to ${href} does not resolve`);
    else if (!path.split(/[#?]/)[0].endsWith("/") && !/\.[a-z0-9]+$/i.test(path.split(/[#?]/)[0]))
      err(p.path, `link to ${href} is missing its trailing slash`);
  }
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    /* An empty alt is valid (decorative) and serialises as a bare `alt`. */
    if (!/\salt(=|\s|>|\/)/.test(tag)) err(p.path, `image with no alt attribute: ${tag.slice(0, 80)}`);
    const src = attr(tag, /\ssrc="([^"]*)"/);
    if (src && src.startsWith("/") && !exists(src)) err(p.path, `image ${src} does not exist`);
  }
  /* A page-level anchor must exist on its page. */
  for (const m of html.matchAll(/<a\b[^>]*?\shref="#([^"]+)"/g)) {
    if (!html.includes(`id="${m[1]}"`)) err(p.path, `link to #${m[1]}, which is not on the page`);
  }
}

/* --- live: do the sibling sites still tell the same story? ----------------- */
if (live) {
  const get = async (u) => {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(15000) });
      return r.ok ? await r.text() : null;
    } catch {
      return null;
    }
  };
  for (const [name, site] of [["cdot.world", CDOT_WORLD], ["certonymity.com", CERTONYMITY]]) {
    const l = await get(site.href + "llms.txt");
    if (l === null) warn(name, "llms.txt could not be fetched");
    else if (!l.includes(SITE.origin)) warn(name, `llms.txt does not mention ${SITE.origin}`);
    const r = await get(site.href + "robots.txt");
    if (r === null) warn(name, "robots.txt could not be fetched");
    else if (/User-agent: GPTBot\s*\nDisallow: \//.test(r)) warn(name, "robots.txt still blocks training crawlers; this site's policy is allow-all");
  }
}

/* --- report ---------------------------------------------------------------- */
console.log(`\nSEO check - ${pages.length} pages, ${sitemapUrls.length} in the sitemap`);
for (const w of warnings) console.log(`  warn   ${w}`);
for (const e of errors) console.log(`  FAIL   ${e}`);
if (!errors.length) console.log(`  ok     ${warnings.length ? `${warnings.length} warning(s), no errors` : "no problems"}\n`);
else {
  console.log(`\n${errors.length} problem(s). Fix them in the page or in src/lib, not here.\n`);
  process.exit(1);
}
