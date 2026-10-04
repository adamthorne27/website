// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://adamthorne.com',
	srcDir: './site/src',
	publicDir: './site/public',
	output: 'static',
	trailingSlash: 'always',
});
