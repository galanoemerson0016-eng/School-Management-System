/**
 * Grade 1 SF9 Excel Export Service
 * Populates the dedicated DepEd Grade 1 SF9 template (SF9 Template Grade 1.xlsx)
 * while preserving original formatting, font sizes, borders, and layouts.
 */

import ExcelJS from 'exceljs';
import type { Student, SchoolProfile } from '../types';
import { formatLearnerName } from '../utils/student-name';

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
  g1Remarks?: {
    term1CanDo?: string;
    term1ToImprove?: string;
    term2CanDo?: string;
    term2ToImprove?: string;
    term3CanDo?: string;
    term3ToImprove?: string;
  };
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
 * Fetch the Grade 1 SF9 template buffer
 */
export async function fetchGrade1TemplateBuffer(): Promise<ArrayBuffer> {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const timestamp = new Date().getTime();
  
  let response = await fetch(`${baseUrl}templates/SF9%20Template%20Grade%201.xlsx?t=${timestamp}`);
  if (!response.ok) {
    response = await fetch(`${baseUrl}templates/SF9_Template_Grade_1.xlsx?t=${timestamp}`);
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch Grade 1 SF9 template: ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

/**
 * Populate the Grade 1 SF9 Excel Workbook with student details
 */
export async function populateGrade1Template(
  buffer: ArrayBuffer,
  opts: SF9Grade1ExcelExportOptions
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];

  const { student, schoolProfile, schoolYear, section, gradeLevel = 'Grade 1', adviser, principal, attendance, g1Remarks } = opts;

  // -- 0. Clear legacy formula bindings from template (AG1, AH1) --
  ['AG1', 'AH1'].forEach((cellAddr) => {
    const c = ws.getCell(cellAddr);
    delete (c as unknown as { formula?: string }).formula;
    if (c.model) delete (c.model as { formula?: string }).formula;
    c.value = '';
  });

  // -- 1. Header Information --
  if (schoolProfile) {
    if (schoolProfile.region) ws.getCell('F4').value = schoolProfile.region;
    
    if (schoolProfile.division) {
      const rawDiv = schoolProfile.division;
      const cleanDiv = rawDiv.replace(/schools division office of/i, '').replace(/schools division of/i, '').trim().toUpperCase();
      ws.getCell('F5').value = `SCHOOLS DIVISION OFFICE OF ${cleanDiv}`;
    }
    
    if (schoolProfile.district) ws.getCell('F6').value = schoolProfile.district;
    
    const cityMuni = schoolProfile.municipality || schoolProfile.city || '';
    const prov = schoolProfile.province || '';
    const location = [cityMuni, prov].filter(Boolean).join(', ');
    if (location) ws.getCell('F7').value = location;

    if (schoolProfile.name) ws.getCell('F9').value = schoolProfile.name;
  }
  ws.getCell('F12').value = `School Year: ${schoolYear}`;

  // -- 2. Learner Info (Rows 14-15) --
  ws.getCell('H14').value = student.lrn || '';
  ws.getCell('M14').value = formatLearnerName(student);
  
  const gStr = String(student.gender || '');
  const sexStr = (gStr === 'Male' || gStr === 'M') ? 'Male' : (gStr === 'Female' || gStr === 'F') ? 'Female' : gStr;
  ws.getCell('W14').value = sexStr;

  const gradeNumStr = gradeLevel.replace(/\D/g, '') || '1';
  ws.getCell('H15').value = `${gradeNumStr} - ${section}`;
  ws.getCell('L15').value = adviser ? adviser.toUpperCase() : '';

  const age = student.birthday ? Math.floor((new Date().getTime() - new Date(student.birthday).getTime()) / 31557600000) : '';
  ws.getCell('W15').value = age;

  // -- 3. Attendance Record (Rows 20 to 32) --
  const monthRowMap: Record<string, number[]> = {
    jun: [20], june: [20],
    jul: [21], july: [21],
    aug: [22], august: [22],
    sep: [23, 24], sept: [23, 24], september: [23, 24],
    oct: [25], october: [25],
    nov: [26], november: [26],
    dec: [27], december: [27],
    jan: [28], january: [28],
    feb: [29], february: [29],
    mar: [30], march: [30],
    apr: [31], april: [31],
  };

  const defaultSchoolDaysMap: Record<string, number> = {
    jun: 16, jul: 23, aug: 19, sep: 22, oct: 22, nov: 19, dec: 13, jan: 20, feb: 20, mar: 21, apr: 6
  };

  const effectiveMonths = (attendance && attendance.months && attendance.months.length > 0)
    ? attendance.months
    : ['JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR', 'APR'];

  let totDays = 0;
  let totPres = 0;
  let totAbs = 0;

  effectiveMonths.forEach((m, idx) => {
    const normM = m.toLowerCase().trim();
    const rows = monthRowMap[normM] || monthRowMap[normM.substring(0, 3)];
    if (rows && normM !== 'total') {
      const fallbackDays = defaultSchoolDaysMap[normM.substring(0, 3)] || 0;
      const rawDays = attendance?.schoolDays?.[idx];
      const rawPres = attendance?.daysPresent?.[idx];
      const rawAbs = attendance?.daysAbsent?.[idx];

      const days = (typeof rawDays === 'number' && rawDays > 0) ? rawDays : fallbackDays;
      const pres = (typeof rawPres === 'number' && rawPres >= 0) ? rawPres : days;
      const abs = (typeof rawAbs === 'number' && rawAbs >= 0) ? rawAbs : Math.max(0, days - pres);

      totDays += days;
      totPres += pres;
      totAbs += abs;

      rows.forEach((r) => {
        const cDays = ws.getCell(`R${r}`);
        delete (cDays as unknown as { formula?: string }).formula;
        if (cDays.model) delete cDays.model.formula;
        cDays.value = days;
        cDays.numFmt = '0';
        cDays.alignment = { vertical: 'middle', horizontal: 'center' };

        const cPres = ws.getCell(`U${r}`);
        delete (cPres as unknown as { formula?: string }).formula;
        if (cPres.model) delete cPres.model.formula;
        cPres.value = pres;
        cPres.numFmt = '0';
        cPres.alignment = { vertical: 'middle', horizontal: 'center' };

        const cAbs = ws.getCell(`W${r}`);
        delete (cAbs as unknown as { formula?: string }).formula;
        if (cAbs.model) delete cAbs.model.formula;
        cAbs.value = abs;
        cAbs.numFmt = '0';
        cAbs.alignment = { vertical: 'middle', horizontal: 'center' };
      });
    }
  });

  // Write Attendance Totals to Row 32
  const cTotDays = ws.getCell('R32');
  delete (cTotDays as unknown as { formula?: string }).formula;
  if (cTotDays.model) delete cTotDays.model.formula;
  cTotDays.value = totDays;
  cTotDays.numFmt = '0';
  cTotDays.alignment = { vertical: 'middle', horizontal: 'center' };

  const cTotPres = ws.getCell('U32');
  delete (cTotPres as unknown as { formula?: string }).formula;
  if (cTotPres.model) delete cTotPres.model.formula;
  cTotPres.value = totPres;
  cTotPres.numFmt = '0';
  cTotPres.alignment = { vertical: 'middle', horizontal: 'center' };

  const cTotAbs = ws.getCell('W32');
  delete (cTotAbs as unknown as { formula?: string }).formula;
  if (cTotAbs.model) delete cTotAbs.model.formula;
  cTotAbs.value = totAbs;
  cTotAbs.numFmt = '0';
  cTotAbs.alignment = { vertical: 'middle', horizontal: 'center' };

  // -- 3b. Grade 1 Learner Progress Remarks --
  if (g1Remarks) {
    if (g1Remarks.term1CanDo) ws.getCell('H29').value = g1Remarks.term1CanDo;
    if (g1Remarks.term1ToImprove) ws.getCell('H35').value = g1Remarks.term1ToImprove;
    if (g1Remarks.term2CanDo) ws.getCell('H46').value = g1Remarks.term2CanDo;
    if (g1Remarks.term2ToImprove) ws.getCell('H52').value = g1Remarks.term2ToImprove;
    if (g1Remarks.term3CanDo) ws.getCell('H63').value = g1Remarks.term3CanDo;
    if (g1Remarks.term3ToImprove) ws.getCell('H70').value = g1Remarks.term3ToImprove;
  }

  // -- 4. Signatures & Transfer Section --
  if (adviser) {
    const c = ws.getCell('P67');
    c.value = adviser.toUpperCase();
    c.font = { name: 'Bookman Old Style', size: 10, bold: true, italic: true, family: 1 };
    c.alignment = { vertical: 'bottom', horizontal: 'center' };
  }
  if (principal) {
    const c1 = ws.getCell('P70');
    c1.value = principal.toUpperCase();
    c1.font = { name: 'Bookman Old Style', size: 10, bold: true, italic: true, family: 1 };
    c1.alignment = { vertical: 'bottom', horizontal: 'center' };

    const c2 = ws.getCell('P78');
    c2.value = principal.toUpperCase();
    c2.font = { name: 'Bookman Old Style', size: 10, bold: true, italic: true, family: 1 };
    c2.alignment = { vertical: 'bottom', horizontal: 'center' };
  }

  // -- 5. Remove extra competency evaluation worksheets (only export the main Grade 1 SF9 sheet) --
  while (wb.worksheets.length > 1) {
    wb.removeWorksheet(wb.worksheets[1].id);
  }

  // Rename worksheet
  let sheetName = formatLearnerName(student).toUpperCase();
  if (sheetName.length > 31) sheetName = sheetName.substring(0, 31);
  ws.name = sheetName;

  // Clear defined names (named ranges)
  if (wb.definedNames) {
    wb.definedNames.model = [];
  }

  return wb;
}
