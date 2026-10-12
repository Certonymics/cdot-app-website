/* The three cDot chains: the one place their facts are written down.
 *
 * Read by the network page (the cards and their spec chips), by the structured
 * data (src/lib/schema.js) and by /llms.txt, so a figure changes here and
 * everywhere follows. Before this the same numbers were typed out in three
 * places that drifted apart silently.
 *
 * `specs` is the machine-readable form (a name, a value, and a unit where the
 * value is a number). `chips` is the same facts as the short labels shown on the
 * page, in display order. They sit side by side so a change to one is hard to
 * make without seeing the other.
 */

/**
 * @typedef {Object} Spec
 * @property {string} name
 * @property {string | number} value
 * @property {string} [unit]
 */
/**
 * @typedef {Object} Chain
 * @property {string} id anchor suffix in the structured data, e.g. "c-layer"
 * @property {string} label "C-Layer"
 * @property {string} headline the card title, e.g. "Identity and asset recovery chain"
 * @property {string} alternateName
 * @property {string} category schema.org applicationCategory
 * @property {string} description
 * @property {Spec[]} specs
 * @property {string[]} chips
 * @property {string} [note] extra sentence for llms.txt only
 */

/** @type {Chain[]} */
export const CHAINS = [
  {
    id: "c-layer",
    label: "C-Layer",
    headline: "Identity and asset recovery chain",
    alternateName: "cDot identity and asset recovery chain",
    category: "SecurityApplication",
    description:
      "A decentralised identity chain for people, businesses, and agents. Cryptographic pseudonyms of verified real identities provide privacy with accountability. Run by nodes around the world for maximum resilience and decentralisation.",
    specs: [
      { name: "Throughput", value: 15000, unit: "tx/s" },
      { name: "Finality", value: 20, unit: "s" },
      { name: "Smart contracts", value: "WASM" },
      { name: "Architecture", value: "Highly parallel" },
      { name: "Access", value: "Permissionless" },
      { name: "Visibility", value: "Public and pseudonymous" },
    ],
    chips: [
      "15,000 tx/s, highly parallel",
      "WASM smart contracts",
      "20s finality",
      "Permissionless",
      "Public and pseudonymous",
    ],
    note: "Anyone can run a node and earn CDOT tokens.",
  },
  {
    id: "p-layer",
    label: "P-Layer",
    headline: "Settlement chain",
    alternateName: "cDot settlement chain",
    category: "FinanceApplication",
    description:
      "Engineered for high-throughput, low-cost global stablecoin settlement and truly programmable money, with native on- and off-ramping. Agentic transactions supported with verifiable, revocable permissions.",
    specs: [
      { name: "Throughput", value: 30000, unit: "tx/s" },
      { name: "Finality", value: "<1", unit: "s" },
      { name: "Byzantine security", value: "45%" },
    ],
    chips: ["30,000 tx/s", "Finality <1s", "Byzantine security 45%"],
  },
  {
    id: "t-layer",
    label: "T-Layer",
    headline: "Trading chain",
    alternateName: "cDot trading chain",
    category: "FinanceApplication",
    description:
      "A high-performance decentralised exchange, offering stablecoin swaps and perpetual futures in a predictable execution environment.",
    specs: [
      { name: "Throughput", value: 30000, unit: "tx/s" },
      { name: "Finality", value: "<1", unit: "s" },
      { name: "Architecture", value: "Native multithreading" },
      { name: "Nodes", value: "Node-permissioned overlay on C-layer" },
      { name: "Visibility", value: "Private and accountable" },
      { name: "Matching engine", value: "Native NASDAQ-like" },
    ],
    chips: [
      "30,000 tx/s, native multithreading",
      "Finality <1s",
      "Node-permissioned overlay on C-layer",
      "Private and accountable",
      "Native NASDAQ-like matching engine",
    ],
  },
];
