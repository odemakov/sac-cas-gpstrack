# SAC-CAS GPS Track

Browser extension that adds a button to download GPS tracks from SAC-CAS route portal pages. Works with Firefox, Chrome, Brave, and Edge.

## Installation

- **Firefox**: [Mozilla Add-ons](https://addons.mozilla.org/firefox/addon/sac-cas-gps-track/)
- **Chrome/Brave/Edge**: [Chrome Web Store](https://chrome.google.com/webstore) (coming soon)

## Development

### Build

Requires [web-ext](https://github.com/mozilla/web-ext):

```bash
npm install -g web-ext
web-ext build
```

Output: `web-ext-artifacts/sac_cas_gps_track-{version}.zip`

### Lint

```bash
web-ext lint
```

### Publishing

**Firefox Add-ons (AMO):**
1. Build the extension: `web-ext build --overwrite-dest`
2. Upload at [AMO Developer Hub](https://addons.mozilla.org/developers/addon/sac-cas-gps-track/versions/submit/)

**Chrome Web Store:**
1. Build the extension: `web-ext build --overwrite-dest`
2. Upload at [Chrome Developer Dashboard](https://chrome.google.com/webstore/devcenter)
3. Note: Same package works for Chrome, Brave, and Edge

## Links

- https://github.com/daald/sac-swissgrid-gps
- https://github.com/ValentinMinder/Swisstopo-WGS84-LV03

## Known Issues

SAC CAS route pages (e.g., https://www.sac-cas.ch/en/huts-and-tours/sac-route-portal/11049/ski_tour/7235) contain multiple segments. The extension creates a GPX file with all segments, but some applications (Strava, Garmin Connect) may only display the first segment.

## License

Open Source (MIT License)
