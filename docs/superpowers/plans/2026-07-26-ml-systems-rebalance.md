# ML and Systems Portfolio Rebalance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe the portfolio around hard problems in machine learning and low-latency systems while making every project page shorter, more metric-led, and easier to scan.

**Architecture:** Keep the existing Astro static-site structure and shared project route. Extend the typed portfolio data with tech stacks and headline metrics, then render the same concise README structure for all four projects.

**Tech Stack:** Astro, TypeScript, static HTML, CSS, Node build verification

## Global Constraints

- Keep the Portfolio Research Toolkit.
- Replace Applied ML Case Study with Physics-Informed Neural Networks for Financial PDEs.
- Keep Lightshift and Verazoi inside Experience, with direct resume-backed metrics.
- Do not publish confidential data sources, customer identities, regional identities, raw records, or private code.
- Use literal labels such as "View project"; remove "Review the evidence" and similar portfolio slogans.
- Do not push or deploy.

---

### Task 1: Define the new public-content contract

**Files:**
- Modify: `scripts/verify-build.mjs`

**Interfaces:**
- Consumes: built pages under `dist/`
- Produces: a failing verification gate for the new homepage, project set, page headings, metrics, and plain link language

- [ ] **Step 1: Write the failing build assertions**

Update the route list to require:

```js
const routes = [
	'index.html',
	'projects/physics-informed-neural-networks/index.html',
	'projects/portfolio-research-toolkit/index.html',
	'projects/event-processing-matching-engine/index.html',
	'projects/vectorized-columnar-analytics/index.html',
];
```

Require the homepage to contain the thesis and representative ML/systems metrics:

```js
for (const text of [
	'I like solving hard problems.',
	'machine learning',
	'low-latency systems',
	'1.88% MPE',
	'0.853 AUPRC',
	'4.2M events/sec',
	'39.3× scan speedup',
	'View project',
]) {
	assert.match(homepage, new RegExp(escapeRegExp(text)), `Homepage is missing: ${text}`);
}
```

Require every project page to use the compact README headings:

```js
const projectHeadings = [
	'Why',
	'Tech stack',
	'Key metrics',
	'What I built',
	'How it works',
	'Evaluation',
	'Limitations',
	'Links and reproducibility',
];
```

Reject the removed framing:

```js
for (const text of ['Applied ML Case Study', 'Review the evidence', 'Technical evidence portfolio']) {
	assert.doesNotMatch(allHtml, new RegExp(escapeRegExp(text)), `Removed phrase is still present: ${text}`);
}
```

- [ ] **Step 2: Run the verification and confirm the expected failure**

Run: `npm run verify`

Expected: FAIL because the new PINN route, thesis, metric labels, headings, and plain link language are not built yet.

- [ ] **Step 3: Commit with Task 2 after the implementation turns the gate green**

Do not commit a deliberately failing state.

### Task 2: Rebalance and shorten the content

**Files:**
- Modify: `src/data/portfolio.ts`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/projects/[slug].astro`
- Modify: `src/components/ProjectCard.astro`
- Modify: `src/styles/global.css`
- Test: `scripts/verify-build.mjs`

**Interfaces:**
- Consumes: `Project`, `Experience`, `projects`, `experience`, and `profileLinks`
- Produces: `Project.stack`, `Project.metrics`, `Experience.highlights`, and homepage-level proof metrics rendered by shared Astro templates

- [ ] **Step 1: Add small typed metric and stack fields**

Add:

```ts
export type HeadlineMetric = {
	value: string;
	label: string;
};
```

Extend `Project` with:

```ts
stack: string[];
metrics: HeadlineMetric[];
```

Replace `Experience.summary` with:

```ts
highlights: string[];
```

Export the homepage metrics:

```ts
export const homepageMetrics: HeadlineMetric[] = [
	{ value: '1.88%', label: 'MPE on peak-load forecasting' },
	{ value: '0.853', label: 'AUPRC on event forecasting' },
	{ value: '4.2M', label: 'events/sec in C++' },
	{ value: '39.3×', label: 'columnar scan speedup' },
];
```

- [ ] **Step 2: Replace the generic applied-ML record**

Create `physics-informed-neural-networks` with:

```ts
{
	slug: 'physics-informed-neural-networks',
	title: 'Physics-Informed Neural Networks for Financial PDEs',
	category: 'Machine learning · Scientific computing',
	summary: 'Inverse-PDE experiments for recovering local-volatility surfaces under controlled noise.',
	stack: ['Python', 'PyTorch', 'PINNs', 'Neural ODEs', 'Autograd'],
	metrics: [
		{ value: '2–3 orders', label: 'lower surface MSE' },
		{ value: '0%, 1%, 5%', label: 'noise levels tested' },
	],
}
```

Use resume-backed details for its existing fields: Black-Scholes/Dupire residuals, boundary constraints, inverse PINN versus neural-adjoint baselines, fixed noise settings, training-time cost, stability limitations, and no unsupported public repository claim.

- [ ] **Step 3: Reorder and shorten all project data**

Order:

1. Physics-Informed Neural Networks
2. Portfolio Research Toolkit
3. C++ Event Processing and Matching Engine
4. Vectorized Columnar Analytics Engine

Limit `contribution`, `evaluation`, `limitations`, and `reproducibility` to two or three concise bullets each. Keep the existing benchmark tables where they communicate real measurements; remove capability-matrix prose that duplicates the page.

- [ ] **Step 4: Put employer accomplishments under Experience**

Lightshift highlights must include:

```ts
[
	'Evaluated roughly 1,800 configurations and 620 HPO trials over about 800 GPU-hours.',
	'Reached 1.88% MPE, 63.4% capture@1, and 100% capture@4 across 155,952 forecasts.',
	'Raised capture@1 by 9.2 percentage points versus production while holding MAE within 0.02 MW.',
]
```

Verazoi highlights must include:

```ts
[
	'Built multimodal event-forecasting pipelines across 44,348 windows and 177,392 horizon targets.',
	'Reached 0.853 mean test AUPRC and 79.1% F1 at 60 minutes.',
	'Used time-aware splits, horizon-specific labels, threshold policies, and tracked evaluations.',
]
```

Keep MLSN to two direct bullets about the research toolkit and validation discipline.

- [ ] **Step 5: Rewrite the homepage**

Use:

```astro
<p class="eyebrow">Machine learning · Low-latency systems</p>
<p class="hero-focus">
	I like solving hard problems. That has led me to machine learning and low-latency systems—work where model quality, careful measurement, and efficient implementation all matter.
</p>
```

Render `homepageMetrics` immediately after the profile links. Replace editorial headings such as "Work that can be inspected" and "Ownership close to the real system" with "Projects" and "Experience."

- [ ] **Step 6: Rewrite the project card and page templates**

Project cards render two metrics, a short stack line, and:

```astro
<a class="text-link" href={`/projects/${project.slug}/`}>View project</a>
```

Project pages render, in order:

```text
Why
Tech stack
Key metrics
What I built
How it works
Evaluation
Limitations
Links and reproducibility
```

Keep `ArchitectureFlow`, `EvidenceTable`, and `MetricBars` only where the relevant project data uses them. Do not reintroduce employer case-study framing.

- [ ] **Step 7: Add only the necessary shared styles**

Add restrained `.metric-grid`, `.metric-card`, `.stack-list`, and `.experience-highlights` rules. Reuse existing colors, borders, spacing variables, and responsive breakpoints.

- [ ] **Step 8: Run the focused gate until green**

Run: `npm run verify`

Expected: PASS with five static pages and the new content assertions.

- [ ] **Step 9: Commit**

```bash
git add scripts/verify-build.mjs src/data/portfolio.ts src/pages/index.astro 'src/pages/projects/[slug].astro' src/components/ProjectCard.astro src/styles/global.css
git commit -m "feat: rebalance portfolio around ML and systems"
```

### Task 3: Final consistency verification

**Files:**
- Verify: all files modified in Tasks 1 and 2

**Interfaces:**
- Consumes: committed static-site source
- Produces: clean local `main` with a passing build and no push

- [ ] **Step 1: Scan built output for stale language**

Run:

```bash
rg -n "Applied ML Case Study|Review the evidence|Technical evidence portfolio|Work that can be inspected|Ownership close to the real system" dist
```

Expected: no matches.

- [ ] **Step 2: Run the complete static verification**

Run: `npm run verify`

Expected: PASS; five pages build.

- [ ] **Step 3: Check diff hygiene**

Run: `git diff --check`

Expected: no output.

- [ ] **Step 4: Check repository state**

Run: `git status --short`

Expected: clean working tree.
