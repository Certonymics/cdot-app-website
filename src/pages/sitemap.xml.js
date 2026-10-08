/**
 * sitemap.xml
 *
 * Generated from the pages that actually exist rather than maintained by hand,
 * so a new route cannot be left out of it. An endpoint instead of
 * @astrojs/sitemap: the integration would be a dependency and a config entry to
 * do what twenty lines do, and this repo already prefers a small script it can
 * read over a package it cannot.
 *
 * 404 is excluded - it is not a destination, and listing it invites indexing of
 * a page that should never appear in results.
 *
 * Dynamic routes ([slug].astro) are skipped by the glob - "/resources/[slug]/"
 * is not a URL - and their pages are listed from the data that generates them,
 * with a lastmod, which is the one thing the static pages cannot offer.
 */
import { getArticles } from "../lib/sanity.js";

export async function GET({ site }) {
  const files = Object.keys(import.meta.glob("./**/*.astro")).filter((f) => !f.includes("["));

  const routes = files
    .map((f) =>
      f
        .replace(/^\.\//, "")
        .replace(/\.astro$/, "")
        /* index maps to its directory, not to a literal "/index". */
        .replace(/(^|\/)index$/, ""),
    )
    .filter((r) => r !== "404")
    .map((r) => (r === "" ? "/" : `/${r}/`))
    .sort();

  const articles = await getArticles();

  const urls = [
    ...routes.map((r) => `  <url><loc>${new URL(r, site).href}</loc></url>`),
    ...articles.map(
      (a) =>
        `  <url><loc>${new URL(`/resources/${a.slug}/`, site).href}</loc>` +
        `<lastmod>${a.modified.slice(0, 10)}</lastmod></url>`,
    ),
  ].join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
