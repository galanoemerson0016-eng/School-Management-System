import * as XLSX from 'xlsx';

export const MAX_WORKBOOK_BYTES = 20 * 1024 * 1024;
export const MAX_WORKSHEETS = 64;

export function assertSafeWorkbookFile(file: File): void {
  if (file.size === 0 || file.size > MAX_WORKBOOK_BYTES) {
    throw new Error(`Workbook must be between 1 byte and ${MAX_WORKBOOK_BYTES / 1024 / 1024} MB.`);
  }
}

export function readSafeWorkbook(data: ArrayBuffer): XLSX.WorkBook {
  const bytes = new Uint8Array(data, 0, Math.min(data.byteLength, 4));
  const isZip = bytes.length === 4 && bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04;
  const isOle = bytes.length === 4 && bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0;
  if (!isZip && !isOle) throw new Error('File does not appear to be a valid Excel workbook.');

  const workbook = XLSX.read(data, { type: 'array', WTF: false });
  if (workbook.SheetNames.length === 0 || workbook.SheetNames.length > MAX_WORKSHEETS) {
    throw new Error(`Workbook must contain between 1 and ${MAX_WORKSHEETS} worksheets.`);
  }
  return workbook;
}
