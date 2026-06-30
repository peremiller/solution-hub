# SolveVerse

**One hub, ~21,000 illustrative solutions.** A multi-domain super app that combines many independent 1,000-solution trackers behind a single shared engine and a domain-switcher dropdown. Pick a domain, and the app generates (or loads) that domain's 1,000 unique solutions on the fly — each one decomposed into subtasks, scored, costed, and sequenced on a timeline.

> ⚠️ **Illustrative model — not advice.** Every category, score, cost, timeline, status, geographic prevalence value, and organization list in this app is a **seeded or hand-authored placeholder** for planning and triage only. Nothing here is researched, sourced, financial, or medical advice. The "who's working on this" organization chips link to a **web search**, not to vetted or endorsed homepages. Use it to brainstorm and prioritize — verify everything before acting.

---

## Domains (21)

The dropdown is grouped: **Featured apps** first, then one domain per **UN Sustainable Development Goal** (SDG 1–17). Each domain generates exactly **1,000 unique solutions** client-side, but only the **active** domain's 1,000 are held in memory at any time (lazy-generated on first visit, then cached).

### Featured apps (4)
- 🧬 **Disease Cures** — solutions to the world's hardest diseases (the only domain with a Map view; ships geographic prevalence data)
- ⚡ **Electricity Prices** — solutions to high electricity prices
- 💧 **Clean Water** — solutions for safe, affordable drinking water
- ⛓️ **Blockchain Problems** — solutions to the blockchain industry's open problems

### UN SDG domains (17)
1. SDG 1 · No Poverty
2. SDG 2 · Zero Hunger
3. SDG 3 · Good Health and Well-being
4. SDG 4 · Quality Education
5. SDG 5 · Gender Equality
6. SDG 6 · Clean Water and Sanitation
7. SDG 7 · Affordable and Clean Energy
8. SDG 8 · Decent Work and Economic Growth
9. SDG 9 · Industry, Innovation and Infrastructure
10. SDG 10 · Reduced Inequalities
11. SDG 11 · Sustainable Cities and Communities
12. SDG 12 · Responsible Consumption and Production
13. SDG 13 · Climate Action
14. SDG 14 · Life Below Water
15. SDG 15 · Life on Land
16. SDG 16 · Peace, Justice and Strong Institutions
17. SDG 17 · Partnerships for the Goals

---

## Features

**Per solution**
- **Subtasks** with cycling statuses (To-do → In progress → Blocked → Done)
- **Comprehensive expandable steps** under each subtask
- **Cost per subtask** in **USD + Philippine pesos (₱)**
- **Impact**, **technical Feasibility**, **Business feasibility**, and **Profit-potential** scores
- **Timeline** — a Gantt-style view of sequenced subtasks measured in approximate months
- **"Who's working on this"** — organization chips that open a web search for that org

**Browsing & analysis**
- **Master-detail layout** — a right-side detail panel with an **✕ close** button that collapses the panel so the table extends full width
- **Views**: Card / Table / **Map** (Map is available only for the Disease domain, which ships prevalence data)
- **Cost-range slider** to filter by total solution cost
- **Collapsible category pills** with a See more / See less toggle
- **Search**, **status filter**, and **sort** (including business feasibility, profit potential, and timeline)
- **Light / dark theme**
- **JSON / CSV export**
- **Infinite scroll**
- **Per-domain `localStorage` persistence** — your statuses and edits are saved separately for each domain

---

## How it's built

SolveVerse is a single self-contained `index.html` with **no runtime dependencies** — but you don't edit that file directly. It is assembled from an engine plus pluggable domain packs.

```
solution-hub/
├── _base.html        # the shared engine (UI, PRNG, views, persistence) with a <!-- PACKS --> marker
├── packs/            # one authorable file per domain
│   ├── disease.js
│   ├── electricity.js
│   ├── water.js
│   ├── blockchain.js
│   └── sdg1.js … sdg17.js
├── build.js          # concatenates packs into _base.html → index.html
├── build.sh          # convenience wrapper: runs `node build.js`
├── vercel.json       # cleanUrls / trailingSlash deploy config
└── index.html        # GENERATED — do not edit by hand
```

**The engine (`_base.html`)** holds all UI, the seeded PRNG (`mulberry32`), the view logic (card/table/map), scoring, timeline, export, and per-domain persistence. It exposes a `window.HUB_DOMAINS` array and a `<!-- PACKS -->` placeholder where packs are injected at build time.

**The packs (`packs/*.js`)** are the data. Each pack is a small, self-contained script that registers one domain by pushing a descriptor onto the shared array:

```js
HUB_DOMAINS.push({
  key: "disease",                 // unique id; namespaces this domain's localStorage
  group: "Featured apps",         // dropdown group: "Featured apps" or the SDG group
  name: "🧬 Disease Cures",        // label shown in the domain switcher
  accent: "#4C9F38",              // theme accent color for this domain
  tagline: "1,000 solutions to the world's hardest diseases.",
  CATEGORIES: [                   // category stems the PRNG expands into 1,000 solutions
    { key: "Onco", name: "Cancer Therapeutics", color: "#ff5c7a",
      stems: [ "Develop a tumor-agnostic targeted therapy", /* … */ ] },
    // … more categories
  ],
  // optional domain extras (e.g. prevalence/REGIONS data to enable the Map view)
});
```

The engine seeds `mulberry32` deterministically from each solution, so the same domain always regenerates the **same** 1,000 solutions, scores, costs, and timelines — reproducible across reloads and machines.

### Add a new domain

1. Create `packs/<your-key>.js` that calls `HUB_DOMAINS.push({ … })` following the contract above (`key`, `group`, `name`, `accent`, `tagline`, `CATEGORIES`).
2. Run `node build.js` to regenerate `index.html`.
3. Your domain appears in the switcher. Featured packs render first; SDG packs (`sdgN.js`) sort numerically 1→17; anything else lands in between.

`build.js` orders packs as **featured first** (Disease, Electricity, Water, Blockchain) **then SDG 1…17**, prepends a tiny shim that initializes `window.HUB_DOMAINS`, and writes the combined single file. It throws if the `<!-- PACKS -->` marker is missing.

---

## Run, rebuild, and deploy

**Rebuild after editing the engine or any pack:**
```bash
node build.js        # or: ./build.sh
```

**Run locally** — it's a static file, so just open it:
```bash
open index.html      # macOS; or open the file in any browser
```
No server, build toolchain, or network connection required.

**Deploy** — push to Vercel (or any static host). `vercel.json` enables clean URLs:
```bash
vercel --prod
```
Only `index.html` and `vercel.json` are needed at runtime; `_base.html`, `_engine.html`, `packs/`, and `build.js` are source/tooling (and are git-ignored or kept out of the deploy as configured).

---

## Not advice

SolveVerse is a brainstorming and triage tool built on **illustrative, seeded placeholder data**. Scores, costs (USD/₱), timelines, statuses, prevalence figures, and organization lists are generated or hand-authored for planning only — they are **not** researched facts, financial guidance, or medical advice, and the organization chips link to web searches rather than endorsed sources. Always do your own research before making any real decision.
