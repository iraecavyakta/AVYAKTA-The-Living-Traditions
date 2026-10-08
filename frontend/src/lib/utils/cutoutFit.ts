/**
 * Sizing a background-removed portrait so every member renders at the same
 * scale, whatever shape their PNG happens to be.
 *
 * Fitting the whole file to the card does not work: the uploads are tightly
 * cropped but at wildly different framings, from a chest-up square to a
 * full-length 2:3. Fit by the file and a chest-up crop renders half the
 * height of the card with the figure stranded at the bottom; let the height
 * win instead and the same file renders wider than its own column and leans
 * over the neighbours.
 *
 * So the file is not what gets fitted - the person inside it is. The caller
 * measures the opaque bounding box out of the alpha channel and passes it
 * here, and this works out the width and offsets that put that box, rather
 * than the image, at a fixed size in the card.
 */

/** Card width ÷ card height. Must match the tile's aspect class. */
export const CARD_ASPECT = 3 / 4;

/** Person height, in card heights. Over 1 so the head clears the arch. */
const PERSON_HEIGHT = 1.08;

/** Half the grid's column gap, in card widths: the room a spill may use. */
export const GUTTER = 0.05;

/**
 * Person width ceiling, in card widths: their own column, plus the half-gap
 * on each side of it. Over 1 on purpose - someone standing with their arms
 * out spans their whole file, and holding them to the column exactly would
 * render them noticeably shorter than everybody else to buy back width that
 * nothing else wants. Spilling into the gap costs nothing, and stopping
 * there is what keeps them off the neighbouring card. Only a genuinely
 * extreme crop, such as a landscape photograph, ever reaches this.
 */
const PERSON_WIDTH = 1 + 2 * GUTTER;

export type CutoutBox = {
  /** Opaque bounds as fractions of the image: 0 is its left/top edge, 1 its right/bottom. */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
};

export type CutoutFit = {
  /** Percentages, for width / left / bottom on the absolutely positioned img. */
  width: number;
  left: number;
  bottom: number;
};

/**
 * @param ratio intrinsic width ÷ height of the PNG.
 * @param box the opaque bounding box within it.
 */
export function fitCutout(ratio: number, box: CutoutBox): CutoutFit | null {
  const personW = box.x1 - box.x0;
  const personH = box.y1 - box.y0;
  // A box this degenerate means the measurement failed, not that someone is
  // very small. The caller falls back to plain object-contain.
  if (!(ratio > 0) || personW < 0.05 || personH < 0.05) return null;

  // Image height, in card heights, that makes the person exactly as tall as
  // we want - then the same for as wide as we allow. Whichever is smaller is
  // the binding constraint, so a broad figure is capped by the column and a
  // narrow one stands full height.
  const height = Math.min(
    PERSON_HEIGHT / personH,
    (PERSON_WIDTH * CARD_ASPECT) / (personW * ratio),
  );
  // Card widths, which is what a CSS width percentage is resolved against.
  const width = (height * ratio) / CARD_ASPECT;

  return {
    width: width * 100,
    // Centre the person in the card, not the image: half the file can be
    // empty, and off to one side.
    left: (0.5 - ((box.x0 + box.x1) / 2) * width) * 100,
    // Stand them on the foot of the arch by dropping whatever empty strip
    // the file carries below them.
    bottom: -(1 - box.y1) * height * 100,
  };
}
