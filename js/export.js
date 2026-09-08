/* ========================================
   FRAME STUDIO — Export (V2)
   Uses canvas + frameConfig from Editor
   ======================================== */

'use strict';

const Export = (() => {
  function getCanvas() { return Editor.getCanvas(); }
  function getConfig() { return Editor.getFrameConfig(); }

  function exportImage(format, filename) {
    const canvas = getCanvas();
    if (!canvas) return;

    const cfg = getConfig();
    const fw = cfg ? cfg.canvasWidth : 928;
    const fh = cfg ? cfg.canvasHeight : 1152;

    const temp = new fabric.StaticCanvas(document.createElement('canvas'));
    temp.setDimensions({ width: fw, height: fh });
    temp.backgroundColor = '#ffffff';

    // Logical width of the on-screen canvas, independent of zoom + HiDPI/retina.
    const nativeWidth = canvas.width / canvas.getZoom();
    const scale = fw / nativeWidth;

    // fabric.Image.clone() is asynchronous (image reload), so collect every
    // clone and wait for them all before rendering — otherwise the frame is
    // missing from the exported image.
    const tasks = canvas.getObjects().map(obj => new Promise(resolve => {
      obj.clone(clone => {
        clone.set({
          left: obj.left * scale,
          top: obj.top * scale,
          scaleX: obj.scaleX * scale,
          scaleY: obj.scaleY * scale
        });
        temp.add(clone);
        resolve();
      });
    }));

    Promise.all(tasks).then(() => {
      const url = format === 'png'
        ? temp.toDataURL({ format: 'png', multiplier: 1 })
        : temp.toDataURL({ format: 'jpeg', quality: 0.95 });

      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'frame-studio-' + Date.now() + '.' + format;
      a.click();
      temp.dispose();
    });
  }

  function init() {
    const btnPNG = document.getElementById('btnExportPNG');
    const btnJPG = document.getElementById('btnExportJPG');
    const btnShare = document.getElementById('btnShare');

    if (btnPNG) btnPNG.addEventListener('click', () => {
      if (!getCanvas()) return;
      exportImage('png');
      App.showToast('تم تحميل الصورة PNG', 'success');
    });

    if (btnJPG) btnJPG.addEventListener('click', () => {
      if (!getCanvas()) return;
      exportImage('jpg');
      App.showToast('تم تحميل الصورة JPG', 'success');
    });

    if (btnShare) btnShare.addEventListener('click', async () => {
      if (!getCanvas()) return;
      const canvas = getCanvas();
      if (navigator.share) {
        try {
          const blob = await (await fetch(canvas.toDataURL({ format: 'png' }))).blob();
          const files = [new File([blob], 'frame-studio.png', { type: 'image/png' })];
          if (navigator.canShare && navigator.canShare({ files })) {
            await navigator.share({ files });
            return;
          }
        } catch (e) { /* fallback */ }
      }
      exportImage('png');
    });
  }

  return { init, exportImage };
})();

document.addEventListener('DOMContentLoaded', Export.init);
