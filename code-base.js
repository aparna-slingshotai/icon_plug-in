// Plugin logic: expects __ICON_MAP__ and __ICON_NAMES__ (injected by prepended script or build).
(function() {

  var CDN_BASE = 'https://cdn.jsdelivr.net/npm/@material-design-icons/svg@0.14.15/outlined';
  var API_URL = 'https://data.jsdelivr.com/v1/package/npm/@material-design-icons/svg@0.14.15';
  var FALLBACK_ICON_NAMES = ['add','remove','search','home','menu','close','check','expand_more','expand_less','settings','favorite','share','person','email','phone','link','image','visibility','visibility_off','delete','edit','save','refresh','arrow_back','arrow_forward','info','warning','error','check_circle','cancel','download','upload','folder','insert_drive_file','description','code','build','bug_report','lightbulb','star','star_half','thumb_up','thumb_down','schedule','today','event','notifications','location_on','map','place','local_offer','label','category','filter_list','sort','tune','dashboard','analytics','trending_up','account_circle','lock','lock_open','vpn_key','login','logout','face','mood','sentiment_satisfied','bookmark','bookmark_border','play_arrow','pause','stop','skip_next','skip_previous','volume_up','volume_off','mic','mic_off','videocam','videocam_off','photo_camera','camera_alt','collections','photo_library','image_aspect_ratio','crop','filter_vintage','brightness_4','contrast','invert_colors','palette','format_paint','brush','auto_awesome','wb_sunny','dark_mode','light_mode'];

  function rgbToFigma(c) {
    return { r: c.r / 255, g: c.g / 255, b: c.b / 255 };
  }

  function findOutlinedNames(data) {
    var names = [];
    if (!data || !data.files) return names;
    for (var i = 0; i < data.files.length; i++) {
      if (data.files[i].name === 'outlined' && data.files[i].files) {
        for (var j = 0; j < data.files[i].files.length; j++) {
          var name = data.files[i].files[j].name;
          if (typeof name === 'string' && name.endsWith('.svg'))
            names.push(name.replace(/\.svg$/, ''));
        }
        break;
      }
    }
    return names.sort();
  }

  async function applyStrokeStyle(node, payload, brushesLoaded) {
    var strokePaint = { type: 'SOLID', color: rgbToFigma(payload.strokeColor), opacity: 1 };

    try {
      node.strokeWeight = payload.strokeWeight;
      node.strokeAlign = payload.strokeAlign;
      await node.setStrokesAsync([strokePaint]);
      await node.setFillsAsync([]);

      switch (payload.strokeStyle) {
        case 'brush_stretch':
          if (brushesLoaded && payload.brushName) {
            node.complexStrokeProperties = { type: 'BRUSH', brushType: 'STRETCH', brushName: payload.brushName, direction: 'FORWARD' };
          } else {
            node.complexStrokeProperties = { type: 'BASIC' };
          }
          break;
        case 'brush_scatter':
          if (brushesLoaded && payload.brushName) {
            node.complexStrokeProperties = {
              type: 'BRUSH', brushType: 'SCATTER', brushName: payload.brushName,
              gap: payload.scatterGap !== undefined ? payload.scatterGap : 1,
              wiggle: payload.scatterWiggle !== undefined ? payload.scatterWiggle : 0,
              sizeJitter: payload.scatterSizeJitter !== undefined ? payload.scatterSizeJitter : 0,
              angularJitter: payload.scatterAngularJitter !== undefined ? payload.scatterAngularJitter : 0,
              rotation: 0
            };
          } else {
            node.complexStrokeProperties = { type: 'BASIC' };
          }
          break;
        case 'dynamic':
          node.complexStrokeProperties = {
            type: 'DYNAMIC',
            frequency: payload.dynamicFrequency !== undefined ? payload.dynamicFrequency : 2,
            wiggle: payload.dynamicWiggle !== undefined ? payload.dynamicWiggle : 2,
            smoothen: payload.dynamicSmoothen !== undefined ? payload.dynamicSmoothen : 0.5
          };
          break;
        default:
          node.complexStrokeProperties = { type: 'BASIC' };
      }
    } catch (e) {
      node.complexStrokeProperties = { type: 'BASIC' };
      node.strokeWeight = payload.strokeWeight;
      node.strokeAlign = payload.strokeAlign;
      await node.setStrokesAsync([strokePaint]);
      await node.setFillsAsync([]);
    }
  }

  async function ensureSvg(iconName) {
    if (__ICON_MAP__[iconName]) return __ICON_MAP__[iconName];
    try {
      var res = await fetch(CDN_BASE + '/' + encodeURIComponent(iconName) + '.svg');
      if (!res.ok) return null;
      var text = await res.text();
      __ICON_MAP__[iconName] = text;
      return text;
    } catch (e) {
      return null;
    }
  }

  async function insertIcon(payload) {
    var svg = await ensureSvg(payload.iconName);
    if (!svg) {
      figma.notify('Icon not found: ' + payload.iconName);
      return;
    }

    try {
      var brushesLoaded = false;
      if (payload.strokeStyle === 'brush_stretch' || payload.strokeStyle === 'brush_scatter') {
        try {
          await figma.loadBrushesAsync();
          brushesLoaded = true;
        } catch (e) {
          figma.notify('Brushes could not load; using basic stroke.');
        }
      }

      var frame = figma.createNodeFromSvg(svg);
      var vectors = frame.findAll(function(n) { return n.type === 'VECTOR'; });

      for (var i = 0; i < vectors.length; i++) {
        await applyStrokeStyle(vectors[i], payload, brushesLoaded);
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

  figma.showUI(__html__, { width: 420, height: 580, themeColors: true });

  figma.ui.onmessage = async function(msg) {
    if (msg.type === 'insert' && msg.payload) {
      await insertIcon(msg.payload);
      return;
    }
    if (msg.type === 'getIconNames') {
      var names = [];
      if (__ICON_NAMES__ && __ICON_NAMES__.length > 100) {
        names = __ICON_NAMES__;
      } else if (Object.keys(__ICON_MAP__).length > 100) {
        names = Object.keys(__ICON_MAP__).sort();
      } else {
        try {
          var res = await fetch(API_URL);
          var data = await res.json();
          names = findOutlinedNames(data);
          if (names.length > 0) __ICON_NAMES__ = names;
        } catch (e) {}
        if (names.length === 0) names = Object.keys(__ICON_MAP__).sort();
        if (names.length === 0) names = FALLBACK_ICON_NAMES;
      }
      figma.ui.postMessage({ type: 'iconNames', iconNames: names });
      return;
    }
    if (msg.type === 'getSvg' && msg.payload && msg.payload.iconName) {
      var name = msg.payload.iconName;
      var svg = __ICON_MAP__[name] || await ensureSvg(name) || '';
      figma.ui.postMessage({ type: 'svg', iconName: name, svg: svg });
    }
  };
})();
