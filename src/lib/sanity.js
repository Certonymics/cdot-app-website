/* Resources content, read from the c.Email Sanity project at BUILD time.
 *
 * The dataset is public-read, so there is no token and nothing secret in this
 * file. Authoring still happens in the c.Email Studio (c.email-website/studio);
 * this site only reads. No browser ever talks to Sanity: pages are rendered to
 * static HTML, which is why no CORS origin has to be registered for cdot.app.
 *
 * Production builds go to the live API rather than the CDN, so a deploy
 * triggered right after publishing cannot ship stale content. Dev uses the CDN,
 * which is faster and fine for previewing.
 */
const PROJECT_ID = "3blzrr9d";
const DATASET = "production";
const API_VERSION = "2024-01-01";

const host = import.meta.env.PROD ? "api.sanity.io" : "apicdn.sanity.io";

/* One query for everything: a handful of articles, and the listing, the
   article pages, the "related" list and the sitemap all need the same data. */
const QUERY = `
  *[_type == "article"] | order(coalesce(publishedAt, _createdAt) desc) {
    "slug": slug.current,
    title,
    excerpt,
    "date": publishedAt,
    "published": coalesce(publishedAt, _createdAt),
    "modified": coalesce(_updatedAt, publishedAt, _createdAt),
    readTime,
    featured,
    cta,
    "cover": coverImage{
      alt,
      "url": asset->url,
      "width": asset->metadata.dimensions.width,
      "height": asset->metadata.dimensions.height
    },
    body[]{
      ...,
      _type == "image" => {
        ...,
        "asset": asset->{
          url,
          "width": metadata.dimensions.width,
          "height": metadata.dimensions.height
        }
      }
    }
  }
`;

let cached;

async function load() {
  const url = `https://${PROJECT_ID}.${host}/v${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent(QUERY)}`;
  let articles;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    articles = (await res.json()).result ?? [];
  } catch (err) {
    if (process.env.ALLOW_EMPTY_CMS) return [];
    throw new Error(
      `Could not fetch Resources from Sanity (${err.message}). Refusing to build: ` +
        `the section would ship empty and its URLs would silently drop out of the ` +
        `sitemap. Set ALLOW_EMPTY_CMS=1 to build anyway.`,
    );
  }
  /* A reachable but empty dataset loses the same pages as an outage. */
  if (articles.length === 0 && !process.env.ALLOW_EMPTY_CMS) {
    throw new Error("Sanity returned 0 articles. Refusing to build - see ALLOW_EMPTY_CMS.");
  }
  return articles;
}

/** All articles, newest first. Fetched once per build. */
export function getArticles() {
  if (!import.meta.env.PROD) return load();
  return (cached ??= load());
}

/** The hero card: the article flagged `featured`, otherwise the newest. */
export function pickFeatured(articles) {
  return articles.find((a) => a.featured) ?? articles[0] ?? null;
}

/** Up to three other articles, newest first. */
export function relatedTo(articles, slug) {
  return articles.filter((a) => a.slug !== slug).slice(0, 3);
}

/* Date and read time are both optional in Sanity, so show only what is set. */
export function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function byline(article) {
  return [formatDate(article.date), article.readTime].filter(Boolean).join(" · ");
}
