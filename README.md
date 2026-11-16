# Pyrra SMP Store

The Pyrra SMP web store. Packages, basket and checkout come from Tebex (Headless API); this repo is only the page.

- `config.js`: the Tebex Headless **public** token, Discord invite and per-package art. Never put the private key here.
- `index.html`, `app.js`, `site.css`: the page.
- `theme/`, `images/`, `descriptions.js`: copied in by `store/build-site.sh` on the server PC.
