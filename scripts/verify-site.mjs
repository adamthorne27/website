import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

async function filesUnder(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	return (await Promise.all(entries.map(async (entry) => {
		const file = path.join(directory, entry.name);
		return entry.isDirectory() ? filesUnder(file) : [file];
	}))).flat();
}

const routes = ['index.html', 'obsessions/index.html', 'obsessions/autoencoders/index.html'];
const files = (await filesUnder('dist')).map((file) => path.relative('dist', file));
assert.deepEqual(files.filter((file) => file.endsWith('.html')).sort(), [...routes].sort(), 'Only the approved pages belong in the upload');
assert.deepEqual(files.filter((file) => file.endsWith('.pdf')), ['Adam_Thorne_PINN_Paper.pdf'], 'Do not publish the private resume');
assert.ok(!files.some((file) => /^(mockup|designs|projects)\//.test(file)), 'Design previews must stay outside the upload');

for (const asset of ['favicon.svg', 'robots.txt', 'portfolio-preview-2026-10.jpg', 'scripts/MODEL.txt', 'fonts/bricolage-OFL.txt', 'fonts/plex-mono-OFL.txt']) {
	await access(path.join('dist', asset));
}

const pages = new Map(await Promise.all(routes.map(async (route) => [route, await readFile(path.join('dist', route), 'utf8')])));
const base = 'https://adamthorne.com';
const demoIds = ['digit-canvas', 'completion-canvas', 'encoder-state', 'encoder-values', 'digit-guess', 'digit-confidence', 'digit-alternatives', 'digit-announcement', 'drawing-hint', 'digit-clear', 'digit-example', 'state-editor', 'state-slider', 'state-restore'];

async function checkLink(reference, source) {
	const url = new URL(reference, new URL(source, base));
	if (url.origin !== base) return;
	const route = decodeURIComponent(url.pathname.slice(1)) + (url.pathname.endsWith('/') ? 'index.html' : '');
	await access(path.join('dist', route));
	if (url.hash) {
		const target = await readFile(path.join('dist', route), 'utf8');
		assert.ok(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${source} links to a missing anchor: ${reference}`);
	}
}

for (const [route, html] of pages) {
	assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, `${route} needs one page heading`);
	const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
	assert.equal(ids.length, new Set(ids).size, `${route} has duplicate IDs`);
	for (const id of demoIds) assert.ok(ids.includes(id), `${route} is missing drawing control ${id}`);
	for (const required of ['Skip to content', 'name="description"', 'rel="canonical"', 'property="og:title"', 'property="og:image"', 'name="twitter:image"', 'name="twitter:card"']) {
		assert.ok(html.includes(required), `${route} is missing ${required}`);
	}
	const previewImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
	assert.equal(previewImage, `${base}/portfolio-preview-2026-10.jpg`, `${route} needs the current absolute sharing image URL`);
	await checkLink(previewImage, `/${route}`);
	assert.ok(!/direction-switch|All designs|\/mockup|\/designs|\bLSE\b/i.test(html), `${route} contains preview or confidential content`);
	const scripts = [...html.matchAll(/<script\b([^>]+)>/g)].map((match) => match[1]);
	assert.equal(scripts.length, 2, `${route} must retain both drawing scripts`);
	assert.ok(scripts[0].includes('/scripts/digit-model.js') && scripts[1].includes('/scripts/drawing-demo.js'), 'Load the model before the controller');
	assert.ok(scripts.every((script) => /\bdefer(?:\s|$)/.test(script) && !script.includes('type="module"')), 'Preserve deferred global model loading');
	for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) await checkLink(match[1], `/${route}`);
}

for (const file of files.filter((file) => file.endsWith('.css'))) {
	const css = await readFile(path.join('dist', file), 'utf8');
	for (const match of css.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) await checkLink(match[1], `/${file}`);
}

for (const [published, approvedHash] of [
	['scripts/digit-model.js', 'eed2e69f13c15f9f3696d6124de2288355c0d7509bb862b226473353fa8eed0c'],
]) {
	const hash = createHash('sha256').update(await readFile(path.join('dist', published))).digest('hex');
	assert.equal(hash, approvedHash, 'The approved drawing model weights must remain intact');
}
assert.deepEqual(await readFile('dist/scripts/drawing-demo.js'), await readFile('site/public/scripts/drawing-demo.js'), 'Publish the current drawing controller');

const home = pages.get('index.html');
const experience = home.match(/<section id="experience"[\s\S]*?<\/section>/)?.[0];
assert.equal((experience?.match(/<li>/g) ?? []).length, 10, 'Retain all ten experience bullets');
assert.ok(home.includes('Lightshift Energy'), 'Use the supplied employer name');
assert.equal((experience.match(/<details[^>]*\bopen(?:\s|>)/g) ?? []).length, 5, 'Open every experience entry by default');
assert.ok(home.includes('href="https://verazoi.com"'), 'Link to Verazoi');
const obsessions = pages.get('obsessions/index.html');
for (const interest of ['Running', 'Dexter', 'Tyler Childers', 'Darknet Diaries']) assert.ok(obsessions.includes(interest), `Missing personal interest: ${interest}`);
assert.ok(obsessions.includes('https://www.strava.com/athletes/142209134/activity-summary/9fb6c3df8173b7d7711161aa1cb786447bfbd87f'), 'Keep the supplied Strava summary');

console.log('Standalone site verified: three pages, working local links, intact demo, and no design previews or private resume.');
