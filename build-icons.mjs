/**
 * Reads @material-design-icons/svg/outlined and generates __ICON_MAP__.
 * Reads lucide-static for stroke-based SVGs and generates __ICON_MAP_STROKE__ (keyed by Material name).
 * Run after npm install. Output: generated-icon-map.js, generated-icon-names.js, generated-icon-map-stroke.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeModules = path.join(__dirname, 'node_modules');
const outlinedPath = path.join(nodeModules, '@material-design-icons', 'svg', 'outlined');
const lucideIconsPath = path.join(nodeModules, 'lucide-static', 'dist', 'esm', 'icons');

if (!fs.existsSync(outlinedPath)) {
  console.error('Run npm install first. @material-design-icons/svg not found.');
  process.exit(1);
}

// Material icon name -> Lucide icon file name (without .js). Used when Fill=Off for true stroke-only vectors.
const MATERIAL_TO_LUCIDE = {
  add: 'plus',
  remove: 'minus',
  search: 'search',
  home: 'home',
  menu: 'menu',
  close: 'x',
  check: 'check',
  expand_more: 'chevron-down',
  expand_less: 'chevron-up',
  settings: 'settings',
  favorite: 'heart',
  share: 'share-2',
  person: 'user',
  email: 'mail',
  phone: 'phone',
  link: 'link',
  image: 'image',
  visibility: 'eye',
  visibility_off: 'eye-off',
  delete: 'trash-2',
  edit: 'pencil',
  save: 'save',
  refresh: 'refresh-cw',
  arrow_back: 'arrow-left',
  arrow_forward: 'arrow-right',
  info: 'info',
  warning: 'alert-triangle',
  error: 'alert-circle',
  check_circle: 'circle-check',
  cancel: 'x-circle',
  download: 'download',
  upload: 'upload',
  folder: 'folder',
  insert_drive_file: 'file',
  description: 'file-text',
  code: 'code',
  build: 'hammer',
  bug_report: 'bug',
  lightbulb: 'lightbulb',
  star: 'star',
  star_half: 'star-half',
  thumb_up: 'thumbs-up',
  thumb_down: 'thumbs-down',
  schedule: 'calendar',
  today: 'calendar-days',
  event: 'calendar',
  notifications: 'bell',
  location_on: 'map-pin',
  map: 'map',
  place: 'map-pin',
  local_offer: 'tag',
  label: 'tag',
  category: 'layout-grid',
  filter_list: 'filter',
  sort: 'arrow-up-down',
  tune: 'sliders-horizontal',
  dashboard: 'layout-dashboard',
  analytics: 'bar-chart-2',
  trending_up: 'trending-up',
  account_circle: 'user-circle',
  lock: 'lock',
  lock_open: 'lock-open',
  vpn_key: 'key',
  login: 'log-in',
  logout: 'log-out',
  face: 'smile',
  mood: 'smile',
  sentiment_satisfied: 'smile',
  bookmark: 'bookmark',
  bookmark_border: 'bookmark',
  play_arrow: 'play',
  pause: 'pause',
  stop: 'square',
  skip_next: 'skip-forward',
  skip_previous: 'skip-back',
  volume_up: 'volume-2',
  volume_off: 'volume-x',
  mic: 'mic',
  mic_off: 'mic-off',
  videocam: 'video',
  videocam_off: 'video-off',
  photo_camera: 'camera',
  camera_alt: 'camera',
  collections: 'images',
  photo_library: 'images',
  image_aspect_ratio: 'ratio',
  crop: 'crop',
  filter_vintage: 'filter',
  brightness_4: 'sun',
  contrast: 'contrast',
  invert_colors: 'invert-colors',
  palette: 'palette',
  format_paint: 'paint-bucket',
  brush: 'brush',
  auto_awesome: 'sparkles',
  wb_sunny: 'sun',
  dark_mode: 'moon',
  light_mode: 'sun',
  add_circle: 'plus-circle',
  remove_circle: 'minus-circle',
  content_copy: 'copy',
  content_cut: 'scissors',
  content_paste: 'clipboard-paste',
  create: 'pen-square',
  create_new_folder: 'folder-plus',
  fullscreen: 'maximize',
  fullscreen_exit: 'minimize',
  more_vert: 'more-vertical',
  more_horiz: 'more-horizontal',
  open_in_new: 'external-link',
  print: 'printer',
  push_pin: 'pin',
  redo: 'redo',
  reply: 'reply',
  report: 'flag',
  send: 'send',
  undo: 'undo',
  zoom_in: 'zoom-in',
  zoom_out: 'zoom-out',
  accessibility: 'accessibility',
  accessibility_new: 'accessibility',
};

const files = fs.readdirSync(outlinedPath).filter((f) => f.endsWith('.svg'));
const map = {};

for (const file of files) {
  const name = file.replace(/\.svg$/, '');
  const svg = fs.readFileSync(path.join(outlinedPath, file), 'utf8');
  map[name] = svg;
}

const names = Object.keys(map).sort();
fs.writeFileSync(path.join(__dirname, 'generated-icon-map.js'), 'var __ICON_MAP__ = ' + JSON.stringify(map) + ';\n', 'utf8');
fs.writeFileSync(path.join(__dirname, 'generated-icon-names.js'), 'var __ICON_NAMES__ = ' + JSON.stringify(names) + ';\n', 'utf8');
console.log('Generated ' + names.length + ' icons in generated-icon-map.js and generated-icon-names.js');

// Stroke-based icon map (Lucide SVGs keyed by Material name) for Fill=Off
const strokeMap = {};
if (fs.existsSync(lucideIconsPath)) {
  for (const [materialName, lucideName] of Object.entries(MATERIAL_TO_LUCIDE)) {
    const jsPath = path.join(lucideIconsPath, lucideName + '.js');
    if (!fs.existsSync(jsPath)) continue;
    try {
      const mod = await import(pathToFileURL(jsPath).href);
      const svg = (mod.default || '').trim();
      if (svg && svg.startsWith('<svg')) strokeMap[materialName] = svg;
    } catch (_) {}
  }
  fs.writeFileSync(path.join(__dirname, 'generated-icon-map-stroke.js'), 'var __ICON_MAP_STROKE__ = ' + JSON.stringify(strokeMap) + ';\n', 'utf8');
  console.log('Generated ' + Object.keys(strokeMap).length + ' stroke icons in generated-icon-map-stroke.js');
} else {
  fs.writeFileSync(path.join(__dirname, 'generated-icon-map-stroke.js'), 'var __ICON_MAP_STROKE__ = {};\n', 'utf8');
  console.log('lucide-static not found; __ICON_MAP_STROKE__ is empty.');
}
