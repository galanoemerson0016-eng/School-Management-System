/**
 * Native PACE Form Excel Export Service (Grade 1 Only)
 * Populates DepEd PACE FORM - Reading and Literacy.xlsx while preserving all 92 merged ranges,
 * column widths, row heights, borders, and styles.
 */

import ExcelJS from 'exceljs';
import type { Student, SchoolProfile } from '../types';
import type { PaceFormData } from '../types/pace';
import { formatLearnerName } from '../utils/student-name';

export interface PaceExcelExportOptions {
  student: Student;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section: string;
  adviser: string;
  principal: string;
  principalTitle: string;
  paceData: PaceFormData;
}

export async function fetchPaceTemplateBuffer(): Promise<ArrayBuffer> {
  const cleanBase = (import.meta.env.BASE_URL || '/').endsWith('/') 
    ? (import.meta.env.BASE_URL || '/') 
    : `${import.meta.env.BASE_URL}/`;
  const timestamp = Date.now();
  
  const candidateUrls = [
    `${cleanBase}templates/PACE%20FORM%20-%20Reading%20and%20Literacy.xlsx?t=${timestamp}`,
    `/templates/PACE%20FORM%20-%20Reading%20and%20Literacy.xlsx?t=${timestamp}`,
    `templates/PACE%20FORM%20-%20Reading%20and%20Literacy.xlsx?t=${timestamp}`,
    `${cleanBase}templates/PACE_FORM.xlsx?t=${timestamp}`,
    `/templates/PACE_FORM.xlsx?t=${timestamp}`
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

  throw new Error('Failed to fetch valid PACE template (Reading and Literacy).');
}

/**
 * Authoritative Sub-Row to Excel Row Mapping (Extracted directly from Template Specification)
 */
const PACE_LEFT_EXCEL_ROW_MAP: Record<string, number> = {
  '1_listening': 19, '1_reading': 20,
  '2_listening': 21, '2_reading': 22,
  '3_listening': 23, '3_reading': 24,
  '4_listening': 25, '4_reading': 26,
  '5_listening': 27, '5_reading': 28,

  '6_listening': 30, '6_reading': 31, '6_speaking': 32,
  '7_listening': 33, '7_reading': 34, '7_speaking': 35,
  '8_listening': 36, '8_reading': 37, '8_speaking': 38,
  '9_listening': 39, '9_reading': 40, '9_speaking': 41,
  '10_listening': 42, '10_reading': 43, '10_speaking': 44,

  '11_listening': 46, '11_reading': 47, '11_speaking': 48,
  '12_main': 49,
  '12a_listening': 51, '12a_reading': 52, '12a_speaking': 53, '12a_writing': 54,
  '12b_listening': 55, '12b_reading': 56, '12b_speaking': 57, '12b_writing': 58,
  '13_listening': 59, '13_reading': 60, '13_speaking': 61,
  '14_listening': 62, '14_reading': 63, '14_speaking': 64,
  '15_listening': 65, '15_reading': 66, '15_speaking': 67, '15_writing': 68,

  '16_listening': 70, '16_reading': 71, '16_speaking': 72,
  '17_listening': 73, '17_reading': 74, '17_speaking': 75,
  '18_listening': 76, '18_reading': 77, '18_speaking': 78
};

const PACE_RIGHT_EXCEL_ROW_MAP: Record<string, number> = {
  '19_listening': 19, '19_reading': 20, '19_speaking': 21,

  '20_main': 22,
  '20a_listening': 23, '20a_reading': 24, '20a_speaking': 25,
  '20b_listening': 26, '20b_reading': 27, '20b_speaking': 28,
  '20c_listening': 29, '20c_reading': 30, '20c_speaking': 31,
  '20d_listening': 32, '20d_reading': 33, '20d_speaking': 34,
  '20e_listening': 35, '20e_reading': 36, '20e_speaking': 37,
  '20f_listening': 38, '20f_reading': 39, '20f_speaking': 40,
  '20g_listening': 41, '20g_reading': 42, '20g_speaking': 43,

  '21_main': 44,
  '21a_listening': 45, '21a_reading': 46, '21a_speaking': 47,
  '21b_listening': 48, '21b_reading': 49, '21b_speaking': 50,

  '22_main': 52,
  '22a_reading': 53, '22a_writing': 54,
  '22b_reading': 55, '22b_writing': 56,
  '22c_reading': 57, '22c_writing': 58,

  '23_reading': 59, '23_writing': 60,

  '24_main': 61,
  '24a_reading': 62, '24a_writing': 63,
  '24b_reading': 64, '24b_writing': 65,
  '24c_reading': 66, '24c_writing': 67,

  '25_reading': 68,
  '25_writing': 69
};

export async function populatePaceTemplate(
  buffer: ArrayBuffer,
  opts: PaceExcelExportOptions
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const ws = wb.getWorksheet('SF9_F2') || wb.worksheets[0];
  if (!ws) throw new Error('Worksheet SF9_F2 not found in PACE template');

  // Fix 1: Clear external formula links in row 1 to prevent Excel recovery repair errors
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

  // Fix 2: Populate Header Information in exact corresponding template cells
  // C5: LRN
  const lrnCell = ws.getCell('C5');
  if (lrnCell) lrnCell.value = student.lrn || '';

  // G5: Learner Name
  const nameCell = ws.getCell('G5');
  if (nameCell) nameCell.value = fullName.toUpperCase();

  // P5: Section
  const secCell = ws.getCell('P5');
  if (secCell) secCell.value = `${section || ''}`.toUpperCase();

  // Fix 3: Populate Ratings (T1, T2, T3) using sub-row string IDs
  const ratings = paceData.ratings || {};

  Object.entries(ratings).forEach(([subId, r]) => {
    if (!r) return;

    if (PACE_LEFT_EXCEL_ROW_MAP[subId]) {
      const rNum = PACE_LEFT_EXCEL_ROW_MAP[subId];
      if (r.t1) ws.getCell(rNum, 7).value = r.t1;   // Col G (T1)
      if (r.t2) ws.getCell(rNum, 8).value = r.t2;   // Col H (T2)
      if (r.t3) ws.getCell(rNum, 9).value = r.t3;   // Col I (T3)
    } else if (PACE_RIGHT_EXCEL_ROW_MAP[subId]) {
      const rNum = PACE_RIGHT_EXCEL_ROW_MAP[subId];
      if (r.t1) ws.getCell(rNum, 16).value = r.t1;  // Col P (T1)
      if (r.t2) ws.getCell(rNum, 17).value = r.t2;  // Col Q (T2)
      if (r.t3) ws.getCell(rNum, 18).value = r.t3;  // Col R (T3)
    }
  });

  return wb;
}

export async function exportPaceToExcel(opts: PaceExcelExportOptions): Promise<void> {
  const buffer = await fetchPaceTemplateBuffer();
  const wb = await populatePaceTemplate(buffer, opts);

  const outBuffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([outBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const studentNameClean = formatLearnerName(opts.student).replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `PACE_Form_${studentNameClean}_${opts.schoolYear}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
