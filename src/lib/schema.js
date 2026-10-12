/* Structured data (schema.org JSON-LD), as plain objects.
 *
 * Layout.astro puts a small graph on every page - the organisation, the website,
 * and the page itself with its breadcrumb - and each page adds only what is true
 * of it: the product and its chains on /network, the FAQ on the pages that have
 * one, the Article on an article. Before this, every page carried the same
 * 3.9 kB graph, including the 404 and the legal pages, and pages the graph said
 * nothing about were described as if they were the product.
 *
 * Every id is built from `site` (astro.config.mjs), never written out, so a
 * domain change cannot leave a stale copy behind. The ids are the stable identity
 * of the organisation, the site and the product across the whole graph.
 *
 * The chain figures come from src/lib/chains.js, which the network page and
 * /llms.txt read too.
 */
import { IOS_URL, ANDROID_URL, CERTONYMITY_URL, CDOT_WORLD_URL, LINKEDIN_URL, COMPANY_NUMBER } from "./links.js";
import { CHAINS } from "./chains.js";

const frag = (site, name) => `${site.href}#${name}`;
/* The company's own node, as certonymity.com publishes it: ONE Organization @id
   on every site (cdot.world and certonymity.com use the same one), so the graphs
   describe a single organisation instead of three look-alikes. `site` is kept in
   the signature so callers do not change. */
export const orgId = (_site) => `${CERTONYMITY_URL}#organization`;
export const websiteId = (site) => frag(site, "website");
export const cdotId = (site) => frag(site, "cdot");
/* The cDot network as cdot.world describes it. Defined there, so only referenced
   here: the app is built on it, and each chain here is the same chain as its
   namesake there. */
export const NETWORK_ID = `${CDOT_WORLD_URL}#cdot`;
export const networkChainId = (id) => `${CDOT_WORLD_URL}#${id}`;

export function organization(site) {
  return {
    "@type": "Organization",
    "@id": orgId(site),
    name: "Certonymity Ltd",
    legalName: "Certonymity Ltd",
    alternateName: "Certonymity",
    /* The company's own site, not this one: this site is a product of the
       company, not the company. The @id is the company's own, shared with
       certonymity.com and cdot.world (see orgId). sameAs holds only profiles that ARE Certonymity - not
       cdot.world or cdot.app, which are things it makes (see the product
       nodes below), and a wrong sameAs can merge entities that are not one. */
    url: CERTONYMITY_URL,
    sameAs: [LINKEDIN_URL],
    identifier: { "@type": "PropertyValue", propertyID: "Companies House company number", value: COMPANY_NUMBER },
    logo: new URL("assets/logo-512.png", site).href,
    email: "info@certonymity.com",
    contactPoint: [
      { "@type": "ContactPoint", contactType: "customer support", email: "support@certonymity.com" },
      { "@type": "ContactPoint", contactType: "press", email: "press@certonymity.com" },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "86-87 Campden Street",
      addressLocality: "London",
      postalCode: "W8 7EN",
      addressCountry: "GB",
    },
    description:
      "Certonymity Ltd builds cDot, the app for secure identity, communication and payments, and the purpose-built blockchain network behind it.",
  };
}

export function website(site) {
  return {
    "@type": "WebSite",
    "@id": websiteId(site),
    url: site.href,
    name: "cDot",
    inLanguage: "en-GB",
    publisher: { "@id": orgId(site) },
  };
}

/* `type` is WebPage unless the page is more specific: AboutPage, ContactPage,
   CollectionPage. */
export function webPage(site, { url, name, description, type = "WebPage", hasBreadcrumb }) {
  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "en-GB",
    isPartOf: { "@id": websiteId(site) },
    ...(hasBreadcrumb && { breadcrumb: { "@id": `${url}#breadcrumb` } }),
  };
}

/* items: [{ name, url }], first to last. */
export function breadcrumbList(url, items) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/* The product. `withChains` adds hasPart for the three chains, so only pass it
   on a page that also includes chainLayers() - a reference to a node the page
   does not define would dangle. */
export function cdotApplication(site, { withChains = false } = {}) {
  return {
    "@type": "SoftwareApplication",
    "@id": cdotId(site),
    name: "cDot",
    applicationCategory: "FinanceApplication",
    operatingSystem: "iOS, Android",
    installUrl: [IOS_URL, ANDROID_URL],
    provider: { "@id": orgId(site) },
    /* The app is the product; the network it runs on is defined on cdot.world. */
    isBasedOn: { "@id": NETWORK_ID },
    url: site.href,
    description:
      "cDot is the app for secure identity, communication and payments: stay private online and share only what you want, when you want. Underneath, it is a blockchain network, a family of purpose-built chains each engineered for what it does best (identity, stablecoin settlement, and trading) operating as one trusted network.",
    ...(withChains && {
      hasPart: CHAINS.map((c) => ({ "@id": frag(site, c.id) })),
    }),
  };
}

/* The three chains, each a discrete SoftwareApplication so its specifications
   are extractable facts instead of prose in one description string. The facts
   themselves live in src/lib/chains.js.

   PropertyValue is schema.org's escape hatch for domain-specific measurements
   that have no dedicated property. Numeric `value` + `unitText` keeps the
   figure machine-comparable; `unitText` alone would force string parsing. */
export function chainLayers(site) {
  return CHAINS.map((c) => ({
    "@type": "SoftwareApplication",
    "@id": frag(site, c.id),
    name: c.label,
    alternateName: c.alternateName,
    applicationCategory: c.category,
    operatingSystem: "Any",
    isPartOf: { "@id": cdotId(site) },
    sameAs: networkChainId(c.id),
    provider: { "@id": orgId(site) },
    description: c.description,
    additionalProperty: c.specs.map((sp) => ({
      "@type": "PropertyValue",
      name: sp.name,
      value: sp.value,
      ...(sp.unit && { unitText: sp.unit }),
    })),
  }));
}

const ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  mdash: "—", ndash: "–", hellip: "…",
};

/* HTML to the plain text a visitor reads, for an answer's `text`. */
export function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|div|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
      if (e[0] === "#") {
        const n = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isNaN(n) ? m : String.fromCodePoint(n);
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/* items: [{ q, html }] - the same array the page renders, so the markup and the
   visible questions cannot disagree (search engines require that they match). */
export function faqPage(url, items) {
  return {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: stripHtml(f.html) },
    })),
  };
}
