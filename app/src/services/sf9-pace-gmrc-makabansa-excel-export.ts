/**
 * Native PACE Form Excel Export Service for GMRC & MAKABANSA (Grade 1 Only)
 * Populates DepEd PACE FORM - GMRC & MAKABANSA.xlsx while preserving all merged ranges,
 * column widths, row heights, borders, and styles.
 */

import ExcelJS from 'exceljs';
import type { Student, SchoolProfile } from '../types';
import type { PaceFormData } from '../types/pace';
import { formatLearnerName } from '../utils/student-name';

export interface PaceGmrcMakabansaExcelExportOptions {
  student: Student;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section: string;
  adviser: string;
  principal: string;
  principalTitle: string;
  paceData: PaceFormData;
}

export async function fetchPaceGmrcMakabansaTemplateBuffer(): Promise<ArrayBuffer> {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const timestamp = new Date().getTime();
  
  let response = await fetch(`${baseUrl}templates/PACE_FORM_GMRC_MAKABANSA.xlsx?t=${timestamp}`);
  if (!response.ok) {
    response = await fetch(`${baseUrl}templates/PACE%20FORM%20-%20GMRC%20%26%20MAKABANSA.xlsx?t=${timestamp}`);
  }
  if (!response.ok) {
    response = await fetch(`${baseUrl}templates/PACE%20FORM%20-%20GMRC%20and%20MAKABANSA.xlsx?t=${timestamp}`);
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch PACE GMRC & MAKABANSA template: ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

/**
 * Authoritative Item to Excel Row Mapping for PACE FORM - GMRC & MAKABANSA
 * Extracted directly from DepEd PACE FORM - GMRC & MAKABANSA.xlsx
 */
const PACE_GMRC_MAKABANSA_EXCEL_ROW_MAP: Record<string, number> = {
  // GMRC Term 1
  'gmrc1_1': 7,
  'gmrc1_2': 9,
  'gmrc1_3': 11,
  'gmrc1_4': 13,
  'gmrc1_5': 15,
  'gmrc1_6': 17,
  'gmrc1_7': 19,

  // GMRC Term 2
  'gmrc2_1': 22,
  'gmrc2_2': 24,
  'gmrc2_3': 26,
  'gmrc2_4': 28,
  'gmrc2_5': 31,
  'gmrc2_6': 33,
  'gmrc2_7': 35,
  'gmrc2_8': 37,
  'gmrc2_9': 39,

  // GMRC Term 3
  'gmrc3_1': 42,
  'gmrc3_2': 44,
  'gmrc3_3': 46,
  'gmrc3_4': 48,
  'gmrc3_5': 50,
  'gmrc3_6': 52,
  'gmrc3_7': 54,
  'gmrc3_8': 56,

  // MAKABANSA Term 1
  'makabansa1_1_main': 62,
  'makabansa1_1a': 63,
  'makabansa1_1b': 64,
  'makabansa1_1c': 65,
  'makabansa1_2': 66,
  'makabansa1_3': 67,

  // MAKABANSA Term 2
  'makabansa2_1': 69,
  'makabansa2_2': 70,
  'makabansa2_3': 71,

  // MAKABANSA Term 3
  'makabansa3_1': 73,
  'makabansa3_2': 74,
  'makabansa3_3': 75,
  'makabansa3_4': 76,
  'makabansa3_5': 77,
  'makabansa3_6': 78,
  'makabansa3_7': 79
};

export async function populatePaceGmrcMakabansaTemplate(
  buffer: ArrayBuffer,
  opts: PaceGmrcMakabansaExcelExportOptions
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.getWorksheet('SF9_F2') || wb.worksheets[0];
  if (!ws) throw new Error('Worksheet SF9_F2 not found in PACE GMRC & MAKABANSA template');

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

  // Populate Header Information in exact corresponding template cells in PACE FORM - GMRC & MAKABANSA.xlsx
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
    const rNum = PACE_GMRC_MAKABANSA_EXCEL_ROW_MAP[itemId];
    if (rNum) {
      const val = r.t1 || r.t2 || r.t3 || (r as { value?: string }).value || '';
      if (val) {
        ws.getCell(rNum, 16).value = val; // Col P (Rating)
      }
    }
  });

  return wb;
}

export async function exportPaceGmrcMakabansaToExcel(opts: PaceGmrcMakabansaExcelExportOptions): Promise<void> {
  const buffer = await fetchPaceGmrcMakabansaTemplateBuffer();
  const wb = await populatePaceGmrcMakabansaTemplate(buffer, opts);

  const outBuffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([outBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const studentNameClean = formatLearnerName(opts.student).replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `PACE_Form_GMRC_MAKABANSA_${studentNameClean}_${opts.schoolYear}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
