// node --experimental-strip-types --test src/lib/utils/cutoutFit.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { CARD_ASPECT, type CutoutBox, GUTTER, fitCutout } from "./cutoutFit.ts";

/** Where the person actually lands in the card, in card widths and heights. */
function render(ratio: number, box: CutoutBox) {
  const fit = fitCutout(ratio, box);
  assert.ok(fit, "expected a fit");
  const imageW = fit.width / 100; // card widths
  const imageH = (imageW * CARD_ASPECT) / ratio; // card heights
  return {
    width: (box.x1 - box.x0) * imageW,
    height: (box.y1 - box.y0) * imageH,
    left: fit.left / 100 + box.x0 * imageW,
    right: fit.left / 100 + box.x1 * imageW,
    bottom: fit.bottom / 100 + (1 - box.y1) * imageH,
  };
}

/** Real uploads: a tall portrait, a square chest-up, a wide chest-up. */
const centred = (w: number): CutoutBox => ({
  x0: (1 - w) / 2,
  x1: (1 + w) / 2,
  y0: 0,
  y1: 1,
});
/** The real uploads, from tall portrait to wide chest-up to arms-spread. */
const CASES: Array<[string, number, CutoutBox]> = [
  ["tall, fills the frame", 0.67, centred(0.88)],
  ["3:4, fills the frame", 0.75, centred(0.87)],
  ["arms out, spans the file", 0.75, centred(1.0)],
  ["square, half empty", 1.0, centred(0.48)],
  ["wide, half empty", 1.22, centred(0.48)],
  ["narrow sliver", 0.95, centred(0.3)],
];

test("every framing renders the person at the same size", () => {
  const heights = CASES.map(([, ratio, box]) => render(ratio, box).height);
  assert.ok(
    Math.max(...heights) - Math.min(...heights) < 0.02,
    `heights spread too far: ${heights.map((h) => h.toFixed(2)).join(", ")}`,
  );
});

test("nobody reaches into the neighbouring card", () => {
  for (const [name, ratio, box] of CASES) {
    const s = render(ratio, box);
    // Spilling into the gutter is fine; crossing it is not.
    assert.ok(
      s.left >= -GUTTER - 1e-9,
      `${name}: overflows left at ${s.left.toFixed(3)}`,
    );
    assert.ok(
      s.right <= 1 + GUTTER + 1e-9,
      `${name}: overflows right at ${s.right.toFixed(3)}`,
    );
  }
});

test("an extreme crop is held back rather than allowed to barge across", () => {
  // Someone photographed in landscape, filling the frame: there is no way to
  // render them full height without reaching the next card, so they come up
  // short instead.
  const s = render(2.0, centred(0.95));
  assert.ok(
    s.right <= 1 + GUTTER + 1e-9,
    `overflows right at ${s.right.toFixed(3)}`,
  );
  assert.ok(
    s.height < 1,
    `expected a short render, got ${s.height.toFixed(2)}`,
  );
});

test("everyone stands on the foot of the arch", () => {
  for (const [name, ratio, box] of CASES) {
    const s = render(ratio, box);
    assert.ok(
      Math.abs(s.bottom) < 1e-9,
      `${name}: floats at ${s.bottom.toFixed(3)}`,
    );
  }
});

test("empty margin below the figure is dropped, not rendered", () => {
  // The same person in two files: cropped tight, and with a strip of empty
  // space under them. The padded file is a quarter taller for the same
  // person, so it is a taller file too - hence the lower ratio.
  const tight = render(0.75, centred(0.86));
  const padded = render(0.75 * 0.8, { x0: 0.07, x1: 0.93, y0: 0, y1: 0.8 });
  assert.ok(Math.abs(padded.bottom) < 1e-9, "padded file floats");
  assert.ok(
    Math.abs(padded.height - tight.height) < 0.02,
    `padding changed the size: ${padded.height.toFixed(2)} vs ${tight.height.toFixed(2)}`,
  );
});

test("an off-centre person is centred in the card", () => {
  const s = render(1.0, { x0: 0.0, x1: 0.4, y0: 0, y1: 1 });
  assert.ok(
    Math.abs((s.left + s.right) / 2 - 0.5) < 1e-9,
    `not centred: ${s.left.toFixed(2)}..${s.right.toFixed(2)}`,
  );
});

test("a failed measurement gives no fit", () => {
  assert.equal(fitCutout(0.75, { x0: 0, x1: 0, y0: 0, y1: 0 }), null);
  assert.equal(fitCutout(0, centred(0.8)), null);
});
