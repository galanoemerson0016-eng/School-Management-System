/**
 * Native PACE Form Excel Export Service for Mathematics (Grade 1 Only)
 * Populates DepEd PACE FORM - Mathematics.xlsx while preserving all merged ranges,
 * column widths, row heights, borders, and styles.
 */

import ExcelJS from 'exceljs';
import type { Student, SchoolProfile } from '../types';
import type { PaceFormData } from '../types/pace';
import { formatLearnerName } from '../utils/student-name';

export interface PaceMathExcelExportOptions {
  student: Student;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section: string;
  adviser: string;
  principal: string;
  principalTitle: string;
  paceData: PaceFormData;
}

export async function fetchPaceMathTemplateBuffer(): Promise<ArrayBuffer> {
  const cleanBase = (import.meta.env.BASE_URL || '/').endsWith('/') 
    ? (import.meta.env.BASE_URL || '/') 
    : `${import.meta.env.BASE_URL}/`;
  const timestamp = Date.now();
  
  const candidateUrls = [
    `${cleanBase}templates/PACE%20FORM%20-%20Mathematics.xlsx?t=${timestamp}`,
    `/templates/PACE%20FORM%20-%20Mathematics.xlsx?t=${timestamp}`,
    `templates/PACE%20FORM%20-%20Mathematics.xlsx?t=${timestamp}`,
    `${cleanBase}templates/PACE_FORM_Mathematics.xlsx?t=${timestamp}`,
    `/templates/PACE_FORM_Mathematics.xlsx?t=${timestamp}`
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
          return buffer;
        }
      }
    } catch {
      // Try next
    }
  }

  throw new Error('Failed to fetch valid PACE Mathematics template.');
}

/**
 * Authoritative Item to Excel Row Mapping for PACE FORM - Mathematics
 * Extracted directly from DepEd PACE FORM - Mathematics.xlsx
 */
const PACE_MATH_EXCEL_ROW_MAP: Record<string, number> = {
  // Term 1
  'm1_1': 9,
  'm1_2': 11,
  'm1_3': 12,
  'm1_4': 14,
  'm1_5': 15,
  'm1_6': 16,
  'm1_7': 17,
  'm1_8': 18,
  'm1_9_main': 20,
  'm1_9a': 21,
  'm1_9b': 22,
  'm1_10': 23,
  'm1_11': 25,
  'm1_12': 26,
  'm1_13': 27,
  'm1_14': 28,
  'm1_15': 29,
  'm1_16': 30,

  // Term 2
  'm2_1': 33,
  'm2_2': 34,
  'm2_3_main': 35,
  'm2_3a': 36,
  'm2_4': 37,
  'm2_5': 38,
  'm2_6': 39,
  'm2_7': 40,
  'm2_8_main': 41,
  'm2_8a': 42,
  'm2_8b': 43,
  'm2_9': 44,
  'm2_10': 45,
  'm2_11': 47,
  'm2_12': 48,
  'm2_13': 49,
  'm2_14_main': 50,
  'm2_14a': 51,
  'm2_14b': 52,
  'm2_15': 53,
  'm2_16': 55,
  'm2_17': 56,
  'm2_18': 57,
  'm2_19': 58,

  // Term 3
  'm3_1': 61,
  'm3_2': 63,
  'm3_3': 64,
  'm3_4': 65,
  'm3_5': 66,
  'm3_6': 67,
  'm3_7': 68,
  'm3_8': 69,
  'm3_9': 70,
  'm3_10': 73,
  'm3_11': 75,
  'm3_12': 76,
  'm3_13': 77,
  'm3_14': 78
};

export async function populatePaceMathTemplate(
  buffer: ArrayBuffer,
  opts: PaceMathExcelExportOptions
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.getWorksheet('SF9_F2') || wb.worksheets[0];
  if (!ws) throw new Error('Worksheet SF9_F2 not found in PACE Mathematics template');

  // Clear external formula links in row 1
  ws.getRow(1).eachCell((cell) => {
    if (cell.formula && cell.formula.includes('[1]')) {
      cell.value = null;
    }
  });

  if (wb.definedNames) {
    wb.definedNames.model = [];
  }

  const { student, section, paceData } = opts;
  const fullName = formatLearnerName(student);

  // Populate Header Information in exact corresponding template cells in PACE FORM - Mathematics.xlsx
  // C2: LRN
  const lrnCell = ws.getCell('C2');
  if (lrnCell) lrnCell.value = student.lrn || '';

  // G2: Learner Name
  const nameCell = ws.getCell('G2');
  if (nameCell) nameCell.value = fullName.toUpperCase();

  // P2: Section
  const secCell = ws.getCell('P2');
  if (secCell) secCell.value = `${section || ''}`.toUpperCase();

  // Populate Ratings using exact sub-row Excel row indices in Column P (16)
  const ratings = paceData.ratings || {};

  Object.entries(ratings).forEach(([itemId, r]) => {
    if (!r) return;
    const rNum = PACE_MATH_EXCEL_ROW_MAP[itemId];
    if (rNum) {
      // For Math, rating value can be stored in t1, rating, or val
      const val = r.t1 || r.t2 || r.t3 || (r as { value?: string }).value || '';
      if (val) {
        ws.getCell(rNum, 16).value = val; // Col P (Rating)
      }
    }
  });

  return wb;
}

export async function exportPaceMathToExcel(opts: PaceMathExcelExportOptions): Promise<void> {
  const buffer = await fetchPaceMathTemplateBuffer();
  const wb = await populatePaceMathTemplate(buffer, opts);

  const outBuffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([outBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const studentNameClean = formatLearnerName(opts.student).replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `PACE_Form_Mathematics_${studentNameClean}_${opts.schoolYear}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
