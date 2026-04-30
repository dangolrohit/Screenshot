const SEEN_KEY = 'fpss_v2_seen';

const HINTS = {
  png:  '<b>Lossless</b> — pixel-perfect, no compression. Best for text, UI &amp; line art.',
  webp: '<b>Recommended ✦</b> — excellent quality at ~half the size of PNG.',
  jpeg: '<b>Smallest file</b> — great for photos and easy sharing. Adjust quality below.',
};

document.addEventListener('DOMContentLoaded', () => {
  const introScreen = document.getElementById('introScreen');
  const mainScreen  = document.getElementById('mainScreen');
  const startBtn    = document.getElementById('startBtn');

  // ── Route to intro or main ────────────────────────────────────────────────
  if (localStorage.getItem(SEEN_KEY)) {
    introScreen.style.display = 'none';
    revealMain();
  } else {
    startBtn.addEventListener('click', () => {
      introScreen.classList.add('out');
      introScreen.addEventListener('animationend', () => {
        introScreen.style.display = 'none';
        localStorage.setItem(SEEN_KEY, '1');
        revealMain();
      }, { once: true });
    });
  }

  function revealMain() {
    mainScreen.classList.add('show');
    bootMain();
  }

  // ── Main screen ───────────────────────────────────────────────────────────
  function bootMain() {
    const captureBtn  = document.getElementById('captureBtn');
    const progressWrap = document.getElementById('progressWrap');
    const progressFill = document.getElementById('progressFill');
    const statusTxt    = document.getElementById('statusTxt');
    const fmtHint      = document.getElementById('fmtHint');
    const qlSection    = document.getElementById('qlSection');
    const qlSlider     = document.getElementById('qlSlider');
    const qlVal        = document.getElementById('qlVal');
    const fmtRadios    = document.querySelectorAll('input[name="fmt"]');

    chrome.runtime.connect({ name: 'popup-keepalive' });

    // ── Format ──────────────────────────────────────────────────────────────
    function currentFmt() {
      return document.querySelector('input[name="fmt"]:checked').value;
    }

    function syncFormat() {
      const f = currentFmt();
      fmtHint.innerHTML = HINTS[f];
      qlSection.classList.toggle('hidden', f === 'png');
    }

    fmtRadios.forEach(r => r.addEventListener('change', syncFormat));
    syncFormat();

    // ── Quality slider ───────────────────────────────────────────────────────
    function syncSlider() {
      const pct = ((qlSlider.value - 60) / 40) * 100;
      qlSlider.style.background =
        `linear-gradient(to right,var(--accent) ${pct}%,var(--dim) ${pct}%)`;
      qlVal.textContent = qlSlider.value + '%';
    }
    qlSlider.addEventListener('input', syncSlider);
    syncSlider();

    // ── Capture ──────────────────────────────────────────────────────────────
    captureBtn.addEventListener('click', () => {
      const format  = currentFmt();
      const quality = parseInt(qlSlider.value, 10);

      captureBtn.disabled = true;
      progressWrap.style.display = 'block';
      setProgress(5);
      setStatus('Starting…', '');

      const onMsg = (msg) => {
        if (msg.action === 'captureProgress') {
          setProgress(msg.progress);
          setStatus(msg.message, '');
        }
      };
      chrome.runtime.onMessage.addListener(onMsg);

      chrome.runtime.sendMessage({ action: 'startScreenshot', format, quality }, (res) => {
        chrome.runtime.onMessage.removeListener(onMsg);
        if (chrome.runtime.lastError) {
          setStatus(chrome.runtime.lastError.message, 'err');
          captureBtn.disabled = false;
          return;
        }
        if (res && res.success) {
          setProgress(100);
          setStatus('Saved — ' + res.filename, 'ok');
          setTimeout(() => window.close(), 2800);
        } else {
          setStatus((res && res.error) || 'Something went wrong.', 'err');
          captureBtn.disabled = false;
        }
      });
    });

    function setProgress(p) { progressFill.style.width = p + '%'; }
    function setStatus(msg, cls) {
      statusTxt.textContent = msg;
      statusTxt.className   = cls;
    }
  }
});
