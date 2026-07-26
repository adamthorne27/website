# Technical Evidence Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Astro starter with a fast, restrained technical portfolio that makes Adam's resume claims inspectable through architecture, evaluation methods, measured results, limitations, and reproducibility links.

**Architecture:** Keep Astro's static output and use a typed `portfolio.ts` content source for the four projects, three experience entries, technical notes, and external links. Render the homepage and project routes from shared components so every project page follows the same evidence structure without adding a frontend framework or client-side state.

**Tech Stack:** Astro 5, TypeScript, semantic HTML, plain CSS, Node.js built-in assertions, static build output.

## Global Constraints

- Preserve the existing Astro project, package manager, lockfile, and static-output architecture.
- Use a white or near-white background, dark neutral text, one muted blue accent, strong typography, minimal animation, and no stock imagery.
- The first viewport must identify Adam, Michigan CS and Applied Mathematics, and the focus on high-performance systems, ML infrastructure, and quantitative research tools.
- Put Selected projects, Experience, Technical writing, and Resume/GitHub/LinkedIn/email immediately after the introduction.
- Feature exactly four primary items: C++ Event Processing and Matching Engine, Vectorized Columnar Analytics Engine, Portfolio Research Toolkit, and a sanitized Verazoi Applied ML Case Study.
- Every project route must cover: problem, users, personal contribution, architecture/data flow, decisions, evaluation, results, failures/limitations/next steps, and repository/documentation/reproducibility.
- Do not publish a benchmark number unless it is present in a checked resume, repository report, or reproducible benchmark output.
- Do not publish confidential Lightshift or Verazoi sources, customer names, geographic identifiers, raw data, or internal URLs.
- If a requested source artifact is not public, show the exact sentence: `Source is private; methodology and individual contribution are described here without confidential implementation details.`
- If a requested result is not yet verified, show the exact status: `Measurement pending reproducible public benchmark.`
- Use HTML/CSS for architecture flows, tables, and plots; do not use raw code screenshots or model-authored SVG diagrams.
- Make all core content readable with JavaScript disabled and support desktop widths down to 320px.
- Use `Adam_Thorne_Resume.pdf` as the public resume filename.

---

## File Structure

### Create

- `src/data/portfolio.ts` — typed source of truth for projects, experience, writing, metrics, and links.
- `src/layouts/BaseLayout.astro` — page metadata, skip link, header, navigation, footer, and global stylesheet import.
- `src/styles/global.css` — design tokens, typography, layout, tables, diagrams, focus states, and responsive behavior.
- `src/components/ProjectCard.astro` — compact project summary for the homepage.
- `src/components/ArchitectureFlow.astro` — semantic ordered data-flow diagram.
- `src/components/EvidenceTable.astro` — accessible benchmark/evaluation table.
- `src/components/MetricBars.astro` — CSS-only comparison plot with a table-equivalent label.
- `src/pages/projects/[slug].astro` — statically generated evidence page for all four projects.
- `src/pages/writing/index.astro` — technical note index sourced from public project documentation.
- `scripts/verify-build.mjs` — built-output checks for routes, required copy, metadata, and internal links.
- `public/Adam_Thorne_Resume.pdf` — public copy of the current general backend/systems resume.

### Modify

- `src/pages/index.astro` — replace the Astro starter with the evidence-first homepage.
- `package.json` — add a `verify` script without adding dependencies.
- `README.md` — replace starter instructions with local build, verification, and content-update instructions.
- `public/favicon.svg` — replace the Astro starter icon with a simple `AT` wordmark.

### Keep

- `astro.config.mjs`
- `package-lock.json`
- `tsconfig.json`
- `public/favicon.ico`

---

### Task 1: Build the Claim and Source Inventory

**Files:**
- Create: `src/data/portfolio.ts`
- Inspect: `../Backend/Resumes/backend_resume.tex`
- Inspect during execution: public repositories and benchmark reports linked from `https://github.com/adamthorne27`

**Interfaces:**
- Produces: exported `projects`, `experience`, `writing`, and `profileLinks` arrays consumed by all routes.
- Produces: `Project`, `Experience`, `WritingEntry`, `EvidenceLink`, and `MetricTable` types.

- [ ] **Step 1: Record the allowed public claims from the resume**

Use these resume-backed facts as the initial evidence ceiling:

```text
Event engine: 4.2 million event messages/second; p99 under 35 microseconds.
Event validation: deterministic replay, invariants, sanitizer runs, CTest/gtest.
Vector engine: typed-batch scan/filter/project/hash aggregation; DuckDB and row-engine checks.
Portfolio toolkit: Parquet caching, TOML configuration, validation tests, QuantStats, MLflow, GitHub/Colab workflows.
Verazoi: artifacts for 45-user experiments; balanced accuracy, F1, AUPRC, recall, false alerts/day, and lead time.
Lightshift: 3.5x training speedup, 30.3s to 8.6s per epoch, no accuracy loss.
Lightshift: 9/9-tested offline scoring library.
Lightshift: data-pipeline stall reduced from projected 12+ hours to 15-20 minutes and memory from about 53 GB/worker to under 1 GB/worker.
Lightshift: about 1,800 configurations across about 800 GPU-hours.
```

- [ ] **Step 2: Audit each public repository before adding a link**

For each candidate repository, check:

```bash
git status --short
rg -n "4\\.2|35|benchmark|p99|DuckDB|walk.forward|point.in.time|leakage|sanitizer|reproduc" README.md docs benchmarks tests src
rg --files | rg "(README|DESIGN|BENCHMARK|REPORT|test|benchmark|reproduc)"
```

Only add an exact source-file URL when the named file exists on the public default branch. Do not link to a guessed path.

- [ ] **Step 3: Define the content contracts**

Create these exact TypeScript interfaces:

```ts
export type EvidenceLink = {
  label: string;
  href: string;
  kind: 'repository' | 'source' | 'documentation' | 'benchmark';
};

export type MetricTable = {
  caption: string;
  columns: string[];
  rows: string[][];
};

export type Project = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  problem: string;
  users: string;
  contribution: string[];
  architecture: string[];
  decisions: string[];
  evaluation: string[];
  results: MetricTable[];
  limitations: string[];
  reproducibility: string[];
  status: string[];
  links: EvidenceLink[];
};

export type Experience = {
  organization: string;
  role: string;
  period: string;
  summary: string;
};

export type WritingEntry = {
  title: string;
  description: string;
  href: string;
  topic: string;
};
```

- [ ] **Step 4: Populate exactly four project entries**

Use these slugs:

```ts
[
  'event-processing-matching-engine',
  'vectorized-columnar-analytics',
  'portfolio-research-toolkit',
  'applied-ml-case-study',
]
```

Use Verazoi for the applied ML case study because the resume provides sanitized evaluation details without disclosing employer data. For every unsupported metric cell, use `Measurement pending reproducible public benchmark.` instead of an estimate.

- [ ] **Step 5: Add experience and technical-writing entries**

Add Lightshift, Verazoi, and Machine Learning Student Network. The Lightshift summary must describe production-adjacent research tooling, profiling, tests, and performance work without claiming the internal application is deployed unless current employer-approved evidence confirms deployment.

Writing entries should link to verified public design/benchmark/research documents. If there are fewer than three public documents, point to named sections on the corresponding project pages rather than inventing standalone articles.

- [ ] **Step 6: Review the inventory**

Verify every number in `portfolio.ts` can be traced to the resume or a checked public artifact. Remove or mark any unsupported number.

- [ ] **Step 7: Commit**

```bash
git add src/data/portfolio.ts
git commit -m "content: add verified portfolio evidence"
```

---

### Task 2: Create the Static Design Foundation

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/styles/global.css`
- Modify: `public/favicon.svg`

**Interfaces:**
- Consumes: page `title`, `description`, and optional `canonicalPath` props.
- Produces: a shared page shell and CSS classes used by every page.

- [ ] **Step 1: Implement the base layout**

`BaseLayout.astro` must:

```text
Set lang="en".
Set charset, viewport, title, description, canonical URL, and theme-color.
Render a "Skip to content" link.
Render a compact header with Adam Thorne and links to Work, Experience, Writing, and Contact.
Render <main id="main"> through <slot />.
Render footer links to Resume, GitHub, LinkedIn, and email.
```

The canonical base URL is `https://adamthorne.com`.

- [ ] **Step 2: Add global design tokens**

Define:

```css
:root {
  --paper: #f7f7f4;
  --surface: #ffffff;
  --ink: #17191c;
  --muted: #60656d;
  --line: #d9dce1;
  --accent: #1f5f8b;
  --accent-soft: #e8f0f5;
  --measure: 72rem;
  --reading: 46rem;
}
```

Use the system font stack. Do not fetch web fonts. Set a 1.55 body line height, visible underlines on inline links, and `:focus-visible` outlines.

- [ ] **Step 3: Define responsive rules**

Use CSS Grid for project and experience lists. Switch all multi-column layouts to one column at `max-width: 720px`. Allow tables to scroll inside a labeled wrapper without causing page-level horizontal overflow. Hide no evidence on mobile.

- [ ] **Step 4: Limit animation**

Do not add entrance animations. Use only short color/border transitions for links and cards, and disable them under `prefers-reduced-motion: reduce`.

- [ ] **Step 5: Replace the starter favicon**

Create a simple text-based `AT` favicon using the site's background, ink, and accent colors.

- [ ] **Step 6: Build**

Run:

```bash
npm run build
```

Expected: Astro exits with code 0.

- [ ] **Step 7: Commit**

```bash
git add src/layouts/BaseLayout.astro src/styles/global.css public/favicon.svg
git commit -m "feat: add technical portfolio design foundation"
```

---

### Task 3: Build the Evidence Components

**Files:**
- Create: `src/components/ProjectCard.astro`
- Create: `src/components/ArchitectureFlow.astro`
- Create: `src/components/EvidenceTable.astro`
- Create: `src/components/MetricBars.astro`

**Interfaces:**
- `ProjectCard` consumes `{ project: Project }`.
- `ArchitectureFlow` consumes `{ title: string; stages: string[] }`.
- `EvidenceTable` consumes `{ table: MetricTable }`.
- `MetricBars` consumes `{ title: string; items: { label: string; value: number; display: string }[] }`.

- [ ] **Step 1: Implement `ProjectCard`**

Render category, title, summary, up to three status facts, and a text link to `/projects/${project.slug}/`. The entire card must not be a nested-link click target.

- [ ] **Step 2: Implement `ArchitectureFlow`**

Render an `<ol>` with one stage per `<li>`, directional separators marked `aria-hidden="true"`, and the full flow remaining readable as a vertical list on mobile.

- [ ] **Step 3: Implement `EvidenceTable`**

Render `<table>`, `<caption>`, `<thead>`, and `<tbody>`. Derive headers and cells from `MetricTable` and reject no content at render time.

- [ ] **Step 4: Implement `MetricBars`**

Render CSS width bars using the largest item as 100%. Include visible numeric display text so color and bar length are never the only carriers of information.

- [ ] **Step 5: Build**

Run:

```bash
npm run build
```

Expected: Astro exits with code 0 and reports no missing imports.

- [ ] **Step 6: Commit**

```bash
git add src/components
git commit -m "feat: add reusable evidence components"
```

---

### Task 4: Replace the Homepage

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `projects`, `experience`, `writing`, and `profileLinks` from `src/data/portfolio.ts`.
- Produces: `/`.

- [ ] **Step 1: Add the exact introduction**

The first viewport must render:

```text
Adam Thorne
Computer Science and Applied Mathematics at the University of Michigan
Building high-performance systems, ML infrastructure, and quantitative research tools.
```

Place Resume, GitHub, LinkedIn, and email links directly below it.

- [ ] **Step 2: Add selected projects**

Render exactly four `ProjectCard` components in the requested order. Above the grid, add one sentence: `Selected work with architecture, measurements, failure modes, and reproducible paths into the implementation.`

- [ ] **Step 3: Add experience**

Render short Lightshift, Verazoi, and MLSN summaries. Keep each summary to 45-70 words and emphasize personal ownership and evaluation evidence.

- [ ] **Step 4: Add technical writing**

Render the verified writing entries as a compact list with topic labels. Use no generic blog teaser text.

- [ ] **Step 5: Add the closing test**

End before the footer with:

```text
The standard I use for this work
Build difficult systems. Test the claims. Measure honestly. Explain the tradeoffs.
```

- [ ] **Step 6: Build**

Run:

```bash
npm run build
```

Expected: `dist/index.html` exists and contains all four project titles.

- [ ] **Step 7: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: build evidence-first portfolio homepage"
```

---

### Task 5: Generate the Four Project Evidence Pages

**Files:**
- Create: `src/pages/projects/[slug].astro`

**Interfaces:**
- Consumes: `projects: Project[]`.
- Produces: four static `/projects/<slug>/` routes through `getStaticPaths()`.

- [ ] **Step 1: Generate routes from project data**

Use:

```ts
export function getStaticPaths() {
  return projects.map((project) => ({
    params: { slug: project.slug },
    props: { project },
  }));
}
```

- [ ] **Step 2: Render the shared evidence sequence**

Every page must render these headings in order:

```text
What problem does this solve?
Who would use it?
What I personally built
Architecture and data flow
Important decisions
Evaluation methodology
Results
Failures, limitations, and next steps
Implementation status
Repository, documentation, and reproducibility
```

- [ ] **Step 3: Render diagrams, tables, and plots**

Use `ArchitectureFlow` on all four pages. Use `EvidenceTable` for every reported benchmark or evaluation matrix. Use `MetricBars` only where two or more comparable verified measurements exist, such as Lightshift's 30.3s versus 8.6s training time if that result is used in a public sanitized discussion.

- [ ] **Step 4: Enforce case-study disclosure**

On the Verazoi page, identify dataset construction at the cohort/schema level only, explain user-wise or time-aware splitting, list model-comparison metrics, and state Adam's individual contribution. Do not include raw health records, customer details, or private source links.

- [ ] **Step 5: Enforce implementation-status clarity**

On the Portfolio Research Toolkit page, separate the current Parquet/TOML/MLflow/QuantStats platform from planned point-in-time and walk-forward extensions. Do not present planned portfolio construction or risk attribution as completed.

- [ ] **Step 6: Build**

Run:

```bash
npm run build
```

Expected: four directories exist under `dist/projects/`, each containing `index.html`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/projects
git commit -m "feat: add project evidence pages"
```

---

### Task 6: Add the Technical-Writing Index and Resume

**Files:**
- Create: `src/pages/writing/index.astro`
- Create: `public/Adam_Thorne_Resume.pdf`
- Modify: `README.md`

**Interfaces:**
- Consumes: `writing` from `src/data/portfolio.ts`.
- Produces: `/writing/` and `/Adam_Thorne_Resume.pdf`.

- [ ] **Step 1: Build the writing index**

Render a short introduction: `Notes on system design, benchmark methodology, and research validation drawn from the projects on this site.` Then render only checked public documents or deep links to the evidence sections on project pages.

- [ ] **Step 2: Copy the current resume**

Copy:

```text
../Backend/Resumes/backend_resume.pdf
```

to:

```text
public/Adam_Thorne_Resume.pdf
```

Do not modify or rebuild the resume during this website task.

- [ ] **Step 3: Replace the starter README**

Document:

```text
npm install
npm run dev
npm run build
npm run verify
```

Explain that portfolio claims live in `src/data/portfolio.ts`, unsupported metrics must use the pending-measurement label, and private employer details must never be added.

- [ ] **Step 4: Build**

Run:

```bash
npm run build
```

Expected: `dist/writing/index.html` and `dist/Adam_Thorne_Resume.pdf` exist.

- [ ] **Step 5: Commit**

```bash
git add src/pages/writing public/Adam_Thorne_Resume.pdf README.md
git commit -m "feat: add technical writing and resume"
```

---

### Task 7: Add Automated Static Verification

**Files:**
- Create: `scripts/verify-build.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: files in `dist/`.
- Produces: exit code 0 only when required routes, content, metadata, and internal links are valid.

- [ ] **Step 1: Write the verification script**

Use Node built-ins only. The script must:

```js
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const routes = [
  'index.html',
  'writing/index.html',
  'projects/event-processing-matching-engine/index.html',
  'projects/vectorized-columnar-analytics/index.html',
  'projects/portfolio-research-toolkit/index.html',
  'projects/applied-ml-case-study/index.html',
  'Adam_Thorne_Resume.pdf',
];

for (const route of routes) {
  await access(path.join('dist', route));
}

const home = await readFile('dist/index.html', 'utf8');
for (const required of [
  'Adam Thorne',
  'Computer Science and Applied Mathematics at the University of Michigan',
  'C++ Event Processing and Matching Engine',
  'Vectorized Columnar Analytics Engine',
  'Portfolio Research Toolkit',
  'Applied ML Case Study',
  'Lightshift',
  'Verazoi',
  'Machine Learning Student Network',
]) {
  assert.ok(home.includes(required), `Missing homepage copy: ${required}`);
}

assert.ok(home.includes('name="description"'), 'Missing meta description');
assert.ok(home.includes('Skip to content'), 'Missing skip link');

const projectHeadings = [
  'What problem does this solve?',
  'Who would use it?',
  'What I personally built',
  'Architecture and data flow',
  'Important decisions',
  'Evaluation methodology',
  'Results',
  'Failures, limitations, and next steps',
  'Implementation status',
  'Repository, documentation, and reproducibility',
];

for (const route of routes.filter((route) => route.startsWith('projects/'))) {
  const html = await readFile(path.join('dist', route), 'utf8');
  for (const heading of projectHeadings) {
    assert.ok(html.includes(heading), `${route} missing heading: ${heading}`);
  }
}

console.log('Static portfolio verification passed.');
```

- [ ] **Step 2: Add the package script**

Add:

```json
"verify": "npm run build && node scripts/verify-build.mjs"
```

- [ ] **Step 3: Run verification**

Run:

```bash
npm run verify
```

Expected:

```text
Static portfolio verification passed.
```

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-build.mjs package.json
git commit -m "test: verify portfolio build and evidence routes"
```

---

### Task 8: Final Evidence, Accessibility, and Scope Review

**Files:**
- Review: `src/data/portfolio.ts`
- Review: `src/pages/index.astro`
- Review: `src/pages/projects/[slug].astro`
- Review: `src/styles/global.css`

**Interfaces:**
- Produces: final static build ready for a hosting decision.

- [ ] **Step 1: Audit claims**

Search:

```bash
rg -n "\\b[0-9]+(?:\\.[0-9]+)?(?:x|%| GB| MB| microseconds| ms|s| hours| users| configurations)\\b" src
```

For every match, confirm the resume or a public checked artifact supports it. Replace unsupported measurements with `Measurement pending reproducible public benchmark.`

- [ ] **Step 2: Audit confidentiality**

Search:

```bash
rg -ni "customer|client|region|warehouse|bucket|internal|private|token|secret|credential" src
```

Review every match and remove employer-identifying or infrastructure-sensitive detail. Keep only the approved generic disclosure sentence for private source.

- [ ] **Step 3: Audit the two-minute path**

Read only the built homepage from top to bottom. Confirm a reviewer sees identity, focus, four projects, three experience entries, technical writing, and contact links without opening navigation.

- [ ] **Step 4: Audit semantic and responsive source**

Confirm:

```text
One h1 per route.
Heading levels do not skip.
All links have descriptive text.
All tables have captions and column headers.
All diagram stages remain ordered text.
No fixed-width content exceeds the viewport.
Focus styles are visible.
Reduced-motion preference is honored.
```

- [ ] **Step 5: Run final verification**

Run:

```bash
npm run verify
```

Expected: build succeeds and static verification passes.

- [ ] **Step 6: Inspect the final diff**

Run:

```bash
git status --short
git diff --stat
git diff --check
```

Expected: only portfolio files are changed, and `git diff --check` prints no errors.

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "chore: finalize technical evidence portfolio"
```

Do not deploy or configure DNS until the user identifies the intended hosting target. Do not change GitHub pinned repositories automatically; provide the four repository names to pin after their public URLs and documentation have been verified.
