let captureInProgress = false;

// Keep service worker alive while the popup is connected
chrome.runtime.onConnect.addListener((_port) => { /* intentional */ });

// ─── Message router ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'startScreenshot') {
    if (captureInProgress) {
      sendResponse({ success: false, error: 'A capture is already running. Please wait.' });
      return true;
    }
    handleCapture(message.format || 'webp', message.quality || 90)
      .then((result) => sendResponse(result))
      .catch((err)  => {
        console.error('[FullPageShot]', err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep channel open for async response
  }
});

// ─── Core: single-shot full-page capture via Chrome DevTools Protocol ────────

// Map format names to CDP format strings and file extensions
const FORMAT_MAP = {
  png:  { cdp: 'png',  ext: 'png'  },
  webp: { cdp: 'webp', ext: 'webp' },
  jpeg: { cdp: 'jpeg', ext: 'jpg'  },
  jpg:  { cdp: 'jpeg', ext: 'jpg'  },
};

async function handleCapture(formatKey = 'webp', quality = 90) {
  captureInProgress = true;

  const fmt = FORMAT_MAP[formatKey] || FORMAT_MAP.webp;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error('No active tab found.');

  const blocked = ['chrome://', 'chrome-extension://', 'about:', 'edge://', 'devtools://'];
  if (!tab.url || blocked.some((p) => tab.url.startsWith(p))) {
    captureInProgress = false;
    throw new Error('Cannot capture this page type. Navigate to a regular website first.');
  }

  const target = { tabId: tab.id };
  let attached = false;

  try {
    progress(10, 'Connecting to page…');

    try {
      await chrome.debugger.attach(target, '1.3');
      attached = true;
    } catch (err) {
      if (err.message.includes('Another debugger')) {
        throw new Error('DevTools is already open for this tab. Close DevTools and try again.');
      }
      throw err;
    }

    progress(25, 'Measuring full page dimensions…');

    // Read full scroll dimensions and device pixel ratio
    const evalResult = await cdp(target, 'Runtime.evaluate', {
      expression: `JSON.stringify({
        w:   Math.max(document.body.scrollWidth,  document.documentElement.scrollWidth),
        h:   Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
        dpr: window.devicePixelRatio || 1
      })`,
      returnByValue: true,
    });

    if (!evalResult || !evalResult.result || evalResult.result.type !== 'string') {
      throw new Error('Could not read page dimensions.');
    }

    const { w: pageW, h: pageH, dpr } = JSON.parse(evalResult.result.value);
    if (!pageW || !pageH) throw new Error('Page reported zero dimensions.');

    progress(38, `Page is ${pageW} × ${pageH} px — setting viewport…`);

    // Expand the viewport to the full page size so everything renders in one frame.
    // deviceScaleFactor = dpr gives native (Ultra HD on HiDPI) resolution.
    await cdp(target, 'Emulation.setDeviceMetricsOverride', {
      width:             Math.ceil(pageW),
      height:            Math.ceil(pageH),
      deviceScaleFactor: dpr,
      mobile:            false,
      screenWidth:       Math.ceil(pageW),
      screenHeight:      Math.ceil(pageH),
    });

    // Scroll to top and let the page settle after the viewport change
    await cdp(target, 'Runtime.evaluate', { expression: 'window.scrollTo(0,0)', returnByValue: true });
    await sleep(450);

    progress(60, `Capturing full-page screenshot as ${fmt.ext.toUpperCase()}…`);

    // Single CDP call — captures the entire viewport (= full page) as one image
    const shotParams = {
      format:                fmt.cdp,
      captureBeyondViewport: true,
      fromSurface:           true,
    };
    // Quality only applies to lossy formats (jpeg, webp); ignored for png
    if (fmt.cdp !== 'png') shotParams.quality = Math.max(0, Math.min(100, quality));

    const shot = await cdp(target, 'Page.captureScreenshot', shotParams);

    if (!shot || !shot.data) throw new Error('captureScreenshot returned no data.');

    progress(82, 'Restoring page viewport…');
    await cdp(target, 'Emulation.clearDeviceMetricsOverride').catch(() => {});

    progress(91, 'Saving file…');

    const ts       = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `fullpage-${ts}.${fmt.ext}`;
    const mimeType = fmt.cdp === 'jpeg' ? 'image/jpeg' : `image/${fmt.cdp}`;
    const dataUrl  = `data:${mimeType};base64,` + shot.data;

    await new Promise((resolve, reject) => {
      chrome.downloads.download({ url: dataUrl, filename, saveAs: false }, (id) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(id);
      });
    });

    progress(100, 'Saved!');
    return { success: true, filename };

  } finally {
    captureInProgress = false;
    if (attached) await chrome.debugger.detach(target).catch(() => {});
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cdp(target, method, params = {}) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand(target, method, params, (result) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(result);
    });
  });
}

function progress(pct, msg) {
  chrome.runtime.sendMessage({ action: 'captureProgress', progress: pct, message: msg })
    .catch(() => {}); // Ignore if popup is closed
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
