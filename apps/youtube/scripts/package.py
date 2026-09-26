"""Package only the built standalone target; reject unsafe archive names and entry references."""
from pathlib import Path
import hashlib, json, re, zipfile
root = Path(__file__).resolve().parents[3]
dist = root / 'apps/youtube/dist'
notice = 'Water Hole YouTube distribution — third-party notices\n\n'
for name in ('phaser', 'vite'):
    notice += f'\n{name}\n' + (root / 'node_modules' / name / 'LICENSE.md').read_text() + '\n'
(dist / 'third-party-licenses.txt').write_text(notice)
files = sorted(p for p in dist.rglob('*') if p.is_file())
assert (dist / 'index.html').is_file()
for p in files:
    assert not p.is_symlink() and p.stat().st_size < 30 * 1024**2
    assert all(re.fullmatch(r'[A-Za-z0-9_.-]+', part) for part in p.relative_to(dist).parts)
javascript = '\n'.join(p.read_text() for p in files if p.suffix == '.js')
for forbidden in ('AdMob', 'ca-app-pub', 'Capacitor', 'MobileAds', 'navigator.language', 'serviceWorker.register', '__waterHole'):
    assert forbidden not in javascript, forbidden
html = (dist / 'index.html').read_text()
for ref in re.findall(r'(?:src|href)="([^"]+)"', html):
    if ref.startswith('data:') or ref == 'https://www.youtube.com/game_api/v1': continue
    assert ref.startswith('./') and (dist / ref).is_file(), ref
assert html.index('https://www.youtube.com/game_api/v1') < html.index('type="module"')
size = sum(p.stat().st_size for p in files)
assert size < 250 * 1024**2 and len(files) <= 8000
release = root / 'release'
release.mkdir(exist_ok=True)
archive = release / 'water-hole-youtube.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in files: z.write(p, p.relative_to(dist).as_posix())
report = dict(archive=str(archive),sha256=hashlib.sha256(archive.read_bytes()).hexdigest(),uncompressedBytes=size,zipBytes=archive.stat().st_size,fileCount=len(files),files=[dict(name=p.relative_to(dist).as_posix(),bytes=p.stat().st_size) for p in files])
(release / 'youtube-package-report.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report, indent=2))
