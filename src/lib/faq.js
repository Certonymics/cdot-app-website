/* The FAQ - the one place its questions and answers are written.
 *
 * The accordion on /faq/, the FAQPage structured data and the FAQ section of
 * /llms.txt are all built from this list, so they cannot disagree. Edit here.
 * The first five are copied from cdot.world's FAQ (src/data/faq.mjs there); the
 * two are separate copies, so a change to one needs making in the other. The rest
 * come from the c.Email site's FAQ, reworded for cDot.
 *
 * Entries with `mini: true` also appear in the short FAQ on the homepage.
 *
 * Answers are small HTML strings (paragraphs, lists, links). External links need
 * no rel/target here: faqHtml() adds them. Internal links are plain hrefs.
 */
import { EMAIL } from "./links.js";

/** @type {{ q: string, a: string, mini?: boolean }[]} */
export const FAQ = [
  {
    q: "What is cDot?",
    mini: true,
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
    mini: true,
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
    mini: true,
    a: `<p>The internet never came with a way to prove who you are, keep your data private, or move money safely. cDot is the internet's missing piece: letting you move across the internet untracked and ensuring your money stays yours, whatever happens.</p>
<p>Most apps track your activity and harvest information about you. With cDot, you share anonymous proofs, not personal data, so you only reveal what you choose to. With no data business to protect, cDot is community-run, open-source, and borderless.</p>`,
  },
  {
    q: "How can I use cDot?",
    mini: true,
    a: `<p>The cDot app is available for iOS and Android. Zero-knowledge identity proofs and encrypted email and chat are live; stablecoin and crypto payments and trading are coming in early 2027.</p>
<p>We will soon be releasing SDKs for developers to build their own apps using the cDot primitives of secure identity, communication and payments.</p>`,
  },
  {
    q: "How can I run a C-Layer node?",
    mini: true,
    a: `<p>The C-Layer is permissionless and community-operated. For maximum decentralisation, we are now looking for as many members of the Massa community as possible to run C-Layer nodes.</p>
<p>For now, enter your email address in the signup form on the <a href="/network/">Network page</a> or email <a href="mailto:${EMAIL}">${EMAIL}</a> to be added to the waitlist. Full instructions coming soon.</p>`,
  },
  {
    q: "How does encryption work on cDot?",
    a: `<p>cDot keeps your emails private using end-to-end encryption (E2EE). This is a method of encryption that ensures only the sender and receiver of a message can read it by only encrypting the message on the sender's device, and decrypting on the receiver's, rather than on servers.</p>
<p>Specifically, cDot uses hybrid public-key encryption (HPKE). This pairs classical and post-quantum cryptography, which means that your emails stay private even if either system is broken at some point in the future. cDot uses ML-KEM, the post-quantum standard published by NIST (the National Institute of Standards and Technology).</p>
<p>cDot is not involved in the sending process. Instead, emails are encrypted on your device before sending, remain encrypted in transit, and are only decrypted on the recipient's device. Nothing is ever stored, encrypted, or decrypted on our servers. (The only exception to this is for businesses using our Business Self-Serve plan, which encrypts emails on a secure server, hosted either by you or us with key management handled by you.) This means no-one else can read your emails: not your email provider, and not us, even if we wanted to.</p>`,
  },
  {
    q: "How does For Your Eyes Only work?",
    a: `<p>For Your Eyes Only is our highest-security setting and requires the intended recipient to pass a continuous biometric presence check to decrypt the email. If they look away from the screen, the email will immediately re-encrypt.</p>`,
  },
  {
    q: "Why do I need to verify my identity?",
    a: `<p>We verify your identity to confirm that you are who you say you are and that people can trust your emails. You'll only have to do this once — afterwards, you can connect new email addresses to cDot at any time.</p>`,
  },
  {
    q: "What data do you store, and where?",
    a: `<p>When you carry out your initial identity check, your identity information and a template of your biometric data are stored on your device only — they never go anywhere else.</p>
<p>Once you have confirmed your identity, we turn your email address into a hash-based message authentication code (HMAC). This is a hash of your email address, combined with a secret key, then hashed again. We link the HMAC to your public verification key and public encryption key via a smart contract executed on our blockchain (the C-Layer).</p>
<p>When you send or receive an email, cDot corresponds with the C-Layer to retrieve the relevant public key to encrypt and/or authenticate it. We don't store, encrypt, or decrypt any of your data on our server.</p>
<p>Your private decryption key, as well as your identity data, remain on your device at all times, and nowhere else.</p>`,
  },
  {
    q: "Can I recover my account if I lose my private key?",
    a: `<p>Yes. Your private key for email decryption is stored on your device to avoid compromising your privacy. However, to prevent you losing your email data if you lose access to your device, cDot automatically encrypts a backup key for you. The retrieval process for this key is only triggered when you sign in using biometrics on a new device.</p>
<p>When you first download cDot, you will be prompted to set a password for your backup. Once you have done this, cDot automatically encrypts and uploads a backup key to your cloud provider, such as Google Drive, iCloud, or OneDrive.</p>
<p>To recover your data, install cDot on a new device and choose the email address you were using previously. Once you have completed authentication with your email provider and identity verification with cDot, you will be asked for your backup password. cDot will then retrieve the encrypted backup from the cloud and restore your keys.</p>
<p>You can configure this process and change your backup password in your cDot settings.</p>`,
  },
  {
    q: "What is the C-Layer?",
    a: `<p>The C-Layer is our blockchain. For cDot, it's where we publish your public encryption key and public verification key. These are public so that you don't need to exchange them with all your chosen recipients before sending them an email (your decryption key, on the other hand, will always be private and stored only on your device). They are published anonymously (containing no email address or name) — and because they are published on-chain, they cannot be tampered with.</p>
<p>We created the C-Layer to act as a decentralised, privacy-preserving identity directory — initially for cDot, with more applications coming soon.</p>`,
  },
  {
    q: "Has cDot been audited for security?",
    a: `<p>cDot has completed a Cloud Application Security Assessment (CASA), the App Defense Alliance framework required by Google for apps that access Gmail data. It verifies that our app meets a recognised baseline of application-security controls — including secure data handling, encryption in transit, and the ability to delete user data on request. Independent penetration tests and cryptographic reviews are planned, with the results to be published.</p>
<p>Users can delete their data at any time by uninstalling the app or emailing <a href="mailto:delete-account@certonymity.com">delete-account@certonymity.com</a>.</p>`,
  },
  {
    q: "How can I give feedback on the app?",
    a: `<p>cDot is a recently developed and launched product, and we're grateful for all and any feedback. If you have any thoughts to share or issues to resolve, please email <a href="mailto:support@certonymity.com">support@certonymity.com</a>.</p>`,
  },
  {
    q: "Is cDot available for businesses?",
    a: `<p>Yes — we have two implementation options available. Business Self-Serve is our out-of-the-box encryption service, with emails encrypted and decrypted on either your existing mail server or a new secure server provided by us. Business Plus offers highly secure client-side encryption, with one decentralised identity document (DID) per business. To find out more, <a href="/contact/">get in touch</a>.</p>`,
  },
];

/* The short list on the homepage: the entries marked `mini`. */
export const MINI_FAQ = FAQ.filter((f) => f.mini);

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
