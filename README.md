# Adam Thorne

The standalone taped-paper portfolio, current obsessions, and interactive drawing demo.

## Run locally

```sh
npm ci
npm run dev
```

## Check and preview the upload

```sh
npm run verify
npm run preview -- --host 127.0.0.1 --port 4328
```

The preview opens at `http://127.0.0.1:4328/`. Verification checks the three public routes, local assets and navigation, metadata, drawing scripts, and exclusion of old designs and confidential employer material.

## Publish

Build command: `npm run verify`. Publish directory: `dist`. Upload the **contents** of `dist` to a static website host; no server, model service, or environment variables are needed. `site-downloads/adam-thorne-site.zip` is a snapshot of the verified build and must be regenerated after edits.

`astro.config.mjs` sets the canonical domain to `https://adamthorne.com`. Update `site` there before building for a different permanent domain. A build or local preview does not publish the site.

To update cPanel automatically from GitHub, follow [the one-time FTPS setup](docs/cpanel-github-deployment.md). The workflow builds and checks the site on pushes to `main`, then uploads `dist/` using connection settings stored in GitHub Actions secrets. It requires no SSH access.

## Edit the site

- `site/src/pages/index.astro`: portfolio and experience with generalized employer details
- `site/src/pages/obsessions/index.astro`: current technical and personal obsessions
- `site/src/pages/obsessions/autoencoders.astro`: saved October 2026 entry
- `site/src/layouts/SiteLayout.astro`: shared document metadata
- `site/public/styles/`: approved paper theme
- `site/public/scripts/`: existing browser model and drawing controller

When adding a technical obsession, give it a dated saved entry, retain earlier entries and demos, then update the overview and archive. The current model runs locally in each visitor's browser. The running note uses the Strava summary supplied by Adam.

The drawing hint is a reset button. Each encoder square opens a slider for its actual activation; edits rerun both model heads while preserving the input strokes. Restore drawing values restores the full original state. Current obsessions has its own page with a return link to the portfolio.

Font licenses are in `site/public/fonts/`; model and training-data attribution is in `site/public/scripts/MODEL.txt`. Only the public PINN paper is included, not the private resume. Preserve the generalized employer bullets when updating experience.

The approved website lives in `site/`. Earlier designs were removed from the current repository and preserved locally in the ignored `site-downloads/legacy-source-before-github-2026-10-04/` backup. Git history also retains the original committed website.
