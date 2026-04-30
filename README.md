# 📷 Full Page Screenshot

> Capture any webpage as a **single, full-length Ultra HD image** — no scrolling, no stitching, one click.

Built by **Rohit Dangol**

---

## What it does

Full Page Screenshot is a minimal Chrome extension that captures the **entire height** of any webpage — from the very top to the very bottom — and saves it as one image file. It does not scroll and stitch; it uses the Chrome DevTools Protocol to expand the viewport to the full page size and capture everything in a single native shot.

---

## Features

- **Single-image capture** — the whole page in one file, no visible seams or joins
- **Ultra HD quality** — captures at native display resolution (2× on HiDPI / Retina screens)
- **Three output formats** — PNG (lossless), WebP (recommended), JPEG (smallest)
- **Adjustable quality** — slider for WebP and JPEG (60 – 100 %)
- **Auto-timestamped filenames** — `fullpage-2026-04-30T14-22-05.webp`
- **Progress bar** — shows each stage of the capture
- **Warm minimal UI** — cozy dark theme, no clutter
- **One-time welcome screen** — introduces the extension on first launch

---

## Screenshots

```
┌─────────────────────────────┐   ┌─────────────────────────────┐
│                             │   │ 📷 Full Page Screenshot     │
│        📷                   │   │    Ultra HD · Single image  │
│                             │   │─────────────────────────────│
│      Welcome to             │   │ FORMAT                      │
│  Full Page Screenshot       │   │ [ PNG ]  [ WebP ✦ ] [ JPEG ]│
│  ─────────────────          │   │                             │
│  by Rohit Dangol            │   │ Recommended ✦ — WebP        │
│                             │   │ excellent quality, half the │
│  Capture any webpage as a   │   │ size of PNG.                │
│  complete single image.     │   │                             │
│                             │   │ QUALITY             90%     │
│  [    Start  ›    ]         │   │ ━━━━━━━━━━━━━░░░░           │
│                             │   │                             │
│  v2.0 · Full page · Single  │   │ [  Capture Full Page  ]     │
└─────────────────────────────┘   └─────────────────────────────┘
        Intro screen                       Main screen
```

---

## Installation

### From source (Developer Mode)

Chrome does not require an account or payment to sideload extensions.

1. **Download or clone this repository**

   ```bash
   git clone https://github.com/rohitdangol/full-page-screenshot.git
   cd full-page-screenshot
   ```

2. **(Optional) Regenerate icons**

   ```bash
   python3 generate_icons.py
   ```

3. **Open Chrome** and go to `chrome://extensions`

4. Enable **Developer mode** (toggle in the top-right corner)

5. Click **Load unpacked** and select the `Screenshot/` folder

6. The 📷 icon will appear in your toolbar — pin it for easy access

### From the Chrome Web Store

> Coming soon — submission in progress.

---

## How to use

1. Navigate to any webpage you want to capture
2. Click the **📷 Full Page Screenshot** icon in the toolbar
3. Choose your **format** (WebP is recommended for most uses)
4. Adjust **quality** if needed (WebP / JPEG only)
5. Click **Capture Full Page**
6. The file is saved automatically to your **Downloads** folder

The popup shows a live progress bar through each stage. Keep it open until "Saved" appears.

---

## Format guide

| Format | Type | Quality control | Best for | Typical size |
|--------|------|----------------|----------|-------------|
| **PNG** | Lossless | — | Text, UI, line art, transparency | Largest |
| **WebP** ✦ | Lossy | Yes (60–100 %) | All-purpose, sharing online | ~50 % smaller than PNG |
| **JPEG** | Lossy | Yes (60–100 %) | Photos, email, storage-constrained | Smallest |

**Recommendation:** Use **WebP at 90 %** for the best balance of quality and file size. Use **PNG** when you need pixel-perfect fidelity or transparency. Use **JPEG** when file size is the top priority or the recipient's software does not support WebP.

---

## How it works

This extension uses the **Chrome DevTools Protocol (CDP)** — the same API that powers Chrome DevTools — to take a true single-shot capture of the full page. There is no scrolling loop.

```
User clicks "Capture"
       │
       ▼
1. chrome.debugger.attach()        — attach CDP to the active tab
       │
       ▼
2. Runtime.evaluate()              — read scrollWidth, scrollHeight, devicePixelRatio
       │
       ▼
3. Emulation.setDeviceMetricsOverride()
                                   — expand the virtual viewport to full page size
                                   — set deviceScaleFactor = native DPR (Ultra HD)
       │
       ▼
4. Page.captureScreenshot()        — ONE call captures the entire page as base64
   { captureBeyondViewport: true }
       │
       ▼
5. Emulation.clearDeviceMetricsOverride()
                                   — restore the original viewport
       │
       ▼
6. chrome.debugger.detach()        — release the tab
       │
       ▼
7. chrome.downloads.download()     — save the file to Downloads
```

### Why CDP instead of scroll-and-stitch?

The classic approach (scroll the page, call `captureVisibleTab` repeatedly, stitch segments on a canvas) has several problems:

- Chrome rate-limits `captureVisibleTab` to ~2 calls per second
- Fixed/sticky elements appear duplicated in each segment
- Canvas stitching introduces visible seams and memory pressure
- It is slow on long pages

The CDP approach has none of these issues. The whole capture takes 1–2 seconds regardless of page length.

### A note on the DevTools banner

While the debugger is attached (roughly 1–2 seconds during capture), Chrome displays a yellow info bar:

> *"[Full Page Screenshot] is debugging this browser"*

This is a Chrome security requirement for any extension that uses the `debugger` API. It cannot be suppressed. It disappears automatically when the capture finishes.

---

## File structure

```
Screenshot/
├── manifest.json        Chrome extension manifest (MV3)
├── background.js        Service worker — all capture logic via CDP
├── popup.html           Extension popup — intro + main UI
├── popup.js             Popup behaviour — routing, format picker, progress
├── generate_icons.py    Script to regenerate PNG icons (Python 3, no deps)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Permissions

| Permission | Why it is needed |
|-----------|-----------------|
| `activeTab` | Access the currently active tab when the user clicks the extension |
| `debugger` | Attach Chrome DevTools Protocol to the tab to capture the full page |
| `downloads` | Save the captured image file to the user's Downloads folder |
| `tabs` | Query the active tab's URL and window ID |

No data leaves your machine. No network requests are made. The image is captured locally and saved directly to Downloads.

---

## Known limitations

| Limitation | Detail |
|-----------|--------|
| **Browser pages** | Cannot capture `chrome://`, `about:`, or DevTools pages |
| **DevTools conflict** | If DevTools is already open for a tab, the debugger cannot attach — close DevTools first |
| **Very large pages** | Pages taller than ~16 000 physical pixels may hit Chrome's internal canvas limits |
| **No background capture** | The popup must stay open for the duration of the capture |
| **Not supported on Edge** | The extension targets Chrome only; Edge may work but is untested |

---

## Development

### Prerequisites

- Chrome 90+ (any modern version)
- Python 3 (only needed to regenerate icons)

### Regenerate icons

```bash
python3 generate_icons.py
# Creates icons/icon16.png, icons/icon48.png, icons/icon128.png
```

### Reset the intro screen

The welcome screen only shows once (stored in `localStorage`). To see it again during development, open the popup, right-click → **Inspect**, then run:

```js
localStorage.clear()
```

Reload the popup.

### Reload after editing

After changing any file, go to `chrome://extensions` and click the **↺ reload** button next to the extension, then reopen the popup.

---

## Contributing

Pull requests are welcome. Please open an issue first if you are planning a larger change.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-change`
3. Commit your changes: `git commit -m "feat: describe what you added"`
4. Push and open a pull request

---

## License

MIT — see [LICENSE](LICENSE) for details.

You are free to use, modify, and distribute this extension. Attribution is appreciated but not required.

---

## Author

**Rohit Dangol**
[github.com/rohitdangol](https://github.com/rohitdangol)

---

## Chrome Web Store listing copy

> The sections below are ready to paste directly into the Chrome Web Store developer dashboard.

### Short description *(132 characters max)*

```
Capture any webpage as a single Ultra HD image — PNG, WebP, or JPEG. One click, no scrolling, no stitching.
```

### Detailed description

```
Full Page Screenshot captures the entire height of any webpage — from the very top to the very bottom — and saves it as one image file.

HOW IT WORKS
Unlike other screenshot tools that scroll and stitch multiple captures together, this extension uses the Chrome DevTools Protocol to take a true single-shot capture. The result is a seamless, pixel-perfect image with no visible seams or duplicated headers.

FORMATS
• PNG  — lossless, perfect for text and UI
• WebP — recommended, excellent quality at half the PNG size
• JPEG — smallest file size, great for photos and sharing

QUALITY CONTROL
For WebP and JPEG you can set the quality level (60–100 %) using a slider before capturing.

ULTRA HD
On HiDPI / Retina displays the output is captured at 2× native resolution, producing crisp 4K-quality images even on very long pages.

PRIVACY
No data leaves your device. No analytics, no servers, no accounts required. Images are saved directly to your Downloads folder.

HOW TO USE
1. Navigate to any webpage
2. Click the 📷 icon in the toolbar
3. Choose PNG, WebP, or JPEG
4. Click "Capture Full Page"
5. The file appears in your Downloads folder automatically

LIMITATIONS
• Cannot capture Chrome internal pages (chrome://, about:)
• If Chrome DevTools is open for the tab, close it before capturing
• The popup must remain open during the capture

Built by Rohit Dangol.
```

---

*Made with care. Capture the whole story.*
