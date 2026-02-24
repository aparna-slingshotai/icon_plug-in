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

  if (isStretchBrush(payload.strokeStyle)) {
    await ensureStretchBrushesLoaded();
  }
  const frame = figma.createNodeFromSvg(svg) as FrameNode;
  const vectors = frame.findAll((n) => n.type === 'VECTOR') as VectorNode[];

  for (const node of vectors) {
    await applyIconStyle(node, payload);
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

figma.ui.onmessage = (msg: { type: string; payload?: InsertIconPayload }) => {
  if (msg.type === 'close') {
    figma.closePlugin();
  }
  if (msg.type === 'insert' && msg.payload) {
    insertIcon(msg.payload);
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
