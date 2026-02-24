/**
 * Figma Lucide Icons Plugin
 * __ICON_MAP__ and __ICON_MAP_STROKE__ are injected at build time by build.mjs (from lucide-static)
 */
declare const __ICON_MAP__: Record<string, string>;
declare const __ICON_MAP_STROKE__: Record<string, string>;

type StretchBrushName = 'HEIST' | 'BIOPIC' | 'EPIC' | 'VERITE' | 'PROPAGANDA';

interface InsertIconPayload {
  iconName: string;
  strokeWeight: number;
  strokeColor: { r: number; g: number; b: number };
  scale: number; // 12, 16, 20, 24 (display size)
  strokeStyle?: string; // '' = basic, or StretchBrushName for brush
}

function rgbToFigma({ r, g, b }: { r: number; g: number; b: number }) {
  return { r: r / 255, g: g / 255, b: b / 255, a: 1 };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const h = (n: number) => Math.max(0, Math.min(255, n | 0)).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function patchSvgForStyle(svg: string, payload: InsertIconPayload): string {
  const hex = rgbToHex(payload.strokeColor);
  const w = String(payload.strokeWeight);

  let out = svg;

  // Ensure root <svg> has desired stroke + stroke-width (override if present).
  out = out.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    let a = attrs ?? '';
    a = /stroke="[^"]*"/.test(a) ? a.replace(/stroke="[^"]*"/, `stroke="${hex}"`) : `${a} stroke="${hex}"`;
    a = /stroke-width="[^"]*"/.test(a)
      ? a.replace(/stroke-width="[^"]*"/, `stroke-width="${w}"`)
      : `${a} stroke-width="${w}"`;
    return `<svg${a}>`;
  });

  // Normalize common Lucide pattern (in case stroke is repeated on children).
  out = out.replace(/stroke="currentColor"/g, `stroke="${hex}"`);
  return out;
}

const STRETCH_BRUSH_NAMES: StretchBrushName[] = ['HEIST', 'BIOPIC', 'EPIC', 'VERITE', 'PROPAGANDA'];
let stretchBrushesLoaded = false;

async function ensureStretchBrushesLoaded(): Promise<void> {
  if (stretchBrushesLoaded) return;
  await figma.loadBrushesAsync('STRETCH');
  stretchBrushesLoaded = true;
}

function isStretchBrush(name: string | undefined): name is StretchBrushName {
  return !!name && STRETCH_BRUSH_NAMES.includes(name as StretchBrushName);
}

async function applyIconStyle(node: VectorNode, payload: InsertIconPayload): Promise<void> {
  const paint: SolidPaint = {
    type: 'SOLID',
    color: rgbToFigma(payload.strokeColor),
    opacity: 1
  };
  node.strokeWeight = payload.strokeWeight;
  node.strokeAlign = 'CENTER';
  await node.setStrokesAsync([paint]);
  await node.setFillsAsync([]);
  if (isStretchBrush(payload.strokeStyle)) {
    await ensureStretchBrushesLoaded();
    node.complexStrokeProperties = {
      type: 'BRUSH',
      brushType: 'STRETCH',
      brushName: payload.strokeStyle,
      direction: 'FORWARD'
    };
  }
}

async function insertIcon(payload: InsertIconPayload): Promise<void> {
  const svg = __ICON_MAP_STROKE__?.[payload.iconName] ?? __ICON_MAP__?.[payload.iconName];
  if (!svg) {
    figma.notify('Icon not found: ' + payload.iconName);
    return;
  }

  const useBrush = isStretchBrush(payload.strokeStyle);
  if (useBrush) await ensureStretchBrushesLoaded();

  const styledSvg = patchSvgForStyle(svg, payload);
  const frame = figma.createNodeFromSvg(styledSvg) as FrameNode;
  const vectors = frame.findAll((n) => n.type === 'VECTOR') as VectorNode[];
  for (const node of vectors) {
    node.strokeAlign = 'CENTER';
    if (useBrush) {
      node.complexStrokeProperties = {
        type: 'BRUSH',
        brushType: 'STRETCH',
        brushName: payload.strokeStyle,
        direction: 'FORWARD'
      };
    }
  }

  const baseSize = 24;
  const scale = payload.scale / baseSize;
  frame.resize(frame.width * scale, frame.height * scale);

  frame.x = figma.viewport.center.x - frame.width / 2;
  frame.y = figma.viewport.center.y - frame.height / 2;
  figma.currentPage.appendChild(frame);
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);
  figma.notify('Icon inserted');
}

figma.showUI(__html__, { width: 560, height: 640, themeColors: true });

// Start loading brushes immediately so first insert with a brush is fast
void ensureStretchBrushesLoaded();

figma.ui.onmessage = (msg: { type: string; payload?: InsertIconPayload | { strokeStyle?: string } }) => {
  if (msg.type === 'close') {
    figma.closePlugin();
  }
  if (msg.type === 'insert' && msg.payload) {
    void insertIcon(msg.payload).then(
      () => { figma.ui.postMessage({ type: 'insertDone' }); },
      () => { figma.ui.postMessage({ type: 'insertDone' }); }
    );
  }
  if (msg.type === 'preloadBrushes' && msg.payload && 'strokeStyle' in msg.payload) {
    const style = msg.payload.strokeStyle;
    if (isStretchBrush(style)) {
      // Fire and forget; this warms up brush data before insert.
      void ensureStretchBrushesLoaded();
    }
  }
  if (msg.type === 'getIconNames') {
    const names = typeof __ICON_MAP__ !== 'undefined' ? Object.keys(__ICON_MAP__).sort() : [];
    figma.ui.postMessage({ type: 'iconNames', iconNames: names });
  }
  if (msg.type === 'getSvg' && msg.payload?.iconName) {
    const svg = typeof __ICON_MAP__ !== 'undefined' ? __ICON_MAP__[msg.payload.iconName] : '';
    figma.ui.postMessage({ type: 'svg', iconName: msg.payload.iconName, svg });
  }
};
