/**
 * Grade 1 Master Excel Import Service (Two-Way Sync)
 * Parses an exported and offline-edited DepEd Grade 1 Master Excel Workbook
 * (UPDATED [Grade 1] ECR, PACE Form, and SF9.xlsx),
 * extracts SF9 Remarks, PACE Macro-skill Ratings, and Learner data,
 * generates a comprehensive Diff, and commits changes back to FormEase.
 */

import ExcelJS from 'exceljs';
import type { PaceRatingDescriptor } from '../types/pace';
import type { SF9Grade1Remarks } from './sf9-g1-excel-export';
import { G1_PACE_LOOKUP_MAP } from './g1-pace-lookup-map';
import { PACE_MASTER_CELL_COLORS } from './pace-template-config';
import { PACE_LANGUAGE_MASTER_CELL_COLORS } from './pace-language-template-config';
import { savePaceRecord, getPaceRecord, type PaceFormSubject } from './pace-record-service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ImportCategory = 'pace' | 'remarks' | 'demographics';
export type ImportChangeType = 'added' | 'modified' | 'unchanged';
export type ImportStrategy = 'merge' | 'fill_blanks' | 'overwrite';

export interface ImportLearnerInfo {
  index: number;
  gender: 'Male' | 'Female';
  lrn: string;
  name: string;
  birthday?: string;
}

export interface ImportDiffItem {
  id: string;
  studentLrn: string;
  studentName: string;
  category: ImportCategory;
  subject?: 'reading' | 'language' | 'math' | 'gmrc' | 'makabansa';
  field: string;
  term?: 't1' | 't2' | 't3';
  oldValue: string;
  newValue: string;
  changeType: ImportChangeType;
}

export interface ParsedGrade1Data {
  sectionName: string;
  schoolYear: string;
  gradeLevel: string;
  adviser: string;
  principal: string;
  learners: ImportLearnerInfo[];
  remarks: Record<string, SF9Grade1Remarks>; // key: lrn
  paceRatings: {
    reading: Record<string, Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>>;
    language: Record<string, Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>>;
    math: Record<string, Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>>;
    gmrc: Record<string, Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>>;
    makabansa: Record<string, Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>>;
  };
}

export interface CurrentGrade1StoreData {
  schoolYear: string;
  remarks: Record<string, SF9Grade1Remarks>; // key: lrn
  paceRatings: {
    reading: unknown;
    language: unknown;
    math: unknown;
    gmrcMakabansa: unknown;
  };
}

export type CurrentGrade1Data = CurrentGrade1StoreData;

export interface Grade1MasterImportResult {
  parsed: ParsedGrade1Data;
  diffs: ImportDiffItem[];
  stats: {
    totalStudents: number;
    totalChanges: number;
    paceAdded: number;
    paceModified: number;
    remarksAdded: number;
    remarksModified: number;
  };
}

// ---------------------------------------------------------------------------
// Reverse Maps & Competency ID Resolvers
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
  'm1_1': 176, 'm1_2': 177, 'm1_3': 178, 'm1_4': 179, 'm1_5': 180,
  'm1_6': 181, 'm1_7': 182, 'm1_8': 183, 'm1_9_main': 184, 'm1_9': 184,
  'm1_9a': 185, 'm1_9b': 186, 'm1_10': 187, 'm1_11': 189, 'm1_12': 190,
  'm1_13': 191, 'm1_14': 192, 'm1_15': 193, 'm1_16': 194,
  'm2_1': 197, 'm2_2': 198, 'm2_3_main': 199, 'm2_3': 199, 'm2_3a': 200,
  'm2_4': 201, 'm2_5': 202, 'm2_6': 203, 'm2_7': 204, 'm2_8_main': 205,
  'm2_8': 205, 'm2_8a': 205, 'm2_8b': 206, 'm2_9': 207, 'm2_10': 208,
  'm2_11': 209, 'm2_12': 210, 'm2_13': 211, 'm2_14_main': 212, 'm2_14': 212,
  'm2_14a': 212, 'm2_14b': 213, 'm2_15': 214, 'm2_16': 216, 'm2_17': 217,
  'm2_18': 218, 'm2_19': 219,
  'm3_1': 222, 'm3_2': 223, 'm3_3': 224, 'm3_4': 225, 'm3_5': 226,
  'm3_6': 227, 'm3_7': 228, 'm3_8': 229, 'm3_9': 230, 'm3_10': 232,
  'm3_11': 233, 'm3_12': 234, 'm3_13': 235, 'm3_14': 236
};

const GMRC_ROW_MAP: Record<string, number> = {
  'gmrc1_1': 256, 'gmrc1_2': 257, 'gmrc1_3': 258, 'gmrc1_4': 259, 'gmrc1_5': 260,
  'gmrc1_6': 261, 'gmrc1_7': 262,
  'gmrc2_1': 264, 'gmrc2_2': 265, 'gmrc2_3': 266, 'gmrc2_4': 267, 'gmrc2_5': 268,
  'gmrc2_6': 269, 'gmrc2_7': 270, 'gmrc2_8': 271, 'gmrc2_9': 272,
  'gmrc3_1': 274, 'gmrc3_2': 275, 'gmrc3_3': 276, 'gmrc3_4': 277, 'gmrc3_5': 278,
  'gmrc3_6': 279, 'gmrc3_7': 280, 'gmrc3_8': 281
};

const MAKABANSA_ROW_MAP: Record<string, number> = {
  'maka1_1_main': 294, 'maka1_1a': 295, 'maka1_1b': 296, 'maka1_2': 297, 'maka1_3': 298,
  'makabansa1_1_main': 294, 'makabansa1_1a': 295, 'makabansa1_1b': 296, 'makabansa1_2': 297, 'makabansa1_3': 298,
  'maka2_1': 300, 'maka2_2': 301, 'maka2_3': 302,
  'makabansa2_1': 300, 'makabansa2_2': 301, 'makabansa2_3': 302,
  'maka3_1': 304, 'maka3_2': 305, 'maka3_3': 306, 'maka3_4': 307, 'maka3_5': 308, 'maka3_6': 309, 'maka3_7': 310,
  'makabansa3_1': 304, 'makabansa3_2': 305, 'makabansa3_3': 306, 'makabansa3_4': 307, 'makabansa3_5': 308, 'makabansa3_6': 309, 'makabansa3_7': 310
};

// Build inverted row maps for O(1) reverse lookup: row -> subId
function invertMap(map: Record<string, number>): Map<number, string> {
  const inv = new Map<number, string>();
  for (const [subId, row] of Object.entries(map)) {
    // Prefer non-_main keys if multiple map to same row
    if (!inv.has(row) || inv.get(row)?.endsWith('_main')) {
      inv.set(row, subId);
    }
  }
  return inv;
}

const INV_READING_LEFT = invertMap(READING_LEFT_ROW_MAP);
const INV_READING_RIGHT = invertMap(READING_RIGHT_ROW_MAP);
const INV_LANG_LEFT = invertMap(LANGUAGE_LEFT_ROW_MAP);
const INV_LANG_RIGHT = invertMap(LANGUAGE_RIGHT_ROW_MAP);
const INV_MATH = invertMap(MATH_ROW_MAP);
const INV_GMRC = invertMap(GMRC_ROW_MAP);
const INV_MAKABANSA = invertMap(MAKABANSA_ROW_MAP);

interface ReverseCellMapping {
  paceRow: number;
  side: 'left' | 'right';
  term: 't1' | 't2' | 't3';
  subject: 'reading' | 'language' | 'math' | 'gmrc' | 'makabansa';
  subId: string;
}

// Global cached reverse lookup: `${sheetName}___${colLetter}` -> ReverseCellMapping
let cachedReverseMap: Map<string, ReverseCellMapping> | null = null;

function getReverseCellMap(): Map<string, ReverseCellMapping> {
  if (cachedReverseMap) return cachedReverseMap;
  const map = new Map<string, ReverseCellMapping>();

  for (const [key, target] of Object.entries(G1_PACE_LOOKUP_MAP)) {
    const parts = key.split('_');
    const paceRow = parseInt(parts[0], 10);
    const side = parts[1] as 'left' | 'right';
    let term = parts[2] as 't1' | 't2' | 't3';
    const sheetName = target.s;
    const colLetter = target.c;

    let subject: 'reading' | 'language' | 'math' | 'gmrc' | 'makabansa' | null = null;
    let subId: string | undefined;

    if (sheetName.includes('READING')) {
      subject = 'reading';
      subId = side === 'left' ? INV_READING_LEFT.get(paceRow) : INV_READING_RIGHT.get(paceRow);
      term = sheetName.includes('TERM 1') ? 't1' : sheetName.includes('TERM 2') ? 't2' : 't3';
    } else if (sheetName.includes('LANGUAGE')) {
      subject = 'language';
      subId = side === 'left' ? INV_LANG_LEFT.get(paceRow) : INV_LANG_RIGHT.get(paceRow);
      term = sheetName.includes('TERM 1') ? 't1' : sheetName.includes('TERM 2') ? 't2' : 't3';
    } else if (sheetName.includes('MATHEMATICS')) {
      subject = 'math';
      subId = INV_MATH.get(paceRow);
      if (subId?.startsWith('m1_')) term = 't1';
      else if (subId?.startsWith('m2_')) term = 't2';
      else if (subId?.startsWith('m3_')) term = 't3';
    } else if (sheetName.includes('GMRC')) {
      subject = 'gmrc';
      subId = INV_GMRC.get(paceRow);
      if (subId?.startsWith('gmrc1_')) term = 't1';
      else if (subId?.startsWith('gmrc2_')) term = 't2';
      else if (subId?.startsWith('gmrc3_')) term = 't3';
    } else if (sheetName.includes('MAKABANSA')) {
      subject = 'makabansa';
      subId = INV_MAKABANSA.get(paceRow);
      if (subId?.startsWith('maka1_') || subId?.startsWith('makabansa1_')) term = 't1';
      else if (subId?.startsWith('maka2_') || subId?.startsWith('makabansa2_')) term = 't2';
      else if (subId?.startsWith('maka3_') || subId?.startsWith('makabansa3_')) term = 't3';
    }

    if (subject && subId) {
      const lookupKey = `${sheetName}___${colLetter}`;
      map.set(lookupKey, { paceRow, side, term, subject, subId });
    }
  }

  cachedReverseMap = map;
  return cachedReverseMap;
}

// ---------------------------------------------------------------------------
// Helper: Normalize Rating & Cell Values
// ---------------------------------------------------------------------------

function normalizeRating(val: unknown): PaceRatingDescriptor {
  if (val === null || val === undefined) return '';
  const s = String(val).trim().toUpperCase();
  if (['A', 'B', 'C', 'D', 'E'].includes(s)) {
    return s as PaceRatingDescriptor;
  }
  return '';
}

function getCellString(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) return '';
  if (typeof cell.value === 'object' && 'result' in cell.value) {
    const r = (cell.value as { result?: unknown }).result;
    return r !== null && r !== undefined ? String(r).trim() : '';
  }
  return String(cell.value).trim();
}

// ---------------------------------------------------------------------------
// Core Parser: parseGrade1MasterWorkbook
// ---------------------------------------------------------------------------

export async function parseGrade1MasterWorkbook(
  buffer: ArrayBuffer,
  currentData: CurrentGrade1StoreData
): Promise<Grade1MasterImportResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  // 1. Validation: Verify presence of critical sheets
  const inputSheet = wb.getWorksheet('INPUT DATA');
  if (!inputSheet) {
    throw new Error('Invalid Grade 1 Master Workbook: Missing "INPUT DATA" sheet.');
  }

  const sectionName = getCellString(inputSheet.getCell('F28')) || 'MATATAG';
  const schoolYear = getCellString(inputSheet.getCell('F18')) || currentData.schoolYear || '2026-2027';
  const gradeLevel = getCellString(inputSheet.getCell('F27')) || 'Grade 1';
  const adviser = getCellString(inputSheet.getCell('F26'));
  const principal = getCellString(inputSheet.getCell('F19'));

  // 2. Extract Learner Roster from INPUT DATA
  const learners: ImportLearnerInfo[] = [];

  // Males (Rows 11 to 60)
  for (let idx = 0; idx < 50; idx++) {
    const r = 11 + idx;
    const name = getCellString(inputSheet.getCell(`L${r}`));
    const lrn = getCellString(inputSheet.getCell(`M${r}`)).replace(/\D/g, '');
    const bday = getCellString(inputSheet.getCell(`N${r}`));
    if (name || lrn) {
      learners.push({
        index: idx,
        gender: 'Male',
        lrn: lrn || `MALE_${idx + 1}`,
        name: name || `Learner (Male #${idx + 1})`,
        birthday: bday || undefined
      });
    }
  }

  // Females (Rows 11 to 60)
  for (let idx = 0; idx < 50; idx++) {
    const r = 11 + idx;
    const name = getCellString(inputSheet.getCell(`Q${r}`));
    const lrn = getCellString(inputSheet.getCell(`R${r}`)).replace(/\D/g, '');
    const bday = getCellString(inputSheet.getCell(`S${r}`));
    if (name || lrn) {
      learners.push({
        index: idx,
        gender: 'Female',
        lrn: lrn || `FEMALE_${idx + 1}`,
        name: name || `Learner (Female #${idx + 1})`,
        birthday: bday || undefined
      });
    }
  }

  // 3. Extract SF9 Remarks from TERM 1/2/3 SUMMARY
  const remarksByLrn: Record<string, SF9Grade1Remarks> = {};
  const termSheets = [
    { key: 'TERM 1 SUMMARY', termCanDo: 'term1CanDo' as const, termToImp: 'term1ToImprove' as const },
    { key: 'TERM 2 SUMMARY', termCanDo: 'term2CanDo' as const, termToImp: 'term2ToImprove' as const },
    { key: 'TERM 3 SUMMARY', termCanDo: 'term3CanDo' as const, termToImp: 'term3ToImprove' as const }
  ];

  for (const { key, termCanDo, termToImp } of termSheets) {
    const ws = wb.getWorksheet(key);
    if (!ws) continue;

    for (const l of learners) {
      const row = l.gender === 'Male' ? (14 + l.index) : (65 + l.index);
      const canDo = getCellString(ws.getCell(`N${row}`));
      const toImp = getCellString(ws.getCell(`Q${row}`));

      if (!remarksByLrn[l.lrn]) {
        remarksByLrn[l.lrn] = {};
      }

      if (canDo && canDo !== '0') {
        remarksByLrn[l.lrn][termCanDo] = canDo;
      }
      if (toImp && toImp !== '0') {
        remarksByLrn[l.lrn][termToImp] = toImp;
      }
    }
  }

  // 4. Extract PACE Ratings from 9 Subject ECR Sheets
  const paceRatings = {
    reading: {} as Record<string, Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>>,
    language: {} as Record<string, Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>>,
    math: {} as Record<string, Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>>,
    gmrc: {} as Record<string, Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>>,
    makabansa: {} as Record<string, Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>>
  };

  const reverseMap = getReverseCellMap();
  const subjectSheetNames = [
    'TERM 1 READING & LITERACY', 'TERM 2 READING & LITERACY', 'TERM 3 READING & LITERACY',
    'TERM 1 LANGUAGE', 'TERM 2 LANGUAGE', 'TERM 3 LANGUAGE',
    'TERM 1-3 MATHEMATICS', 'TERM 1-3 GMRC', 'G1 PACE FORM MAKABANSA'
  ];

  for (const sName of subjectSheetNames) {
    const ws = wb.getWorksheet(sName);
    if (!ws) continue;

    for (const l of learners) {
      const studentRow = sName === 'TERM 1-3 MATHEMATICS'
        ? (l.gender === 'Male' ? (16 + l.index) : (67 + l.index))
        : (l.gender === 'Male' ? (15 + l.index) : (66 + l.index));

      const row = ws.getRow(studentRow);
      row.eachCell((cell, colNumber) => {
        const colLetter = ws.getColumn(colNumber).letter || '';
        const lookupKey = `${sName}___${colLetter}`;
        const mapping = reverseMap.get(lookupKey);
        if (!mapping) return;

        const rawVal = getCellString(cell);
        const rating = normalizeRating(rawVal);
        if (!rating) return;

        const { subject, subId, term } = mapping;

        // Guard against unassessed or locked cells (#3F3F3F, #434343, #B7B7B7, #000000)
        if (subject === 'reading' && subId) {
          const color = (PACE_MASTER_CELL_COLORS[subId]?.[term] || '').toUpperCase();
          if (color === '#3F3F3F' || color === '#434343' || color === '#B7B7B7' || color === '#000000') return;
        } else if (subject === 'language' && subId) {
          const color = (PACE_LANGUAGE_MASTER_CELL_COLORS[subId]?.[term] || '').toUpperCase();
          if (color === '#B7B7B7' || color === '#3F3F3F' || color === '#000000') return;
        }

        if (!paceRatings[subject][l.lrn]) {
          paceRatings[subject][l.lrn] = {};
        }
        if (!paceRatings[subject][l.lrn][subId]) {
          paceRatings[subject][l.lrn][subId] = {};
        }
        paceRatings[subject][l.lrn][subId][term] = rating;
      });
    }
  }

  // 5. Compute Diffs against Current FormEase State
  const diffs: ImportDiffItem[] = [];
  let paceAdded = 0;
  let paceModified = 0;
  let remarksAdded = 0;
  let remarksModified = 0;

  // Helper to resolve current rating
  const getCurrentRating = (
    subject: 'reading' | 'language' | 'math' | 'gmrc' | 'makabansa',
    lrn: string,
    subId: string,
    term: 't1' | 't2' | 't3'
  ): string => {
    let storeObj: unknown;
    if (subject === 'reading') storeObj = currentData.paceRatings.reading;
    else if (subject === 'language') storeObj = currentData.paceRatings.language;
    else if (subject === 'math') storeObj = currentData.paceRatings.math;
    else storeObj = currentData.paceRatings.gmrcMakabansa;

    if (!storeObj || typeof storeObj !== 'object') return '';
    const s = storeObj as Record<string, unknown>;
    const studentEntry = (s[lrn] || s[lrn.trim()]) as { ratings?: Record<string, Record<string, string>> } | Record<string, Record<string, string>> | undefined;
    if (!studentEntry || typeof studentEntry !== 'object') return '';
    const ratings = ('ratings' in studentEntry && studentEntry.ratings
      ? studentEntry.ratings
      : studentEntry) as Record<string, Record<string, string>>;
    const compRatings = ratings?.[subId];
    if (!compRatings || typeof compRatings !== 'object') return '';
    return compRatings[term] || '';
  };

  // Compare PACE Ratings
  const allSubjects: ('reading' | 'language' | 'math' | 'gmrc' | 'makabansa')[] = ['reading', 'language', 'math', 'gmrc', 'makabansa'];
  for (const subject of allSubjects) {
    const subjRatings = paceRatings[subject];
    for (const [lrn, compMap] of Object.entries(subjRatings)) {
      const learner = learners.find(l => l.lrn === lrn);
      const studentName = learner ? learner.name : lrn;

      for (const [subId, terms] of Object.entries(compMap)) {
        for (const [termKey, newVal] of Object.entries(terms)) {
          const term = termKey as 't1' | 't2' | 't3';
          const oldVal = getCurrentRating(subject, lrn, subId, term);
          const nVal = newVal || '';

          if (nVal !== oldVal) {
            const isAdd = !oldVal && Boolean(nVal);
            if (isAdd) paceAdded++;
            else paceModified++;

            diffs.push({
              id: `pace_${subject}_${lrn}_${subId}_${term}`,
              studentLrn: lrn,
              studentName,
              category: 'pace',
              subject,
              field: `${subId} (${term.toUpperCase()})`,
              term,
              oldValue: oldVal,
              newValue: nVal,
              changeType: isAdd ? 'added' : 'modified'
            });
          }
        }
      }
    }
  }

  // Compare SF9 Remarks
  const remarkFields: { key: keyof SF9Grade1Remarks; label: string }[] = [
    { key: 'term1CanDo', label: 'Term 1: What Your Child Can Do' },
    { key: 'term1ToImprove', label: 'Term 1: What Your Child Is Learning To Improve' },
    { key: 'term2CanDo', label: 'Term 2: What Your Child Can Do' },
    { key: 'term2ToImprove', label: 'Term 2: What Your Child Is Learning To Improve' },
    { key: 'term3CanDo', label: 'Term 3: What Your Child Can Do' },
    { key: 'term3ToImprove', label: 'Term 3: What Your Child Is Learning To Improve' }
  ];

  for (const [lrn, rem] of Object.entries(remarksByLrn)) {
    const learner = learners.find(l => l.lrn === lrn);
    const studentName = learner ? learner.name : lrn;
    const oldRem = currentData.remarks[lrn] || currentData.remarks[lrn.trim()] || {};

    for (const { key, label } of remarkFields) {
      const newVal = (rem[key] || '').trim();
      const oldVal = (oldRem[key] || '').trim();

      if (newVal && newVal !== oldVal) {
        const isAdd = !oldVal && Boolean(newVal);
        if (isAdd) remarksAdded++;
        else remarksModified++;

        diffs.push({
          id: `remarks_${lrn}_${key}`,
          studentLrn: lrn,
          studentName,
          category: 'remarks',
          field: label,
          oldValue: oldVal,
          newValue: newVal,
          changeType: isAdd ? 'added' : 'modified'
        });
      }
    }
  }

  const parsed: ParsedGrade1Data = {
    sectionName,
    schoolYear,
    gradeLevel,
    adviser,
    principal,
    learners,
    remarks: remarksByLrn,
    paceRatings
  };

  return {
    parsed,
    diffs,
    stats: {
      totalStudents: learners.length,
      totalChanges: diffs.length,
      paceAdded,
      paceModified,
      remarksAdded,
      remarksModified
    }
  };
}

// ---------------------------------------------------------------------------
// Apply Importer: applyGrade1MasterImport
// ---------------------------------------------------------------------------

export interface ApplyImportResult {
  updatedRemarksCount: number;
  updatedPaceCount: number;
}

export async function applyGrade1MasterImport(
  importResult: Grade1MasterImportResult,
  strategy: ImportStrategy
): Promise<ApplyImportResult> {
  const { parsed, diffs } = importResult;
  const sy = parsed.schoolYear;

  // Filter diffs based on strategy
  const applicableDiffs = diffs.filter(d => {
    if (strategy === 'fill_blanks') {
      return !d.oldValue && Boolean(d.newValue);
    }
    return Boolean(d.newValue);
  });

  // 1. Group & Apply SF9 Remarks
  const remarksDiffs = applicableDiffs.filter(d => d.category === 'remarks');
  const remarksByLrn: Record<string, Partial<SF9Grade1Remarks>> = {};

  for (const d of remarksDiffs) {
    if (!remarksByLrn[d.studentLrn]) {
      const existing = localStorage.getItem(`g1_remarks_${d.studentLrn}_${sy}`);
      const baseRem: Partial<SF9Grade1Remarks> = existing
        ? JSON.parse(existing)
        : (parsed.remarks[d.studentLrn] ? { ...parsed.remarks[d.studentLrn] } : {});
      remarksByLrn[d.studentLrn] = baseRem;
    }
    const rem = remarksByLrn[d.studentLrn];
    if (d.field.includes('Term 1: What Your Child Can Do')) rem.term1CanDo = d.newValue;
    else if (d.field.includes('Term 1: What Your Child Is Learning To Improve')) rem.term1ToImprove = d.newValue;
    else if (d.field.includes('Term 2: What Your Child Can Do')) rem.term2CanDo = d.newValue;
    else if (d.field.includes('Term 2: What Your Child Is Learning To Improve')) rem.term2ToImprove = d.newValue;
    else if (d.field.includes('Term 3: What Your Child Can Do')) rem.term3CanDo = d.newValue;
    else if (d.field.includes('Term 3: What Your Child Is Learning To Improve')) rem.term3ToImprove = d.newValue;
  }

  for (const [lrn, rem] of Object.entries(remarksByLrn)) {
    localStorage.setItem(`g1_remarks_${lrn}_${sy}`, JSON.stringify(rem));
  }

  // 2. Group & Apply PACE Ratings
  const paceDiffs = applicableDiffs.filter(d => d.category === 'pace');

  const updateSubjectStore = (
    subject: PaceFormSubject,
    legacyKey: string,
    diffsForSubject: ImportDiffItem[]
  ) => {
    if (diffsForSubject.length === 0) return;
    const raw = localStorage.getItem(legacyKey);
    const store: Record<string, { ratings?: Record<string, Record<string, string>> }> = raw ? JSON.parse(raw) : {};

    for (const d of diffsForSubject) {
      if (!store[d.studentLrn]) {
        store[d.studentLrn] = {
          ratings: {}
        };
      }
      if (!store[d.studentLrn].ratings) {
        store[d.studentLrn].ratings = {};
      }
      const compId = d.field.split(' ')[0];
      const term = (d.term || 't1') as 't1' | 't2' | 't3';
      if (!store[d.studentLrn].ratings![compId]) {
        store[d.studentLrn].ratings![compId] = {};
      }
      store[d.studentLrn].ratings![compId][term] = d.newValue;

      // Also persist to versioned school-year scoped PACE service
      const existing = getPaceRecord(subject, sy, d.studentLrn) || {
        lrn: d.studentLrn,
        studentName: '',
        gradeLevel: 'Grade 1',
        section: '',
        schoolYear: sy,
        teacherName: '',
        ratings: {},
      };

      const compRating = existing.ratings[compId] || {};
      const updatedCompRating = { ...compRating, [term]: d.newValue as PaceRatingDescriptor };
      savePaceRecord(subject, sy, d.studentLrn, {
        ...existing,
        schoolYear: sy,
        ratings: {
          ...existing.ratings,
          [compId]: updatedCompRating,
        },
      });
    }

    localStorage.setItem(legacyKey, JSON.stringify(store));
  };

  updateSubjectStore('reading', 'formease_pace_reading_ratings', paceDiffs.filter(d => d.subject === 'reading'));
  updateSubjectStore('language', 'formease_pace_language_ratings', paceDiffs.filter(d => d.subject === 'language'));
  updateSubjectStore('math', 'formease_pace_math_ratings', paceDiffs.filter(d => d.subject === 'math'));
  
  // GMRC and Makabansa are saved to both their individual keys and combined key
  const gmrcMakabansaDiffs = paceDiffs.filter(d => d.subject === 'gmrc' || d.subject === 'makabansa');
  updateSubjectStore('gmrc-makabansa', 'formease_pace_gmrc_makabansa_ratings', gmrcMakabansaDiffs);
  updateSubjectStore('gmrc-makabansa', 'formease_pace_gmrc_ratings', paceDiffs.filter(d => d.subject === 'gmrc'));
  updateSubjectStore('gmrc-makabansa', 'formease_pace_makabansa_ratings', paceDiffs.filter(d => d.subject === 'makabansa'));

  return {
    updatedRemarksCount: remarksDiffs.length,
    updatedPaceCount: paceDiffs.length
  };
}
