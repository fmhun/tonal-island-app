# Tonal Island public distribution

This public repository contains the maintained website and macOS release assets. The macOS application's source and signing procedure live in a separate private repository.

- Edit the website in `site/`; it is the canonical website source. Keep the current static HTML/CSS/JavaScript structure unless a task justifies changing it.
- Keep download actions mint (`#ade8d5`) with dark text; the macOS visual styling must not replace them with blue buttons.
- Run `python3 scripts/check_site.py` before proposing a website change. Pages publishes only `site/`.
- Use focused branches and PRs. Human review and manual merge are the default. Respect explicit authorization already given in the session.
- Never copy application sources, private Git history, archives, debug symbols, credentials or private logs into this repository.
- Attach distributable DMGs to GitHub Releases; do not commit binary packages to Git.
- Release preparation and publication run from the private repository. Do not introduce Apple credentials or access to private sources here.
- `site/downloads.json` is the public download contract. Update a channel only after the corresponding release and exact asset are publicly accessible. Preserve the other channel.
- Stable and alpha versions are distinct. Each download records its exact tag, version, build, macOS minimum, architectures, URL, size and SHA-256.
- Download schema v2 also records `distribution`: `adhoc-alpha` is alpha-only, locally signed and not notarized; `developer-id` is the signed/notarized path. Never label an ad-hoc download as identified or notarized by Apple. Keep the installation guide and status text consistent with the selected profile.
- Published release assets and tags must not be replaced. A correction needs a new version. Prepare complete draft releases before publishing an immutable release.
- Never publish a candidate or merge a download update merely because checks passed; follow the authorization for the current task.

The website demonstration uses a Für Elise excerpt adapted from an existing public-domain edition, not captured live MIDI. Preserve attribution and the current gesture requirement for sound.
