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

    // Produce every export object IN ORDER (bottom-to-top, same as the live
    // canvas): user image → frame → text. Images are cloned async; text is
    // rebuilt synchronously (so the typed text is guaranteed). Only AFTER all
    // are ready do we add them to temp — otherwise the order would get scrambled
    // (async images could land on top of the text and hide it).
    const producers = canvas.getObjects().map(obj => {
      if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') {
        return Promise.resolve(new fabric.Text(obj.text, {
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

    Promise.all(producers).then(items => {
      items.forEach(item => temp.add(item));
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
