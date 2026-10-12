#!/usr/bin/env node
/**
 * Content-Security-Policy, written into every built page. Runs after
 * `astro build` (see the "build" script in package.json).
 *
 * Why this is not Astro's own `security.csp`: that option hashes only the scripts
 * Astro itself processes. Every script on this site is `is:inline` (see the note
 * in Layout.astro), so Astro's policy would not cover a single one and browsers
 * would block them all - the theme script, the menus, the carousel, the forms.
 * Here each page's policy is built from what that page actually contains:
 *   - script-src: 'self' plus a SHA-256 hash of each inline <script>
 *   - style-src:  'self' plus a hash of each inline <style>
 * so a script injected into a page, which would not match any hash, does not run.
 * JSON-LD blocks are data, not scripts, and are not subject to script-src.
 *
 * The policy is a <meta> tag, so it travels with the file. A <meta> cannot carry
 * frame-ancestors; that one is in public/_headers.
 *
 * Because it hashes exact text, anything that rewrites a page's inline scripts
 * after this step (Cloudflare's Rocket Loader, or the old Auto Minify) makes the
 * hashes stop matching and the scripts stop running. Both should stay off.
 *
 * Fails the build if a page has something the policy would block that is not
 * covered: an inline style attribute, an inline event handler, or an asset loaded
 * from another origin.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import config from "../astro.config.mjs";

/* The site's own origin, from the same `site` everything else uses, so an
   absolute URL to this site is not mistaken for another origin. */
const SELF = new URL(config.site).origin;

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");

/* Everything except script-src and style-src, which are built per page.
   connect-src is the only list that ever needs editing: it names the hosts the
   browser talks to. script.google.com answers a form post with a redirect to
   script.googleusercontent.com, and a redirect is checked against the policy
   too, so both are needed. map.c-layer.certonym.org is the node registry. */
const STATIC_DIRECTIVES = [
  "default-src 'self'",
  "img-src 'self'",
  "font-src 'self'",
  "connect-src 'self' https://script.google.com https://script.googleusercontent.com https://map.c-layer.certonym.org",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
];

const hash = (text) => "'sha256-" + createHash("sha256").update(text, "utf8").digest("base64") + "'";

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : [];
  });
}

const META = /<meta http-equiv="content-security-policy"[^>]*>/i;
const problems = [];
let pages = 0;
let scripts = 0;
let styles = 0;

for (const file of walk(dist)) {
  const name = "/" + relative(dist, file);
  let html = readFileSync(file, "utf8");
  html = html.replace(META, ""); // idempotent: a rerun replaces, never stacks

  const scriptHashes = new Set();
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    if (/\bsrc\s*=/i.test(attrs)) continue; // external: covered by 'self'
    if (/type\s*=\s*["']?application\/(ld\+)?json/i.test(attrs)) continue; // data
    scriptHashes.add(hash(m[2]));
    scripts++;
  }
  const styleHashes = new Set();
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    styleHashes.add(hash(m[1]));
    styles++;
  }

  const body = html.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "");
  if (/<[a-z][^>]*\sstyle\s*=/i.test(body)) problems.push(`${name}: inline style="" attribute (the policy would block it)`);
  if (/<[a-z][^>]*\son[a-z]+\s*=/i.test(body)) problems.push(`${name}: inline event handler (the policy would block it)`);
  // Only tags that fetch something. <link rel="canonical"> and <a href> merely
  // name a URL, so they are not resource loads.
  for (const m of body.matchAll(/<(script|img|iframe|source|video|audio|link)\b([^>]*)>/gi)) {
    const [, tag, attrs] = m;
    if (tag.toLowerCase() === "link" && !/rel=["'][^"']*\b(stylesheet|preload|modulepreload|prefetch|icon)\b/i.test(attrs)) continue;
    const url = attrs.match(/\s(?:src|href)=["'](https?:\/\/[^"']+)["']/i)?.[1];
    if (url && !url.startsWith(SELF)) problems.push(`${name}: loads ${url} from another origin`);
  }

  const policy = [
    ...STATIC_DIRECTIVES,
    `script-src 'self' ${[...scriptHashes].join(" ")}`.trim(),
    `style-src 'self' ${[...styleHashes].join(" ")}`.trim(),
  ].join("; ");

  const tag = `<meta http-equiv="Content-Security-Policy" content="${policy}" />`;
  // Right after the charset meta, so it precedes every script and stylesheet but
  // does not push the charset past the first 1024 bytes.
  if (!/<meta charset=[^>]*>/i.test(html)) {
    problems.push(`${name}: no <meta charset> to anchor the policy after`);
    continue;
  }
  html = html.replace(/(<meta charset=[^>]*>)/i, `$1${tag}`);
  writeFileSync(file, html);
  pages++;
}

console.log(`CSP: policy written to ${pages} pages (${scripts} inline scripts and ${styles} inline styles hashed).`);
if (problems.length) {
  console.error("\nCSP problems:\n  " + [...new Set(problems)].join("\n  "));
  process.exit(1);
}
