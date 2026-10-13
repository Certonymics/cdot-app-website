/* /llms.txt - a plain-text summary of the site for language models.
 *
 * Generated rather than hand-kept, so the parts that used to go stale cannot:
 *   - every URL is built from `site` (astro.config.mjs), not typed with the domain
 *   - the three chains and their figures come from src/lib/chains.js, the same
 *     data the network page and the structured data read
 *   - the Blog articles are listed from Sanity, so a new article appears
 *     here on the next build with no one remembering to add it
 * What remains hand-written is the prose that describes the site itself (what
 * cDot is, how it works, one line per page). Change it here, and when a page's
 * purpose changes.
 */
import { CHAINS } from "../lib/chains.js";
import { getArticles } from "../lib/sanity.js";
import { FAQ, faqTextBlocks } from "../lib/faq.js";
import { CERTONYMITY_URL, CDOT_WORLD_URL, COMPANY_NUMBER } from "../lib/links.js";

/** One line of prose, however it was wrapped. */
const oneLine = (s = "") => s.replace(/\s+/g, " ").trim();

export async function GET({ site }) {
  const u = (path) => new URL(path, site).href;
  const articles = await getArticles();

  const chains = CHAINS.map(
    (c, i) =>
      `${i + 1}. ${c.label} - ${c.headline.toLowerCase()}: ${c.description} ` +
      `Specifications: ${c.chips.join("; ")}.` +
      (c.note ? ` ${c.note}` : ""),
  ).join("\n");

  const resources = articles
    .map((a) => `  - [${a.title}](${u(`/blog/${a.slug}/`)})` + (a.excerpt ? `: ${oneLine(a.excerpt)}` : ""))
    .join("\n");

  const faq = FAQ.map((f) =>
    [`### ${f.q}`, ...faqTextBlocks(f.a, site).map((b) => (typeof b === "string" ? b : b.list.map((l) => `- ${l}`).join("\n")))].join("\n\n"),
  ).join("\n\n");

  const text = `# cDot

> cDot is the app for secure identity, email, messaging, and payments. When apps and websites
> track everything you do, cDot keeps you private online: share only what you want, when you
> want. Built by Certonymity Ltd (London, UK).

cDot has two faces, and both are on this site. For people, it is an app: one verified identity
that works across email, messaging, payments and age checks, without handing your personal data
to every service you use. Underneath, it is a blockchain network - a family of purpose-built
chains, each engineered for what it does best: identity, stablecoin settlement, and trading,
operating as one trusted network.

## How cDot, cdot.world and Certonymity relate

- Certonymity Ltd (${CERTONYMITY_URL}) is the company: registered in England and Wales, company
  number ${COMPANY_NUMBER}, based in London. It builds cDot.
- cDot the network (${CDOT_WORLD_URL}) is the project: the C-Layer, P-Layer and T-Layer chains,
  the mission, and the open-source work. cdot.world covers the network itself.
- cDot the app (this site, ${site.href}) is the product built on that network: what it does, how
  to get it, and how it works for the people using it.
- Each publishes its own llms.txt (see Related sites). For the network's specifications, the
  C-Layer's status and the project's mission, prefer cdot.world; for company details, prefer
  certonymity.com; for the app, this site.

## How it works

Download the app, connect your existing email address, then scan an ID and take a selfie once.
That one-time check encrypts your identity information into anonymous attribute proofs held on
your device. From then on your encrypted identity is tied to your email, powering private
messaging, payments, and verification - services receive a proof of what they need to know,
not your data.

## The network

Three chains, interoperable by design. Specifications are on ${u("/network/")}.

${chains}

## Why it exists

Stablecoins enable instant, borderless, programmable transactions, but today's blockchains
aren't designed for them. Existing systems are either fully general or optimised for trading,
and none were built to integrate identity with payments. Payments at scale don't just need speed
and low cost - they need verifiable identity on both sides of a transaction. As AI agents
increasingly transact on behalf of people and businesses, stablecoin payments also need native
agent identity to remain accountable, auditable, and trusted. No single general-purpose chain
can serve all these purposes. Combining decentralised identity, stablecoin payments, and agent
permissions, cDot exists to close the gap.

## Pages

- [cDot](${u("/")}): the app, its five products, how it works, and where to get it.
- [Network](${u("/network/")}): the three chains and their specifications, plus the
  live C-Layer node map and node-operator signup.
- [c.ID](${u("/product/c-id/")}): prove your age, not your identity. A reusable,
  privacy-preserving proof of age linked to your email address, using zero-knowledge proofs so
  a service learns only that you meet its age requirement. Includes an FAQ.
- [c.Pay](${u("/product/c-pay/")}): instant, borderless, private payments -
  stablecoin settlement, why the existing chains do not serve it, and the use cases.
- [Email](${u("/product/c-email/")}): send authenticated, end-to-end encrypted
  messages from your existing email address. Why use it, how it works, and an FAQ. Available on
  iOS, Android, and as a Chrome extension.
- [c.Chat](${u("/product/c-chat/")}): decentralised private messaging.
- [c.Vault](${u("/product/c-vault/")}): store and recover any asset.
- [For developers](${u("/product/developers/")}): cut onboarding times and KYC costs
  with reusable, cross-platform identity verification. Integrate in five minutes and receive
  proofs instead of storing user data. Includes an FAQ.
- [How it works](${u("/how-it-works/")}): the steps behind cDot - linking an existing
  email address, one-time identity verification, key management on the C-layer, the three email
  security levels, hybrid post-quantum encryption, and c.ID.
- [Privacy & security](${u("/security/")}): the privacy and security architecture -
  end-to-end encryption (HPKE with X-Wing: X25519 + ML-KEM-768), on-device biometrics, invisible
  2FA, key management, zero-knowledge proofs, the CASA independent assessment, and data storage.
- [Blog](${u("/blog/")}): articles from the team on privacy, email security
  and why cDot exists.
${resources}
- [FAQ](${u("/faq/")}): what cDot is, how it works, why it was created, how to use it and how to run a C-Layer node.
- [Whitepaper](${u("/whitepaper/")}): the technical and economic design of the network. Not yet published.
- [Docs](${u("/docs/")}): guides and references for using and building on the network. Not yet published.
- [Code](${u("/code/")}): open-source repositories, SDKs and examples for building on the network. Not yet published.
- [Community](${u("/community/")}): where users, node operators and developers get together. Not yet published.
- [About](${u("/about/")})
- [Contact](${u("/contact/")}): how to reach the team, by enquiry type.

Note: c.Chat, c.Vault, Whitepaper, Docs, Code, Community and About are published but not yet written out in full.
Prefer the pages above them for anything substantive.

## FAQ

${faq}

## Related sites (each publishes its own llms.txt)

- [Certonymity: information for LLMs](${u(CERTONYMITY_URL + "llms.txt")}): the company behind cDot.
- [cDot network: information for LLMs](${u(CDOT_WORLD_URL + "llms.txt")}): the network, the
  chains, the mission and the open-source work.

## Data

- [C-Layer node registry](https://map.c-layer.certonym.org/api/data): live JSON of the
  community-run nodes plotted on the network map.

## Contact

- [info@certonymity.com](mailto:info@certonymity.com): general enquiries.
- Certonymity Ltd, 86-87 Campden Street, London W8 7EN, United Kingdom. Registered in England and
  Wales, company number ${COMPANY_NUMBER}.

## Disclaimer

cDot is technical infrastructure. Any regulated activities, including banking and payments, are
performed by licensed partners.
`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
