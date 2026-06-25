/**
 * Physical CR80 card geometry (portrait student ID on a lanyard).
 * Real-world: 53.98mm x 85.6mm. We render at these exact mm so the on-screen
 * preview and the exported PDF are 1:1 with a card printer / cutting guides.
 */
export const CARD_WIDTH_MM = 53.98;
export const CARD_HEIGHT_MM = 85.6;
export const CARD_WIDTH = `${CARD_WIDTH_MM}mm`;
export const CARD_HEIGHT = `${CARD_HEIGHT_MM}mm`;

/** Default on-screen preview zoom (mm -> readable px). */
export const PREVIEW_SCALE = 3.2;
