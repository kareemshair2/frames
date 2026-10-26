/* ========================================
   FRAME STUDIO — Export (V3)
   Uses canvas + frameConfig from Editor.
   Downloads via toBlob + objectURL (reliable
   for large images; multi-MB data: URLs can
   silently fail). Reports real success/errors.
   ======================================== */

'use strict';

const Export = (() => {
  function getCanvas() { return Editor.getCanvas(); }
  function getConfig() { return Editor.getFrameConfig(); }

  // Produce every export object IN ORDER (bottom-to-top, same as the live
  // canvas): user image → frame → text. Images are cloned async; text is
  // rebuilt synchronously (so the typed text is guaranteed). Only AFTER all
  // are ready do we add them to temp — otherwise the order would get scrambled.
  function buildItems(scale) {
    const canvas = getCanvas();
    const producers = canvas.getObjects().map(obj => {
      if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
        // Read the string from the live input field (source of truth for what
        // the user typed), falling back to the object's own text.
        let typed = obj.text || '';
        if (obj.id && !typed) {
          const inp = document.getElementById('input-' + obj.id);
          if (inp && inp.value) typed = inp.value;
        }
        return Promise.resolve(new fabric.Text(typed, {
          left: obj.left * scale,
          top: obj.top * scale,
          fontSize: +obj.fontSize,
          fontFamily: obj.fontFamily,
          fontWeight: obj.fontWeight || 'normal',
          fill: obj.fill,
          textAlign: obj.textAlign || 'center',
          originX: obj.originX || 'center',
          originY: obj.originY || 'center'
        }));
      }
      return new Promise(resolve => {
        obj.clone(clone => {
          clone.set({
            left: obj.left * scale,
            top: obj.top * scale,
            scaleX: obj.scaleX * scale,
            scaleY: obj.scaleY * scale
          });
          resolve(clone);
        });
      });
    });
    return Promise.all(producers);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser time to begin the download before freeing the URL.
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // Returns a Promise that resolves when the download has been triggered.
  function exportImage(format, filename) {
    return new Promise((resolve, reject) => {
      const canvas = getCanvas();
      if (!canvas) { reject(new Error('الكانفس غير جاهز')); return; }

      const cfg = getConfig();
      const fw = cfg ? cfg.canvasWidth : 928;
      const fh = cfg ? cfg.canvasHeight : 1152;

      const temp = new fabric.StaticCanvas(document.createElement('canvas'));
      temp.setDimensions({ width: fw, height: fh });
      temp.backgroundColor = '#ffffff';

      // Logical width of the on-screen canvas, independent of zoom + HiDPI/retina.
      const nativeWidth = canvas.width / canvas.getZoom();
      const scale = fw / nativeWidth;

      buildItems(scale).then(items => {
        items.forEach(item => temp.add(item));
        temp.renderAll();

        const lower = temp.lowerCanvasEl;
        const name = filename || ('frame-studio-' + Date.now() + '.' + format);
        const mime = format === 'png' ? 'image/png' : 'image/jpeg';
        const quality = format === 'png' ? undefined : 0.95;

        const onBlob = (blob) => {
          temp.dispose();
          if (!blob) { reject(new Error('تعذّر إنشاء ملف الصورة')); return; }
          try { downloadBlob(blob, name); resolve(); }
          catch (e) { reject(e); }
        };

        if (lower.toBlob) {
          lower.toBlob(onBlob, mime, quality);
        } else {
          // Very old browsers: fall back to a data URL round-trip.
          const dataUrl = temp.toDataURL({ format: format === 'png' ? 'png' : 'jpeg', quality: 0.95 });
          fetch(dataUrl).then(r => r.blob()).then(onBlob).catch(reject);
        }
      }).catch(err => { temp.dispose(); reject(err); });
    });
  }

  function init() {
    const btnPNG = document.getElementById('btnExportPNG');
    const btnJPG = document.getElementById('btnExportJPG');
    const btnShare = document.getElementById('btnShare');

    if (btnPNG) btnPNG.addEventListener('click', () => {
      if (!getCanvas()) return;
      exportImage('png')
        .then(() => App.showToast('تم تحميل الصورة PNG', 'success'))
        .catch(e => App.showToast('فشل التصدير — ' + (e.message || e), 'error'));
    });

    if (btnJPG) btnJPG.addEventListener('click', () => {
      if (!getCanvas()) return;
      exportImage('jpg')
        .then(() => App.showToast('تم تحميل الصورة JPG', 'success'))
        .catch(e => App.showToast('فشل التصدير — ' + (e.message || e), 'error'));
    });

    if (btnShare) btnShare.addEventListener('click', async () => {
      const canvas = getCanvas();
      if (!canvas) return;
      if (navigator.share) {
        try {
          const blob = await new Promise((res, rej) =>
            canvas.lowerCanvasEl.toBlob(b => b ? res(b) : rej(new Error('blob')), 'image/png'));
          const files = [new File([blob], 'frame-studio.png', { type: 'image/png' })];
          if (navigator.canShare && navigator.canShare({ files })) {
            await navigator.share({ files });
            return;
          }
        } catch (e) { /* fallback to download */ }
      }
      exportImage('png')
        .then(() => App.showToast('تم تحميل الصورة PNG', 'success'))
        .catch(e => App.showToast('فشلت المشاركة — ' + (e.message || e), 'error'));
    });
  }

  return { init, exportImage };
})();

document.addEventListener('DOMContentLoaded', Export.init);
