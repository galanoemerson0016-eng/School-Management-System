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
  getStudentRemarks?: (lrn: string) => SF9Grade1Remarks | undefined;
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

/**
 * Helper to compute age in years and months
 */
function calculateAge(birthday?: string, asOfDate: Date = new Date()): { years: number; months: number } {
  if (!birthday) return { years: 0, months: 0 };
  const bdate = new Date(birthday);
  if (isNaN(bdate.getTime())) return { years: 0, months: 0 };

  let years = asOfDate.getFullYear() - bdate.getFullYear();
  let months = asOfDate.getMonth() - bdate.getMonth();

  if (asOfDate.getDate() < bdate.getDate()) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years: Math.max(0, years), months: Math.max(0, months) };
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

/**
 * Update or insert a cell value in an OpenXML worksheet string while preserving existing styles.
 */
function updateCellInSheetXml(sheetXml: string, cellRef: string, value: string | number, isNumeric = false, forceStyle?: string): string {
  const formattedVal = escapeXml(value);
  let newInner = '';
  let newTag = '';

  if (isNumeric && typeof value === 'number' && !isNaN(value)) {
    newTag = `<c r="${cellRef}"`;
    newInner = `<v>${value}</v>`;
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
      return `${newTag}${styleAttr}>${newInner}</c>`;
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
  const zip = await JSZip.loadAsync(buffer);

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
  const startYear = parseInt(syParts[0], 10) || new Date().getFullYear();

  const ageBoSY = calculateAge(student.birthday, new Date(startYear, 5, 1)); // June 1

  // -------------------------------------------------------------------------
  // 1. SHEET: School Data (sheet3.xml in template)
  // -------------------------------------------------------------------------
  const sheet3File = zip.file('xl/worksheets/sheet3.xml');
  if (sheet3File) {
    let xml = await sheet3File.async('string');
    const locAddr = [schoolProfile.municipality || schoolProfile.city, schoolProfile.province].filter(Boolean).join(', ');
    let cleanDiv = (schoolProfile.division || '').replace(/schools division office of/i, '').replace(/division of/i, '').replace(/schools division/i, '').trim().toUpperCase();
    if (cleanDiv) cleanDiv = `SCHOOLS DIVISION OFFICE OF ${cleanDiv}`;

    const dataCells: Record<string, string | number> = {
      'C4': (schoolProfile.name || '').toUpperCase(),
      'C5': schoolProfile.school_id || '',
      'C6': locAddr,
      'C7': schoolProfile.district || '',
      'C8': cleanDiv,
      'C9': schoolProfile.region || '',
      'C10': locAddr,
      'C12': (principal || schoolProfile.head_name || '').toUpperCase(),
      'C13': schoolYear,
      'C14': gradeLevel,
      'C15': sectionUpper,
      'C16': (adviser || schoolProfile.adviser_name || '').toUpperCase()
    };
    xml = updateCellsBatch(xml, dataCells);
    zip.file('xl/worksheets/sheet3.xml', xml);
  }

  // -------------------------------------------------------------------------
  // 2. SHEET: SF9 - GRADE 1 (sheet2.xml in template)
  // -------------------------------------------------------------------------
  const sheet2File = zip.file('xl/worksheets/sheet2.xml');
  if (sheet2File) {
    let xml = await sheet2File.async('string');

    let regionVal = (schoolProfile.region || '').trim();
    if (regionVal && !/^region/i.test(regionVal)) {
      regionVal = `Region ${regionVal}`;
    }

    let divVal = (schoolProfile.division || '').trim();
    if (divVal) {
      const cleanDiv = divVal.replace(/schools division office of/i, '').replace(/division of/i, '').replace(/schools division/i, '').trim().toUpperCase();
      divVal = cleanDiv ? `SCHOOLS DIVISION OFFICE OF ${cleanDiv}` : divVal.toUpperCase();
    }

    let distVal = (schoolProfile.district || '').trim();
    if (distVal) {
      if (!/district/i.test(distVal)) {
        distVal = `${distVal.toUpperCase()} DISTRICT`;
      } else {
        distVal = distVal.toUpperCase();
      }
    }

    const muniProv = [schoolProfile.municipality || schoolProfile.city, schoolProfile.province].filter(Boolean).join(', ');

    const sf9Cells: Record<string, string | number> = {
      // Header Information
      'C5': regionVal,
      'C6': divVal,
      'C7': distVal,
      'C8': muniProv,
      'C10': (schoolProfile.name || '').toUpperCase(),
      'L13': schoolYear,

      // Learner Details
      'D15': fullName,
      'N15': student.lrn || '',
      'D16': sectionUpper,
      'I16': (adviser || schoolProfile.adviser_name || '').toUpperCase(),
      'N16': formatDateToMMDDYYYY(student.birthday), // MM/DD/YYYY format

      // Age BoSY (Font Size 10) / EoSY (Left empty as requested)
      'G17': ageBoSY.years || 0,
      'I17': ageBoSY.months || 0,
      'O17': '',
      'R17': '',

      // 3-Term Descriptive Progress
      'E23': g1Remarks?.term1CanDo || '',
      'E31': g1Remarks?.term1ToImprove || '',
      'E43': g1Remarks?.term2CanDo || '',
      'E51': g1Remarks?.term2ToImprove || '',
      'E63': g1Remarks?.term3CanDo || '',
      'E71': g1Remarks?.term3ToImprove || '',

      // Signatures
      'M72': (adviser || schoolProfile.adviser_name || '').toUpperCase(),
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
    zip.file('xl/worksheets/sheet2.xml', xml);
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

    // Reading & Literacy Ratings
    const readingRatings = paceRatings?.reading || {};
    Object.entries(readingRatings).forEach(([subId, r]) => {
      if (!r) return;
      if (READING_LEFT_ROW_MAP[subId]) {
        const rNum = READING_LEFT_ROW_MAP[subId];
        if (r.t1) paceCells[`G${rNum}`] = r.t1;
        if (r.t2) paceCells[`H${rNum}`] = r.t2;
        if (r.t3) paceCells[`I${rNum}`] = r.t3;
      } else if (READING_RIGHT_ROW_MAP[subId]) {
        const rNum = READING_RIGHT_ROW_MAP[subId];
        if (r.t1) paceCells[`P${rNum}`] = r.t1;
        if (r.t2) paceCells[`Q${rNum}`] = r.t2;
        if (r.t3) paceCells[`R${rNum}`] = r.t3;
      }
    });

    // Language Ratings
    const langRatings = paceRatings?.language || {};
    Object.entries(langRatings).forEach(([subId, r]) => {
      if (!r) return;
      if (LANGUAGE_LEFT_ROW_MAP[subId]) {
        const rNum = LANGUAGE_LEFT_ROW_MAP[subId];
        if (r.t1) paceCells[`G${rNum}`] = r.t1;
        if (r.t2) paceCells[`H${rNum}`] = r.t2;
        if (r.t3) paceCells[`I${rNum}`] = r.t3;
      } else if (LANGUAGE_RIGHT_ROW_MAP[subId]) {
        const rNum = LANGUAGE_RIGHT_ROW_MAP[subId];
        if (r.t1) paceCells[`P${rNum}`] = r.t1;
        if (r.t2) paceCells[`Q${rNum}`] = r.t2;
        if (r.t3) paceCells[`R${rNum}`] = r.t3;
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

    // Normalize heights of slightly tall rows in Language (rows 87-163) and Math (rows 164-245)
    // so all sections fit on exactly 1 portrait page each without 1-row page splits
    const langTallRows = [103, 106, 108, 111, 118, 120, 124, 132, 133, 134, 142, 148, 155];
    const mathTallRows = [176, 178, 183, 205, 208, 212, 230, 232];

    langTallRows.forEach(r => {
      xml = xml.replace(new RegExp(`(<row\\s+r="${r}"[^>]*ht=")([^"]+)(")`), (_m, p1, ht, p3) => {
        const newHt = Math.max(15.75, parseFloat(ht) - 2.5);
        return `${p1}${newHt}${p3}`;
      });
    });

    mathTallRows.forEach(r => {
      xml = xml.replace(new RegExp(`(<row\\s+r="${r}"[^>]*ht=")([^"]+)(")`), (_m, p1, ht, p3) => {
        const newHt = Math.max(15.75, parseFloat(ht) - 3.0);
        return `${p1}${newHt}${p3}`;
      });
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
      // Ensure all 4 pages match the official DepEd template:
      // Page 1: Reading & Literacy (rows 1-86)
      // Page 2: Language (rows 87-163)
      // Page 3: Mathematics (rows 164-245)
      // Page 4: GMRC & Makabansa Combined (rows 246-312)
      const newRowBreaks = '<rowBreaks count="3" manualBreakCount="3"><brk id="86" max="19" man="1"/><brk id="163" max="19" man="1"/><brk id="245" max="19" man="1"/></rowBreaks>';
      if (xml.includes('<rowBreaks')) {
        xml = xml.replace(/<rowBreaks[\s\S]*?<\/rowBreaks>/, newRowBreaks);
      } else {
        xml = xml.replace('</worksheet>', `${newRowBreaks}</worksheet>`);
      }

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

      xml = xml.replace(
        /<pageSetup[^>]*\/>/,
        '<pageSetup paperSize="14" scale="65" fitToHeight="0" orientation="portrait" r:id="rId1"/>'
      );
    }

    // Keep printOptions and zero-margins from template
    if (xml.includes('<printOptions')) {
      xml = xml.replace(/<printOptions[^>]*\/>/, '<printOptions horizontalCentered="1" verticalCentered="1"/>');
    } else {
      xml = xml.replace('<pageMargins', '<printOptions horizontalCentered="1" verticalCentered="1"/><pageMargins');
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

  const males = sectionStudents.filter(s => (s.gender || '').toUpperCase() === 'MALE');
  const females = sectionStudents.filter(s => (s.gender || '').toUpperCase() === 'FEMALE');

  for (const { sheetFile, termKey } of summarySheets) {
    const sFile = zip.file(sheetFile);
    if (!sFile) continue;

    let xml = await sFile.async('string');
    let cleanDiv = (schoolProfile.division || '').replace(/schools division office of/i, '').replace(/division of/i, '').replace(/schools division/i, '').trim().toUpperCase();
    if (cleanDiv) cleanDiv = `SCHOOLS DIVISION OFFICE OF ${cleanDiv}`;

    const sumCells: Record<string, string | number> = {
      'E5': schoolProfile.region || '',
      'M5': cleanDiv,
      'E6': (schoolProfile.name || '').toUpperCase(),
      'M6': schoolProfile.school_id || '',
      'R6': schoolYear,
      'G9': gradeLevel,
      'P9': (adviser || schoolProfile.adviser_name || '').toUpperCase(),
      'G10': sectionUpper
    };

    // Males (Rows 14 - 63)
    for (let i = 0; i < 50; i++) {
      const rowNum = 14 + i;
      const st = males[i];
      if (st) {
        sumCells[`C${rowNum}`] = formatLearnerName(st).toUpperCase();
        sumCells[`F${rowNum}`] = st.lrn || '';
        sumCells[`H${rowNum}`] = formatDateToMMDDYYYY(st.birthday);

        const stAgeBoSY = calculateAge(st.birthday, new Date(startYear, 5, 1));
        sumCells[`I${rowNum}`] = stAgeBoSY.years || '';
        sumCells[`J${rowNum}`] = stAgeBoSY.months || 0;
        sumCells[`K${rowNum}`] = ''; // Left blank for EoSY until end of school year
        sumCells[`L${rowNum}`] = ''; // Left blank for EoSY until end of school year
        sumCells[`M${rowNum}`] = 'M';

        const rem = getStudentRemarks ? getStudentRemarks(st.lrn) : (st.lrn === student.lrn ? g1Remarks : undefined);
        if (rem) {
          const canDo = termKey === 'term1' ? rem.term1CanDo : termKey === 'term2' ? rem.term2CanDo : rem.term3CanDo;
          const toImp = termKey === 'term1' ? rem.term1ToImprove : termKey === 'term2' ? rem.term2ToImprove : rem.term3ToImprove;
          if (canDo) sumCells[`N${rowNum}`] = canDo;
          if (toImp) sumCells[`Q${rowNum}`] = toImp;
        }
      } else {
        sumCells[`C${rowNum}`] = '';
        sumCells[`F${rowNum}`] = '';
        sumCells[`H${rowNum}`] = '';
      }
    }

    // Females (Rows 65 - 114)
    for (let i = 0; i < 50; i++) {
      const rowNum = 65 + i;
      const st = females[i];
      if (st) {
        sumCells[`C${rowNum}`] = formatLearnerName(st).toUpperCase();
        sumCells[`F${rowNum}`] = st.lrn || '';
        sumCells[`H${rowNum}`] = formatDateToMMDDYYYY(st.birthday);

        const stAgeBoSY = calculateAge(st.birthday, new Date(startYear, 5, 1));
        sumCells[`I${rowNum}`] = stAgeBoSY.years || '';
        sumCells[`J${rowNum}`] = stAgeBoSY.months || 0;
        sumCells[`K${rowNum}`] = ''; // Left blank for EoSY until end of school year
        sumCells[`L${rowNum}`] = ''; // Left blank for EoSY until end of school year
        sumCells[`M${rowNum}`] = 'F';

        const rem = getStudentRemarks ? getStudentRemarks(st.lrn) : (st.lrn === student.lrn ? g1Remarks : undefined);
        if (rem) {
          const canDo = termKey === 'term1' ? rem.term1CanDo : termKey === 'term2' ? rem.term2CanDo : rem.term3CanDo;
          const toImp = termKey === 'term1' ? rem.term1ToImprove : termKey === 'term2' ? rem.term2ToImprove : rem.term3ToImprove;
          if (canDo) sumCells[`N${rowNum}`] = canDo;
          if (toImp) sumCells[`Q${rowNum}`] = toImp;
        }
      } else {
        sumCells[`C${rowNum}`] = '';
        sumCells[`F${rowNum}`] = '';
        sumCells[`H${rowNum}`] = '';
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
