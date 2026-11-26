const actions = [...document.querySelectorAll('.ti-download, [data-ti-download]')];
const details = [...document.querySelectorAll('.ti-requirements, [data-ti-download-details]')];

try {
  const response = await fetch(new URL('../downloads.json', import.meta.url));
  if (!response.ok) throw new Error('Download metadata unavailable');
  const manifest = await response.json();
  const release = manifest.stable || manifest.alpha;
  if (manifest.schemaVersion === 2 && release) {
    const expected = `https://github.com/fmhun/tonal-island-app/releases/download/${release.tag}/${release.download.name}`;
    const adhoc = release.distribution === 'adhoc-alpha';
    if (release.download.url !== expected || !/^[a-f0-9]{64}$/.test(release.download.sha256)
        || !['adhoc-alpha', 'developer-id'].includes(release.distribution)
        || (adhoc && release.channel !== 'alpha')) {
      throw new Error('Invalid download metadata');
    }
    for (const action of actions) {
      action.href = expected;
      action.textContent = release.channel === 'alpha' ? 'Download alpha for macOS' : 'Download for macOS';
    }
    const architectures = release.architectures.map(value => ({arm64:'Apple Silicon', x86_64:'Intel'}[value] || value)).join(' + ');
    for (const detail of details) {
      detail.replaceChildren(`${release.tag} · ${architectures} · macOS ${release.minimumMacOS}+${adhoc ? ' · Not notarized' : ''}`);
      if (detail.matches('.ti-requirements')) {
        const guide = document.createElement('a');
        guide.href = './installation.html';
        guide.textContent = 'Installation guide';
        detail.append(' · ', guide);
      }
    }
    for (const notice of document.querySelectorAll('[data-ti-distribution]')) {
      notice.textContent = adhoc
        ? 'This alpha uses a local ad-hoc signature. It is not signed with an Apple Developer ID or notarized by Apple.'
        : 'This download is signed with Developer ID and notarized by Apple.';
    }
    for (const guide of document.querySelectorAll('[data-ti-adhoc-guide]')) guide.hidden = !adhoc;
  }
} catch {
  // A missing release keeps the demo available instead of a broken download.
}
