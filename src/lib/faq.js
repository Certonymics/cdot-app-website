/* The FAQ - the one place its questions and answers are written.
 *
 * The accordion on /faq/, the FAQPage structured data and the FAQ section of
 * /llms.txt are all built from this list, so they cannot disagree. Edit here.
 * Copied from cdot.world's FAQ (src/data/faq.mjs there); the two are separate
 * copies, so a change to one needs making in the other.
 *
 * Answers are small HTML strings (paragraphs, lists, links). External links need
 * no rel/target here: faqHtml() adds them. Internal links are plain hrefs.
 */
import { EMAIL } from "./links.js";

/** @type {{ q: string, a: string }[]} */
export const FAQ = [
  {
    q: "What is cDot?",
    a: `<p>cDot is the operating system for a secure, private internet. It is both an app you can download, and a protocol you will soon be able to build on.</p>
<p>The cDot app lets you:</p>
<ul>
<li>Send and receive encrypted, verified emails and instant messages.</li>
<li>Make private, borderless, instant payments in crypto and stablecoin.</li>
<li>Pass age verification and prove selected facts about yourself without exposing your personal data.</li>
<li>Store any data in a secure vault, recoverable with your unique biometric data.</li>
</ul>
<p>The cDot protocol is designed to let anyone build their own apps using our building blocks of secure identity, communication and payments. Our vision is for a community-driven ecosystem of apps available on cDot, letting users do anything they need to on the internet — but this time, with security and privacy guaranteed.</p>`,
  },
  {
    q: "How does cDot work?",
    a: `<p>cDot runs on a family of three purpose-built, interconnected blockchains:</p>
<ul>
<li>The C-Layer, which acts as a permissionless, decentralised identity directory. This is a fork of <a href="https://massa.network/">the Massa blockchain</a>.</li>
<li>The P-Layer, designed for instant stablecoin payments and programmable money.</li>
<li>The T-Layer, built for stablecoin swaps and perpetual futures (perps).</li>
</ul>
<p>At the heart of our protocol are what we call DIDs (decentralised identity documents). These are stored on the C-Layer and allow platforms to receive zero-knowledge proofs of your anonymised identity attributes.</p>`,
  },
  {
    q: "Why was cDot created?",
    a: `<p>The internet never came with a way to prove who you are, keep your data private, or move money safely. cDot is the internet's missing piece: letting you move across the internet untracked and ensuring your money stays yours, whatever happens.</p>
<p>Most apps track your activity and harvest information about you. With cDot, you share anonymous proofs, not personal data, so you only reveal what you choose to. With no data business to protect, cDot is community-run, open-source, and borderless.</p>`,
  },
  {
    q: "How can I use cDot?",
    a: `<p>The cDot app is available for iOS and Android. Zero-knowledge identity proofs and encrypted email and chat are live; stablecoin and crypto payments and trading are coming in early 2027.</p>
<p>We will soon be releasing SDKs for developers to build their own apps using the cDot primitives of secure identity, communication and payments.</p>`,
  },
  {
    q: "How can I run a C-Layer node?",
    a: `<p>The C-Layer is permissionless and community-operated. For maximum decentralisation, we are now looking for as many members of the Massa community as possible to run C-Layer nodes.</p>
<p>For now, enter your email address in the signup form on the <a href="/network/">Network page</a> or email <a href="mailto:${EMAIL}">${EMAIL}</a> to be added to the waitlist. Full instructions coming soon.</p>`,
  },
];

/* For the page: external links open safely in a new tab. */
export const faqHtml = (a) =>
  a.replace(/<a href="(https?:[^"]+)">/g, '<a href="$1" target="_blank" rel="noopener noreferrer">');

/* For llms.txt: plain text. A link reads "text (url)"; a list item is a "- "
   line. Returns blocks, each a paragraph string or { list: [...] }. */
export function faqTextBlocks(a, site) {
  const clean = (s) =>
    s
      .replace(/<a href="([^"]+)">([^<]+)<\/a>/g, (_, href, text) =>
        href.startsWith("mailto:") ? text : `${text} (${new URL(href, site).href})`,
      )
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const blocks = [];
  for (const m of a.matchAll(/<p>([\s\S]*?)<\/p>|<ul>([\s\S]*?)<\/ul>/g)) {
    if (m[1] !== undefined) blocks.push(clean(m[1]));
    else blocks.push({ list: [...m[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => clean(x[1])) });
  }
  return blocks;
}
