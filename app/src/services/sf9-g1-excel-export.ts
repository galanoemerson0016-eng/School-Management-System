/**
 * Grade 1 SF9 & PACE Form Excel Export Service
 * Populates the official DepEd Grade 1 SF9 with PACE Form template
 * (G1 School Form 9 with PACE Form (SY 26-27).xlsx)
 * using direct OpenXML package manipulation to guarantee 100% fidelity,
 * preserving all shapes, drawings, logos, merged ranges, borders, and print setups.
 */

import JSZip from 'jszip';
import type { Student, SchoolProfile } from '../types';
import type { PaceRatingDescriptor } from '../types/pace';
import { formatLearnerName } from '../utils/student-name';
import { G1_PACE_LOOKUP_MAP } from './g1-pace-lookup-map';
import { PACE_MASTER_CELL_COLORS } from './pace-template-config';
import { PACE_LANGUAGE_MASTER_CELL_COLORS } from './pace-language-template-config';

export interface SF9Grade1Remarks {
  term1CanDo?: string;
  term1ToImprove?: string;
  term2CanDo?: string;
  term2ToImprove?: string;
  term3CanDo?: string;
  term3ToImprove?: string;
}

export interface SF9Grade1ExcelExportOptions {
  student: Student;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section: string;
  gradeLevel?: string;
  adviser: string;
  principal: string;
  principalTitle: string;
  attendance?: {
    months: string[];
    schoolDays: number[];
    daysPresent: number[];
    daysAbsent: number[];
  };
  g1Remarks?: SF9Grade1Remarks;
  paceRatings?: {
    reading?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
    language?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
    math?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
    gmrcMakabansa?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
  };
  sectionStudents?: Student[];
  getStudentRemarks?: (lrn?: string, studentId?: string) => SF9Grade1Remarks | undefined;
  getStudentAttendance?: (student: Student) => {
    months: string[];
    schoolDays: number[];
    daysPresent: number[];
    daysAbsent: number[];
  } | undefined;
  getStudentPaceRatings?: (lrn?: string, studentId?: string) => {
    reading?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
    language?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
    math?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
    gmrcMakabansa?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
  } | undefined;
  paceSubjectFilter?: 'reading' | 'language' | 'math' | 'gmrc-makabansa' | 'all';
}

/**
 * Helper to check if a grade level string corresponds to Grade 1
 */
export function isGrade1(gradeLevel?: string): boolean {
  if (!gradeLevel) return false;
  const g = gradeLevel.toString().trim().toLowerCase();
  const digits = g.replace(/\D/g, '');
  if (digits === '10' || digits === '11' || digits === '12') return false;
  return digits === '1' || g === 'g1' || /^grade\s*1(\D|$)/i.test(g);
}

/**
 * Helper to format any date string into DepEd MM/DD/YYYY format
 */
export function formatDateToMMDDYYYY(dateStr?: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;

  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${m}/${d}/${y}`;
  }

  const mdyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (mdyMatch) {
    const m = mdyMatch[1].padStart(2, '0');
    const d = mdyMatch[2].padStart(2, '0');
    const y = mdyMatch[3];
    return `${m}/${d}/${y}`;
  }

  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  }

  return trimmed;
}

/**
 * Fetch the official Grade 1 SF9 with PACE Form template buffer
 */
export async function fetchGrade1TemplateBuffer(): Promise<ArrayBuffer> {
  const cleanBase = (import.meta.env.BASE_URL || '/').endsWith('/') 
    ? (import.meta.env.BASE_URL || '/') 
    : `${import.meta.env.BASE_URL}/`;
  const timestamp = Date.now();
  
  const templateUrls = [
    `${cleanBase}templates/UPDATED%20[Grade%201]%20ECR,%20PACE%20Form,%20and%20SF9.xlsx?t=${timestamp}`,
    `/templates/UPDATED%20[Grade%201]%20ECR,%20PACE%20Form,%20and%20SF9.xlsx?t=${timestamp}`,
    `templates/UPDATED%20[Grade%201]%20ECR,%20PACE%20Form,%20and%20SF9.xlsx?t=${timestamp}`,
    `${cleanBase}templates/G1%20School%20Form%209%20with%20PACE%20Form%20(SY%2026-27).xlsx?t=${timestamp}`,
    `/templates/G1%20School%20Form%209%20with%20PACE%20Form%20(SY%2026-27).xlsx?t=${timestamp}`,
    `templates/G1%20School%20Form%209%20with%20PACE%20Form%20(SY%2026-27).xlsx?t=${timestamp}`,
    `${cleanBase}templates/SF9%20Template%20Grade%201.xlsx?t=${timestamp}`,
    `/templates/SF9%20Template%20Grade%201.xlsx?t=${timestamp}`,
    `templates/SF9%20Template%20Grade%201.xlsx?t=${timestamp}`,
    `${cleanBase}templates/G1_School_Form_9_with_PACE_Form_(SY_26-27).xlsx?t=${timestamp}`,
    `/templates/G1_School_Form_9_with_PACE_Form_(SY_26-27).xlsx?t=${timestamp}`
  ];

  for (const url of templateUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        // Ensure the response is an actual Excel/ZIP archive (PK\x03\x04), not an HTML SPA fallback or 0 bytes
        if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
          return buffer;
        }
      }
    } catch {
      // Continue to fallback
    }
  }

  throw new Error('Failed to fetch valid Grade 1 School Form 9 with PACE Form template.');
}

export const BOSY_DATE_2026 = new Date(2026, 5, 8); // June 8, 2026
export const EOSY_DATE_2027 = new Date(2027, 3, 8); // April 8, 2027
export const BOSY_EXCEL_DATE = 'DATE(2026,6,8)';
export const EOSY_EXCEL_DATE = 'DATE(2027,4,8)';

export function parseBirthDateParts(birthday?: string): { year: number; month: number; day: number } | null {
  if (!birthday) return null;
  const trimmed = birthday.trim();
  const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    return { year: parseInt(ymdMatch[1], 10), month: parseInt(ymdMatch[2], 10), day: parseInt(ymdMatch[3], 10) };
  }
  const mdyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (mdyMatch) {
    return { year: parseInt(mdyMatch[3], 10), month: parseInt(mdyMatch[1], 10), day: parseInt(mdyMatch[2], 10) };
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }
  return null;
}

/**
 * Helper to compute age in years and months (defaulting to BoSY: June 8, 2026)
 */
export function calculateAge(birthday?: string, asOfDate: Date = BOSY_DATE_2026): { years: number; months: number } {
  const parts = parseBirthDateParts(birthday);
  if (!parts) return { years: 0, months: 0 };

  const asOfYear = asOfDate.getFullYear();
  const asOfMonth = asOfDate.getMonth() + 1;
  const asOfDay = asOfDate.getDate();

  let years = asOfYear - parts.year;
  let months = asOfMonth - parts.month;

  if (asOfDay < parts.day) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years: Math.max(0, years), months: Math.max(0, months) };
}

export interface StudentBoSyEoSyAge {
  boSy: { years: number | string; months: number | string };
  eoSy: { years: number | string; months: number | string };
}

/**
 * Calculates Beginning of SY (BoSY) and End of SY (EoSY) child age
 * Defaulting to June 8 (BoSY) and April 8 (EoSY) of the active school year.
 */
export function getStudentBoSyEoSyAge(
  birthday?: string,
  schoolYear: string = '2026-2027',
  fallbackAge?: number | string
): StudentBoSyEoSyAge {
  const syParts = (schoolYear || '2026-2027').split('-');
  const startYear = parseInt(syParts[0], 10) || 2026;
  const endYear = parseInt(syParts[1], 10) || startYear + 1;
  const bosyDate = new Date(startYear, 5, 8); // June 8 of start year
  const eosyDate = new Date(endYear, 3, 8);   // April 8 of end year

  if (birthday && parseBirthDateParts(birthday)) {
    const boSy = calculateAge(birthday, bosyDate);
    const eoSy = calculateAge(birthday, eosyDate);
    return {
      boSy: { years: boSy.years, months: boSy.months },
      eoSy: { years: eoSy.years, months: eoSy.months }
    };
  }

  if (fallbackAge !== undefined && fallbackAge !== null && fallbackAge !== '' && !isNaN(Number(fallbackAge))) {
    const numAge = Number(fallbackAge);
    return {
      boSy: { years: numAge, months: 0 },
      eoSy: { years: numAge + 1, months: 0 }
    };
  }

  return {
    boSy: { years: '', months: '' },
    eoSy: { years: '', months: '' }
  };
}

export function birthDateToExcelSerial(birthday?: string): number | null {
  const parts = parseBirthDateParts(birthday);
  if (!parts) return null;
  const epoch = new Date(Date.UTC(1899, 11, 30));
  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return Math.round((utcDate.getTime() - epoch.getTime()) / (24 * 60 * 60 * 1000));
}

function escapeFormulaXml(f: string): string {
  return f.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const getAgeFormula = (r: number, targetExcelDate: string, unit: 'Y' | 'YM') =>
  `IF(H${r}="","",DATEDIF(IF(ISNUMBER(H${r}),H${r},DATE(IF(MID(H${r},3,1)="/",RIGHT(H${r},4),LEFT(H${r},4)),IF(MID(H${r},3,1)="/",LEFT(H${r},2),MID(H${r},6,2)),IF(MID(H${r},3,1)="/",MID(H${r},4,2),RIGHT(H${r},2)))),${targetExcelDate},"${unit}"))`;

function colNumberToLetters(n: number): string {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - m) / 26);
  }
  return s;
}

function lettersToColNumber(letters: string): number {
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }
  return n;
}

/**
 * Insert a cell XML tag into a row's inner XML while strictly maintaining
 * ascending alphabetical column order (mandated by OpenXML spreadsheetml schemas).
 */
function insertCellIntoRowBody(rowBody: string, cellRef: string, cellTag: string): string {
  const targetCol = cellRef.replace(/\d+/g, '').toUpperCase();
  const targetColNum = lettersToColNumber(targetCol);

  // Match each cell element: either self-closing <c .../> or with children <c ...>...</c>
  const cellRegex = /<c\s+r="([A-Z]+)\d+"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g;
  let match: RegExpExecArray | null;
  while ((match = cellRegex.exec(rowBody)) !== null) {
    const existingCol = match[1];
    const existingColNum = lettersToColNumber(existingCol);
    if (existingColNum > targetColNum) {
      // Target column comes before this existing column, insert here
      return rowBody.slice(0, match.index) + cellTag + rowBody.slice(match.index);
    }
  }
  // If target column is greater than all existing columns in the row, append to the end
  return rowBody + cellTag;
}

/**
 * Update or insert a cell with an explicit formula and optional cached value in OpenXML
 */
function setCellFormulaInSheetXml(
  sheetXml: string,
  cellRef: string,
  formula: string,
  value?: number | string | null,
  isNumeric = true,
  defaultStyle = '704'
): string {
  const escapedFormula = escapeFormulaXml(formula);
  let valTag = '<v/>';
  let tAttr = '';
  if (value !== undefined && value !== null && value !== '') {
    if (isNumeric && typeof value === 'number' && !isNaN(value)) {
      valTag = `<v>${value}</v>`;
    } else {
      tAttr = ' t="str"';
      valTag = `<v>${escapeXml(value)}</v>`;
    }
  }

  // 1. Self-closing cell
  const selfClosingRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)\\/>`);
  if (selfClosingRegex.test(sheetXml)) {
    return sheetXml.replace(selfClosingRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleId = styleMatch ? styleMatch[1] : defaultStyle;
      const styleAttr = styleId ? ` s="${styleId}"` : '';
      return `<c r="${cellRef}"${styleAttr}${tAttr}><f>${escapedFormula}</f>${valTag}</c>`;
    });
  }

  // 2. Full cell
  const fullCellRegex = new RegExp(`<c\\s+r="${cellRef}"[\\s\\S]*?<\\/c>`);
  if (fullCellRegex.test(sheetXml)) {
    return sheetXml.replace(fullCellRegex, (match) => {
      const openTag = match.substring(0, match.indexOf('>') + 1);
      const styleMatch = openTag.match(/\s+s="(\d+)"/);
      const styleId = styleMatch ? styleMatch[1] : defaultStyle;
      const styleAttr = styleId ? ` s="${styleId}"` : '';
      return `<c r="${cellRef}"${styleAttr}${tAttr}><f>${escapedFormula}</f>${valTag}</c>`;
    });
  }

  // 3. Row exists, cell absent
  const rowNum = cellRef.replace(/\D/g, '');
  const rowRegex = new RegExp(`(<row\\s+r="${rowNum}"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
  if (rowRegex.test(sheetXml)) {
    return sheetXml.replace(rowRegex, (_m, p1, p2, p3) => {
      const styleAttr = defaultStyle ? ` s="${defaultStyle}"` : '';
      const cellTag = `<c r="${cellRef}"${styleAttr}${tAttr}><f>${escapedFormula}</f>${valTag}</c>`;
      return `${p1}${insertCellIntoRowBody(p2, cellRef, cellTag)}${p3}`;
    });
  }

  return sheetXml;
}

/**
 * XML string escaping helper
 */
function escapeXml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function unescapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * Update or insert a cell value in an OpenXML worksheet string while preserving existing styles and formulas.
 */
function updateCellInSheetXml(
  sheetXml: string, 
  cellRef: string, 
  value: string | number, 
  isNumeric = false, 
  forceStyle?: string,
  preserveExistingFormula = true
): string {
  const formattedVal = escapeXml(value);
  let newInner = '';
  let newTag = '';

  const isEmpty = value === '' || value === null || value === undefined;

  if (isNumeric && typeof value === 'number' && !isNaN(value)) {
    newTag = `<c r="${cellRef}"`;
    newInner = `<v>${value}</v>`;
  } else if (isEmpty) {
    newTag = `<c r="${cellRef}"`;
    newInner = '';
  } else {
    newTag = `<c r="${cellRef}" t="inlineStr"`;
    newInner = `<is><t xml:space="preserve">${formattedVal}</t></is>`;
  }

  // 1. Check self-closing cell: <c r="D15" s="163"/>
  const selfClosingRegex = new RegExp(`<c\\s+r="${cellRef}"([^>]*?)\\/>`);
  if (selfClosingRegex.test(sheetXml)) {
    return sheetXml.replace(selfClosingRegex, (_match, attrs) => {
      const styleMatch = attrs.match(/\s+s="(\d+)"/);
      const styleId = forceStyle || (styleMatch ? styleMatch[1] : '');
      const styleAttr = styleId ? ` s="${styleId}"` : '';
      if (isEmpty) {
        return `<c r="${cellRef}"${styleAttr}/>`;
      }
      return `${newTag}${styleAttr}>${newInner}</c>`;
    });
  }

  // 2. Check full cell: <c r="C5" s="176" t="s"><v>361</v></c> or with formula
  const fullCellRegex = new RegExp(`<c\\s+r="${cellRef}"[\\s\\S]*?<\\/c>`);
  if (fullCellRegex.test(sheetXml)) {
    return sheetXml.replace(fullCellRegex, (match) => {
      const openTag = match.substring(0, match.indexOf('>') + 1);
      const styleMatch = openTag.match(/\s+s="(\d+)"/);
      const styleId = forceStyle || (styleMatch ? styleMatch[1] : '');
      const styleAttr = styleId ? ` s="${styleId}"` : '';

      const formulaMatch = match.match(/<f[^>]*>([\s\S]*?)<\/f>/);
      if (preserveExistingFormula && formulaMatch && formulaMatch[1] !== '#REF!') {
        const formulaTag = formulaMatch[0];
        if (isEmpty) {
          return `<c r="${cellRef}"${styleAttr}>${formulaTag}<v/></c>`;
        }
        if (isNumeric && typeof value === 'number' && !isNaN(value)) {
          return `<c r="${cellRef}"${styleAttr}>${formulaTag}<v>${value}</v></c>`;
        }
        return `<c r="${cellRef}" t="str"${styleAttr}>${formulaTag}<v>${formattedVal}</v></c>`;
      }

      if (isEmpty) {
        return `<c r="${cellRef}"${styleAttr}/>`;
      }
      return `${newTag}${styleAttr}>${newInner}</c>`;
    });
  }

  // 3. Check if row exists but cell is absent: insert into <row r="num">
  const rowNum = cellRef.replace(/\D/g, '');
  const rowRegex = new RegExp(`(<row\\s+r="${rowNum}"[^>]*>)([\\s\\S]*?)(<\\/row>)`);
  if (rowRegex.test(sheetXml)) {
    return sheetXml.replace(rowRegex, (_m, p1, p2, p3) => {
      const styleAttr = forceStyle ? ` s="${forceStyle}"` : '';
      if (isEmpty) {
        const cellTag = `<c r="${cellRef}"${styleAttr}/>`;
        return `${p1}${insertCellIntoRowBody(p2, cellRef, cellTag)}${p3}`;
      }
      const cellTag = `${newTag}${styleAttr}>${newInner}</c>`;
      return `${p1}${insertCellIntoRowBody(p2, cellRef, cellTag)}${p3}`;
    });
  }

  return sheetXml;
}

/**
 * Batch update multiple cells in a worksheet XML string
 */
function updateCellsBatch(
  sheetXml: string, 
  cells: Record<string, string | number | undefined | null>,
  styles?: Record<string, string>
): string {
  let updated = sheetXml;
  for (const [ref, val] of Object.entries(cells)) {
    if (val === undefined || val === null) continue;
    const isNum = typeof val === 'number';
    const forceStyle = styles?.[ref];
    updated = updateCellInSheetXml(updated, ref, val, isNum, forceStyle);
  }
  return updated;
}

// ---------------------------------------------------------------------------
// Row Mappings for PACE Sheet
// ---------------------------------------------------------------------------

const READING_LEFT_ROW_MAP: Record<string, number> = {
  '1_listening': 19, '1_speaking': 20,
  '2_listening': 21, '2_speaking': 22,
  '3_listening': 23, '3_speaking': 24,
  '4_listening': 25, '4_speaking': 26,
  '5_listening': 27, '5_speaking': 28,

  '6_listening': 30, '6_speaking': 31, '6_reading': 32,
  '7_listening': 33, '7_speaking': 34, '7_reading': 35,
  '8_listening': 36, '8_speaking': 37, '8_reading': 38,
  '9_listening': 39, '9_speaking': 40, '9_reading': 41,
  '10_listening': 42, '10_speaking': 43, '10_reading': 44,

  '11_listening': 46, '11_speaking': 47, '11_reading': 48,
  '12_main': 49,
  '12a_listening': 50, '12a_speaking': 51, '12a_reading': 52, '12a_writing': 53,
  '12b_listening': 54, '12b_speaking': 55, '12b_reading': 56, '12b_writing': 57,
  '13_listening': 58, '13_speaking': 59, '13_reading': 60,
  '14_listening': 61, '14_speaking': 62, '14_reading': 63,
  '15_listening': 64, '15_speaking': 65, '15_reading': 66, '15_writing': 67,

  '16_listening': 69, '16_speaking': 70, '16_reading': 71,
  '17_listening': 72, '17_speaking': 73, '17_reading': 74,
  '18_listening': 75, '18_speaking': 76, '18_reading': 77
};

const READING_RIGHT_ROW_MAP: Record<string, number> = {
  '19_listening': 19, '19_speaking': 20, '19_reading': 21,

  '20_main': 22,
  '20a_listening': 23, '20a_speaking': 24, '20a_reading': 25,
  '20b_listening': 26, '20b_speaking': 27, '20b_reading': 28,
  '20c_listening': 29, '20c_speaking': 30, '20c_reading': 31,
  '20d_listening': 32, '20d_speaking': 33, '20d_reading': 34,
  '20e_listening': 35, '20e_speaking': 36, '20e_reading': 37,
  '20f_listening': 38, '20f_speaking': 39, '20f_reading': 40,
  '20g_listening': 41, '20g_speaking': 42, '20g_reading': 43,

  '21_main': 44,
  '21a_listening': 45, '21a_speaking': 46, '21a_reading': 47,
  '21b_listening': 48, '21b_speaking': 49, '21b_reading': 50,

  '22_main': 52,
  '22a_speaking': 53, '22a_writing': 54,
  '22b_speaking': 55, '22b_writing': 56,
  '22c_speaking': 57, '22c_writing': 58,

  '23_speaking': 59, '23_writing': 60,

  '24_main': 61,
  '24a_speaking': 62, '24a_writing': 63,
  '24b_speaking': 64, '24b_writing': 65,
  '24c_speaking': 66, '24c_writing': 67,

  '25_speaking': 68, '25_writing': 69
};

const LANGUAGE_LEFT_ROW_MAP: Record<string, number> = {
  '1_main': 99,
  '1a_listening': 100, '1a_speaking': 101,
  '1b_listening': 102, '1b_speaking': 103,
  '1c_listening': 104, '1c_speaking': 105,

  '2_main': 106,
  '2a_listening': 107, '2a_speaking': 108,
  '2b_listening': 109, '2b_speaking': 110,

  '3_main': 111,
  '3a_listening': 112, '3a_speaking': 113,
  '3b_listening': 114, '3b_speaking': 115,
  '3c_listening': 116, '3c_speaking': 117,
  '3d_listening': 118, '3d_speaking': 119,
  '3e_listening': 120, '3e_speaking': 121,
  '3f_listening': 122, '3f_speaking': 123,

  '4_main': 124,
  '4a_listening': 125, '4a_speaking': 126,
  '4b_listening': 127, '4b_speaking': 128,
  '4c_listening': 129, '4c_speaking': 130,

  '5_listening': 131, '5_speaking': 132,

  '6_main': 134,
  '6a_listening': 135, '6a_speaking': 136,
  '6b_listening': 137, '6b_speaking': 138,
  '6c_listening': 139, '6c_speaking': 140,

  '7_main': 141,
  '7a_listening': 142, '7a_speaking': 143,
  '7b_listening': 144, '7b_speaking': 145,
  '7c_listening': 146, '7c_speaking': 147,

  '8_main': 148,
  '8a_listening': 149, '8a_speaking': 150,
  '8b_listening': 151, '8b_speaking': 152,
  '8c_listening': 153, '8c_speaking': 154,

  '9_main': 155,
  '9a_listening': 156, '9a_speaking': 157,
  '9b_listening': 158, '9b_speaking': 159,
  '9c_listening': 160, '9c_speaking': 161
};

const LANGUAGE_RIGHT_ROW_MAP: Record<string, number> = {
  '10_listening': 98, '10_speaking': 99,

  '11_listening': 101, '11_speaking': 102,

  '12_main': 103,
  '12a_listening': 104, '12a_speaking': 105,
  '12b_listening': 106, '12b_speaking': 107,

  '13_main': 108,
  '13a_listening': 109, '13a_speaking': 110,
  '13b_listening': 111, '13b_speaking': 112,
  '13c_listening': 113, '13c_speaking': 114,
  '13d_listening': 115, '13d_speaking': 116,

  '14_listening': 118,
  '15_listening': 119,
  '15_speaking': 120,

  '16_main': 121,
  '16a_listening': 122, '16a_speaking': 123,
  '16b_listening': 124, '16b_speaking': 125,
  '16c_listening': 126, '16c_speaking': 127,
  '16d_listening': 128, '16d_speaking': 129,

  '17_listening': 130, '17_speaking': 131,

  '18_main': 133,
  '18a_listening': 134, '18a_speaking': 135,
  '18b_listening': 136, '18b_speaking': 137,
  '18c_listening': 138, '18c_speaking': 139,

  '19_listening': 140, '19_speaking': 141,

  '20_main': 142,
  '20a_listening': 143, '20a_speaking': 144,
  '20b_listening': 145, '20b_speaking': 146,
  '20c_listening': 147, '20c_speaking': 148,
  '20d_listening': 149, '20d_speaking': 150,
  '20e_listening': 151, '20e_speaking': 152
};

const MATH_ROW_MAP: Record<string, number> = {
  // Term 1 (Rows 176 - 194)
  'm1_1': 176,
  'm1_2': 177,
  'm1_3': 178,
  'm1_4': 179,
  'm1_5': 180,
  'm1_6': 181,
  'm1_7': 182,
  'm1_8': 183,
  'm1_9_main': 184,
  'm1_9': 184,
  'm1_9a': 185,
  'm1_9b': 186,
  'm1_10': 187,
  'm1_11': 189,
  'm1_12': 190,
  'm1_13': 191,
  'm1_14': 192,
  'm1_15': 193,
  'm1_16': 194,

  // Term 2 (Rows 197 - 219)
  'm2_1': 197,
  'm2_2': 198,
  'm2_3_main': 199,
  'm2_3': 199,
  'm2_3a': 200,
  'm2_4': 201,
  'm2_5': 202,
  'm2_6': 203,
  'm2_7': 204,
  'm2_8_main': 205,
  'm2_8': 205,
  'm2_8a': 205,
  'm2_8b': 206,
  'm2_9': 207,
  'm2_10': 208,
  'm2_11': 209,
  'm2_12': 210,
  'm2_13': 211,
  'm2_14_main': 212,
  'm2_14': 212,
  'm2_14a': 212,
  'm2_14b': 213,
  'm2_15': 214,
  'm2_16': 216,
  'm2_17': 217,
  'm2_18': 218,
  'm2_19': 219,

  // Term 3 (Rows 222 - 236)
  'm3_1': 222,
  'm3_2': 223,
  'm3_3': 224,
  'm3_4': 225,
  'm3_5': 226,
  'm3_6': 227,
  'm3_7': 228,
  'm3_8': 229,
  'm3_9': 230,
  'm3_10': 232,
  'm3_11': 233,
  'm3_12': 234,
  'm3_13': 235,
  'm3_14': 236
};

const GMRC_ROW_MAP: Record<string, number> = {
  // Term 1 (Rows 256 - 262)
  'gmrc1_1': 256,
  'gmrc1_2': 257,
  'gmrc1_3': 258,
  'gmrc1_4': 259,
  'gmrc1_5': 260,
  'gmrc1_6': 261,
  'gmrc1_7': 262,

  // Term 2 (Rows 264 - 272)
  'gmrc2_1': 264,
  'gmrc2_2': 265,
  'gmrc2_3': 266,
  'gmrc2_4': 267,
  'gmrc2_5': 268,
  'gmrc2_6': 269,
  'gmrc2_7': 270,
  'gmrc2_8': 271,
  'gmrc2_9': 272,

  // Term 3 (Rows 274 - 281)
  'gmrc3_1': 274,
  'gmrc3_2': 275,
  'gmrc3_3': 276,
  'gmrc3_4': 277,
  'gmrc3_5': 278,
  'gmrc3_6': 279,
  'gmrc3_7': 280,
  'gmrc3_8': 281
};

const MAKABANSA_ROW_MAP: Record<string, number> = {
  // Term 1 (Rows 294 - 298)
  'maka1_1_main': 294, 'maka1_1a': 295, 'maka1_1b': 296,
  'maka1_2': 297, 'maka1_3': 298,
  'makabansa1_1_main': 294, 'makabansa1_1a': 295, 'makabansa1_1b': 296,
  'makabansa1_2': 297, 'makabansa1_3': 298,

  // Term 2 (Rows 300 - 302)
  'maka2_1': 300, 'maka2_2': 301, 'maka2_3': 302,
  'makabansa2_1': 300, 'makabansa2_2': 301, 'makabansa2_3': 302,

  // Term 3 (Rows 304 - 310)
  'maka3_1': 304, 'maka3_2': 305, 'maka3_3': 306, 'maka3_4': 307,
  'maka3_5': 308, 'maka3_6': 309, 'maka3_7': 310,
  'makabansa3_1': 304, 'makabansa3_2': 305, 'makabansa3_3': 306, 'makabansa3_4': 307,
  'makabansa3_5': 308, 'makabansa3_6': 309, 'makabansa3_7': 310
};

/**
 * Helper to discover sheet mapping (e.g. "INPUT DATA" -> "xl/worksheets/sheet2.xml")
 */
async function getWorkbookSheetMap(zip: JSZip): Promise<Record<string, string>> {
  const sheetMap: Record<string, string> = {};
  const wbFile = zip.file('xl/workbook.xml');
  const relFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!wbFile || !relFile) return sheetMap;

  const wbXml = await wbFile.async('string');
  const relXml = await relFile.async('string');
  const sRegex = /<sheet\b([^>]*?)\/?>/g;
  let match: RegExpExecArray | null;
  while ((match = sRegex.exec(wbXml)) !== null) {
    const attrs = match[1];
    const nameMatch = attrs.match(/name="([^"]+)"/);
    const rIdMatch = attrs.match(/r:id="([^"]+)"/);
    if (nameMatch && rIdMatch) {
      const name = nameMatch[1];
      const rId = rIdMatch[1];
      const relMatch = relXml.match(new RegExp(`<Relationship\\s+Id="${rId}"[^>]*Target="([^"]+)"`));
      if (relMatch) {
        const target = ('xl/' + relMatch[1]).replace('xl/xl/', 'xl/');
        const unescapedName = name.replace(/&amp;/g, '&');
        sheetMap[unescapedName] = target;
      }
    }
  }

  // Fallback defaults for Grade 1 17-sheet master workbook if any were missed
  const defaultSheetPaths: Record<string, string> = {
    'Home': 'xl/worksheets/sheet1.xml',
    'INPUT DATA': 'xl/worksheets/sheet2.xml',
    'SF9 - GRADE 1': 'xl/worksheets/sheet3.xml',
    'TERM 1 SUMMARY': 'xl/worksheets/sheet4.xml',
    'TERM 2 SUMMARY': 'xl/worksheets/sheet5.xml',
    'TERM 3 SUMMARY': 'xl/worksheets/sheet6.xml',
    'PACE - GRADE 1': 'xl/worksheets/sheet7.xml',
    'TERM 1 READING & LITERACY': 'xl/worksheets/sheet8.xml',
    'TERM 2 READING & LITERACY': 'xl/worksheets/sheet9.xml',
    'TERM 3 READING & LITERACY': 'xl/worksheets/sheet10.xml',
    'TERM 1 LANGUAGE': 'xl/worksheets/sheet11.xml',
    'TERM 2 LANGUAGE': 'xl/worksheets/sheet12.xml',
    'TERM 3 LANGUAGE': 'xl/worksheets/sheet13.xml',
    'TERM 1-3 MATHEMATICS': 'xl/worksheets/sheet14.xml',
    'TERM 1-3 GMRC': 'xl/worksheets/sheet15.xml',
    'G1 PACE FORM MAKABANSA': 'xl/worksheets/sheet16.xml',
    'G1 - ATTENDANCE SUMMARY': 'xl/worksheets/sheet17.xml',
  };

  for (const [name, defaultPath] of Object.entries(defaultSheetPaths)) {
    if (!sheetMap[name] && zip.file(defaultPath)) {
      sheetMap[name] = defaultPath;
    }
  }

  return sheetMap;
}

/**
 * Populate the newly released 17-sheet unified master workbook:
 * "UPDATED [Grade 1] ECR, PACE Form, and SF9.xlsx"
 * Preserving all formulas, formatting, password protection, and OpenXML layout.
 */
async function populateUpdatedAllInOneGrade1Workbook(
  zip: JSZip,
  opts: SF9Grade1ExcelExportOptions
): Promise<ArrayBuffer> {
  const sheetMap = await getWorkbookSheetMap(zip);

  // 1. Remove stale calcChain & external links to prevent Excel repair popups
  zip.remove('xl/calcChain.xml');
  zip.remove('xl/externalLinks/externalLink1.xml');
  zip.remove('xl/externalLinks/_rels/externalLink1.xml.rels');

  const wbRel = zip.file('xl/_rels/workbook.xml.rels');
  if (wbRel) {
    let relXml = await wbRel.async('string');
    relXml = relXml.replace(/<Relationship[^>]*Target="calcChain\.xml"[^>]*\/>/g, '');
    relXml = relXml.replace(/<Relationship[^>]*Target="externalLinks\/[^"]*"[^>]*\/>/g, '');
    zip.file('xl/_rels/workbook.xml.rels', relXml);
  }

  const ctFile = zip.file('[Content_Types].xml');
  if (ctFile) {
    let ctXml = await ctFile.async('string');
    ctXml = ctXml.replace(/<Override[^>]*PartName="\/xl\/calcChain\.xml"[^>]*\/>/g, '');
    ctXml = ctXml.replace(/<Override[^>]*PartName="\/xl\/externalLinks\/[^"]*"[^>]*\/>/g, '');
    zip.file('[Content_Types].xml', ctXml);
  }

  // 1b. Force full calculation on load to ensure all formula linkages evaluate immediately
  const wbFile = zip.file('xl/workbook.xml');
  if (wbFile) {
    let wbXml = await wbFile.async('string');
    if (wbXml.includes('<calcPr')) {
      wbXml = wbXml.replace(/<calcPr([^>]*?)(?:\/?>|>[\s\S]*?<\/calcPr>)/g, (_match, attrs) => {
        // Remove existing attributes if they are already present to avoid duplication
        const cleanAttrs = attrs.replace(/\s*fullCalcOnLoad="\d+"/g, '')
                              .replace(/\s*forceFullCalc="\d+"/g, '');
        return `<calcPr${cleanAttrs} fullCalcOnLoad="1" forceFullCalc="1"/>`;
      });
      // Fallback if <calcPr> was missing entirely (rare, but just in case)
      if (!wbXml.includes('fullCalcOnLoad="1"')) {
        wbXml = wbXml.replace('</workbook>', '<calcPr calcId="191029" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>');
      }
    }
    zip.file('xl/workbook.xml', wbXml);
  }

  // 1c. Unify fonts, alignments, and styles for learner rows in INPUT DATA (sheet2.xml):
  // Ensure styles 73, 75, 77, 79, 81, 83, 104, 106 use uniform Arial 10pt Bold (font 14),
  // shrinkToFit for names, horizontal/vertical center for LRN & Birthday, and correct numFmt.
  const stylesFile = zip.file('xl/styles.xml');
  if (stylesFile) {
    let stylesXml = await stylesFile.async('string');
    const nameStyle = '<xf borderId="36" fillId="5" fontId="14" numFmtId="0" xfId="0" applyAlignment="1" applyBorder="1" applyFill="1" applyFont="1"><alignment horizontal="left" vertical="center" shrinkToFit="1"/></xf>';
    const lrnStyle = '<xf borderId="36" fillId="5" fontId="14" numFmtId="49" xfId="0" applyAlignment="1" applyBorder="1" applyFill="1" applyFont="1" applyNumberFormat="1"><alignment horizontal="center" vertical="center"/></xf>';
    const bdayStyle = '<xf borderId="36" fillId="5" fontId="14" numFmtId="164" xfId="0" applyAlignment="1" applyBorder="1" applyFill="1" applyFont="1" applyNumberFormat="1"><alignment horizontal="center" vertical="center"/></xf>';

    const cellXfsMatch = stylesXml.match(/<cellXfs count="(\d+)">([\s\S]*?)<\/cellXfs>/);
    if (cellXfsMatch) {
      const xfs: string[] = [];
      const xfRegex = /<xf\s+[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g;
      let m: RegExpExecArray | null;
      while ((m = xfRegex.exec(cellXfsMatch[2])) !== null) {
        xfs.push(m[0]);
      }
      if (xfs.length > 106) {
        xfs[73] = nameStyle;
        xfs[79] = nameStyle;
        xfs[75] = lrnStyle;
        xfs[81] = lrnStyle;
        xfs[104] = lrnStyle;
        xfs[77] = bdayStyle;
        xfs[83] = bdayStyle;
        xfs[106] = bdayStyle;
        stylesXml = stylesXml.replace(
          /<cellXfs count="\d+">[\s\S]*?<\/cellXfs>/,
          `<cellXfs count="${xfs.length}">${xfs.join('')}</cellXfs>`
        );
        zip.file('xl/styles.xml', stylesXml);
      }
    }
  }

  // 2. Fix DepEd Template Bug in TERM 1-3 MATHEMATICS (sheet14.xml):
  // Female learners in rows 67-116 incorrectly referenced Q12..Q61 instead of Q11..Q60
  const mathSheetPath = sheetMap['TERM 1-3 MATHEMATICS'] || 'xl/worksheets/sheet14.xml';
  const mathFile = zip.file(mathSheetPath);
  if (mathFile) {
    let mXml = await mathFile.async('string');
    mXml = mXml.replace(
      /<c\s+r="C(\d+)"([^>]*)><f>IF\('INPUT DATA'!Q(\d+)=""\s*,\s*""\s*,\s*'INPUT DATA'!Q\d+\)<\/f>/g,
      (orig, rowStr, attrs) => {
        const rowNum = parseInt(rowStr, 10);
        if (rowNum >= 67 && rowNum <= 116) {
          const correctQ = rowNum - 56;
          return `<c r="C${rowNum}"${attrs}><f>IF('INPUT DATA'!Q${correctQ}="","",'INPUT DATA'!Q${correctQ})</f>`;
        }
        return orig;
      }
    );
    zip.file(mathSheetPath, mXml);
  }

  // 3. Prepare learners list: Males first, Females second, sorted alphabetically by Last Name
  const sectionStudents = (opts.sectionStudents && opts.sectionStudents.length > 0)
    ? opts.sectionStudents
    : [opts.student];

  const isMale = (s: Student) => {
    const g = (s.gender || '').toUpperCase();
    return g === 'MALE' || g === 'M';
  };

  const sortFn = (a: Student, b: Student) => {
    const lastA = (a.last_name || '').toUpperCase();
    const lastB = (b.last_name || '').toUpperCase();
    if (lastA !== lastB) return lastA.localeCompare(lastB);
    return (a.first_name || '').toUpperCase().localeCompare((b.first_name || '').toUpperCase());
  };

  const males = sectionStudents.filter(isMale).sort(sortFn);
  const females = sectionStudents.filter(s => !isMale(s)).sort(sortFn);

  const prof: Partial<SchoolProfile> = opts.schoolProfile || {};
  const cleanDiv = (prof.division || '')
    .replace(/schools division office of/i, '')
    .replace(/division of/i, '')
    .replace(/schools division/i, '')
    .trim().toUpperCase();

  let distVal = (prof.district || '').trim();
  if (distVal) {
    distVal = distVal.toUpperCase().includes('DISTRICT') ? distVal.toUpperCase() : `${distVal.toUpperCase()} DISTRICT`;
  }
  let muniCity = (prof.municipality || prof.city || '').trim();
  if (!muniCity && prof.district) {
    const extracted = prof.district
      .replace(/\b(east|west|north|south|central|district|dist\.|cluster|zone)\b/gi, '')
      .trim();
    if (extracted) {
      muniCity = extracted;
    }
  }
  muniCity = (muniCity || 'VICTORIA').toUpperCase();
  let province = (prof.province || '').trim();
  if (!province && prof.division) {
    const extractedProv = prof.division
      .replace(/schools division office of/i, '')
      .replace(/division of/i, '')
      .replace(/schools division/i, '')
      .replace(/\bprovince\b/i, '')
      .trim();
    if (extractedProv && extractedProv.toUpperCase() !== muniCity) {
      province = extractedProv;
    }
  }
  province = (province || 'TARLAC').toUpperCase();
  const muniCityProv = [muniCity, province].filter(Boolean).join(', ') || muniCity;

  const profileAdviser = (opts.schoolProfile?.adviser_name || '').trim();
  let rawAdviser = (opts.adviser || '').trim();
  const isMockAdviser = !rawAdviser || 
                        rawAdviser.toLowerCase().includes('maria') || 
                        rawAdviser.toLowerCase().includes('santos') || 
                        rawAdviser.toLowerCase().includes('juan') || 
                        rawAdviser.toLowerCase().includes('recovered') || 
                        rawAdviser.toLowerCase() === 'tba';

  if ((isMockAdviser || !rawAdviser) && profileAdviser && profileAdviser.toLowerCase() !== 'admin') {
    rawAdviser = profileAdviser;
  } else if (!rawAdviser) {
    rawAdviser = profileAdviser;
  }

  const rawSection = (opts.section || opts.student?.student_section || 'MATATAG').trim();
  const rawPrincipal = (opts.principal || opts.schoolProfile?.head_name || 'JUAN A. DELA CRUZ').trim();

  // 4. Populate INPUT DATA (sheet2.xml)
  const inputSheetPath = sheetMap['INPUT DATA'] || 'xl/worksheets/sheet2.xml';
  const inputFile = zip.file(inputSheetPath);
  if (inputFile) {
    let inputXml = await inputFile.async('string');
    const inputCells: Record<string, string | number> = {
      'F10': opts.schoolProfile.region || '',
      'F11': cleanDiv,
      'F12': muniCity,
      'F13': distVal,
      'F15': opts.schoolProfile.school_id || '',
      'F16': (opts.schoolProfile.name || '').toUpperCase(),
      'F18': opts.schoolYear,
      'F19': rawPrincipal.toUpperCase(),
      'F26': rawAdviser.toUpperCase(),
      'F27': (opts.gradeLevel || 'Grade 1'),
      'F28': rawSection.toUpperCase()
    };

    // Males (Rows 11 to 60)
    for (let i = 0; i < 50; i++) {
      const r = 11 + i;
      const st = males[i];
      if (st) {
        inputCells[`K${r}`] = i + 1;
        inputCells[`L${r}`] = formatLearnerName(st).toUpperCase();
        inputCells[`M${r}`] = st.lrn || '';
        const bSerial = birthDateToExcelSerial(st.birthday);
        inputCells[`N${r}`] = bSerial !== null ? bSerial : formatDateToMMDDYYYY(st.birthday);
      } else {
        inputCells[`K${r}`] = '';
        inputCells[`L${r}`] = '';
        inputCells[`M${r}`] = '';
        inputCells[`N${r}`] = '';
      }
    }

    // Females (Rows 11 to 60)
    for (let i = 0; i < 50; i++) {
      const r = 11 + i;
      const st = females[i];
      if (st) {
        inputCells[`P${r}`] = i + 1;
        inputCells[`Q${r}`] = formatLearnerName(st).toUpperCase();
        inputCells[`R${r}`] = st.lrn || '';
        const bSerial = birthDateToExcelSerial(st.birthday);
        inputCells[`S${r}`] = bSerial !== null ? bSerial : formatDateToMMDDYYYY(st.birthday);
      } else {
        inputCells[`P${r}`] = '';
        inputCells[`Q${r}`] = '';
        inputCells[`R${r}`] = '';
        inputCells[`S${r}`] = '';
      }
    }

    // Ensure all learner rows (11 to 60) have uniform styling:
    // K & P: style 72 (NO., centered, Arial 10pt bold)
    // L & Q: style 79 (Name, left, vertical center, shrinkToFit, Arial 10pt bold)
    // M & R: style 81 (LRN, centered, vertical center, Arial 10pt bold)
    // N & S: style 83 (Birthday, centered, vertical center, Arial 10pt bold, M/d/yyyy)
    const inputStyles: Record<string, string> = {};
    for (let i = 0; i < 50; i++) {
      const r = 11 + i;
      inputStyles[`K${r}`] = '72';
      inputStyles[`L${r}`] = '79';
      inputStyles[`M${r}`] = '81';
      inputStyles[`N${r}`] = '83';
      inputStyles[`P${r}`] = '72';
      inputStyles[`Q${r}`] = '79';
      inputStyles[`R${r}`] = '81';
      inputStyles[`S${r}`] = '83';
    }

    inputXml = updateCellsBatch(inputXml, inputCells, inputStyles);

    // Standardize column widths in INPUT DATA:
    // K & P (No.): 5.0
    // L & Q (Name): 42.0
    // M & R (LRN): 16.5
    // N & S (Birthday): 16.0
    // O (Spacer): 3.75
    const updatedCols = '<cols>' +
      '<col customWidth="1" min="1" max="2" width="3.75"/>' +
      '<col customWidth="1" min="3" max="3" width="11.5"/>' +
      '<col customWidth="1" min="4" max="4" width="7.5"/>' +
      '<col customWidth="1" min="5" max="5" width="3.75"/>' +
      '<col customWidth="1" min="6" max="6" width="12.5"/>' +
      '<col customWidth="1" min="7" max="7" width="31.5"/>' +
      '<col customWidth="1" min="8" max="10" width="3.75"/>' +
      '<col customWidth="1" min="11" max="11" width="5.0"/>' +
      '<col customWidth="1" min="12" max="12" width="42.0"/>' +
      '<col customWidth="1" min="13" max="13" width="16.5"/>' +
      '<col customWidth="1" min="14" max="14" width="16.0"/>' +
      '<col customWidth="1" min="15" max="15" width="3.75"/>' +
      '<col customWidth="1" min="16" max="16" width="5.0"/>' +
      '<col customWidth="1" min="17" max="17" width="42.0"/>' +
      '<col customWidth="1" min="18" max="18" width="16.5"/>' +
      '<col customWidth="1" min="19" max="19" width="16.0"/>' +
      '<col customWidth="1" min="20" max="21" width="3.75"/>' +
      '<col customWidth="1" min="22" max="26" width="12.5"/>' +
      '</cols>';
    inputXml = inputXml.replace(/<cols>[\s\S]*?<\/cols>/, updatedCols);

    // Standardize row heights for Rows 11 to 60: ht="20"
    inputXml = inputXml.replace(/<row\s+r="(\d+)"[^>]*>/g, (orig, rowStr) => {
      const r = parseInt(rowStr, 10);
      if (r >= 11 && r <= 60) {
        return `<row r="${r}" ht="20" customHeight="1">`;
      }
      return orig;
    });

    // Suppress green error triangles on LRN columns (M11:M60 and R11:R60)
    if (!inputXml.includes('<ignoredErrors>')) {
      const ignoredErrorsTag = '<ignoredErrors><ignoredError sqref="M11:M60 R11:R60" numberStoredAsText="1"/></ignoredErrors>';
      if (inputXml.includes('<drawing')) {
        inputXml = inputXml.replace('<drawing', `${ignoredErrorsTag}<drawing`);
      } else {
        inputXml = inputXml.replace('</worksheet>', `${ignoredErrorsTag}</worksheet>`);
      }
    }

    zip.file(inputSheetPath, inputXml);
  }

  // 5. Populate G1 - ATTENDANCE SUMMARY (sheet17.xml)
  const attSheetPath = sheetMap['G1 - ATTENDANCE SUMMARY'] || 'xl/worksheets/sheet17.xml';
  const attFile = zip.file(attSheetPath);
  if (attFile) {
    let attXml = await attFile.async('string');
    const attCells: Record<string, string | number> = {};
    const monthCols = ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'];

    const getAttendanceForStudent = (st: Student) => {
      if (opts.getStudentAttendance) {
        const res = opts.getStudentAttendance(st);
        if (res) return res;
      }
      if (st.lrn === opts.student.lrn && opts.attendance) {
        return opts.attendance;
      }
      return null;
    };

    const sampleAtt = opts.attendance || (opts.getStudentAttendance ? opts.getStudentAttendance(opts.student) : null);
    if (sampleAtt && sampleAtt.schoolDays && sampleAtt.schoolDays.length > 0) {
      const schoolDays12 = [
        sampleAtt.schoolDays[0] || 16,
        sampleAtt.schoolDays[1] || 23,
        sampleAtt.schoolDays[2] || 19,
        Math.ceil((sampleAtt.schoolDays[3] || 22) / 2),
        Math.floor((sampleAtt.schoolDays[3] || 22) / 2),
        sampleAtt.schoolDays[4] || 22,
        sampleAtt.schoolDays[5] || 19,
        sampleAtt.schoolDays[6] || 13,
        sampleAtt.schoolDays[7] || 20,
        sampleAtt.schoolDays[8] || 20,
        sampleAtt.schoolDays[9] || 21,
        sampleAtt.schoolDays[10] || 6
      ];
      monthCols.forEach((col, idx) => {
        attCells[`${col}12`] = schoolDays12[idx];
        attCells[`${col}116`] = schoolDays12[idx];
      });
    }

    males.forEach((m, idx) => {
      const r = 13 + idx;
      const stAtt = getAttendanceForStudent(m);
      if (stAtt && stAtt.daysPresent && stAtt.daysPresent.length > 0) {
        const dp12 = [
          stAtt.daysPresent[0] || 0,
          stAtt.daysPresent[1] || 0,
          stAtt.daysPresent[2] || 0,
          Math.ceil((stAtt.daysPresent[3] || 0) / 2),
          Math.floor((stAtt.daysPresent[3] || 0) / 2),
          stAtt.daysPresent[4] || 0,
          stAtt.daysPresent[5] || 0,
          stAtt.daysPresent[6] || 0,
          stAtt.daysPresent[7] || 0,
          stAtt.daysPresent[8] || 0,
          stAtt.daysPresent[9] || 0,
          stAtt.daysPresent[10] || 0
        ];
        monthCols.forEach((col, mIdx) => {
          attCells[`${col}${r}`] = dp12[mIdx];
        });
      }
    });

    females.forEach((f, idx) => {
      const r = 64 + idx;
      const stAtt = getAttendanceForStudent(f);
      if (stAtt && stAtt.daysPresent && stAtt.daysPresent.length > 0) {
        const dp12 = [
          stAtt.daysPresent[0] || 0,
          stAtt.daysPresent[1] || 0,
          stAtt.daysPresent[2] || 0,
          Math.ceil((stAtt.daysPresent[3] || 0) / 2),
          Math.floor((stAtt.daysPresent[3] || 0) / 2),
          stAtt.daysPresent[4] || 0,
          stAtt.daysPresent[5] || 0,
          stAtt.daysPresent[6] || 0,
          stAtt.daysPresent[7] || 0,
          stAtt.daysPresent[8] || 0,
          stAtt.daysPresent[9] || 0,
          stAtt.daysPresent[10] || 0
        ];
        monthCols.forEach((col, mIdx) => {
          attCells[`${col}${r}`] = dp12[mIdx];
        });
      }
    });

    attXml = updateCellsBatch(attXml, attCells);
    zip.file(attSheetPath, attXml);
  }

  // 6. Populate Term Summaries (sheet4.xml, sheet5.xml, sheet6.xml)
  const termSummaryDefs = [
    { key: 'TERM 1 SUMMARY', term: 'term1' as const, file: sheetMap['TERM 1 SUMMARY'] || 'xl/worksheets/sheet4.xml' },
    { key: 'TERM 2 SUMMARY', term: 'term2' as const, file: sheetMap['TERM 2 SUMMARY'] || 'xl/worksheets/sheet5.xml' },
    { key: 'TERM 3 SUMMARY', term: 'term3' as const, file: sheetMap['TERM 3 SUMMARY'] || 'xl/worksheets/sheet6.xml' }
  ];

  const getStudentRemarks = (st?: Student) => {
    if (!st) return undefined;
    const stId = st.id;
    const optStudentId = opts.student.id;
    if (opts.getStudentRemarks) {
      const r = opts.getStudentRemarks(st.lrn, stId)
        || (st.lrn ? opts.getStudentRemarks(st.lrn.trim(), stId?.trim()) : null)
        || (stId ? opts.getStudentRemarks(stId) : null);
      if (r) return r;
    }
    const isCurrentStudent = 
      (st.lrn && opts.student.lrn && st.lrn.trim() === opts.student.lrn.trim()) ||
      (stId && optStudentId && stId === optStudentId) ||
      st.lrn === opts.student.lrn;
    if (isCurrentStudent && opts.g1Remarks) {
      return opts.g1Remarks;
    }
    return undefined;
  };

  for (const { file, term } of termSummaryDefs) {
    const sumFile = zip.file(file);
    if (!sumFile) continue;

    let sumXml = await sumFile.async('string');
    const sumCells: Record<string, string | number> = {
      'E5': opts.schoolProfile.region || '',
      'M5': cleanDiv,
      'E6': (opts.schoolProfile.name || '').toUpperCase(),
      'M6': opts.schoolProfile.school_id || '',
      'R6': opts.schoolYear,
      'G9': (opts.gradeLevel || 'Grade 1'),
      'P9': rawAdviser.toUpperCase(),
      'G10': rawSection.toUpperCase()
    };

    // Males (rows 14 - 63)
    for (let i = 0; i < 50; i++) {
      const r = 14 + i;
      const st = males[i];
      const fH = `IF('INPUT DATA'!N${11 + i}="","",'INPUT DATA'!N${11 + i})`;
      const fI = getAgeFormula(r, BOSY_EXCEL_DATE, 'Y');
      const fJ = getAgeFormula(r, BOSY_EXCEL_DATE, 'YM');
      const fK = getAgeFormula(r, EOSY_EXCEL_DATE, 'Y');
      const fL = getAgeFormula(r, EOSY_EXCEL_DATE, 'YM');

      if (st) {
        const stName = formatLearnerName(st).toUpperCase();
        sumXml = setCellFormulaInSheetXml(sumXml, `C${r}`, `IF('INPUT DATA'!L${11 + i}="","",'INPUT DATA'!L${11 + i})`, stName, false, '684');

        const bosyAge = calculateAge(st.birthday, BOSY_DATE_2026);
        const eosyAge = calculateAge(st.birthday, EOSY_DATE_2027);
        const bSerial = birthDateToExcelSerial(st.birthday);
        const hasBday = Boolean(st.birthday && parseBirthDateParts(st.birthday));

        sumXml = setCellFormulaInSheetXml(sumXml, `H${r}`, fH, hasBday ? bSerial : null, true, '766');
        sumXml = setCellFormulaInSheetXml(sumXml, `I${r}`, fI, hasBday ? bosyAge.years : null, true, '698');
        sumXml = setCellFormulaInSheetXml(sumXml, `J${r}`, fJ, hasBday ? bosyAge.months : null, true, '698');
        sumXml = setCellFormulaInSheetXml(sumXml, `K${r}`, fK, hasBday ? eosyAge.years : null, true, '698');
        sumXml = setCellFormulaInSheetXml(sumXml, `L${r}`, fL, hasBday ? eosyAge.months : null, true, '698');

        const rem = getStudentRemarks(st);
        const canDo = rem ? (term === 'term1' ? rem.term1CanDo : term === 'term2' ? rem.term2CanDo : rem.term3CanDo) : undefined;
        const toImp = rem ? (term === 'term1' ? rem.term1ToImprove : term === 'term2' ? rem.term2ToImprove : rem.term3ToImprove) : undefined;
        sumCells[`N${r}`] = canDo || '';
        sumCells[`Q${r}`] = toImp || '';
      } else {
        sumXml = setCellFormulaInSheetXml(sumXml, `C${r}`, `IF('INPUT DATA'!L${11 + i}="","",'INPUT DATA'!L${11 + i})`, null, false, '684');
        sumCells[`N${r}`] = '';
        sumCells[`Q${r}`] = '';
        sumXml = setCellFormulaInSheetXml(sumXml, `H${r}`, fH, null, true, '766');
        sumXml = setCellFormulaInSheetXml(sumXml, `I${r}`, fI, null, true, '698');
        sumXml = setCellFormulaInSheetXml(sumXml, `J${r}`, fJ, null, true, '698');
        sumXml = setCellFormulaInSheetXml(sumXml, `K${r}`, fK, null, true, '698');
        sumXml = setCellFormulaInSheetXml(sumXml, `L${r}`, fL, null, true, '698');
      }
    }

    // Females (rows 65 - 114)
    for (let i = 0; i < 50; i++) {
      const r = 65 + i;
      const st = females[i];
      const fH = `IF('INPUT DATA'!S${11 + i}="","",'INPUT DATA'!S${11 + i})`;
      const fI = getAgeFormula(r, BOSY_EXCEL_DATE, 'Y');
      const fJ = getAgeFormula(r, BOSY_EXCEL_DATE, 'YM');
      const fK = getAgeFormula(r, EOSY_EXCEL_DATE, 'Y');
      const fL = getAgeFormula(r, EOSY_EXCEL_DATE, 'YM');

      if (st) {
        const stName = formatLearnerName(st).toUpperCase();
        sumXml = setCellFormulaInSheetXml(sumXml, `C${r}`, `IF('INPUT DATA'!Q${11 + i}="","",'INPUT DATA'!Q${11 + i})`, stName, false, '704');

        const bosyAge = calculateAge(st.birthday, BOSY_DATE_2026);
        const eosyAge = calculateAge(st.birthday, EOSY_DATE_2027);
        const bSerial = birthDateToExcelSerial(st.birthday);
        const hasBday = Boolean(st.birthday && parseBirthDateParts(st.birthday));

        sumXml = setCellFormulaInSheetXml(sumXml, `H${r}`, fH, hasBday ? bSerial : null, true, '766');
        sumXml = setCellFormulaInSheetXml(sumXml, `I${r}`, fI, hasBday ? bosyAge.years : null, true, '704');
        sumXml = setCellFormulaInSheetXml(sumXml, `J${r}`, fJ, hasBday ? bosyAge.months : null, true, '704');
        sumXml = setCellFormulaInSheetXml(sumXml, `K${r}`, fK, hasBday ? eosyAge.years : null, true, '704');
        sumXml = setCellFormulaInSheetXml(sumXml, `L${r}`, fL, hasBday ? eosyAge.months : null, true, '704');

        const rem = getStudentRemarks(st);
        const canDo = rem ? (term === 'term1' ? rem.term1CanDo : term === 'term2' ? rem.term2CanDo : rem.term3CanDo) : undefined;
        const toImp = rem ? (term === 'term1' ? rem.term1ToImprove : term === 'term2' ? rem.term2ToImprove : rem.term3ToImprove) : undefined;
        sumCells[`N${r}`] = canDo || '';
        sumCells[`Q${r}`] = toImp || '';
      } else {
        sumXml = setCellFormulaInSheetXml(sumXml, `C${r}`, `IF('INPUT DATA'!Q${11 + i}="","",'INPUT DATA'!Q${11 + i})`, null, false, '704');
        sumCells[`N${r}`] = '';
        sumCells[`Q${r}`] = '';
        sumXml = setCellFormulaInSheetXml(sumXml, `H${r}`, fH, null, true, '766');
        sumXml = setCellFormulaInSheetXml(sumXml, `I${r}`, fI, null, true, '704');
        sumXml = setCellFormulaInSheetXml(sumXml, `J${r}`, fJ, null, true, '704');
        sumXml = setCellFormulaInSheetXml(sumXml, `K${r}`, fK, null, true, '704');
        sumXml = setCellFormulaInSheetXml(sumXml, `L${r}`, fL, null, true, '704');
      }
    }

    sumXml = updateCellsBatch(sumXml, sumCells);
    zip.file(file, sumXml);
  }

  // 7. Populate Subject ECRs (sheet8.xml through sheet16.xml)
  const subjectSheetNames = [
    'TERM 1 READING & LITERACY', 'TERM 2 READING & LITERACY', 'TERM 3 READING & LITERACY',
    'TERM 1 LANGUAGE', 'TERM 2 LANGUAGE', 'TERM 3 LANGUAGE',
    'TERM 1-3 MATHEMATICS', 'TERM 1-3 GMRC', 'G1 PACE FORM MAKABANSA'
  ];

  const subjectSheetXmls: Record<string, { xml: string; path: string; cells: Record<string, string | number> }> = {};
  for (const sName of subjectSheetNames) {
    const p = sheetMap[sName];
    if (p && zip.file(p)) {
      subjectSheetXmls[sName] = {
        xml: await zip.file(p)!.async('string'),
        path: p,
        cells: {}
      };
    }
  }

  const getStudentRatings = (st: Student) => {
    const stId = st.id;
    const optStudentId = opts.student.id;
    if (opts.getStudentPaceRatings) {
      const r = opts.getStudentPaceRatings(st.lrn, stId)
        || (st.lrn ? opts.getStudentPaceRatings(st.lrn.trim(), stId?.trim()) : null)
        || (stId ? opts.getStudentPaceRatings(stId) : null);
      if (r && (Object.keys(r.reading || {}).length > 0 || Object.keys(r.language || {}).length > 0 || Object.keys(r.math || {}).length > 0 || Object.keys(r.gmrcMakabansa || {}).length > 0)) {
        return r;
      }
    }
    const isCurrentStudent = 
      (st.lrn && opts.student.lrn && st.lrn.trim() === opts.student.lrn.trim()) ||
      (stId && optStudentId && stId === optStudentId) ||
      st.lrn === opts.student.lrn;
    if (isCurrentStudent && opts.paceRatings) {
      return opts.paceRatings;
    }
    return null;
  };

  const allRoster = [
    ...males.map((st, idx) => ({ st, isMale: true, idx })),
    ...females.map((st, idx) => ({ st, isMale: false, idx }))
  ];

  for (const { st, isMale: maleFlag, idx } of allRoster) {
    const ratings = getStudentRatings(st);
    if (!ratings) continue;

    const applyRatings = (
      catRatings: unknown,
      rowMap: Record<string, number>,
      side: 'left' | 'right'
    ) => {
      if (!catRatings || typeof catRatings !== 'object') return;
      const catObj = catRatings as Record<string, unknown>;
      const actualRatings = (catObj.ratings && typeof catObj.ratings === 'object')
        ? (catObj.ratings as Record<string, unknown>)
        : catObj;
      for (const [subId, r] of Object.entries(actualRatings)) {
        if (!r || typeof r !== 'object') continue;
        const paceRow = rowMap[subId];
        if (!paceRow) continue;

        const rObj = r as Record<string, string | undefined>;
        const terms: ('t1' | 't2' | 't3')[] = ['t1', 't2', 't3'];
        for (const term of terms) {
          const val = rObj[term];
          if (!val) continue;

          const key = `${paceRow}_${side}_${term}`;
          const mapping = G1_PACE_LOOKUP_MAP[key];
          if (mapping && subjectSheetXmls[mapping.s]) {
            const sName = mapping.s;
            const studentRow = (sName === 'TERM 1-3 MATHEMATICS')
              ? (maleFlag ? (16 + idx) : (67 + idx))
              : (maleFlag ? (15 + idx) : (66 + idx));

            const cellRef = `${mapping.c}${studentRow}`;
            subjectSheetXmls[sName].cells[cellRef] = val;
          }
        }
      }
    };

    applyRatings(ratings.reading, READING_LEFT_ROW_MAP, 'left');
    applyRatings(ratings.reading, READING_RIGHT_ROW_MAP, 'right');
    applyRatings(ratings.language, LANGUAGE_LEFT_ROW_MAP, 'left');
    applyRatings(ratings.language, LANGUAGE_RIGHT_ROW_MAP, 'right');
    applyRatings(ratings.math, MATH_ROW_MAP, 'right');
    applyRatings(ratings.gmrcMakabansa, GMRC_ROW_MAP, 'right');
    applyRatings(ratings.gmrcMakabansa, MAKABANSA_ROW_MAP, 'right');
  }

  for (const sName of subjectSheetNames) {
    const data = subjectSheetXmls[sName];
    if (!data) continue;
    if (sName.startsWith('TERM 1 READING') || sName.startsWith('TERM 2 READING') || sName.startsWith('TERM 3 READING')) {
      data.cells['P9'] = rawAdviser.toUpperCase();
      data.cells['G9'] = (opts.gradeLevel || 'Grade 1');
      data.cells['G10'] = rawSection.toUpperCase();
    } else if (sName.startsWith('TERM 1 LANGUAGE') || sName.startsWith('TERM 2 LANGUAGE') || sName.startsWith('TERM 3 LANGUAGE')) {
      data.cells['P9'] = rawAdviser.toUpperCase();
      data.cells['G9'] = (opts.gradeLevel || 'Grade 1');
      data.cells['G10'] = rawSection.toUpperCase();
    } else if (sName === 'TERM 1-3 MATHEMATICS') {
      data.cells['N9'] = rawAdviser.toUpperCase();
      data.cells['G9'] = (opts.gradeLevel || 'Grade 1');
      data.cells['G10'] = rawSection.toUpperCase();
    } else if (sName === 'TERM 1-3 GMRC') {
      data.cells['N9'] = rawAdviser.toUpperCase();
      data.cells['G9'] = (opts.gradeLevel || 'Grade 1');
      data.cells['G10'] = rawSection.toUpperCase();
    } else if (sName === 'G1 PACE FORM MAKABANSA') {
      data.cells['K9'] = rawAdviser.toUpperCase();
      data.cells['G9'] = (opts.gradeLevel || 'Grade 1');
      data.cells['G10'] = rawSection.toUpperCase();
    }
  }

  for (const [, data] of Object.entries(subjectSheetXmls)) {
    if (Object.keys(data.cells).length > 0) {
      const updated = updateCellsBatch(data.xml, data.cells);
      zip.file(data.path, updated);
    }
  }

  // 8. Set Active Student in SF9 - GRADE 1 (sheet3.xml) and PACE - GRADE 1 (sheet7.xml)
  const activeName = formatLearnerName(opts.student).toUpperCase();

  const sf9Path = sheetMap['SF9 - GRADE 1'] || 'xl/worksheets/sheet3.xml';
  const sf9File = zip.file(sf9Path);
  if (sf9File) {
    let sf9Xml = await sf9File.async('string');

    // Build region display value
    let sf9Region = (opts.schoolProfile.region || '').trim();
    if (sf9Region && !/^region/i.test(sf9Region)) {
      sf9Region = `Region ${sf9Region}`;
    }
    // Build division display value
    let sf9Div = (opts.schoolProfile.division || '').trim();
    if (sf9Div) {
      const stripped = sf9Div.replace(/schools division office of/i, '').replace(/division of/i, '').replace(/schools division/i, '').trim().toUpperCase();
      sf9Div = `SCHOOLS DIVISION OFFICE OF ${stripped}`;
    }

    const syDisplay = opts.schoolYear 
      ? (opts.schoolYear.toLowerCase().includes('school year') ? opts.schoolYear : `School Year ${opts.schoolYear}`) 
      : '';

    const activeBosy = calculateAge(opts.student.birthday, BOSY_DATE_2026);
    const activeEosy = calculateAge(opts.student.birthday, EOSY_DATE_2027);
    const hasActiveBday = Boolean(opts.student.birthday && parseBirthDateParts(opts.student.birthday));

    const activeRem = getStudentRemarks(opts.student);
    const activeT1CanDo = activeRem?.term1CanDo || '';
    const activeT1ToImp = activeRem?.term1ToImprove || '';
    const activeT2CanDo = activeRem?.term2CanDo || '';
    const activeT2ToImp = activeRem?.term2ToImprove || '';
    const activeT3CanDo = activeRem?.term3CanDo || '';
    const activeT3ToImp = activeRem?.term3ToImprove || '';

    const replaceSf9RemarksCell = (xml: string, cellRef: string, termSheet: string, colNum: number, val: string) => {
      const vlookup = `VLOOKUP(D15,'${termSheet}'!C14:T114,${colNum},0)`;
      const guardedFormula = `IFERROR(IF(OR(${vlookup}=0,${vlookup}=""),"",${vlookup}),"")`;
      const cellReg = new RegExp(`(<c\\s+r="${cellRef}"[^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/c>)`);
      return xml.replace(cellReg, (_m, openTag) => {
        const cleanOpen = openTag.replace(/\s+t="[^"]*"/g, '');
        const styleMatch = cleanOpen.match(/\s+s="(\d+)"/);
        const styleAttr = styleMatch ? '' : ' s="704"';
        const inner = val ? `<v>${escapeXml(val)}</v>` : '<v/>';
        return `${cleanOpen}${styleAttr} t="str"><f>${guardedFormula}</f>${inner}</c>`;
      });
    };

    sf9Xml = replaceSf9RemarksCell(sf9Xml, 'E23', 'TERM 1 SUMMARY', 12, activeT1CanDo);
    sf9Xml = replaceSf9RemarksCell(sf9Xml, 'E31', 'TERM 1 SUMMARY', 15, activeT1ToImp);
    sf9Xml = replaceSf9RemarksCell(sf9Xml, 'E43', 'TERM 2 SUMMARY', 12, activeT2CanDo);
    sf9Xml = replaceSf9RemarksCell(sf9Xml, 'E51', 'TERM 2 SUMMARY', 15, activeT2ToImp);
    sf9Xml = replaceSf9RemarksCell(sf9Xml, 'E63', 'TERM 3 SUMMARY', 12, activeT3CanDo);
    sf9Xml = replaceSf9RemarksCell(sf9Xml, 'E71', 'TERM 3 SUMMARY', 15, activeT3ToImp);

    sf9Xml = updateCellsBatch(sf9Xml, {
      // Front page header fields
      'C5': sf9Region,
      'C6': sf9Div,
      'C7': distVal,
      'C8': muniCityProv,
      'C10': (opts.schoolProfile.name || '').toUpperCase(),
      'C13': syDisplay,
      // Active student
      'D15': activeName,
      'D16': rawSection.toUpperCase(),
      'I16': rawAdviser.toUpperCase(),
      'N15': opts.student.lrn || '',
      'N16': formatDateToMMDDYYYY(opts.student.birthday),
      'G17': hasActiveBday ? activeBosy.years : '',
      'I17': hasActiveBday ? activeBosy.months : '',
      'O17': hasActiveBday ? activeEosy.years : '',
      'R17': hasActiveBday ? activeEosy.months : '',
      'M72': rawAdviser.toUpperCase(),
      'M75': rawPrincipal.toUpperCase()
    });
    zip.file(sf9Path, sf9Xml);
  }

  const pacePath = sheetMap['PACE - GRADE 1'] || 'xl/worksheets/sheet7.xml';
  const paceFile = zip.file(pacePath);
  if (paceFile) {
    let paceXml = await paceFile.async('string');

    const paceSubjectFilter = opts.paceSubjectFilter || 'all';
    const isSingleSubject = paceSubjectFilter !== 'all';

    // 1. Update all 4 subject headers in PACE - GRADE 1 (Rows 6, 91, 168, 250) with dynamic formulas
    const replaceHeaderCell = (xml: string, cellRef: string, val: string, formula?: string) => {
      const reg = new RegExp(`(<c\\s+r="${cellRef}"[^>]*?)(?:\\/>|>([\\s\\S]*?)<\\/c>)`);
      return xml.replace(reg, (_m, openTag) => {
        const cleanOpen = openTag.replace(/\s+t="[^"]*"/g, '');
        if (formula && !isSingleSubject) {
          return `${cleanOpen} t="str"><f>${formula}</f><v>${escapeXml(val)}</v></c>`;
        }
        return `${cleanOpen} t="str"><v>${escapeXml(val)}</v></c>`;
      });
    };

    const lrnFormula = 'IF(G6="","",IF(VLOOKUP(G6,\'TERM 1 SUMMARY\'!C14:S114,4,0)="","",VLOOKUP(G6,\'TERM 1 SUMMARY\'!C14:S114,4,0)))';
    const sectionFormula = "IF('TERM 1 SUMMARY'!G10=\"\",\"\",'TERM 1 SUMMARY'!G10)";
    const nameFormula = "IF('SF9 - GRADE 1'!D15=\"\",\"\",'SF9 - GRADE 1'!D15)";

    // Page 1: Reading & Literacy
    paceXml = replaceHeaderCell(paceXml, 'G6', activeName, nameFormula);
    paceXml = replaceHeaderCell(paceXml, 'D6', opts.student.lrn || '', lrnFormula);
    paceXml = replaceHeaderCell(paceXml, 'N6', rawSection.toUpperCase(), sectionFormula);

    // Page 2: Language
    paceXml = replaceHeaderCell(paceXml, 'G91', activeName, 'IF(G6="","",G6)');
    paceXml = replaceHeaderCell(paceXml, 'D91', opts.student.lrn || '', 'IF(D6="","",D6)');
    paceXml = replaceHeaderCell(paceXml, 'N91', rawSection.toUpperCase(), 'IF(N6="","",N6)');

    // Page 3: Mathematics
    paceXml = replaceHeaderCell(paceXml, 'G168', activeName, 'IF(G6="","",G6)');
    paceXml = replaceHeaderCell(paceXml, 'D168', opts.student.lrn || '', 'IF(D6="","",D6)');
    paceXml = replaceHeaderCell(paceXml, 'N168', rawSection.toUpperCase(), 'IF(N6="","",N6)');

    // Page 4: GMRC & Makabansa
    paceXml = replaceHeaderCell(paceXml, 'G250', activeName, 'IF(G6="","",G6)');
    paceXml = replaceHeaderCell(paceXml, 'D250', opts.student.lrn || '', 'IF(D6="","",D6)');
    paceXml = replaceHeaderCell(paceXml, 'N250', rawSection.toUpperCase(), 'IF(N6="","",N6)');

    paceXml = replaceHeaderCell(paceXml, 'G288', activeName, 'IF(G6="","",G6)');
    paceXml = replaceHeaderCell(paceXml, 'D288', opts.student.lrn || '', 'IF(D6="","",D6)');
    paceXml = replaceHeaderCell(paceXml, 'N288', rawSection.toUpperCase(), 'IF(N6="","",N6)');

    const SUBJECT_RANGES: Record<string, { start: number; end: number; printArea: string; startRow: number }> = {
      reading: { start: 1, end: 86, printArea: "'PACE - GRADE 1'!$A$1:$T$86", startRow: 1 },
      language: { start: 87, end: 163, printArea: "'PACE - GRADE 1'!$A$87:$T$163", startRow: 87 },
      math: { start: 164, end: 245, printArea: "'PACE - GRADE 1'!$A$164:$T$245", startRow: 164 },
      'gmrc-makabansa': { start: 246, end: 312, printArea: "'PACE - GRADE 1'!$A$246:$T$312", startRow: 246 }
    };
    const targetRange = isSingleSubject ? SUBJECT_RANGES[paceSubjectFilter] : undefined;

    // Active student row in subject sheets
    const isMale = (opts.student.gender || '').toUpperCase() === 'MALE';
    const maleIdx = males.findIndex(s => s.lrn === opts.student.lrn);
    const femaleIdx = females.findIndex(s => s.lrn === opts.student.lrn);
    const studentIndex = isMale
      ? (maleIdx >= 0 ? maleIdx : 0)
      : (femaleIdx >= 0 ? femaleIdx : 0);
    const studentRow = isMale ? (15 + studentIndex) : (66 + studentIndex);
    const mathStudentRow = isMale ? (16 + studentIndex) : (67 + studentIndex);

    // 2. Pre-evaluate all VLOOKUP formula cells in PACE sheet and ensure blank values display as blank instead of 0
    paceXml = paceXml.replace(
      /(<c\s+r="([A-Z]+\d+)"[^>]*?)><f>([\s\S]*?)<\/f>(?:<v>[\s\S]*?<\/v>|<v\/>)?<\/c>/g,
      (fullCell, openTag, cellRef, formula) => {
        const vm = formula.match(/VLOOKUP\([^,]+,'([^']+)'!([A-Z]+)\d+:[A-Z]+\d+,\s*(\d+),\s*0\)/);
        let evaluatedVal = '';
        if (vm) {
          const sheetName = unescapeXml(vm[1]);
          const startCol = vm[2];
          const colIdx = parseInt(vm[3], 10);
          const targetColNum = lettersToColNumber(startCol) + colIdx - 1;
          const targetCol = colNumberToLetters(targetColNum);
          const targetRow = (sheetName === 'TERM 1-3 MATHEMATICS') ? mathStudentRow : studentRow;
          const cellInSubject = `${targetCol}${targetRow}`;
          const rawVal = subjectSheetXmls[sheetName]?.cells[cellInSubject];
          if (rawVal !== undefined && rawVal !== null && rawVal !== '' && rawVal !== 0 && rawVal !== '0') {
            evaluatedVal = String(rawVal);
          }
        }

        const cleanOpen = openTag.replace(/\s+t="[^"]*"/g, '');
        // Extract raw VLOOKUP to cleanly wrap with zero-to-blank guard
        const vlookupMatch = formula.match(/VLOOKUP\([^,]+,'[^']+'![A-Z]+\d+:[A-Z]+\d+,\s*\d+,\s*0\)/);
        const rawFormula = vlookupMatch ? vlookupMatch[0] : formula.trim();
        const guardedFormula = rawFormula.includes('VLOOKUP')
          ? `IFERROR(IF(OR(${rawFormula}=0,${rawFormula}=""),"",${rawFormula}),"")`
          : rawFormula;

        if (isSingleSubject) {
          if (evaluatedVal) {
            return `${cleanOpen} t="str"><v>${escapeXml(evaluatedVal)}</v></c>`;
          }
          return `${cleanOpen}/>`;
        } else {
          if (evaluatedVal) {
            return `${cleanOpen} t="str"><f>${guardedFormula}</f><v>${escapeXml(evaluatedVal)}</v></c>`;
          }
          return `${cleanOpen} t="str"><f>${guardedFormula}</f><v/></c>`;
        }
      }
    );

    // 3. Handle Single-Subject Isolation if requested
    if (targetRange) {
      // Filter rows
      paceXml = paceXml.replace(/<sheetData>([\s\S]*?)<\/sheetData>/, (_match, rowsContent) => {
        const rowRegex = /<row\s+r="(\d+)"[\s\S]*?<\/row>/g;
        const keptRows: string[] = [];
        let rm;
        while ((rm = rowRegex.exec(rowsContent)) !== null) {
          const oldR = parseInt(rm[1], 10);
          if (oldR >= targetRange.start && oldR <= targetRange.end) {
            keptRows.push(rm[0]);
          }
        }
        return `<sheetData>${keptRows.join('')}</sheetData>`;
      });

      // Filter merges
      paceXml = paceXml.replace(/<mergeCells\s+count="(\d+)">([\s\S]*?)<\/mergeCells>/, (_match, _count, mergeContent) => {
        const mergeRegex = /<mergeCell\s+ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"\/>/g;
        const keptMerges: string[] = [];
        let mm;
        while ((mm = mergeRegex.exec(mergeContent)) !== null) {
          const r1 = parseInt(mm[2], 10);
          const r2 = parseInt(mm[4], 10);
          if (r1 >= targetRange.start && r2 <= targetRange.end) {
            keptMerges.push(mm[0]);
          }
        }
        return `<mergeCells count="${keptMerges.length}">${keptMerges.join('')}</mergeCells>`;
      });

      // Remove row breaks
      paceXml = paceXml.replace(/<rowBreaks[\s\S]*?<\/rowBreaks>/g, '');

      // Set topLeftCell and active selection
      const topCell = `A${targetRange.startRow}`;
      paceXml = paceXml.replace(
        /<sheetViews>[\s\S]*?<\/sheetViews>/,
        `<sheetViews><sheetView tabSelected="1" view="normal" topLeftCell="${topCell}" workbookViewId="0"><selection activeCell="${topCell}" sqref="${topCell}"/></sheetView></sheetViews>`
      );

      // Strip any remaining cross-sheet formula cells
      paceXml = paceXml.replace(/<c\s+r="([A-Z]+\d+)"([^>]*?)><f>[\s\S]*?<\/f>(?:<v>([^<]*)<\/v>|<v\/>)?<\/c>/g, (_m, cellRef, attrs, val) => {
        const sMatch = attrs.match(/s="(\d+)"/);
        const sAttr = sMatch ? ` s="${sMatch[1]}"` : '';
        if (val) {
          return `<c r="${cellRef}"${sAttr} t="str"><v>${val}</v></c>`;
        }
        return `<c r="${cellRef}"${sAttr}/>`;
      });

      zip.file(pacePath, paceXml);

      // Remove all other 16 worksheets from zip
      const otherSheets = [
        'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml', 'xl/worksheets/sheet3.xml',
        'xl/worksheets/sheet4.xml', 'xl/worksheets/sheet5.xml', 'xl/worksheets/sheet6.xml',
        'xl/worksheets/sheet8.xml', 'xl/worksheets/sheet9.xml', 'xl/worksheets/sheet10.xml',
        'xl/worksheets/sheet11.xml', 'xl/worksheets/sheet12.xml', 'xl/worksheets/sheet13.xml',
        'xl/worksheets/sheet14.xml', 'xl/worksheets/sheet15.xml', 'xl/worksheets/sheet16.xml',
        'xl/worksheets/sheet17.xml',
        'xl/calcChain.xml'
      ];
      otherSheets.forEach(f => zip.remove(f));

      // Build clean 1-sheet workbook.xml
      const singleWbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <workbookPr defaultThemeVersion="166925"/>
  <sheets>
    <sheet name="PACE - GRADE 1" sheetId="1" r:id="rId1"/>
  </sheets>
  <definedNames>
    <definedName name="_xlnm.Print_Area" localSheetId="0">${targetRange.printArea}</definedName>
  </definedNames>
</workbook>`;
      zip.file('xl/workbook.xml', singleWbXml);

      const singleWbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet7.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;
      zip.file('xl/_rels/workbook.xml.rels', singleWbRels);

      const ctFile = zip.file('[Content_Types].xml');
      if (ctFile) {
        let ctXml = await ctFile.async('string');
        for (let i = 1; i <= 17; i++) {
          if (i !== 7) {
            ctXml = ctXml.replace(new RegExp(`<Override[^>]*PartName="\\/xl\\/worksheets\\/sheet${i}\\.xml"[^>]*\\/>`), '');
          }
        }
        ctXml = ctXml.replace(/<Override[^>]*PartName="\/xl\/calcChain\.xml"[^>]*\/>/g, '');
        zip.file('[Content_Types].xml', ctXml);
      }

      const cleanAppXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Excel</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>PACE - GRADE 1</vt:lpstr></vt:vector></TitlesOfParts><Company></Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0300</AppVersion></Properties>`;
      zip.file('docProps/app.xml', cleanAppXml);
    } else {
      // For all subjects (full workbook export), strictly preserve the template's native 4-page print setup
      // (scale="62", fitToPage="1", fitToHeight="0", margins="0.25", natural rows and dimensions, no manual rowBreaks)
      zip.file(pacePath, paceXml);
    }
  }

  return await zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
}

/**
 * Populate the unified Grade 1 SF9 & PACE Form Excel Workbook directly via OpenXML
 * Returns an ArrayBuffer of the valid .xlsx file
 */
export async function populateGrade1TemplateBuffer(
  buffer: ArrayBuffer,
  opts: SF9Grade1ExcelExportOptions
): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error('Provided Grade 1 template buffer is not a valid zip/xlsx archive (0 bytes or corrupted).');
  }
  const zip = await JSZip.loadAsync(bytes);

  // Check if this is the updated 17-sheet unified master workbook
  if (zip.file('xl/worksheets/sheet17.xml') || zip.file('xl/worksheets/sheet8.xml')) {
    return await populateUpdatedAllInOneGrade1Workbook(zip, opts);
  }

  // 1. Remove stale calcChain & external links to prevent Excel repair popups
  zip.remove('xl/calcChain.xml');
  zip.remove('xl/externalLinks/externalLink1.xml');
  zip.remove('xl/externalLinks/_rels/externalLink1.xml.rels');

  const wbRel = zip.file('xl/_rels/workbook.xml.rels');
  if (wbRel) {
    let relXml = await wbRel.async('string');
    relXml = relXml.replace(/<Relationship[^>]*Target="calcChain\.xml"[^>]*\/>/g, '');
    relXml = relXml.replace(/<Relationship[^>]*Target="externalLinks\/[^"]*"[^>]*\/>/g, '');
    zip.file('xl/_rels/workbook.xml.rels', relXml);
  }

  const ctFile = zip.file('[Content_Types].xml');
  if (ctFile) {
    let ctXml = await ctFile.async('string');
    ctXml = ctXml.replace(/<Override[^>]*PartName="\/xl\/calcChain\.xml"[^>]*\/>/g, '');
    ctXml = ctXml.replace(/<Override[^>]*PartName="\/xl\/externalLinks\/[^"]*"[^>]*\/>/g, '');
    zip.file('[Content_Types].xml', ctXml);
  }
  const paceSubjectFilter = opts.paceSubjectFilter || 'all';

  const SUBJECT_RANGES: Record<string, { start: number; end: number; printArea: string; startRow: number }> = {
    reading: { start: 1, end: 86, printArea: "'PACE - GRADE 1'!$A$2:$T$86", startRow: 1 },
    language: { start: 87, end: 163, printArea: "'PACE - GRADE 1'!$A$87:$T$163", startRow: 87 },
    math: { start: 164, end: 245, printArea: "'PACE - GRADE 1'!$A$164:$T$245", startRow: 164 },
    'gmrc-makabansa': { start: 246, end: 312, printArea: "'PACE - GRADE 1'!$A$246:$T$312", startRow: 246 }
  };

  const targetRange = paceSubjectFilter !== 'all' ? SUBJECT_RANGES[paceSubjectFilter] : undefined;

  if (targetRange) {
    // Single-subject PACE export: Remove all other sheets and unused drawings/rels/metadata
    const unusedFiles = [
      'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml', 'xl/worksheets/sheet3.xml',
      'xl/worksheets/sheet5.xml', 'xl/worksheets/sheet6.xml', 'xl/worksheets/sheet7.xml',
      'xl/worksheets/_rels/sheet1.xml.rels', 'xl/worksheets/_rels/sheet2.xml.rels',
      'xl/worksheets/_rels/sheet5.xml.rels', 'xl/worksheets/_rels/sheet6.xml.rels', 'xl/worksheets/_rels/sheet7.xml.rels',
      'xl/drawings/drawing1.xml', 'xl/drawings/drawing2.xml', 'xl/drawings/drawing3.xml', 'xl/drawings/drawing4.xml', 'xl/drawings/drawing5.xml',
      'xl/drawings/_rels/drawing1.xml.rels', 'xl/drawings/_rels/drawing2.xml.rels', 'xl/drawings/_rels/drawing3.xml.rels',
      'xl/drawings/_rels/drawing4.xml.rels', 'xl/drawings/_rels/drawing5.xml.rels',
      'xl/metadata.xml', 'xl/metadata'
    ];
    unusedFiles.forEach(f => zip.remove(f));

    const newWbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <workbookPr defaultThemeVersion="166925"/>
  <sheets>
    <sheet name="PACE - GRADE 1" sheetId="1" r:id="rId1"/>
  </sheets>
  <definedNames>
    <definedName name="_xlnm.Print_Area" localSheetId="0">${targetRange.printArea}</definedName>
  </definedNames>
</workbook>`;
    zip.file('xl/workbook.xml', newWbXml);

    const newWbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet4.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>`;
    zip.file('xl/_rels/workbook.xml.rels', newWbRels);

    if (ctFile) {
      let ctXml = await ctFile.async('string');
      ctXml = ctXml.replace(/<Override[^>]*PartName="\/xl\/worksheets\/sheet[123567]\.xml"[^>]*\/>/g, '');
      ctXml = ctXml.replace(/<Override[^>]*PartName="\/xl\/drawings\/drawing[12345]\.xml"[^>]*\/>/g, '');
      ctXml = ctXml.replace(/<Override[^>]*PartName="\/xl\/calcChain\.xml"[^>]*\/>/g, '');
      ctXml = ctXml.replace(/<Override[^>]*PartName="\/xl\/externalLinks\/[^"]*"[^>]*\/>/g, '');
      ctXml = ctXml.replace(/<Override[^>]*PartName="\/xl\/metadata[^"]*"[^>]*\/>/g, '');
      zip.file('[Content_Types].xml', ctXml);
    }

    // Update docProps/app.xml to reflect exactly 1 worksheet part
    const cleanAppXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Microsoft Excel</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs><TitlesOfParts><vt:vector size="1" baseType="lpstr"><vt:lpstr>PACE - GRADE 1</vt:lpstr></vt:vector></TitlesOfParts><Company></Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0300</AppVersion></Properties>`;
    zip.file('docProps/app.xml', cleanAppXml);
  } else {
    // Full workbook export: Keep all sheets and set 4-page print area
    const wbFile = zip.file('xl/workbook.xml');
    if (wbFile) {
      let wbXml = await wbFile.async('string');
      wbXml = wbXml.replace(/<externalLink[^>]*\/>/g, '').replace(/<externalReferences>[\s\S]*?<\/externalReferences>/g, '');
      if (!wbXml.includes('name="_xlnm.Print_Area" localSheetId="3"')) {
        wbXml = wbXml.replace(
          '</definedNames>',
          '<definedName name="_xlnm.Print_Area" localSheetId="3">\'PACE - GRADE 1\'!$A$2:$T$312</definedName></definedNames>'
        );
      } else {
        wbXml = wbXml.replace(
          /<definedName name="_xlnm\.Print_Area" localSheetId="3">[^<]*<\/definedName>/,
          '<definedName name="_xlnm.Print_Area" localSheetId="3">\'PACE - GRADE 1\'!$A$2:$T$312</definedName>'
        );
      }
      zip.file('xl/workbook.xml', wbXml);
    }
  }

  // Ensure ONLY cell rating styles (colored fills 2, 7, 8, 9, 10) in styles.xml are explicitly centered horizontally and vertically
  const styleCloneMap: Record<number, string> = {};
  const stylesFile = zip.file('xl/styles.xml');
  if (stylesFile) {
    let stylesXml = await stylesFile.async('string');

    // Ensure ALL fonts across the workbook use Bookman Old Style (family val="1")
    stylesXml = stylesXml.replace(/<font>([\s\S]*?)<\/font>/g, (_match, inner) => {
      let newInner = inner;
      if (newInner.includes('<name val="')) {
        newInner = newInner.replace(/<name val="[^"]*"\/>/g, '<name val="Bookman Old Style"/>');
      } else {
        newInner = `<name val="Bookman Old Style"/>${newInner}`;
      }
      if (newInner.includes('<family val="')) {
        newInner = newInner.replace(/<family val="[^"]*"\/>/g, '<family val="1"/>');
      } else {
        newInner = `<family val="1"/>${newInner}`;
      }
      return `<font>${newInner}</font>`;
    });

    stylesXml = stylesXml.replace(/(<xf\s+[^>]*?fillId="(?:2|7|8|9|10)"[^>]*?>)([\s\S]*?)(<\/xf>)/g, (match, open, inner, close) => {
      if (inner.includes('<alignment')) {
        const newInner = inner.replace(/<alignment([^>]*?)\/>/g, (aMatch: string, aAttrs: string) => {
          if (!aAttrs.includes('horizontal=')) {
            return `<alignment horizontal="center"${aAttrs}/>`;
          }
          return aMatch;
        });
        return `${open}${newInner}${close}`;
      } else {
        return `${open}<alignment horizontal="center" vertical="center"/>${close}`;
      }
    });

    // 2. Clones for Column P styles in Math, GMRC, Makabansa to center ratings while preserving original borders
    const cellXfMatch = stylesXml.match(/<cellXfs\s+count="(\d+)">([\s\S]*?)<\/cellXfs>/);
    if (cellXfMatch) {
      const xfContent = cellXfMatch[2];
      const parts = xfContent.split(/(?=<xf\b)/);
      const colPStyles = [236, 232, 247, 234, 188, 231, 216, 199, 226, 207, 176, 169, 162, 166, 172];

      colPStyles.forEach(oldId => {
        if (oldId < parts.length) {
          const orig = parts[oldId];
          let centered = '';
          if (orig.includes('<alignment')) {
            centered = orig.replace(/<alignment([^>]*?)\/>/g, (_am: string, aAttrs: string) => {
              const cleanAttrs = aAttrs.replace(/\s*horizontal="[^"]*"/g, '');
              return `<alignment horizontal="center"${cleanAttrs}/>`;
            });
          } else if (orig.includes('</xf>')) {
            centered = orig.replace('</xf>', '<alignment horizontal="center" vertical="center"/></xf>');
          } else {
            centered = orig.replace('/>', ' applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>');
          }
          if (!centered.includes('applyAlignment="1"')) {
            centered = centered.replace('<xf ', '<xf applyAlignment="1" ');
          }
          const newId = parts.length;
          parts.push(centered);
          styleCloneMap[oldId] = newId.toString();
        }
      });

      const newCellXfs = `<cellXfs count="${parts.length}">${parts.join('')}</cellXfs>`;
      stylesXml = stylesXml.replace(/<cellXfs[\s\S]*?<\/cellXfs>/, newCellXfs);
    }
    zip.file('xl/styles.xml', stylesXml);
  }

  const {
    student,
    schoolProfile,
    schoolYear,
    section,
    gradeLevel = 'Grade 1',
    adviser,
    principal,
    attendance,
    g1Remarks,
    paceRatings,
    sectionStudents = [],
    getStudentRemarks
  } = opts;

  const fullName = formatLearnerName(student).toUpperCase();
  const sectionUpper = (section || '').toUpperCase();
  const syParts = (schoolYear || '2026-2027').split('-');
  const _startYear = parseInt(syParts[0], 10) || new Date().getFullYear();

  const ageBoSY = calculateAge(student.birthday, BOSY_DATE_2026);
  const ageEoSY = calculateAge(student.birthday, EOSY_DATE_2027);
  const hasBdayLegacy = Boolean(student.birthday && parseBirthDateParts(student.birthday));

  let regionVal = (schoolProfile.region || '').trim();
  if (regionVal && !/^region/i.test(regionVal)) {
    regionVal = `Region ${regionVal}`;
  }

  const cleanDiv = (schoolProfile.division || '').replace(/schools division office of/i, '').replace(/division of/i, '').replace(/schools division/i, '').trim().toUpperCase();
  const divVal = cleanDiv ? cleanDiv : (schoolProfile.division || '').toUpperCase();

  let distVal = (schoolProfile.district || '').trim();
  if (distVal) {
    if (!/district/i.test(distVal)) {
      distVal = `${distVal.toUpperCase()} DISTRICT`;
    } else {
      distVal = distVal.toUpperCase();
    }
  }

  let muniCityLegacy = (schoolProfile.municipality || schoolProfile.city || '').trim();
  if (!muniCityLegacy && schoolProfile.district) {
    const extracted = schoolProfile.district.replace(/\b(east|west|north|south|central|district|dist\.|cluster|zone)\b/gi, '').trim();
    if (extracted) muniCityLegacy = extracted;
  }
  muniCityLegacy = (muniCityLegacy || 'VICTORIA').toUpperCase();

  let provLegacy = (schoolProfile.province || '').trim();
  if (!provLegacy && schoolProfile.division) {
    const extractedProv = schoolProfile.division.replace(/schools division office of/i, '').replace(/division of/i, '').replace(/schools division/i, '').replace(/\bprovince\b/i, '').trim();
    if (extractedProv && extractedProv.toUpperCase() !== muniCityLegacy) provLegacy = extractedProv;
  }
  provLegacy = (provLegacy || 'TARLAC').toUpperCase();
  const muniProv = [muniCityLegacy, provLegacy].filter(Boolean).join(', ') || muniCityLegacy;

  const profileAdviserLegacy = (schoolProfile.adviser_name || '').trim();
  let rawAdviserLegacy = (adviser || '').trim();
  const isMockLegacy = !rawAdviserLegacy || 
                       rawAdviserLegacy.toLowerCase().includes('maria') || 
                       rawAdviserLegacy.toLowerCase().includes('santos') || 
                       rawAdviserLegacy.toLowerCase().includes('juan') || 
                       rawAdviserLegacy.toLowerCase().includes('recovered') || 
                       rawAdviserLegacy.toLowerCase() === 'tba';

  if ((isMockLegacy || !rawAdviserLegacy) && profileAdviserLegacy && profileAdviserLegacy.toLowerCase() !== 'admin') {
    rawAdviserLegacy = profileAdviserLegacy;
  } else if (!rawAdviserLegacy) {
    rawAdviserLegacy = profileAdviserLegacy;
  }

  const rawSectionLegacy = (section || student?.student_section || 'MATATAG').trim();
  const rawPrincipalLegacy = (principal || schoolProfile.head_name || 'JUAN A. DELA CRUZ').trim();

  // -------------------------------------------------------------------------
  // 1. SHEET: INPUT DATA (sheet2.xml in template)
  // -------------------------------------------------------------------------
  const inputSheetFile = zip.file('xl/worksheets/sheet2.xml');
  if (inputSheetFile) {
    let inputXml = await inputSheetFile.async('string');
    const inputCells: Record<string, string | number> = {
      'F10': regionVal,
      'F11': cleanDiv,
      'F12': muniCityLegacy,
      'F13': distVal,
      'F15': schoolProfile.school_id || '',
      'F16': (schoolProfile.name || '').toUpperCase(),
      'F18': schoolYear,
      'F19': rawPrincipalLegacy.toUpperCase(),
      'F26': rawAdviserLegacy.toUpperCase(),
      'F27': (gradeLevel || 'Grade 1'),
      'F28': rawSectionLegacy.toUpperCase()
    };

    const males = sectionStudents.length > 0
      ? sectionStudents.filter(s => (s.gender || '').toUpperCase() === 'MALE')
      : ((student.gender || '').toUpperCase() === 'MALE' ? [student] : []);
    const females = sectionStudents.length > 0
      ? sectionStudents.filter(s => (s.gender || '').toUpperCase() === 'FEMALE')
      : ((student.gender || '').toUpperCase() === 'FEMALE' ? [student] : []);

    for (let i = 0; i < 50; i++) {
      const r = 11 + i;
      const m = males[i];
      if (m) {
        inputCells[`K${r}`] = i + 1;
        inputCells[`L${r}`] = formatLearnerName(m).toUpperCase();
        inputCells[`M${r}`] = m.lrn || '';
        inputCells[`N${r}`] = formatDateToMMDDYYYY(m.birthday);
      } else {
        inputCells[`K${r}`] = '';
        inputCells[`L${r}`] = '';
        inputCells[`M${r}`] = '';
        inputCells[`N${r}`] = '';
      }
    }

    for (let i = 0; i < 50; i++) {
      const r = 11 + i;
      const f = females[i];
      if (f) {
        inputCells[`P${r}`] = i + 1;
        inputCells[`Q${r}`] = formatLearnerName(f).toUpperCase();
        inputCells[`R${r}`] = f.lrn || '';
        inputCells[`S${r}`] = formatDateToMMDDYYYY(f.birthday);
      } else {
        inputCells[`P${r}`] = '';
        inputCells[`Q${r}`] = '';
        inputCells[`R${r}`] = '';
        inputCells[`S${r}`] = '';
      }
    }

    inputXml = updateCellsBatch(inputXml, inputCells);
    zip.file('xl/worksheets/sheet2.xml', inputXml);
  }

  // -------------------------------------------------------------------------
  // 2. SHEET: SF9 - GRADE 1 (sheet3.xml in template)
  // -------------------------------------------------------------------------
  const sf9SheetPath = 'xl/worksheets/sheet3.xml';
  const sheet2File = zip.file(sf9SheetPath);
  if (sheet2File) {
    let xml = await sheet2File.async('string');

    const sf9Cells: Record<string, string | number> = {
      // Header Information
      'C5': regionVal,
      'C6': divVal,
      'C7': distVal,
      'C8': muniProv,
      'C10': (schoolProfile.name || '').toUpperCase(),
      'C13': schoolYear,

      // Learner Details
      'D15': fullName,
      'N15': student.lrn || '',
      'D16': sectionUpper,
      'I16': rawAdviserLegacy.toUpperCase(),
      'N16': formatDateToMMDDYYYY(student.birthday), // MM/DD/YYYY format

      // Age BoSY / EoSY (June 8, 2026 / April 8, 2027)
      'G17': hasBdayLegacy ? ageBoSY.years : '',
      'I17': hasBdayLegacy ? ageBoSY.months : '',
      'O17': hasBdayLegacy ? ageEoSY.years : '',
      'R17': hasBdayLegacy ? ageEoSY.months : '',

      // 3-Term Descriptive Progress
      'E23': g1Remarks?.term1CanDo || '',
      'E31': g1Remarks?.term1ToImprove || '',
      'E43': g1Remarks?.term2CanDo || '',
      'E51': g1Remarks?.term2ToImprove || '',
      'E63': g1Remarks?.term3CanDo || '',
      'E71': g1Remarks?.term3ToImprove || '',

      // Signatures
      'M72': rawAdviserLegacy.toUpperCase(),
      'M75': (principal || schoolProfile.head_name || '').toUpperCase()
    };

    // Style overrides (Remarks in Term 2 & 3 use non-bold styles 394 and 357)
    const sf9Styles: Record<string, string> = {
      'E43': '394', // Term 2 Can Do (Non-bold Bookman Old Style 10pt)
      'E51': '357', // Term 2 To Improve (Non-bold Bookman Old Style 10pt)
      'E63': '394', // Term 3 Can Do (Non-bold Bookman Old Style 10pt)
      'E71': '357'  // Term 3 To Improve (Non-bold Bookman Old Style 10pt)
    };

    // Attendance records (Rows 25 - 37 in Sheet 2: SF9 - GRADE 1)
    // Month is Column M:N, Class Days is Column O:P, Present is Column Q, Absent is Column R
    const effectiveAttendance = (attendance && Array.isArray(attendance.months) && attendance.months.length > 0)
      ? attendance
      : {
          months: ['JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL'],
          schoolDays: [16, 23, 19, 22, 22, 19, 13, 20, 20, 21, 6],
          daysPresent: [16, 23, 19, 22, 22, 19, 13, 20, 20, 21, 6],
          daysAbsent: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };

    const findMonthData = (mName: string) => {
      const target = mName.toLowerCase().trim();
      const target3 = target.substring(0, 3);
      const idx = effectiveAttendance.months.findIndex(m => {
        const str = (m || '').toLowerCase().trim();
        if (str === 'total') return false;
        return str === target || str === target3 || str.startsWith(target3) || target.startsWith(str);
      });
      if (idx !== -1 && idx < 11) {
        const sd = effectiveAttendance.schoolDays?.[idx] || 0;
        const dp = effectiveAttendance.daysPresent?.[idx] != null ? effectiveAttendance.daysPresent[idx] : sd;
        const da = effectiveAttendance.daysAbsent?.[idx] != null ? effectiveAttendance.daysAbsent[idx] : Math.max(0, sd - dp);
        return { sd, dp, da };
      }
      return null;
    };

    const g1AttendanceRows = [
      { row: 25, month: 'june' },
      { row: 26, month: 'july' },
      { row: 27, month: 'august' },
      { row: 28, month: 'september', split: 'first_half' },
      { row: 29, month: 'september', split: 'second_half' },
      { row: 30, month: 'october' },
      { row: 31, month: 'november' },
      { row: 32, month: 'december' },
      { row: 33, month: 'january' },
      { row: 34, month: 'february' },
      { row: 35, month: 'march' },
      { row: 36, month: 'april' }
    ];

    let totalSchoolDays = 0;
    let totalPresent = 0;
    let totalAbsent = 0;

    g1AttendanceRows.forEach(item => {
      const mData = findMonthData(item.month);
      let sd = 0, dp = 0, da = 0;
      if (mData) {
        if (item.split === 'first_half') {
          sd = Math.ceil(mData.sd / 2);
          dp = Math.ceil(mData.dp / 2);
          da = Math.ceil(mData.da / 2);
        } else if (item.split === 'second_half') {
          sd = Math.floor(mData.sd / 2);
          dp = Math.floor(mData.dp / 2);
          da = Math.floor(mData.da / 2);
        } else {
          sd = mData.sd;
          dp = mData.dp;
          da = mData.da;
        }
      }

      if (sd > 0) sf9Cells[`O${item.row}`] = sd;
      if (dp > 0 || sd > 0) sf9Cells[`Q${item.row}`] = dp;
      if (da > 0 || sd > 0) sf9Cells[`R${item.row}`] = da;

      totalSchoolDays += sd;
      totalPresent += dp;
      totalAbsent += da;
    });

    if (totalSchoolDays > 0) {
      sf9Cells['O37'] = totalSchoolDays;
      sf9Cells['Q37'] = totalPresent;
      sf9Cells['R37'] = totalAbsent;
    }

    // Break all external data validation references
    xml = xml.replace(/<extLst>[\s\S]*?<\/extLst>/g, '');
    xml = xml.replace(/<dataValidations[\s\S]*?<\/dataValidations>/g, '');

    xml = updateCellsBatch(xml, sf9Cells, sf9Styles);
    zip.file(sf9SheetPath, xml);
  }

  // -------------------------------------------------------------------------
  // 3. SHEET: PACE - GRADE 1 (sheet4.xml in template)
  // -------------------------------------------------------------------------
  const sheet4File = zip.file('xl/worksheets/sheet4.xml');
  if (sheet4File) {
    let xml = await sheet4File.async('string');
    const paceCells: Record<string, string | number> = {
      // Reading & Literacy Header (Row 6)
      'D6': student.lrn || '',
      'I6': fullName,
      'O6': sectionUpper,

      // Language Header (Row 91)
      'D91': student.lrn || '',
      'I91': fullName,
      'O91': sectionUpper,

      // Mathematics Header (Row 168)
      'D168': student.lrn || '',
      'I168': fullName,
      'O168': sectionUpper,

      // GMRC Header (Row 250)
      'D250': student.lrn || '',
      'I250': fullName,
      'O250': sectionUpper,

      // Makabansa Header (Row 288)
      'D288': student.lrn || '',
      'I288': fullName,
      'O288': sectionUpper
    };

    // Rating cell style overrides (e.g. style 445 is centered without affecting left-aligned text descriptions)
    const paceStyles: Record<string, string> = {};

    const isUnassessedPaceCell = (subId: string, term: 't1' | 't2' | 't3', isLang: boolean = false) => {
      const colors = isLang ? PACE_LANGUAGE_MASTER_CELL_COLORS[subId] : PACE_MASTER_CELL_COLORS[subId];
      if (!colors) return false;
      const c = (colors[term] || '').toUpperCase();
      return c === '#3F3F3F' || c === '#434343' || c === '#B7B7B7' || c === '#000000';
    };

    // Reading & Literacy Ratings
    const readingRatings = paceRatings?.reading || {};
    Object.entries(readingRatings).forEach(([subId, r]) => {
      if (!r) return;
      if (READING_LEFT_ROW_MAP[subId]) {
        const rNum = READING_LEFT_ROW_MAP[subId];
        if (r.t1 && !isUnassessedPaceCell(subId, 't1', false)) paceCells[`G${rNum}`] = r.t1;
        if (r.t2 && !isUnassessedPaceCell(subId, 't2', false)) paceCells[`H${rNum}`] = r.t2;
        if (r.t3 && !isUnassessedPaceCell(subId, 't3', false)) paceCells[`I${rNum}`] = r.t3;
      } else if (READING_RIGHT_ROW_MAP[subId]) {
        const rNum = READING_RIGHT_ROW_MAP[subId];
        if (r.t1 && !isUnassessedPaceCell(subId, 't1', false)) paceCells[`P${rNum}`] = r.t1;
        if (r.t2 && !isUnassessedPaceCell(subId, 't2', false)) paceCells[`Q${rNum}`] = r.t2;
        if (r.t3 && !isUnassessedPaceCell(subId, 't3', false)) paceCells[`R${rNum}`] = r.t3;
      }
    });

    // Language Ratings
    const langRatings = paceRatings?.language || {};
    Object.entries(langRatings).forEach(([subId, r]) => {
      if (!r) return;
      if (LANGUAGE_LEFT_ROW_MAP[subId]) {
        const rNum = LANGUAGE_LEFT_ROW_MAP[subId];
        if (r.t1 && !isUnassessedPaceCell(subId, 't1', true)) paceCells[`G${rNum}`] = r.t1;
        if (r.t2 && !isUnassessedPaceCell(subId, 't2', true)) paceCells[`H${rNum}`] = r.t2;
        if (r.t3 && !isUnassessedPaceCell(subId, 't3', true)) paceCells[`I${rNum}`] = r.t3;
      } else if (LANGUAGE_RIGHT_ROW_MAP[subId]) {
        const rNum = LANGUAGE_RIGHT_ROW_MAP[subId];
        if (r.t1 && !isUnassessedPaceCell(subId, 't1', true)) paceCells[`P${rNum}`] = r.t1;
        if (r.t2 && !isUnassessedPaceCell(subId, 't2', true)) paceCells[`Q${rNum}`] = r.t2;
        if (r.t3 && !isUnassessedPaceCell(subId, 't3', true)) paceCells[`R${rNum}`] = r.t3;
      }
    });

    // Mathematics Ratings
    const mathRatings = paceRatings?.math || {};
    Object.entries(mathRatings).forEach(([subId, r]) => {
      if (!r) return;
      const rNum = MATH_ROW_MAP[subId];
      if (rNum) {
        const val = r.t1 || r.t2 || r.t3;
        if (val) {
          paceCells[`P${rNum}`] = val;
          const cMatch = xml.match(new RegExp(`<c\\s+r="P${rNum}"[^>]*s="(\\d+)"`));
          const oldStyle = cMatch ? parseInt(cMatch[1], 10) : 0;
          if (styleCloneMap[oldStyle]) paceStyles[`P${rNum}`] = styleCloneMap[oldStyle];
        }
      }
    });

    // GMRC Ratings
    const gmrcRatings = paceRatings?.gmrcMakabansa || {};
    Object.entries(gmrcRatings).forEach(([subId, r]) => {
      if (!r) return;
      const rNum = GMRC_ROW_MAP[subId];
      if (rNum) {
        const val = r.t1 || r.t2 || r.t3;
        if (val) {
          paceCells[`P${rNum}`] = val;
          const cMatch = xml.match(new RegExp(`<c\\s+r="P${rNum}"[^>]*s="(\\d+)"`));
          const oldStyle = cMatch ? parseInt(cMatch[1], 10) : 0;
          if (styleCloneMap[oldStyle]) paceStyles[`P${rNum}`] = styleCloneMap[oldStyle];
        }
      }
    });

    // Makabansa Ratings
    Object.entries(gmrcRatings).forEach(([subId, r]) => {
      if (!r) return;
      const rNum = MAKABANSA_ROW_MAP[subId];
      if (rNum) {
        const val = r.t1 || r.t2 || r.t3;
        if (val) {
          paceCells[`P${rNum}`] = val;
          const cMatch = xml.match(new RegExp(`<c\\s+r="P${rNum}"[^>]*s="(\\d+)"`));
          const oldStyle = cMatch ? parseInt(cMatch[1], 10) : 0;
          if (styleCloneMap[oldStyle]) paceStyles[`P${rNum}`] = styleCloneMap[oldStyle];
        }
      }
    });

    // Populate cell values first
    xml = updateCellsBatch(xml, paceCells, paceStyles);

    if (targetRange) {
      // Filter rows (keep natural row numbers to prevent cell corruption)
      xml = xml.replace(/<sheetData>([\s\S]*?)<\/sheetData>/, (_match, rowsContent) => {
        const rowRegex = /<row\s+r="(\d+)"[\s\S]*?<\/row>/g;
        const keptRows: string[] = [];
        let rm;
        while ((rm = rowRegex.exec(rowsContent)) !== null) {
          const oldR = parseInt(rm[1], 10);
          if (oldR >= targetRange.start && oldR <= targetRange.end) {
            keptRows.push(rm[0]);
          }
        }
        return `<sheetData>${keptRows.join('')}</sheetData>`;
      });

      // Filter mergeCells
      xml = xml.replace(/<mergeCells\s+count="(\d+)">([\s\S]*?)<\/mergeCells>/, (_match, _count, mergeContent) => {
        const mergeRegex = /<mergeCell\s+ref="([A-Z]+)(\d+):([A-Z]+)(\d+)"\/>/g;
        const keptMerges: string[] = [];
        let mm;
        while ((mm = mergeRegex.exec(mergeContent)) !== null) {
          const r1 = parseInt(mm[2], 10);
          const r2 = parseInt(mm[4], 10);
          if (r1 >= targetRange.start && r2 <= targetRange.end) {
            keptMerges.push(mm[0]);
          }
        }
        return `<mergeCells count="${keptMerges.length}">${keptMerges.join('')}</mergeCells>`;
      });

      // Remove row breaks so single subject prints as 1 page
      xml = xml.replace(/<rowBreaks[\s\S]*?<\/rowBreaks>/g, '');

      // Normal view mode scrolled directly to the active subject's top row (prevents gray void display)
      const topCell = `A${targetRange.startRow}`;
      xml = xml.replace(
        /<sheetViews>[\s\S]*?<\/sheetViews>/,
        `<sheetViews><sheetView tabSelected="1" view="normal" topLeftCell="${topCell}" workbookViewId="0"><selection activeCell="${topCell}" sqref="${topCell}"/></sheetView></sheetViews>`
      );

      // Math header fixes
      if (paceSubjectFilter === 'math') {
        xml = xml.replace(/<c\s+r="P173"\s+s="192"/, '<c r="P173" s="99"');
        if (!xml.includes('ref="D173:O173"')) {
          xml = xml.replace('<mergeCells', '<mergeCells><mergeCell ref="D173:O173"/>');
          xml = xml.replace(/<mergeCells\s+count="(\d+)"/, (_m, cnt) => `<mergeCells count="${parseInt(cnt, 10) + 1}"`);
        }
      }

      xml = xml.replace(
        /<pageSetup[^>]*\/>/,
        '<pageSetup paperSize="14" fitToWidth="1" fitToHeight="1" orientation="portrait" r:id="rId1"/>'
      );

      xml = xml.replace(/<dimension\s+ref="[^"]*"\/>/, `<dimension ref="A${targetRange.start}:T${targetRange.end}"/>`);
    } else {
      // Ensure Mathematics header row 173 has D173:O173 properly merged without interior dividers
      // and Language header row 91 has O91:R91 merged for section value
      ['D173:O173', 'O91:R91'].forEach(ref => {
        if (!xml.includes(`ref="${ref}"`)) {
          xml = xml.replace('<mergeCells', `<mergeCells><mergeCell ref="${ref}"/>`);
          xml = xml.replace(/<mergeCells\s+count="(\d+)"/, (_m, cnt) => `<mergeCells count="${parseInt(cnt, 10) + 1}"`);
        }
      });
      // Ensure P173 header cell uses matching dark blue header style
      xml = xml.replace(/<c\s+r="P173"\s+s="192"/, '<c r="P173" s="99"');
    }

    // Break all external data validation references
    xml = xml.replace(/<extLst>[\s\S]*?<\/extLst>/g, '');
    xml = xml.replace(/<dataValidations[\s\S]*?<\/dataValidations>/g, '');

    zip.file('xl/worksheets/sheet4.xml', xml);
  }

  // -------------------------------------------------------------------------
  // 4. SHEETS: Summary Rosters (sheet5: Term 1, sheet6: Term 2, sheet7: Term 3)
  // -------------------------------------------------------------------------
  const summarySheets = [
    { sheetFile: 'xl/worksheets/sheet5.xml', termKey: 'term1' as const },
    { sheetFile: 'xl/worksheets/sheet6.xml', termKey: 'term2' as const },
    { sheetFile: 'xl/worksheets/sheet7.xml', termKey: 'term3' as const }
  ];

  const males = sectionStudents.length > 0
    ? sectionStudents.filter(s => (s.gender || '').toUpperCase() === 'MALE')
    : ((student.gender || '').toUpperCase() === 'MALE' ? [student] : []);
  const females = sectionStudents.length > 0
    ? sectionStudents.filter(s => (s.gender || '').toUpperCase() === 'FEMALE')
    : ((student.gender || '').toUpperCase() === 'FEMALE' ? [student] : []);

  for (const { sheetFile, termKey } of summarySheets) {
    const sFile = zip.file(sheetFile);
    if (!sFile) continue;

    let xml = await sFile.async('string');
    const cleanDiv = (schoolProfile.division || '').replace(/schools division office of/i, '').replace(/division of/i, '').replace(/schools division/i, '').trim().toUpperCase();

    const sumCells: Record<string, string | number> = {
      'E5': schoolProfile.region || '',
      'M5': cleanDiv,
      'E6': (schoolProfile.name || '').toUpperCase(),
      'M6': schoolProfile.school_id || '',
      'R6': schoolYear,
      'G9': gradeLevel,
      'P9': rawAdviserLegacy.toUpperCase(),
      'G10': sectionUpper
    };

    // Males (Rows 14 - 63)
    for (let i = 0; i < 50; i++) {
      const rowNum = 14 + i;
      const st = males[i];
      const fI = getAgeFormula(rowNum, BOSY_EXCEL_DATE, 'Y');
      const fJ = getAgeFormula(rowNum, BOSY_EXCEL_DATE, 'YM');
      const fK = getAgeFormula(rowNum, EOSY_EXCEL_DATE, 'Y');
      const fL = getAgeFormula(rowNum, EOSY_EXCEL_DATE, 'YM');

      if (st) {
        sumCells[`C${rowNum}`] = formatLearnerName(st).toUpperCase();
        sumCells[`F${rowNum}`] = st.lrn || '';
        const bSerial = birthDateToExcelSerial(st.birthday);
        sumCells[`H${rowNum}`] = bSerial !== null ? bSerial : formatDateToMMDDYYYY(st.birthday);
        sumCells[`M${rowNum}`] = 'M';

        const stAgeBoSY = calculateAge(st.birthday, BOSY_DATE_2026);
        const stAgeEoSY = calculateAge(st.birthday, EOSY_DATE_2027);
        const hasBday = Boolean(st.birthday && parseBirthDateParts(st.birthday));

        xml = setCellFormulaInSheetXml(xml, `I${rowNum}`, fI, hasBday ? stAgeBoSY.years : null, true, '18');
        xml = setCellFormulaInSheetXml(xml, `J${rowNum}`, fJ, hasBday ? stAgeBoSY.months : null, true, '18');
        xml = setCellFormulaInSheetXml(xml, `K${rowNum}`, fK, hasBday ? stAgeEoSY.years : null, true, '18');
        xml = setCellFormulaInSheetXml(xml, `L${rowNum}`, fL, hasBday ? stAgeEoSY.months : null, true, '18');

        const rem = getStudentRemarks ? getStudentRemarks(st.lrn) : (st.lrn === student.lrn ? g1Remarks : undefined);
        const canDo = rem ? (termKey === 'term1' ? rem.term1CanDo : termKey === 'term2' ? rem.term2CanDo : rem.term3CanDo) : undefined;
        const toImp = rem ? (termKey === 'term1' ? rem.term1ToImprove : termKey === 'term2' ? rem.term2ToImprove : rem.term3ToImprove) : undefined;
        sumCells[`N${rowNum}`] = canDo || '';
        sumCells[`Q${rowNum}`] = toImp || '';
      } else {
        sumCells[`C${rowNum}`] = '';
        sumCells[`F${rowNum}`] = '';
        sumCells[`H${rowNum}`] = '';
        sumCells[`N${rowNum}`] = '';
        sumCells[`Q${rowNum}`] = '';
        xml = setCellFormulaInSheetXml(xml, `I${rowNum}`, fI, null, true, '18');
        xml = setCellFormulaInSheetXml(xml, `J${rowNum}`, fJ, null, true, '18');
        xml = setCellFormulaInSheetXml(xml, `K${rowNum}`, fK, null, true, '18');
        xml = setCellFormulaInSheetXml(xml, `L${rowNum}`, fL, null, true, '18');
      }
    }

    // Females (Rows 65 - 114)
    for (let i = 0; i < 50; i++) {
      const rowNum = 65 + i;
      const st = females[i];
      const fI = getAgeFormula(rowNum, BOSY_EXCEL_DATE, 'Y');
      const fJ = getAgeFormula(rowNum, BOSY_EXCEL_DATE, 'YM');
      const fK = getAgeFormula(rowNum, EOSY_EXCEL_DATE, 'Y');
      const fL = getAgeFormula(rowNum, EOSY_EXCEL_DATE, 'YM');

      if (st) {
        sumCells[`C${rowNum}`] = formatLearnerName(st).toUpperCase();
        sumCells[`F${rowNum}`] = st.lrn || '';
        const bSerial = birthDateToExcelSerial(st.birthday);
        sumCells[`H${rowNum}`] = bSerial !== null ? bSerial : formatDateToMMDDYYYY(st.birthday);
        sumCells[`M${rowNum}`] = 'F';

        const stAgeBoSY = calculateAge(st.birthday, BOSY_DATE_2026);
        const stAgeEoSY = calculateAge(st.birthday, EOSY_DATE_2027);
        const hasBday = Boolean(st.birthday && parseBirthDateParts(st.birthday));

        xml = setCellFormulaInSheetXml(xml, `I${rowNum}`, fI, hasBday ? stAgeBoSY.years : null, true, '18');
        xml = setCellFormulaInSheetXml(xml, `J${rowNum}`, fJ, hasBday ? stAgeBoSY.months : null, true, '18');
        xml = setCellFormulaInSheetXml(xml, `K${rowNum}`, fK, hasBday ? stAgeEoSY.years : null, true, '18');
        xml = setCellFormulaInSheetXml(xml, `L${rowNum}`, fL, hasBday ? stAgeEoSY.months : null, true, '18');

        const rem = getStudentRemarks ? getStudentRemarks(st.lrn) : (st.lrn === student.lrn ? g1Remarks : undefined);
        const canDo = rem ? (termKey === 'term1' ? rem.term1CanDo : termKey === 'term2' ? rem.term2CanDo : rem.term3CanDo) : undefined;
        const toImp = rem ? (termKey === 'term1' ? rem.term1ToImprove : termKey === 'term2' ? rem.term2ToImprove : rem.term3ToImprove) : undefined;
        sumCells[`N${rowNum}`] = canDo || '';
        sumCells[`Q${rowNum}`] = toImp || '';
      } else {
        sumCells[`C${rowNum}`] = '';
        sumCells[`F${rowNum}`] = '';
        sumCells[`H${rowNum}`] = '';
        sumCells[`N${rowNum}`] = '';
        sumCells[`Q${rowNum}`] = '';
        xml = setCellFormulaInSheetXml(xml, `I${rowNum}`, fI, null, true, '18');
        xml = setCellFormulaInSheetXml(xml, `J${rowNum}`, fJ, null, true, '18');
        xml = setCellFormulaInSheetXml(xml, `K${rowNum}`, fK, null, true, '18');
        xml = setCellFormulaInSheetXml(xml, `L${rowNum}`, fL, null, true, '18');
      }
    }

    xml = updateCellsBatch(xml, sumCells);
    zip.file(sheetFile, xml);
  }

  return await zip.generateAsync({ type: 'arraybuffer' });
}

/**
 * Compatible wrapper returning an object with writeBuffer for backwards compatibility
 */
export async function populateGrade1Template(
  buffer: ArrayBuffer,
  opts: SF9Grade1ExcelExportOptions
): Promise<{ xlsx: { writeBuffer: () => Promise<ArrayBuffer> } }> {
  const out = await populateGrade1TemplateBuffer(buffer, opts);
  return {
    xlsx: {
      writeBuffer: async () => out
    }
  };
}

/**
 * Export unified Grade 1 School Form 9 with PACE Form to Excel (.xlsx)
 */
export async function exportGrade1FullWorkbookToExcel(opts: SF9Grade1ExcelExportOptions): Promise<void> {
  const buffer = await fetchGrade1TemplateBuffer();
  const outBuffer = await populateGrade1TemplateBuffer(buffer, opts);

  const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const safeName = formatLearnerName(opts.student).replace(/[^a-z0-9]/gi, '_');
  let filePrefix = 'SF9_with_PACE';
  if (opts.paceSubjectFilter === 'reading') filePrefix = 'PACE_Form_Reading';
  else if (opts.paceSubjectFilter === 'language') filePrefix = 'PACE_Form_Language';
  else if (opts.paceSubjectFilter === 'math') filePrefix = 'PACE_Form_Mathematics';
  else if (opts.paceSubjectFilter === 'gmrc-makabansa') filePrefix = 'PACE_Form_GMRC_Makabansa';

  a.download = `${filePrefix}_${safeName}_${opts.schoolYear}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export complete Grade 1 Section Master ECR, PACE, and SF9 Workbook (.xlsx)
 * Containing all enrolled learners, official ECRs, attendance summary, and formula-driven SF9/PACE.
 */
export async function exportGrade1AllInOneSectionMasterToExcel(opts: SF9Grade1ExcelExportOptions): Promise<void> {
  const buffer = await fetchGrade1TemplateBuffer();
  const outBuffer = await populateGrade1TemplateBuffer(buffer, opts);

  const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const safeSection = (opts.section || 'Grade_1').replace(/[^a-z0-9]/gi, '_');
  a.download = `Grade1_Master_ECR_PACE_SF9_${safeSection}_${opts.schoolYear}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
