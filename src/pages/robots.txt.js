/* robots.txt, generated so the domain comes from `site` in astro.config.mjs
 * instead of being typed into a static file: a domain change used to leave the
 * Sitemap line pointing at the old site. The policy below is unchanged and is
 * explained in its own comments - edit it here, not in public/. */
import { CERTONYMITY_URL, CDOT_WORLD_URL } from "../lib/links.js";

export function GET({ site }) {
  const text = `# ${site.host}
#
# POLICY: every crawler is welcome, including the ones that gather training data.
# This is a public product site whose purpose is to be found and read; nothing
# here is private. (An earlier version let assistants read and cite the page but
# opted out of model training. That opt-out was removed deliberately - do not
# re-add it by accident; scripts/check-seo.mjs fails if a named AI crawler is
# blocked.)
#
# The same policy is stated on cdot.world, certonymity.com and c.email. A
# robots.txt only governs the host that serves it, so each publishes its own.

User-agent: *
Allow: /

# Structured summary for language models: /llms.txt
#
# Related sites. cdot.app is the cDot app, built on the cDot network (cdot.world)
# by Certonymity Ltd (certonymity.com). Each publishes its own robots.txt and
# llms.txt:
#   ${CDOT_WORLD_URL}robots.txt  ${CDOT_WORLD_URL}llms.txt
#   ${CERTONYMITY_URL}robots.txt  ${CERTONYMITY_URL}llms.txt

Sitemap: ${new URL("sitemap.xml", site).href}
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
