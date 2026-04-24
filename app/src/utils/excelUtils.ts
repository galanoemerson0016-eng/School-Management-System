/**
 * Utility to convert Excel cell references (A1, B2) to grid coordinates.
 */
export function cellToCoords(cell: string): { row: number; col: number } {
  const match = cell.match(/([A-Z]+)(\d+)/);
  if (!match) return { row: 0, col: 0 };
  
  const colStr = match[1];
  const row = parseInt(match[2], 10);
  
  let col = 0;
  for (let i = 0; i < colStr.length; i++) {
    col = col * 26 + (colStr.charCodeAt(i) - 64);
  }
  
  return { row, col };
}

/**
 * Utility to convert Excel range (A1:B2) to grid span.
 */
export function rangeToSpan(range: string) {
  const [start, end] = range.split(':');
  const startCoords = cellToCoords(start);
  const endCoords = cellToCoords(end);
  
  return {
    rowStart: startCoords.row,
    colStart: startCoords.col,
    rowEnd: endCoords.row + 1,
    colEnd: endCoords.col + 1,
    rowSpan: endCoords.row - startCoords.row + 1,
    colSpan: endCoords.col - startCoords.col + 1
  };
}

/**
 * Scaling factors for Excel units to pixels.
 * Based on 8.5" width = 816px (Legal) and row height 1pt = 1.333px.
 */
export const SCALING = {
  COL_UNIT: 2.816, // Calculated as 816px / total units in JSON
  ROW_UNIT: 1.333, // 1pt = 1.333px at 96 DPI
};
