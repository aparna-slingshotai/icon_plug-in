/**
 * Reads @material-design-icons/svg/outlined and generates a JS file that defines __ICON_MAP__.
 * Run after npm install. Output: generated-icon-map.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeModules = path.join(__dirname, 'node_modules');
const outlinedPath = path.join(nodeModules, '@material-design-icons', 'svg', 'outlined');

if (!fs.existsSync(outlinedPath)) {
  console.error('Run npm install first. @material-design-icons/svg not found.');
  process.exit(1);
}

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
