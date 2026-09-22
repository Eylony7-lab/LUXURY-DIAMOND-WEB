// One-off dev utility: generates elegant placeholder JPG images for the
// seed diamonds in /public/images/diamonds/{sku}/1.jpg..N.jpg. Not used at
// runtime — safe to delete once real product photography is uploaded.
// Requires the `sharp` package (not a project dependency): run
//   npm i -D sharp && node scripts/generate-placeholder-images.mjs && npm uninstall sharp
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "public", "images", "diamonds");

const DIAMONDS = [
  { sku: "RD-10234", shape: "Round", count: 6 },
  { sku: "OV-88231", shape: "Oval", count: 6 },
  { sku: "EM-55019", shape: "Emerald", count: 4 },
  { sku: "CU-30772", shape: "Cushion", count: 6 },
  { sku: "PS-91045", shape: "Pear", count: 3 },
];

const SHAPE_PATHS = {
  Round: `<circle cx="600" cy="600" r="270" />`,
  Oval: `<ellipse cx="600" cy="600" rx="220" ry="300" />`,
  Emerald: `<rect x="380" y="330" width="440" height="540" rx="28" />`,
  Cushion: `<rect x="350" y="350" width="500" height="500" rx="90" />`,
  Pear: `<path d="M600 300 C 740 420, 840 560, 780 720 C 740 830, 620 890, 600 900 C 580 890, 460 830, 420 720 C 360 560, 460 420, 600 300 Z" />`,
};

function buildSvg({ shape, index }) {
  const facetOpacity = 0.16 + (index % 3) * 0.04;
  return `
  <svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#221f1a"/>
        <stop offset="55%" stop-color="#171512"/>
        <stop offset="100%" stop-color="#0e0d0b"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="42%" r="60%">
        <stop offset="0%" stop-color="#e8cf9e" stop-opacity="0.9"/>
        <stop offset="55%" stop-color="#b3915a" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#b3915a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="stone" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#fbf3e2"/>
        <stop offset="30%" stop-color="#e9cf9d"/>
        <stop offset="60%" stop-color="#b3915a"/>
        <stop offset="100%" stop-color="#8c6d3f"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="1200" fill="url(#bg)"/>
    <circle cx="600" cy="560" r="420" fill="url(#glow)"/>
    <g fill="url(#stone)" fill-opacity="${facetOpacity + 0.55}" stroke="#f7ecd6" stroke-opacity="0.5" stroke-width="3">
      ${SHAPE_PATHS[shape] ?? SHAPE_PATHS.Round}
    </g>
    <g stroke="#f7ecd6" stroke-opacity="${facetOpacity}" stroke-width="2" fill="none">
      <line x1="600" y1="330" x2="600" y2="870"/>
      <line x1="380" y1="600" x2="820" y2="600"/>
      <line x1="440" y1="420" x2="760" y2="780"/>
      <line x1="760" y1="420" x2="440" y2="780"/>
    </g>
    <text x="600" y="1060" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="40" fill="#f2e6cd" letter-spacing="4">${shape.toUpperCase()}</text>
    <text x="600" y="1110" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#b3915a" letter-spacing="6">PLACEHOLDER IMAGE ${index}</text>
  </svg>`;
}

async function main() {
  for (const { sku, shape, count } of DIAMONDS) {
    const dir = path.join(OUT_DIR, sku);
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 1; i <= count; i++) {
      const svg = buildSvg({ shape, index: i });
      const outPath = path.join(dir, `${i}.jpg`);
      await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(outPath);
      console.log(`wrote ${path.relative(process.cwd(), outPath)}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
