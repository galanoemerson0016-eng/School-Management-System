import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import {
  assertSafeWorkbookFile,
  MAX_WORKBOOK_BYTES,
  MAX_WORKSHEETS,
  readSafeWorkbook,
} from './safe-workbook-reader';

const makeWorkbookBytes = (sheetCount = 1): ArrayBuffer => {
  const workbook = XLSX.utils.book_new();
  for (let index = 0; index < sheetCount; index += 1) {
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet([['LRN'], ['999900000001']]),
      `Sheet${index + 1}`,
    );
  }
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
};

describe('safe workbook reader', () => {
  it('reads a valid XLSX workbook', () => {
    const workbook = readSafeWorkbook(makeWorkbookBytes());

    expect(workbook.SheetNames).toEqual(['Sheet1']);
  });

  it('preserves supported CSV enrollment input only when explicitly enabled', () => {
    const csvWorkbook = readSafeWorkbook('LAST NAME,FIRST NAME,GENDER\nDOE,JANE,Female', { allowCsv: true });

    expect(csvWorkbook.SheetNames).toHaveLength(1);
    expect(() => readSafeWorkbook('LAST NAME,FIRST NAME,GENDER')).toThrow('Text workbook input');
  });

  it('rejects binary input that does not have an Excel workbook signature', () => {
    expect(() => readSafeWorkbook(new TextEncoder().encode('not a workbook').buffer)).toThrow('valid Excel workbook');
  });

  it('rejects workbooks with more than the supported worksheet limit', () => {
    expect(() => readSafeWorkbook(makeWorkbookBytes(MAX_WORKSHEETS + 1))).toThrow('worksheets');
  });

  it('rejects empty and oversized files before they are parsed', () => {
    const empty = new File([], 'empty.xlsx');
    const oversized = { size: MAX_WORKBOOK_BYTES + 1 } as File;

    expect(() => assertSafeWorkbookFile(empty)).toThrow('between 1 byte');
    expect(() => assertSafeWorkbookFile(oversized)).toThrow('between 1 byte');
  });
});
