// Plugin logic: expects __ICON_MAP__, __ICON_NAMES__, __ICON_MAP_STROKE__ (injected by build from Lucide Icons).
(function() {

  function rgbToFigma(c) {
    return { r: c.r / 255, g: c.g / 255, b: c.b / 255 };
  }

  function rgbToHex(c) {
    function h(n) {
      var s = Math.max(0, Math.min(255, n | 0)).toString(16);
      return s.length === 1 ? '0' + s : s;
    }
    return '#' + h(c.r) + h(c.g) + h(c.b);
  }

  function patchSvgForStyle(svg, payload) {
    // Prefer baking stroke style into SVG to avoid per-node async styling work.
    var hex = rgbToHex(payload.strokeColor || { r: 0, g: 0, b: 0 });
    var w = String(payload.strokeWeight != null ? payload.strokeWeight : 2);

    var out = svg;

    // Ensure root <svg> has desired stroke + stroke-width (override if present).
    out = out.replace(/<svg\b([^>]*)>/, function(match, attrs) {
      var a = attrs || '';
      if (/stroke="[^"]*"/.test(a)) a = a.replace(/stroke="[^"]*"/, 'stroke="' + hex + '"');
      else a += ' stroke="' + hex + '"';

      if (/stroke-width="[^"]*"/.test(a)) a = a.replace(/stroke-width="[^"]*"/, 'stroke-width="' + w + '"');
      else a += ' stroke-width="' + w + '"';

      return '<svg' + a + '>';
    });

    // Some SVGs may also specify stroke on children; normalize common Lucide pattern.
    out = out.replace(/stroke="currentColor"/g, 'stroke="' + hex + '"');
    return out;
  }

  var stretchBrushesLoaded = false;
  async function ensureStretchBrushesLoaded() {
    if (stretchBrushesLoaded) return;
    await figma.loadBrushesAsync('STRETCH');
    stretchBrushesLoaded = true;
  }

  var STRETCH_BRUSH_NAMES = ['HEIST', 'BIOPIC', 'EPIC', 'VERITE', 'PROPAGANDA'];
  function isStretchBrush(name) {
    return name && STRETCH_BRUSH_NAMES.indexOf(name) !== -1;
  }

  async function insertIcon(payload) {
    var svg = (typeof __ICON_MAP_STROKE__ !== 'undefined' && __ICON_MAP_STROKE__[payload.iconName])
      ? __ICON_MAP_STROKE__[payload.iconName]
      : (__ICON_MAP__ && __ICON_MAP__[payload.iconName]);
    if (!svg) {
      figma.notify('Icon not found: ' + payload.iconName);
      return;
    }

    try {
      var useBrush = isStretchBrush(payload.strokeStyle);
      if (useBrush) await ensureStretchBrushesLoaded();

      var styledSvg = patchSvgForStyle(svg, payload);
      var frame = figma.createNodeFromSvg(styledSvg);
      var vectors = frame.findAll(function(n) { return n.type === 'VECTOR'; });

      for (var i = 0; i < vectors.length; i++) {
        vectors[i].strokeAlign = 'CENTER';
        if (useBrush) {
          vectors[i].complexStrokeProperties = {
            type: 'BRUSH',
            brushType: 'STRETCH',
            brushName: payload.strokeStyle,
            direction: 'FORWARD'
          };
        }
      }

      var baseSize = 24;
      var scale = payload.scale / baseSize;
      frame.resize(frame.width * scale, frame.height * scale);

      frame.x = figma.viewport.center.x - (frame.width / 2);
      frame.y = figma.viewport.center.y - (frame.height / 2);
      figma.currentPage.appendChild(frame);
      figma.currentPage.selection = [frame];
      figma.viewport.scrollAndZoomIntoView([frame]);
      figma.notify('Icon inserted');
    } catch (e) {
      figma.notify('Insert failed: ' + (e.message || String(e)));
    }
  }

  figma.showUI(__html__, { width: 560, height: 640, themeColors: true });

  // Start loading brushes immediately so first insert with a brush is fast
  ensureStretchBrushesLoaded().catch(function() {});

  figma.ui.onmessage = async function(msg) {
    if (msg.type === 'close') {
      figma.closePlugin();
      return;
    }
    if (msg.type === 'insert' && msg.payload) {
      try {
        await insertIcon(msg.payload);
      } finally {
        figma.ui.postMessage({ type: 'insertDone' });
      }
      return;
    }
    if (msg.type === 'preloadBrushes' && msg.payload && msg.payload.strokeStyle) {
      if (isStretchBrush(msg.payload.strokeStyle)) {
        await ensureStretchBrushesLoaded();
      }
      return;
    }
    if (msg.type === 'getIconNames') {
      var names = (__ICON_NAMES__ && __ICON_NAMES__.length) ? __ICON_NAMES__ : (Object.keys(__ICON_MAP__ || {}).sort());
      figma.ui.postMessage({ type: 'iconNames', iconNames: names });
      return;
    }
    if (msg.type === 'getSvg' && msg.payload && msg.payload.iconName) {
      var name = msg.payload.iconName;
      var svg = (__ICON_MAP__ && __ICON_MAP__[name]) || '';
      figma.ui.postMessage({ type: 'svg', iconName: name, svg: svg });
    }
  };
})();
