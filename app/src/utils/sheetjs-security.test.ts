import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';

describe('SheetJS parser security baseline', () => {
  it('uses the remediated official SheetJS CE release', () => {
    expect(XLSX.version).toBe('0.20.3');
  });

  it('does not pollute object prototypes while parsing crafted worksheet headers', () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['LRN', '__proto__', 'constructor'],
      ['999900000001', 'unexpected', 'unexpected'],
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Synthetic');
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

    const parsed = XLSX.read(bytes, { type: 'array', WTF: false });
    XLSX.utils.sheet_to_json(parsed.Sheets.Synthetic, { defval: null });

    expect(({} as Record<string, unknown>).unexpected).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'unexpected')).toBe(false);
  });
});
