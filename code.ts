/**
 * Figma Material Symbols Stylized Icons Plugin
 * __ICON_MAP__ and __ICON_MAP_STROKE__ are injected at build time by build.mjs
 */
declare const __ICON_MAP__: Record<string, string>;
declare const __ICON_MAP_STROKE__: Record<string, string>;

type StrokeStyle = 'basic' | 'brush_stretch' | 'brush_scatter' | 'dynamic';
type BrushStretchName = 'HEIST' | 'BLOCKBUSTER' | 'GRINDHOUSE' | 'BIOPIC' | 'NOIR' | 'VERITE' | 'NEW_WAVE';
type BrushScatterName = 'WITCH_HOUSE' | 'SHOEGAZE' | 'DRONE' | 'BUBBLEGUM' | 'VAPORWAVE';

interface InsertIconPayload {
  iconName: string;
  style?: string; // outlined | rounded | sharp
  weight?: number; // 100–700
  grade?: string; // normal | simplified
  fill?: 'on' | 'off';
  strokeWeight: number;
  strokeColor: { r: number; g: number; b: number };
  strokeAlign: 'INSIDE' | 'CENTER' | 'OUTSIDE';
  scale: number; // 12, 16, 20, 24 (optical size)
  strokeStyle: StrokeStyle;
  brushName?: BrushStretchName | BrushScatterName;
  scatterGap?: number;
  scatterWiggle?: number;
  scatterSizeJitter?: number;
  scatterAngularJitter?: number;
  dynamicFrequency?: number;
  dynamicWiggle?: number;
  dynamicSmoothen?: number;
}

function rgbToFigma({ r, g, b }: { r: number; g: number; b: number }) {
  return { r: r / 255, g: g / 255, b: b / 255, a: 1 };
}

function applyIconStyle(node: VectorNode, payload: InsertIconPayload): Promise<void> {
  const paint: SolidPaint = {
    type: 'SOLID',
    color: rgbToFigma(payload.strokeColor),
    opacity: 1
  };
  const useFill = payload.fill !== 'off';
  if (useFill) {
    return node.setFillsAsync([paint]).then(() => node.setStrokesAsync([]));
  } else {
    node.strokeWeight = payload.strokeWeight;
    node.strokeAlign = 'CENTER';
    return node.setStrokesAsync([paint]).then(() => node.setFillsAsync([]));
  }
}

async function insertIcon(payload: InsertIconPayload): Promise<void> {
  // When Fill=Off use stroke-based SVGs (Lucide) for true stroke-only vectors; otherwise Material fill-based
  const useStrokeSource = payload.fill === 'off' && typeof __ICON_MAP_STROKE__ !== 'undefined';
  const svg = useStrokeSource
    ? __ICON_MAP_STROKE__?.[payload.iconName] ?? __ICON_MAP__?.[payload.iconName]
    : __ICON_MAP__?.[payload.iconName];
  if (!svg) {
    figma.notify('Icon not found: ' + payload.iconName);
    return;
  }

  const frame = figma.createNodeFromSvg(svg) as FrameNode;
  const vectors = frame.findAll((n) => n.type === 'VECTOR') as VectorNode[];

  for (const node of vectors) {
    await applyIconStyle(node, payload);
  }

  const baseSize = 24;
  const scale = payload.scale / baseSize;
  frame.resize(frame.width * scale, frame.height * scale);

  frame.x = figma.viewport.center.x - (frame.width / 2);
  frame.y = figma.viewport.center.y - (frame.height / 2);
  figma.currentPage.appendChild(frame);
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);
  figma.notify('Icon inserted');
}

figma.showUI(__html__, { width: 560, height: 640, themeColors: true });

figma.ui.onmessage = (msg: { type: string; payload?: InsertIconPayload; iconNames?: string[] }) => {
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
