# Tonal Island mini-site

[Visit Tonal Island](https://fmhun.github.io/tonal-island-app/)

An interactive introduction to Tonal Island, a macOS companion for understanding the notes and intervals you play.

This repository contains the maintained public static website and macOS distributables attached to GitHub Releases. The application is developed separately. There is no public application download yet.

The demo includes ten musical excerpts, adapted from public-domain editions published by the Mutopia Project. Sound is synthesized locally in the browser. See [music credits](https://fmhun.github.io/tonal-island-app/music-credits.html).

GitHub Pages deploys only `site/`, using the workflow in `.github/workflows/pages.yml`, when changes are pushed to `main`.

Validate changes with `python3 scripts/check_site.py` (Python 3.10+ and Node.js required). Preview with `python3 -m http.server 8052 --directory site --bind 127.0.0.1`.

`site/downloads.json` records the current stable and alpha download separately. Until a verified release is published, both entries stay null and the main action opens the demo. Release assets are versioned DMGs, `SHA256SUMS`, and `release.json`. Build archives, symbols, source history and signing material are never published here.
