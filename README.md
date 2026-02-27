# Material Symbols Stylized Icons — Figma Plugin

Insert Google Material Symbols (outlined) with stylized strokes—clean, chalk, or textured—without manually editing each icon. Choose size (12–24pt), stroke color, and see a light/dark preview before placing on the canvas.

## Features

- **Full Material Symbols library** (outlined style). Run `npm run build` to embed the full set (~2,500+ icons); the repo ships with a small fallback set so the plugin works without building.
- **Search and pick** an icon from the grid.
- **Three stroke styles:** Clean (basic), Chalk (stretch brush), Textured (scatter brush).
- **Stroke-based only:** Only strokes are colored; fills are cleared for a consistent outline look.
- **Size:** 12pt, 16pt, 20pt, or 24pt (increments of 4).
- **Preview** with your stroke color and a **light/dark background toggle** (top-right of preview).
- **Stroke color** presets from the **Sundial Design System (Slingshot AI)**; you can edit the preset hex values in `ui.html` to match your Figma design tokens.

## Material Symbols (icons)

The plugin loads the **full Material Symbols** set (same icons as [Google Fonts Material Symbols](https://fonts.google.com/icons)) in two ways:

- **With network:** On first run, the plugin fetches the icon list and SVGs from the CDN (jsDelivr). You get all ~2,500+ outlined icons and search without running a build.
- **Offline (optional):** Run `npm install` then `npm run build` to embed the full set into `code.js` so the plugin works without network access.

**Chalk / Textured** stroke styles use Figma’s built-in brush presets (API). Strokes are applied first, then brush properties. If an icon’s vectors don’t support brush, the plugin falls back to a basic stroke.

## Install and run locally

1. Clone this repo.
2. **Recommended** — embed the full icon set so you can search and preview all Material Symbols:
   ```bash
   npm install
   npm run build
   ```
   This generates `code.js` with the full Material Symbols set. Without this, the plugin uses a small built-in set (add, face, home, search, settings).
3. In Figma: **Plugins → Development → Import plugin from manifest…** and select the `manifest.json` in this folder.
4. Run the plugin from **Plugins → Development → Material Symbols Stylized Icons**.

## Make the plugin publicly available

To publish as a **Figma Community plugin**:

1. In Figma, go to **Resources → Plugins** and create a new plugin (or use **Development → New Plugin** and replace its files with this repo).
2. Replace the plugin’s `manifest.json`, `code.js`, and `ui.html` with the ones from this repo (after running `npm run build` if you want the full icon set).
3. Use **Publish** (or **Submit to Community**) from the plugin’s menu in Figma and follow the prompts. You may need to set the plugin **id** in `manifest.json` to the one Figma assigns when you create the plugin.

## Share with your Figma organization

**Requirement:** Your Figma account must be on an **Organization or Enterprise** plan.

1. **Create the plugin in Figma (one-time)**  
   In the **Figma desktop app**: **Plugins → Development → New Plugin**. Choose “Empty” or any template, then replace its files with yours: copy in `manifest.json`, `code.js`, and `ui.html` from this repo (after `npm run build`). If Figma gave the plugin an **id**, set that same `id` in your `manifest.json`.

2. **Publish as a private org plugin**  
   In the plugin’s menu (three dots or right‑click the plugin): **Publish** (or **Submit to Community**). In the publish flow:
   - Fill in name, description, tagline, and any images.
   - On **“Add the final details”**, set **Publish to** to **your organization** (not Community).  
   Private org plugins **skip Community review** and are available to your org right away.

3. **How others in your org get it**  
   Colleagues go to the file browser → **All teams** or **All workspaces** → **Plugins**, then find the plugin and click **Save** to add it to their account.  
   Admins can also [approve and install plugins for the organization](https://help.figma.com/hc/articles/4404239054127).

**Alternative (no publish):** Share the plugin folder (e.g. via Git or zip). Others use **Plugins → Development → Import plugin from manifest…** and select your `manifest.json`. This installs it only for them as a development plugin.

## Project structure

```
icon_plug-in/
├── manifest.json   # Figma plugin manifest
├── code.js         # Plugin logic + icon map (built or minimal)
├── ui.html         # Plugin UI (search, grid, stroke style, preview, insert)
├── code.ts         # TypeScript source (optional; build uses code.js)
├── build.mjs       # Merges full icon set into code.js
├── build-icons.mjs # Reads @material-design-icons/svg and generates icon map
└── package.json
```

## License

Icons: [Apache License 2.0](https://github.com/google/material-design-icons/blob/master/LICENSE) (Google Material Design Icons).  
Plugin code: use as you like; consider Apache 2.0 if you redistribute.
