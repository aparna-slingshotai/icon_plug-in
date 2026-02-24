/**
 * Reads lucide-static/icons/*.svg and generates __ICON_MAP__ and __ICON_NAMES__.
 * Lucide Icons: https://github.com/lucide-icons/lucide
 * Run after npm install. Output: generated-icon-map.js, generated-icon-names.js, generated-icon-map-stroke.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeModules = path.join(__dirname, 'node_modules');
const lucideIconsPath = path.join(nodeModules, 'lucide-static', 'icons');

if (!fs.existsSync(lucideIconsPath)) {
  console.error('Run npm install first. lucide-static not found.');
  process.exit(1);
}

const files = fs.readdirSync(lucideIconsPath).filter((f) => f.endsWith('.svg'));
const map = {};

for (const file of files) {
  const name = file.replace(/\.svg$/, '');
  const svg = fs.readFileSync(path.join(lucideIconsPath, file), 'utf8');
  map[name] = svg;
}

const names = Object.keys(map).sort();
fs.writeFileSync(path.join(__dirname, 'generated-icon-map.js'), 'var __ICON_MAP__ = ' + JSON.stringify(map) + ';\n', 'utf8');
fs.writeFileSync(path.join(__dirname, 'generated-icon-names.js'), 'var __ICON_NAMES__ = ' + JSON.stringify(names) + ';\n', 'utf8');
// Lucide icons are stroke-based; stroke map is same as main map for compatibility
fs.writeFileSync(path.join(__dirname, 'generated-icon-map-stroke.js'), 'var __ICON_MAP_STROKE__ = ' + JSON.stringify(map) + ';\n', 'utf8');
console.log('Generated ' + names.length + ' Lucide icons in generated-icon-map.js, generated-icon-names.js, generated-icon-map-stroke.js');
