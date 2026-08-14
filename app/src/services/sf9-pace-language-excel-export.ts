/**
 * Native PACE Form Excel Export Service for Language (Grade 1 Only)
 * Populates DepEd PACE FORM - Language.xlsx while preserving all merged ranges,
 * column widths, row heights, borders, and styles.
 */

import ExcelJS from 'exceljs';
import type { Student, SchoolProfile } from '../types';
import type { PaceFormData } from '../types/pace';
import { formatLearnerName } from '../utils/student-name';

export interface PaceLanguageExcelExportOptions {
  student: Student;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section: string;
  adviser: string;
  principal: string;
  principalTitle: string;
  paceData: PaceFormData;
}

export async function fetchPaceLanguageTemplateBuffer(): Promise<ArrayBuffer> {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const timestamp = new Date().getTime();
  
  let response = await fetch(`${baseUrl}templates/PACE%20FORM%20-%20Language.xlsx?t=${timestamp}`);
  if (!response.ok) {
    response = await fetch(`${baseUrl}templates/PACE_FORM_Language.xlsx?t=${timestamp}`);
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch PACE Language template: ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

/**
 * Authoritative Sub-Row to Excel Row Mapping for PACE FORM - Language
 * Extracted directly from DepEd PACE FORM - Language.xlsx
 */
const PACE_LANGUAGE_LEFT_EXCEL_ROW_MAP: Record<string, number> = {
  '1_main': 8,
  '1a_listening': 9, '1a_speaking': 10,
  '1b_listening': 11, '1b_speaking': 12,
  '1c_listening': 13, '1c_speaking': 14,

  '2_main': 15,
  '2a_listening': 17, '2a_speaking': 18,
  '2b_listening': 19, '2b_speaking': 20,

  '3_main': 21,
  '3a_listening': 24, '3a_speaking': 25,
  '3b_listening': 26, '3b_speaking': 27,
  '3c_listening': 28, '3c_speaking': 29,
  '3d_listening': 30, '3d_speaking': 31,
  '3e_listening': 32, '3e_speaking': 33,
  '3f_listening': 34, '3f_speaking': 35,

  '4_main': 36,
  '4a_listening': 38, '4a_speaking': 39,
  '4b_listening': 40, '4b_speaking': 41,
  '4c_listening': 42, '4c_speaking': 43,

  '5_listening': 44, '5_speaking': 45,

  '6_main': 48,
  '6a_listening': 50, '6a_speaking': 51,
  '6b_listening': 52, '6b_speaking': 53,
  '6c_listening': 54, '6c_speaking': 55,

  '7_main': 56,
  '7a_listening': 57, '7a_speaking': 58,
  '7b_listening': 60, '7b_speaking': 61,
  '7c_listening': 62, '7c_speaking': 63,

  '8_main': 64,
  '8a_listening': 66, '8a_speaking': 67,
  '8b_listening': 68, '8b_speaking': 69,
  '8c_listening': 70, '8c_speaking': 71,

  '9_main': 72,
  '9a_listening': 73, '9a_speaking': 74,
  '9b_listening': 75, '9b_speaking': 76,
  '9c_listening': 77, '9c_speaking': 78
};

const PACE_LANGUAGE_RIGHT_EXCEL_ROW_MAP: Record<string, number> = {
  '10_listening': 7, '10_speaking': 8,

  '11_listening': 11, '11_speaking': 12,

  '12_main': 14,
  '12a_listening': 17, '12a_speaking': 18,
  '12b_listening': 20, '12b_speaking': 21,

  '13_main': 23,
  '13a_listening': 25, '13a_speaking': 26,
  '13b_listening': 27, '13b_speaking': 28,
  '13c_listening': 29, '13c_speaking': 30,
  '13d_listening': 32, '13d_speaking': 33,

  '14_listening': 35,

  '15_speaking': 37,

  '16_main': 40,
  '16a_listening': 41, '16a_speaking': 42,
  '16b_listening': 43, '16b_speaking': 44,
  '16c_listening': 45, '16c_speaking': 46,
  '16d_listening': 47, '16d_speaking': 48,

  '17_listening': 49, '17_speaking': 50,

  '18_listening': 52, '18_speaking': 53,
  '18a_listening': 54, '18a_speaking': 55,
  '18b_listening': 56, '18b_speaking': 57,
  '18c_listening': 58, '18c_speaking': 59,

  '19_listening': 60, '19_speaking': 61,

  '20_main': 62,
  '20a_listening': 64, '20a_speaking': 65,
  '20b_listening': 66, '20b_speaking': 67,
  '20c_listening': 68, '20c_speaking': 69,
  '20d_listening': 70, '20d_speaking': 71,
  '20e_listening': 72, '20e_speaking': 73
};

export async function populatePaceLanguageTemplate(
  buffer: ArrayBuffer,
  opts: PaceLanguageExcelExportOptions
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.getWorksheet('SF9_F2') || wb.worksheets[0];
  if (!ws) throw new Error('Worksheet SF9_F2 not found in PACE Language template');

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

  // Populate Header Information in exact corresponding template cells in PACE FORM - Language.xlsx
  // C2: LRN
  const lrnCell = ws.getCell('C2');
  if (lrnCell) lrnCell.value = student.lrn || '';

  // G2: Learner Name
  const nameCell = ws.getCell('G2');
  if (nameCell) nameCell.value = fullName.toUpperCase();

  // P2: Section
  const secCell = ws.getCell('P2');
  if (secCell) secCell.value = `${section || ''}`.toUpperCase();

  // Populate Ratings (T1, T2, T3) using exact sub-row Excel row indices
  const ratings = paceData.ratings || {};

  Object.entries(ratings).forEach(([subId, r]) => {
    if (!r) return;

    if (PACE_LANGUAGE_LEFT_EXCEL_ROW_MAP[subId]) {
      const rNum = PACE_LANGUAGE_LEFT_EXCEL_ROW_MAP[subId];
      if (r.t1) ws.getCell(rNum, 7).value = r.t1;   // Col G (T1)
      if (r.t2) ws.getCell(rNum, 8).value = r.t2;   // Col H (T2)
      if (r.t3) ws.getCell(rNum, 9).value = r.t3;   // Col I (T3)
    } else if (PACE_LANGUAGE_RIGHT_EXCEL_ROW_MAP[subId]) {
      const rNum = PACE_LANGUAGE_RIGHT_EXCEL_ROW_MAP[subId];
      if (r.t1) ws.getCell(rNum, 16).value = r.t1;  // Col P (T1)
      if (r.t2) ws.getCell(rNum, 17).value = r.t2;  // Col Q (T2)
      if (r.t3) ws.getCell(rNum, 18).value = r.t3;  // Col R (T3)
    }
  });

  return wb;
}

export async function exportPaceLanguageToExcel(opts: PaceLanguageExcelExportOptions): Promise<void> {
  const buffer = await fetchPaceLanguageTemplateBuffer();
  const wb = await populatePaceLanguageTemplate(buffer, opts);

  const outBuffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([outBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const studentNameClean = formatLearnerName(opts.student).replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `PACE_Form_Language_${studentNameClean}_${opts.schoolYear}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
