/**
 * Figma Material Symbols Stylized Icons Plugin
 * Icon map __ICON_MAP__ is injected at build time by build.mjs
 */
declare const __ICON_MAP__: Record<string, string>;

type StrokeStyle = 'basic' | 'brush_stretch' | 'brush_scatter' | 'dynamic';
type BrushStretchName = 'HEIST' | 'BLOCKBUSTER' | 'GRINDHOUSE' | 'BIOPIC' | 'NOIR' | 'VERITE' | 'NEW_WAVE';
type BrushScatterName = 'WITCH_HOUSE' | 'SHOEGAZE' | 'DRONE' | 'BUBBLEGUM' | 'VAPORWAVE';

interface InsertIconPayload {
  iconName: string;
  strokeWeight: number;
  strokeColor: { r: number; g: number; b: number };
  strokeAlign: 'INSIDE' | 'CENTER' | 'OUTSIDE';
  scale: number; // 12, 16, 20, 24
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

async function applyStrokeStyle(
  node: VectorNode,
  payload: InsertIconPayload,
  brushesLoaded: boolean
): Promise<void> {
  const strokePaint: SolidPaint = {
    type: 'SOLID',
    color: rgbToFigma(payload.strokeColor),
    opacity: 1
  };

  try {
    switch (payload.strokeStyle) {
      case 'brush_stretch':
        if (brushesLoaded && payload.brushName) {
          (node as any).complexStrokeProperties = {
            type: 'BRUSH',
            brushType: 'STRETCH',
            brushName: payload.brushName,
            direction: 'FORWARD'
          };
        } else {
          (node as any).complexStrokeProperties = { type: 'BASIC' };
        }
        break;
      case 'brush_scatter':
        if (brushesLoaded && payload.brushName) {
          (node as any).complexStrokeProperties = {
            type: 'BRUSH',
            brushType: 'SCATTER',
            brushName: payload.brushName,
            gap: payload.scatterGap ?? 1,
            wiggle: payload.scatterWiggle ?? 0,
            sizeJitter: payload.scatterSizeJitter ?? 0,
            angularJitter: payload.scatterAngularJitter ?? 0,
            rotation: 0
          };
        } else {
          (node as any).complexStrokeProperties = { type: 'BASIC' };
        }
        break;
      case 'dynamic':
        (node as any).complexStrokeProperties = {
          type: 'DYNAMIC',
          frequency: payload.dynamicFrequency ?? 2,
          wiggle: payload.dynamicWiggle ?? 2,
          smoothen: payload.dynamicSmoothen ?? 0.5
        };
        break;
      default:
        (node as any).complexStrokeProperties = { type: 'BASIC' };
    }

    node.strokeWeight = payload.strokeWeight;
    node.strokeAlign = payload.strokeAlign;
    await node.setStrokesAsync([strokePaint]);
    await node.setFillsAsync([]); // stroke-based only
  } catch {
    (node as any).complexStrokeProperties = { type: 'BASIC' };
    node.strokeWeight = payload.strokeWeight;
    node.strokeAlign = payload.strokeAlign;
    await node.setStrokesAsync([strokePaint]);
    await node.setFillsAsync([]);
  }
}

async function insertIcon(payload: InsertIconPayload): Promise<void> {
  const svg = __ICON_MAP__?.[payload.iconName];
  if (!svg) {
    figma.notify('Icon not found: ' + payload.iconName);
    return;
  }

  let brushesLoaded = false;
  if (payload.strokeStyle === 'brush_stretch' || payload.strokeStyle === 'brush_scatter') {
    try {
      await figma.loadBrushesAsync();
      brushesLoaded = true;
    } catch (_) {
      figma.notify('Could not load brushes; using basic stroke.');
    }
  }

  const frame = figma.createNodeFromSvg(svg) as FrameNode;
  const vectors = frame.findAll((n) => n.type === 'VECTOR') as VectorNode[];

  for (const node of vectors) {
    await applyStrokeStyle(node, payload, brushesLoaded);
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

figma.showUI(__html__, { width: 420, height: 560, themeColors: true });

figma.ui.onmessage = (msg: { type: string; payload?: InsertIconPayload; iconNames?: string[] }) => {
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
