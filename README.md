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


## Installation

### From source (Developer Mode)

Chrome does not require an account or payment to sideload extensions.

1. **Download or clone this repository**

   ```bash
   git clone https://github.com/dangolrohit/screenshot.git
   cd screenshot
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

## License

MIT — see [LICENSE](LICENSE) for details.

You are free to use, modify, and distribute this extension. Attribution is appreciated but not required.

---

*Made with care. Capture the whole story.*
