/**
 * 1. Generate icon map and names from @material-design-icons/svg (build-icons.mjs)
 * 2. Merge into code.js = generated-icon-map.js + generated-icon-names.js + code-base.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

execSync('node build-icons.mjs', { cwd: __dirname, stdio: 'inherit' });

const iconMap = fs.readFileSync(path.join(__dirname, 'generated-icon-map.js'), 'utf8');
const iconNames = fs.readFileSync(path.join(__dirname, 'generated-icon-names.js'), 'utf8');
const iconMapStroke = fs.readFileSync(path.join(__dirname, 'generated-icon-map-stroke.js'), 'utf8');
const codeBase = fs.readFileSync(path.join(__dirname, 'code-base.js'), 'utf8');
fs.writeFileSync(path.join(__dirname, 'code.js'), iconMap + iconNames + iconMapStroke + codeBase, 'utf8');
console.log('Built code.js with Material Symbols and stroke-only icon set.');
