#!/usr/bin/env node
/**
 * Strips what a visitor does not need from the built output. Runs after
 * `astro build` and before csp.mjs (see the "build" script in package.json),
 * because csp.mjs hashes each inline script's exact text: change a script after
 * that and the hash stops matching and the script stops running.
 *
 * The source is written for the people who maintain it, so it is full of
 * explanation. None of that is for the visitor, and "view source" is where they
 * would meet it:
 *   - HTML comments are removed from every page. Templates should use {/* *\/}
 *     instead, which never reaches the output at all; this is the safety net.
 *   - Each inline <script> is minified with esbuild, which also drops its
 *     comments. Done with a parser, not a regex, so a "//" inside a string or
 *     a URL cannot be mistaken for a comment.
 *   - Comments are removed from inline <style> blocks.
 *   - public/assets/map.js is minified in dist/ (the copy in public/ stays
 *     readable, and is what you edit).
 *
 * JSON-LD blocks are data and are left exactly as they are.
 */
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";

const dist = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : [];
  });

const minify = (code, where) => {
  try {
    return transformSync(code, { minify: true, target: "es2019", legalComments: "none" }).code.trim();
  } catch (e) {
    console.error(`tidy: could not minify a script in ${where}:\n${e.message}`);
    process.exit(1);
  }
};

let pages = 0;
let before = 0;
let after = 0;

for (const file of walk(dist)) {
  const original = readFileSync(file, "utf8");
  const name = file.slice(dist.length);

  /* One pass over the page. A script or style block is handled as a unit, so a
     comment-looking string inside one is never touched by the HTML rule. */
  const html = original.replace(
    /(<script\b([^>]*)>)([\s\S]*?)(<\/script>)|(<style\b[^>]*>)([\s\S]*?)(<\/style>)|<!--[\s\S]*?-->/gi,
    (m, sOpen, sAttrs, sBody, sClose, yOpen, yBody, yClose) => {
      if (sOpen !== undefined) {
        const isCode = !/\bsrc\s*=/i.test(sAttrs) && !/type\s*=\s*["']?application\/(ld\+)?json/i.test(sAttrs);
        return isCode ? sOpen + minify(sBody, name) + sClose : m;
      }
      if (yOpen !== undefined) return yOpen + yBody.replace(/\/\*[\s\S]*?\*\//g, "") + yClose;
      return ""; // an HTML comment
    },
  );

  if (html !== original) writeFileSync(file, html);
  before += original.length;
  after += html.length;
  pages++;
}

const map = join(dist, "assets", "map.js");
let mapNote = "";
if (existsSync(map)) {
  const src = readFileSync(map, "utf8");
  const min = minify(src, "assets/map.js");
  writeFileSync(map, min + "\n");
  mapNote = `, map.js ${(src.length / 1024).toFixed(1)} -> ${(min.length / 1024).toFixed(1)} kB`;
}

console.log(`tidy: ${pages} pages, ${((before - after) / 1024).toFixed(1)} kB of comments and whitespace removed${mapNote}.`);
