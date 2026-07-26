import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const routes = [
	'index.html',
	'projects/physics-informed-neural-networks/index.html',
	'projects/portfolio-research-toolkit/index.html',
	'projects/event-processing-matching-engine/index.html',
	'projects/vectorized-columnar-analytics/index.html',
	'Adam_Thorne_Resume.pdf',
	'Adam_Thorne_PINN_Paper.pdf',
	'og.png',
];

for (const route of routes) {
	await access(path.join('dist', route));
}
await assert.rejects(access(path.join('dist', 'writing/index.html')), { code: 'ENOENT' });

const home = await readFile('dist/index.html', 'utf8');
const hero = home.match(/<section class="hero">([\s\S]*?)<\/section>/)?.[1];
assert.ok(hero, 'Homepage is missing its hero section');
assert.ok(!hero.includes('metric-grid'), 'Homepage hero must not contain context-free metric cards');
for (const required of [
	'Adam Thorne',
	'Computer Science and Applied Mathematics at the University of Michigan',
	'I like solving hard problems.',
	'machine learning',
	'low-latency systems',
	'Reached 1.88% MPE',
	'Reached 0.853 mean test AUPRC',
	'4.2M',
	'messages per second',
	'39.3×',
	'scan p50 speedup',
	'Physics-Informed Neural Networks for Financial PDEs',
	'Portfolio Research Toolkit',
	'C++ Event Processing and Matching Engine',
	'Vectorized Columnar Analytics Engine',
	'Lightshift',
	'1,800 configurations and 620 HPO trials',
	'100% capture@3/@4',
	'reproducing deployed metrics within noise',
	'Verazoi',
	'Machine Learning Student Network',
	'View project',
]) {
	assert.ok(home.includes(required), `Missing homepage copy: ${required}`);
}

assert.ok(home.includes('name="description"'), 'Missing meta description');
assert.ok(home.includes('Skip to content'), 'Missing skip link');
assert.ok(home.includes('property="og:image"'), 'Missing Open Graph image');
assert.ok(home.includes('name="twitter:card"'), 'Missing X card metadata');
assert.ok(!home.includes('Technical writing'), 'Homepage still contains the writing section');
assert.ok(!home.includes('href="/writing/"'), 'Navigation still links to the writing route');

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

const vectorPage = await readFile(
	path.join('dist', 'projects/vectorized-columnar-analytics/index.html'),
	'utf8',
);
const pinnPage = await readFile(
	path.join('dist', 'projects/physics-informed-neural-networks/index.html'),
	'utf8',
);
assert.ok(
	pinnPage.includes('href="/Adam_Thorne_PINN_Paper.pdf"'),
	'PINN project page is missing its paper link',
);
const stylesheetHref = vectorPage.match(/href="(\/_astro\/[^"]+\.css)"/)?.[1];
assert.ok(stylesheetHref, 'Vector project page is missing its built stylesheet');
const stylesheet = await readFile(path.join('dist', stylesheetHref.slice(1)), 'utf8');
assert.match(
	stylesheet,
	/\.metric-fill\{[^}]*display:block/,
	'Metric bar fills must use a box display so percentage widths render',
);

for (const route of routes.filter((route) => route.startsWith('projects/'))) {
	const html = await readFile(path.join('dist', route), 'utf8');
	assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, `${route} must contain one h1`);
	assert.ok(html.includes('<ol class="architecture">'), `${route} missing architecture flow`);
	assert.ok(html.includes('<caption>'), `${route} missing evidence table caption`);
	for (const heading of projectHeadings) {
		assert.ok(html.includes(heading), `${route} missing heading: ${heading}`);
	}
}

const htmlRoutes = routes.filter((route) => route.endsWith('.html'));
const allHtml = (
	await Promise.all(htmlRoutes.map((route) => readFile(path.join('dist', route), 'utf8')))
).join('\n');
for (const removed of [
	'Applied ML Case Study',
	'Review the evidence',
	'Technical evidence portfolio',
	'Work that can be inspected',
	'Ownership close to the real system',
]) {
	assert.ok(!allHtml.includes(removed), `Removed phrase is still present: ${removed}`);
}

for (const route of htmlRoutes) {
	const html = await readFile(path.join('dist', route), 'utf8');
	const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
	for (const href of hrefs) {
		if (!href.startsWith('/')) continue;
		const url = new URL(href, 'https://adamthorne.com');
		const relativePath = url.pathname.endsWith('/')
			? `${url.pathname.slice(1)}index.html`
			: url.pathname.slice(1);
		await access(path.join('dist', relativePath));
		if (url.hash) {
			const target = await readFile(path.join('dist', relativePath), 'utf8');
			assert.ok(target.includes(`id="${url.hash.slice(1)}"`), `${route} links to missing anchor: ${href}`);
		}
	}
}

console.log('Static portfolio verification passed.');
