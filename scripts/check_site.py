"""Check static assets, download metadata and JavaScript before Pages deployment."""

import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"


def validate_release(release, channel):
    if release is None:
        return
    assert release["channel"] == channel
    assert re.fullmatch(r"\d+\.\d+\.\d+", release["version"])
    suffix = r"-alpha\.\d+" if channel == "alpha" else ""
    assert re.fullmatch("v" + re.escape(release["version"]) + suffix, release["tag"])
    assert re.fullmatch(r"[1-9]\d*", release["build"])
    assert re.fullmatch(r"\d+\.\d+(?:\.\d+)?", release["minimumMacOS"])
    assert release["architectures"] and set(release["architectures"]) <= {"arm64", "x86_64"}
    download = release["download"]
    assert re.fullmatch(r"Tonal-Island-[a-zA-Z0-9.-]+\.dmg", download["name"])
    assert download["url"] == f'https://github.com/fmhun/tonal-island-app/releases/download/{release["tag"]}/{download["name"]}'
    assert re.fullmatch(r"[a-f0-9]{64}", download["sha256"])
    assert isinstance(download["size"], int) and download["size"] > 0
    assert re.fullmatch(r"\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ", release["releasedAt"])


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.urls = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if "id" in attrs:
            assert attrs["id"] not in self.ids, "Duplicate HTML id"
            self.ids.add(attrs["id"])
        self.urls.extend(attrs[key] for key in ["href", "src"] if key in attrs)


def main():
    manifest = json.loads((SITE / "downloads.json").read_text())
    assert manifest["schemaVersion"] == 1
    for channel in ["stable", "alpha"]:
        validate_release(manifest[channel], channel)
    for file in SITE.rglob("*.html"):
        text = file.read_text()
        assert text.startswith("<!doctype html>")
        page = Page()
        page.feed(text)
        for url in page.urls:
            split = urlsplit(url)
            if split.scheme or split.netloc:
                continue
            target = (file.parent / unquote(split.path)).resolve() if split.path else file
            assert target.is_relative_to(SITE.resolve()), url
            assert target.exists(), (file, url)
            if not split.path and split.fragment:
                assert split.fragment in page.ids, (file, url)
    for file in SITE.rglob("*.js"):
        text = file.read_text()
        result = subprocess.run(["node", "--input-type=module", "--check"], input=text, text=True, capture_output=True)
        assert result.returncode == 0, (file, result.stderr)
        for asset in re.findall(r"\./assets/native/[a-f0-9]+\.(?:png|webp)", text):
            assert (SITE / asset).is_file(), asset
    for file in SITE.rglob("*"):
        if file.suffix in {".html", ".js", ".json", ".css"}:
            text = file.read_text()
            assert not any(value in text for value in ["tonal-island-site", "window.openai", "/Users/", "/private/tmp/"]), file
    print("Website checks passed: HTML links, native assets, JavaScript and download channels.")


if __name__ == "__main__":
    main()
