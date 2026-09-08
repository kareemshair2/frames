/* ========================================
   FRAME STUDIO — Editor Core (V2)
   Layer order:
     [0] User Image
     [1] Frame
     [2+] Text
   ======================================== */

'use strict';

const Editor = (() => {
  let canvas = null;
  let userImage = null;
  let frameImage = null;
  let textObjects = { name: null, title: null, details: null };
  let currentStep = 1;
  let frameConfig = null;

  const el = {};

  function cache() {
    [
      'editorCanvas','canvasContainer','canvasEmpty','canvasControls',
      'uploadZone','fileInput','uploadPreview','previewImg','removeImage',
      'framesGrid','inputName','inputTitle','inputDetails',
      'btnNext','btnPrev','mobileNext','mobilePrev',
      'zoomSlider','zoomValue','zoomIn','zoomOut','resetImage',
      'nameFontSize','titleFontSize','detailsFontSize',
      'nameFontSizeVal','titleFontSizeVal','detailsFontSizeVal',
      'textColorOptions','alignOptions'
    ].forEach(id => { el[id] = document.getElementById(id); });
  }

  /* ===== CANVAS ===== */
  function initCanvas() {
    canvas = new fabric.Canvas('editorCanvas', {
      backgroundColor: '#e8e6e1',
      preserveObjectStacking: true,
      selection: false
    });
    fitCanvas();
    window.addEventListener('resize', fitCanvas);
  }

  function fitCanvas() {
    if (!canvas) return;
    const area = document.getElementById('canvasArea');
    if (!area) return;
    const fw = frameConfig ? frameConfig.canvasWidth : 928;
    const fh = frameConfig ? frameConfig.canvasHeight : 1152;
    const cs = getComputedStyle(area);
    const padBottom = parseFloat(cs.paddingBottom) || 0;
    const gap = 24;
    const availW = Math.max(area.clientWidth - 12, 50);
    const availH = Math.max(area.clientHeight - padBottom - gap, 50);
    const s = Math.min(availW / fw, availH / fh, 1);
    canvas.setDimensions({ width: Math.floor(fw * s), height: Math.floor(fh * s) });
    canvas.setZoom(s);
    canvas.renderAll();
  }

  /* ===== STEPS ===== */
  function goToStep(step) {
    if (step < 1 || step > 4) return;
    currentStep = step;
    document.querySelectorAll('.sidebar__panel').forEach(p =>
      p.classList.toggle('active', +p.dataset.panel === step)
    );
    document.querySelectorAll('.step-pill').forEach(b => {
      const s = +b.dataset.step;
      b.classList.toggle('active', s === step);
      b.classList.toggle('done', s < step);
    });
    if (el.btnPrev) el.btnPrev.style.display = step > 1 ? '' : 'none';
    if (el.mobilePrev) el.mobilePrev.style.display = step > 1 ? '' : 'none';
    if (el.btnNext) el.btnNext.style.display = step === 4 ? 'none' : '';
    if (el.mobileNext) el.mobileNext.style.display = step === 4 ? 'none' : '';
  }

  /* ===== UPLOAD ===== */
  function initUpload() {
    el.uploadZone.addEventListener('click', () => el.fileInput.click());
    el.uploadZone.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.fileInput.click(); }
    });
    el.uploadZone.addEventListener('dragover', e => { e.preventDefault(); el.uploadZone.classList.add('dragover'); });
    el.uploadZone.addEventListener('dragleave', () => el.uploadZone.classList.remove('dragover'));
    el.uploadZone.addEventListener('drop', e => {
      e.preventDefault(); el.uploadZone.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    el.fileInput.addEventListener('change', () => { if (el.fileInput.files[0]) handleFile(el.fileInput.files[0]); });
    el.removeImage.addEventListener('click', removeImage);
  }

  function handleFile(file) {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      App.showToast('صيغة غير مدعومة', 'error'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      App.showToast('الملف كبير جدًا — الحد 10MB', 'error'); return;
    }
    const r = new FileReader();
    r.onload = e => {
      placeUserImage(e.target.result);
      el.uploadZone.style.display = 'none';
      el.uploadPreview.style.display = '';
      el.previewImg.src = e.target.result;
      el.canvasEmpty.style.display = 'none';
      el.canvasContainer.style.display = '';
      el.canvasControls.style.display = '';
      App.showToast('تم رفع الصورة بنجاح', 'success');
    };
    r.readAsDataURL(file);
  }

  /* ===== USER IMAGE ===== */
  function placeUserImage(src) {
    fabric.Image.fromURL(src, img => {
      if (userImage) canvas.remove(userImage);
      userImage = img;

      const pa = frameConfig
        ? frameConfig.photoArea
        : { x: 273, y: 290, width: 385, height: 573 };

      const scX = pa.width / img.width;
      const scY = pa.height / img.height;
      const sc = Math.max(scX, scY);

      img.set({
        left: pa.x + pa.width / 2,
        top: pa.y + pa.height / 2,
        originX: 'center',
        originY: 'center',
        scaleX: sc,
        scaleY: sc,
        selectable: true,
        hasControls: true,
        hasBorders: true,
        borderColor: '#FBAE42',
        cornerColor: '#014976',
        cornerSize: 10,
        transparentCorners: false
      });

      canvas.add(img);
      canvas.sendToBack(img);
      restack();
      canvas.renderAll();
      updateZoom(100);
      App.showToast('حرّك الصورة لتظهر في الفتحة', 'info');
    });
  }

  function removeImage() {
    if (userImage) { canvas.remove(userImage); userImage = null; }
    el.uploadZone.style.display = '';
    el.uploadPreview.style.display = 'none';
    if (el.canvasContainer) el.canvasContainer.style.display = '';
    if (el.canvasControls) el.canvasControls.style.display = '';
    el.fileInput.value = '';
  }

  /* ===== FRAME ===== */
  function initFrameSelector() {
    FramesManager.renderFrameCards(el.framesGrid, frame => {
      frameConfig = frame;
      loadFrame(frame);
    });
  }

  function loadFrame(frame) {
    const src = frame.dataUrl || frame.image;
    fabric.Image.fromURL(src, img => {
      if (frameImage) canvas.remove(frameImage);
      frameImage = img;

      if (!frameConfig.canvasWidth) frameConfig.canvasWidth = img.width;
      if (!frameConfig.canvasHeight) frameConfig.canvasHeight = img.height;

      const fw = frameConfig.canvasWidth;
      const fh = frameConfig.canvasHeight;

      img.set({
        left: 0, top: 0,
        scaleX: fw / img.width,
        scaleY: fh / img.height,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false
      });

      canvas.add(img);
      restack();

      if (el.canvasEmpty) el.canvasEmpty.style.display = 'none';
      if (el.canvasContainer) el.canvasContainer.style.display = '';
      if (el.canvasControls) el.canvasControls.style.display = '';

      canvas.renderAll();
      fitCanvas();
      createTexts(frameConfig);
      updateFormFieldVisibility(frameConfig);

      if (userImage) repositionImage();
    });
  }

  function repositionImage() {
    if (!userImage || !frameConfig) return;
    const pa = frameConfig.photoArea;
    const nat = userImage._element;
    const scX = pa.width / nat.naturalWidth;
    const scY = pa.height / nat.naturalHeight;
    const sc = Math.max(scX, scY);
    userImage.set({
      left: pa.x + pa.width / 2,
      top: pa.y + pa.height / 2,
      originX: 'center', originY: 'center',
      scaleX: sc, scaleY: sc
    });
    canvas.renderAll();
  }

  function restack() {
    if (userImage) canvas.sendToBack(userImage);
    if (frameImage) canvas.bringToFront(frameImage);
    Object.values(textObjects).forEach(t => { if (t) canvas.bringToFront(t); });
  }

  /* ===== TEXT ===== */
  function createTexts(frame) {
    Object.keys(textObjects).forEach(k => {
      if (textObjects[k]) { canvas.remove(textObjects[k]); textObjects[k] = null; }
    });
    if (!frame || !frame.text) return;

    const defs = {
      name:    { size: 42, weight: 'bold',   color: '#014976' },
      title:   { size: 28, weight: 'normal', color: '#012d4f' },
      details: { size: 24, weight: 'bold',   color: '#FFFFFF' }
    };

    Object.keys(frame.text).forEach(key => {
      const cfg = frame.text[key];
      const d = defs[key] || {};
      const inp = el[key === 'name' ? 'inputName' : key === 'title' ? 'inputTitle' : 'inputDetails'];
      const val = (inp && inp.value) ? inp.value : '';

      const t = new fabric.Text(val, {
        left: cfg.x,
        top: cfg.y,
        fontSize: cfg.fontSize || d.size,
        fontFamily: 'Cairo, Tajawal, sans-serif',
        fontWeight: cfg.fontWeight || d.weight,
        fill: cfg.color || d.color,
        textAlign: cfg.align || 'center',
        originX: 'center', originY: 'center',
        selectable: true, evented: true,
        hasControls: true, hasBorders: true,
        borderColor: '#FBAE42',
        cornerColor: '#014976',
        cornerSize: 10,
        transparentCorners: false,
        lockRotation: true
      });

      textObjects[key] = t;
      canvas.add(t);
      canvas.bringToFront(t);
    });
    canvas.renderAll();
    syncSliders();
  }

  function updateText(key, val) {
    if (textObjects[key]) { textObjects[key].set('text', val || ''); canvas.renderAll(); }
  }

  function updateFormFieldVisibility(cfg) {
    const has = cfg && cfg.text ? cfg.text : {};
    document.querySelectorAll('[data-text-field]').forEach(group => {
      const field = group.dataset.textField;
      group.style.display = has[field] ? '' : 'none';
    });
  }

  function syncSliders() {
    if (!frameConfig || !frameConfig.text) return;
    const c = frameConfig.text;
    if (c.name && el.nameFontSize) { el.nameFontSize.value = c.name.fontSize; el.nameFontSizeVal.textContent = c.name.fontSize + 'px'; }
    if (c.title && el.titleFontSize) { el.titleFontSize.value = c.title.fontSize; el.titleFontSizeVal.textContent = c.title.fontSize + 'px'; }
    if (c.details && el.detailsFontSize) { el.detailsFontSize.value = c.details.fontSize; el.detailsFontSizeVal.textContent = c.details.fontSize + 'px'; }
  }

  function initTextInputs() {
    el.inputName.addEventListener('input', () => updateText('name', el.inputName.value));
    el.inputTitle.addEventListener('input', () => updateText('title', el.inputTitle.value));
    el.inputDetails.addEventListener('input', () => updateText('details', el.inputDetails.value));

    el.nameFontSize.addEventListener('input', () => {
      const v = +el.nameFontSize.value; el.nameFontSizeVal.textContent = v + 'px';
      if (textObjects.name) { textObjects.name.set('fontSize', v); canvas.renderAll(); }
    });
    el.titleFontSize.addEventListener('input', () => {
      const v = +el.titleFontSize.value; el.titleFontSizeVal.textContent = v + 'px';
      if (textObjects.title) { textObjects.title.set('fontSize', v); canvas.renderAll(); }
    });
    el.detailsFontSize.addEventListener('input', () => {
      const v = +el.detailsFontSize.value; el.detailsFontSizeVal.textContent = v + 'px';
      if (textObjects.details) { textObjects.details.set('fontSize', v); canvas.renderAll(); }
    });

    el.textColorOptions.querySelectorAll('.color-dot').forEach(btn => {
      btn.addEventListener('click', () => {
        el.textColorOptions.querySelectorAll('.color-dot').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Object.values(textObjects).forEach(t => { if (t) t.set('fill', btn.dataset.color); });
        canvas.renderAll();
      });
    });
  }

  /* ===== ZOOM ===== */
  function initZoom() {
    el.zoomSlider.addEventListener('input', () => zoomTo(+el.zoomSlider.value));
    el.zoomIn.addEventListener('click', () => zoomTo(Math.min(+el.zoomSlider.value + 10, 300)));
    el.zoomOut.addEventListener('click', () => zoomTo(Math.max(+el.zoomSlider.value - 10, 10)));
    el.resetImage.addEventListener('click', resetImagePos);
  }

  function zoomTo(pct) {
    updateZoom(pct);
    if (!userImage || !frameConfig) return;
    const pa = frameConfig.photoArea;
    const nat = userImage._element;
    const base = Math.max(pa.width / nat.naturalWidth, pa.height / nat.naturalHeight);
    userImage.set({ scaleX: base * (pct / 100), scaleY: base * (pct / 100) });
    canvas.renderAll();
  }

  function updateZoom(v) { el.zoomSlider.value = v; el.zoomValue.textContent = v + '%'; }

  function resetImagePos() {
    repositionImage();
    updateZoom(100);
    App.showToast('تم إعادة ضبط الصورة', 'info');
  }

  /* ===== NAV ===== */
  function initNav() {
    el.btnNext.addEventListener('click', () => goToStep(currentStep + 1));
    el.btnPrev.addEventListener('click', () => goToStep(currentStep - 1));
    el.mobileNext.addEventListener('click', () => goToStep(currentStep + 1));
    el.mobilePrev.addEventListener('click', () => goToStep(currentStep - 1));
    document.querySelectorAll('.step-pill').forEach(b => {
      b.addEventListener('click', () => {
        const s = +b.dataset.step;
        if (s <= currentStep || b.classList.contains('done')) goToStep(s);
      });
    });
  }

  function getCanvas() { return canvas; }
  function getFrameConfig() { return frameConfig; }

  async function init() {
    cache(); initCanvas(); initUpload();
    initTextInputs(); initZoom(); initNav();
    await FramesManager.loadFrames();
    initFrameSelector();

    const frames = FramesManager.getAll();
    if (frames && frames.length) {
      frameConfig = frames[0];
      loadFrame(frameConfig);
    }

    goToStep(1);
  }

  return { init, getCanvas, getFrameConfig };
})();

document.addEventListener('DOMContentLoaded', Editor.init);
