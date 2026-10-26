/* ========================================
   FRAME STUDIO — Frame System (V2)
   Loads frames from local frames.json,
   falls back to built-in data for file://
   ======================================== */

'use strict';

const FramesManager = (() => {
  let framesData = [];
  let selectedFrame = null;

  const BUILT_IN_FRAMES = [
    {
      id: 'frame2',
      name: '\u0645\u0634\u0627\u0631\u0643\u0629 \u0641\u064A \u0643\u0627\u0645\u0628 \u062C\u0630\u0648\u0631',
      image: 'assets/frames/frame2.png',
      canvasWidth: 2048,
      canvasHeight: 2048,
      photoArea: { x: 636, y: 408, width: 776, height: 824 },
      textColors: ['#014976', '#FFFFFF'],
      text: {
        name: { x: 1024, y: 1280, fontSize: 60, fontWeight: 'bold', color: '#FFFFFF', align: 'center', letterSpacing: 0 }
      }
    },
    {
      id: 'codemakers',
      name: 'The Code Makers Journey',
      image: 'assets/frames/codemakers.png',
      canvasWidth: 2500,
      canvasHeight: 2500,
      photoArea: { x: 877, y: 881, width: 748, height: 748 },
      textColors: ['#FFFFFF', '#FBAE42'],
      text: {
        name: { x: 1250, y: 1873, fontSize: 72, fontWeight: 'bold', color: '#FFFFFF', align: 'center', label: '\u0627\u0644\u0627\u0633\u0645', placeholder: '\u0623\u062F\u062E\u0644 \u0627\u0633\u0645\u0643' },
        role: { x: 1250, y: 2036, fontSize: 52, fontWeight: 'bold', color: '#FFFFFF', align: 'center', label: '\u0627\u0644\u0639\u0636\u0648\u064A\u0629', value: 'Code Makers member' },
        track: { x: 1250, y: 2200, fontSize: 50, fontWeight: 'bold', color: '#FFFFFF', align: 'center', label: '\u0627\u0644\u062A\u0631\u0627\u0643', options: ['Data analysis-Season1', 'UI/UX-Season1', 'Backend-Season'] }
      }
    }
  ];

  // On file:// the browser taints the canvas for any <img> loaded from a
  // relative path, which blocks toBlob/toDataURL on export. Loading the frame
  // as an inline base64 data URL avoids the taint. We only pull in the (large)
  // embedded data file when actually running from file://; over http(s) the
  // normal image files are used and this is never loaded.
  function isFileProtocol() {
    return location.protocol === 'file:';
  }

  function loadEmbeddedData() {
    if (window.FRAME_DATA) return Promise.resolve(window.FRAME_DATA);
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'js/frames-data.js';
      s.onload = () => resolve(window.FRAME_DATA || {});
      s.onerror = () => { console.warn('Could not load js/frames-data.js'); resolve({}); };
      document.head.appendChild(s);
    });
  }

  function applyEmbeddedData() {
    if (!isFileProtocol()) return Promise.resolve();
    return loadEmbeddedData().then((data) => {
      if (!data) return;
      framesData.forEach(frame => {
        if (data[frame.id]) frame.dataUrl = data[frame.id];
      });
    });
  }

  async function loadFrames() {
    try {
      const resp = await fetch('config/frames.json');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const parsed = await resp.json();
      framesData = (Array.isArray(parsed) && parsed.length) ? parsed : BUILT_IN_FRAMES;
    } catch (e) {
      console.warn('Could not load config/frames.json, using built-in frames:', e.message);
      framesData = BUILT_IN_FRAMES;
    }
    await applyEmbeddedData();
  }

  function renderFrameCards(container, onSelect) {
    if (!container || !framesData.length) return;
    container.innerHTML = '';

    framesData.forEach(frame => {
      const card = document.createElement('div');
      card.className = 'frame-card';
      card.dataset.frameId = frame.id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', '\u0627\u062E\u062A\u0631 ' + frame.name);

      const imgSrc = frame.dataUrl || frame.image;

      card.innerHTML =
        '<div class="frame-card__img">' +
          '<img src="' + imgSrc + '" alt="' + frame.name + '" loading="lazy">' +
        '</div>' +
        '<div class="frame-card__label">' + frame.name + '</div>';

      card.addEventListener('click', () => {
        container.querySelectorAll('.frame-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        if (onSelect) onSelect(frame);
      });
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          container.querySelectorAll('.frame-card').forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          if (onSelect) onSelect(frame);
        }
      });

      container.appendChild(card);
    });
  }

  function getAll() { return framesData; }
  function getSelectedFrame() { return selectedFrame; }

  return { loadFrames, renderFrameCards, getAll, getSelectedFrame };
})();
