/* A page's meta description, taken from the page itself.
 *
 * The description, og:description and the structured data's description all say
 * what the page is about, and so does the hero subtitle at the top of it. Kept as
 * two pieces of text they drift apart the moment one is edited (they did). So
 * the layout reads the subtitle out of the rendered page and uses it, unless the
 * page sets a `description` of its own. Edit the subtitle and the meta tags, the
 * share card text and the structured data follow on the next build.
 *
 * A subtitle is only used if it can stand alone in a search result: long enough
 * to say something, and not a "Coming soon." placeholder. Otherwise the page has
 * to give a `description`, and the layout fails the build if it does not, rather
 * than publishing a page with no description.
 */
import { stripHtml } from "./schema.js";

/* Below this a description is too thin to be useful in a result (see also
   scripts/check-seo.mjs). */
export const MIN_DESCRIPTION = 70;

/** The hero subtitle's text from a page's rendered HTML, or undefined. */
export function heroSubtitle(html) {
  const hero = html.match(/<div[^>]*class="page-hero"[^>]*>[\s\S]*?<p[^>]*class="sub"[^>]*>([\s\S]*?)<\/p>/i);
  if (!hero) return undefined;
  const text = stripHtml(hero[1]);
  return text.length >= MIN_DESCRIPTION && !/^coming soon/i.test(text) ? text : undefined;
}
