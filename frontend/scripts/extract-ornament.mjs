// Pull the gold line-work out of a gold-on-dark-red ornament photo and write
// it as transparent WebPs that can be tinted with a CSS mask.
//
//   npm i --no-save playwright && npx playwright install chromium
//   node scripts/extract-ornament.mjs <photo> public/ornament
//
// A one-off authoring tool, not part of the build, so playwright is installed
// for the run and not kept in package.json - it is only here to drive a canvas
// for the pixel work. Adjust CROPS to the motifs in the photo at hand; the
// boxes below suit the first one.
//
// The backdrop is red (high R, almost no G) and the ornament is gold (high R
// AND high G), so the green channel alone separates them: everything below LO
// is backdrop, everything above HI is solid ornament, and the ramp between
// keeps the soft edges so the result is not aliased.
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [input, outDir] = process.argv.slice(2);
const LO = 34;
const HI = 150;
/** Longest side of a written file; motifs are backdrop texture, not detail shots. */
const MAX = 720;

// Regions worth keeping as standalone motifs, as fractions of the image, each
// with the edges it was drawn against.
//
// The anchor matters as much as the box. These motifs are drawn running off
// the edge of the artwork, and that cut edge is where they belong on the page
// too - flush to it, so the ornament reads as continuing past the corner
// rather than as a shape that happens to be clipped. Trimming blank margin
// off an anchored edge would throw that registration away, so only the inner
// edges get trimmed; "t", "r", "b", "l" are kept exactly where the crop put
// them.
const CROPS = {
  "corner-tl": { box: [0.0, 0.0, 0.3, 0.38], anchor: "tl" },
  "corner-tr": { box: [0.78, 0.0, 1.0, 0.28], anchor: "tr" },
  "edge-right": { box: [0.89, 0.26, 1.0, 0.48], anchor: "r" },
  "corner-bl": { box: [0.0, 0.66, 0.23, 1.0], anchor: "bl" },
  "lotus-br": { box: [0.64, 0.49, 1.0, 1.0], anchor: "br" },
};

mkdirSync(outDir, { recursive: true });
const src =
  "data:image/png;base64," + readFileSync(input).toString("base64");

const browser = await chromium.launch();
const page = await browser.newPage();
const files = await page.evaluate(
  async ({ src, LO, HI, MAX, CROPS }) => {
    const im = new Image();
    im.src = src;
    await im.decode();
    const W = im.naturalWidth;
    const H = im.naturalHeight;

    const full = document.createElement("canvas");
    full.width = W;
    full.height = H;
    const fctx = full.getContext("2d", { willReadFrequently: true });
    fctx.drawImage(im, 0, 0);
    const img = fctx.getImageData(0, 0, W, H);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const a = Math.max(0, Math.min(1, (d[i + 1] - LO) / (HI - LO)));
      // White, so the PNG carries shape in alpha only and can be tinted to
      // whatever gold the page already uses.
      d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = Math.round(a * 255);
    }
    fctx.putImageData(img, 0, 0);

    const out = [];
    for (const [name, { box, anchor }] of Object.entries(CROPS)) {
      const [x0, y0, x1, y1] = box;
      const sx = Math.round(x0 * W);
      const sy = Math.round(y0 * H);
      const sw = Math.round(x1 * W) - sx;
      const sh = Math.round(y1 * H) - sy;

      // Trim blank margin off the inner edges only, so the motif can be placed
      // by its own outline there, while the anchored edges stay exactly where
      // the crop put them and so stay registered to the page edge.
      const region = fctx.getImageData(sx, sy, sw, sh).data;
      let tx0 = sw, tx1 = -1, ty0 = sh, ty1 = -1;
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          if (region[(y * sw + x) * 4 + 3] < 8) continue;
          if (x < tx0) tx0 = x;
          if (x > tx1) tx1 = x;
          if (y < ty0) ty0 = y;
          if (y > ty1) ty1 = y;
        }
      }
      if (tx1 < 0) continue;
      if (anchor.includes("l")) tx0 = 0;
      if (anchor.includes("r")) tx1 = sw - 1;
      if (anchor.includes("t")) ty0 = 0;
      if (anchor.includes("b")) ty1 = sh - 1;

      const cx = sx + tx0;
      const cy = sy + ty0;
      const cw = tx1 - tx0 + 1;
      const ch = ty1 - ty0 + 1;

      const scale = Math.min(1, MAX / Math.max(cw, ch));
      const o = document.createElement("canvas");
      o.width = Math.round(cw * scale);
      o.height = Math.round(ch * scale);
      const octx = o.getContext("2d");
      octx.imageSmoothingQuality = "high";
      octx.drawImage(full, cx, cy, cw, ch, 0, 0, o.width, o.height);
      out.push({
        name,
        anchor,
        width: o.width,
        height: o.height,
        data: o.toDataURL("image/webp", 0.86).split(",")[1],
      });
    }
    return out;
  },
  { src, LO, HI, MAX, CROPS },
);

for (const f of files) {
  const buf = Buffer.from(f.data, "base64");
  writeFileSync(join(outDir, `${f.name}.webp`), buf);
  console.log(
    `${f.name.padEnd(14)} ${String(f.width).padStart(4)}x${String(f.height).padStart(4)}  anchor ${f.anchor.padEnd(2)}  ${(buf.length / 1024).toFixed(0)} KB  aspect ${f.width}/${f.height}`,
  );
}
await browser.close();
