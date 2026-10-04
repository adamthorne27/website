# Update the website from GitHub

The workflow in `.github/workflows/deploy-cpanel.yml` runs when you push to `main`. GitHub installs the dependencies, runs `npm run verify`, and uploads only the finished `dist/` files through encrypted FTP (FTPS). It does not require SSH or Node.js on cPanel.

## One-time cPanel setup

1. Open **Domains** and confirm the document root for `adamthorne.com`. It is often `public_html`.
2. Open **FTP Accounts** and create a dedicated account, for example `website-deploy`.
3. Set its **Directory** to that exact document root. Replace cPanel's automatically suggested account subfolder; the account should open directly in the folder containing the live `index.html`.
4. Choose a password and create the account.
5. Click **Configure FTP Client** for the account. Use the server hostname and complete username from its connection settings. Confirm that the host supports explicit FTPS on port 21. The workflow verifies the server certificate, so use the server hostname supplied by the host.

If the host lists a different explicit FTPS port, update `port: 21` in the workflow. If it only supports implicit FTPS, use `protocol: ftps-legacy` and the host's corresponding port.

## One-time GitHub setup

Open [the website repository's Actions secrets](https://github.com/adamthorne27/website/settings/secrets/actions). Select **New repository secret** for each entry:

| Secret name | Value |
| --- | --- |
| `CPANEL_FTP_SERVER` | Server hostname from cPanel's FTP connection settings, without `ftp://` |
| `CPANEL_FTP_USERNAME` | Full FTP username shown in cPanel |
| `CPANEL_FTP_PASSWORD` | Password you chose for the deployment FTP account |
| `CPANEL_FTP_SERVER_DIR` | `./` when the new account's Directory is already the domain's document root |

The server directory is relative to the FTP account's starting folder. With the dedicated account configured above, use `./`; adding `public_html/` would create an extra folder inside the live website. If using an existing account that opens elsewhere, use the relative path from that account's starting folder to the domain's document root, ending with `/`.

Enter these values directly in GitHub; credentials are not stored in the workflow or site files.

## First deployment and future updates

Commit and push the current site source and workflow to `main`: include `site/`, `scripts/verify-site.mjs`, `package.json`, `package-lock.json`, and `astro.config.mjs`. Include your site edits in the commit; the workflow deploys the source on GitHub rather than unpublished local files. Do not commit `dist/`, ZIP downloads, `node_modules/`, or credentials.

After pushing, open **Actions → Deploy website to cPanel** to check the run. A successful local build checks the site, but the first GitHub run must still verify the host connection and upload. Check the live home page, obsessions page, and drawing demo after the first successful run.

For later updates, edit the site, commit, and push to `main`. The workflow handles building and uploading. You can also select **Run workflow** on the Actions page to redeploy the current `main` branch.

The action tracks the files it manages and can remove previously deployed files that disappear from later builds. The first upload does not erase unrelated files already on the host, such as `.htaccess`; old ZIPs or old design files can be removed separately in File Manager if needed.

Sources: [cPanel FTP Accounts](https://docs.cpanel.net/cpanel/files/ftp-accounts/), [GitHub Actions secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets), [FTP deployment action](https://github.com/SamKirkland/FTP-Deploy-Action).
