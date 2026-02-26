/**
 * 1. Generate icon map and names from lucide-static (build-icons.mjs)
 * 2. Merge into code.js = generated-icon-map.js + generated-icon-names.js + generated-icon-map-stroke.js + code-base.js
 * 3. Inline Ash logo SVG into ui.html if assets/ash-wordmark-dark.svg exists
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
console.log('Built code.js with Lucide Icons.');

// Inline Ash logo into ui.html (replace content between ASH_LOGO_START and ASH_LOGO_END)
const assetsDir = path.join(__dirname, 'assets');
const logoPath = fs.existsSync(path.join(assetsDir, 'ash-wordmark-dark.svg'))
  ? path.join(assetsDir, 'ash-wordmark-dark.svg')
  : path.join(assetsDir, 'Ash Logo - wordmark - Dark.svg');
const uiPath = path.join(__dirname, 'ui.html');
let uiHtml = fs.readFileSync(uiPath, 'utf8');
const startMarker = '<!--ASH_LOGO_START-->';
const endMarker = '<!--ASH_LOGO_END-->';
const logoSvg = fs.existsSync(logoPath)
  ? fs.readFileSync(logoPath, 'utf8').trim()
  : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 24" fill="currentColor" style="color:var(--figma-color-text)"><text x="0" y="18" font-family="Inter,-apple-system,sans-serif" font-size="14" font-weight="600">Ash</text></svg>';
uiHtml = uiHtml.replace(new RegExp(startMarker + '[\\s\\S]*?' + endMarker), startMarker + logoSvg + endMarker);
fs.writeFileSync(uiPath, uiHtml, 'utf8');
if (fs.existsSync(logoPath)) {
  console.log('Inlined Ash logo from assets/' + path.basename(logoPath));
} else {
  console.log('Ash logo not found in assets/ – using fallback. Add ash-wordmark-dark.svg or "Ash Logo - wordmark - Dark.svg" and run build again.');
}
