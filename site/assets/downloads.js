const action = document.querySelector('.ti-download');
const requirements = document.querySelector('.ti-requirements');

try {
  const response = await fetch(new URL('../downloads.json', import.meta.url));
  if (!response.ok) throw new Error('Download metadata unavailable');
  const manifest = await response.json();
  const release = manifest.stable || manifest.alpha;
  if (manifest.schemaVersion === 1 && release) {
    const expected = `https://github.com/fmhun/tonal-island-app/releases/download/${release.tag}/${release.download.name}`;
    if (release.download.url !== expected || !/^[a-f0-9]{64}$/.test(release.download.sha256)) {
      throw new Error('Invalid download metadata');
    }
    action.href = expected;
    action.textContent = release.channel === 'alpha' ? 'Download alpha for macOS' : 'Download for macOS';
    requirements.textContent = `Version ${release.version} · macOS ${release.minimumMacOS} or later · ${release.architectures.join(' / ')}`;
  }
} catch {
  // Keep the working interactive demo as the primary action until a release is available.
}
