// Plugin logic: expects __ICON_MAP__, __ICON_NAMES__, __ICON_MAP_STROKE__ (injected by build from Lucide Icons).
(function() {

  function rgbToFigma(c) {
    return { r: c.r / 255, g: c.g / 255, b: c.b / 255 };
  }

  async function applyIconStyle(node, payload) {
    var paint = { type: 'SOLID', color: rgbToFigma(payload.strokeColor), opacity: 1 };
    // Lucide icons are stroke-based; use stroke only (fill off)
    node.strokeWeight = payload.strokeWeight != null ? payload.strokeWeight : 2;
    node.strokeAlign = 'CENTER';
    await node.setStrokesAsync([paint]);
    await node.setFillsAsync([]);
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
      var frame = figma.createNodeFromSvg(svg);
      var vectors = frame.findAll(function(n) { return n.type === 'VECTOR'; });

      for (var i = 0; i < vectors.length; i++) {
        await applyIconStyle(vectors[i], payload);
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

  figma.ui.onmessage = async function(msg) {
    if (msg.type === 'close') {
      figma.closePlugin();
      return;
    }
    if (msg.type === 'insert' && msg.payload) {
      await insertIcon(msg.payload);
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
