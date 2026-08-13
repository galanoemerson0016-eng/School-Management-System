/**
 * SF9 Excel Export Service
 * Generates DepEd SF9 Learner's Performance Report as a formatted .xlsx file
 * by populating the pre-formatted SF9_Template_G2_G12.xlsm template.
 */

import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import type { Student, SchoolProfile } from '../types';
import { formatLearnerName } from '../utils/student-name';
import { formatGradeForDisplay } from '../lib/grading';
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SF9SubjectItem {
  name: string;
  id?: string;
  isHeader?: boolean;
  isComponent?: boolean;
  isReserved?: boolean;
}

export interface SF9ExcelExportOptions {
  student: Student;
  schoolProfile: SchoolProfile;
  schoolYear: string;
  section: string;
  adviser: string;
  principal: string;
  principalTitle: string;
  grades: Record<string, number[]>;
  subjects: SF9SubjectItem[];
  observedValues: Record<string, string[]>;
  comments: string[];
  attendance: {
    months: string[];
    schoolDays: number[];
    daysPresent: number[];
    daysAbsent: number[];
  };
  gradeLevel: string;
  subjectTerm?: (subjectName: string, subjectId?: string) => 1 | 2 | 3 | 'all' | 'none' | undefined;
  pageSize?: 'A4' | 'LETTER';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shared font definitions for consistent Bookman Old Style rendering across the table.
 *  `family: 1` (Roman / Serif) ensures Excel resolves Bookman Old Style cleanly. */
const FONT_SUBJECT_PARENT: Partial<ExcelJS.Font> = { name: 'Bookman Old Style', size: 12, bold: false, italic: true, family: 1 };
const FONT_SUBJECT_COMP: Partial<ExcelJS.Font> = { name: 'Bookman Old Style', size: 11, bold: false, italic: true, family: 1 };
const FONT_GRADE_VAL: Partial<ExcelJS.Font> = { name: 'Bookman Old Style', size: 12, bold: true, italic: false, family: 1 };
const FONT_REMARKS_VAL: Partial<ExcelJS.Font> = { name: 'Bookman Old Style', size: 12, bold: false, italic: false, family: 1 };

function getSubjectAverage(grades: number[]): number | null {
  if (!grades || grades.length === 0) return null;
  const valid = grades.filter(g => typeof g === 'number' && !isNaN(g) && g > 0);
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / valid.length);
}

function getFinalRemarks(average: number | null): string {
  if (average === null) return '';
  return average >= 75 ? 'Passed' : 'Failed';
}

/** Convert a grade display value to a number for the Excel cell.
 *  Writing numeric values (not strings) ensures Excel applies uniform
 *  cell formatting and font sizing across the grade columns. */
function gradeAsNumber(displayVal: string): number | string {
  if (!displayVal) return '';
  const n = Number(displayVal);
  return isNaN(n) ? displayVal : n;
}

// ---------------------------------------------------------------------------
// Core Template Mapping
// ---------------------------------------------------------------------------

async function fetchTemplateBuffer(): Promise<ArrayBuffer> {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const response = await fetch(`${baseUrl}templates/SF9_Template_G2_G12.xlsx?t=${new Date().getTime()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch template: ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

async function populateTemplate(buffer: ArrayBuffer, opts: SF9ExcelExportOptions): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('Worksheet not found in template');

  const {
    student,
    schoolProfile,
    schoolYear,
    section,
    gradeLevel,
    subjects,
    grades,
    attendance,
    adviser,
    principal,
    principalTitle
  } = opts;

  // -- School Header Information --
  ws.getCell('D4').value = schoolProfile?.region || 'Region';
  
  const rawDivision = schoolProfile?.division || '';
  const cleanDivision = rawDivision.replace(/schools division office of/i, '').replace(/schools division of/i, '').trim().toUpperCase();
  ws.getCell('D5').value = `SCHOOLS DIVISION OFFICE OF ${cleanDivision || '_________________'}`;
  
  ws.getCell('D6').value = schoolProfile?.district || 'District';
  
  const muniCity = schoolProfile?.municipality || schoolProfile?.city || '';
  const prov = schoolProfile?.province || '';
  let locationText = muniCity || prov || 'Municipality/City, Province';
  if (muniCity && prov) {
      locationText = `${muniCity}, ${prov}`;
  }
  ws.getCell('D7').value = locationText;
  
  ws.getCell('D9').value = schoolProfile?.name || 'School Name';

  // -- Student Information --
  ws.getCell('D12').value = `School Year: ${schoolYear}`;
  
  // Do NOT overwrite label cells D14, N14, R14, D15, N15, R15, D16!
  // Write values into the dedicated value cells:
  ws.getCell('E14').value = formatLearnerName(student);
  
  const age = student.birthday ? Math.floor((new Date().getTime() - new Date(student.birthday).getTime()) / 31557600000) : '';
  ws.getCell('O14').value = age;
  const g = String(student.gender || '');
  const sexStr = (g === 'Male' || g === 'M') ? 'Male' : (g === 'Female' || g === 'F') ? 'Female' : g;
  ws.getCell('S14').value = sexStr;
  
  const gradeNumStr = gradeLevel.replace(/\D/g, '') || gradeLevel;
  ws.getCell('E15').value = student.lrn || '';
  ws.getCell('O15').value = gradeNumStr;
  ws.getCell('S15').value = section;
  
  const gradeNum = parseInt(gradeLevel.replace(/\D/g, '') || '0');
  const isSHS = gradeNum === 11 || gradeNum === 12;
  if (isSHS) {
      const STRAND_MAPPING: Record<string, string> = {
          'STEM': 'Science, Technology, Engineering, and Mathematics',
          'ABM': 'Accountancy, Business, and Management',
          'HUMSS': 'Humanities and Social Sciences',
          'GAS': 'General Academic Strand',
          'ICT': 'Information and Communications Technology'
      };
      const strandDisplay = student.strand ? (STRAND_MAPPING[student.strand] || student.strand).toUpperCase() : '';
      const trackDisplay = student.track ? student.track.toUpperCase() : '';
      ws.getCell('F16').value = `${trackDisplay}${strandDisplay ? ' - ' + strandDisplay : ''}`;
  }

  // -- Attendance Totals --
  // The template has months starting at col X (24). Since attendance months can vary, we map dynamically.
  const startColIdx = 24; // Col X
  attendance.months.forEach((month, idx) => {
      if (startColIdx + idx <= 34) { // Don't overflow the attendance table
        // Header (Row 4)
        const headerCell = ws.getCell(4, startColIdx + idx);
        if (headerCell) headerCell.value = month.substring(0, 3);
        
        // Days of School (Row 5 - merged with 6)
        const daysCell = ws.getCell(5, startColIdx + idx);
        if (daysCell) daysCell.value = attendance.schoolDays[idx] || 0;
        
        // Days Present (Row 7 - merged with 8)
        const presentCell = ws.getCell(7, startColIdx + idx);
        if (presentCell) presentCell.value = attendance.daysPresent[idx] || 0;
        
        // Days Absent (Row 9 - merged with 10)
        const absentCell = ws.getCell(9, startColIdx + idx);
        if (absentCell) absentCell.value = attendance.daysAbsent[idx] || 0;
      }
  });

  // Calculate and set Totals for Attendance
  // Note: computeStudentAttendance already appends the 'TOTAL' value as the last element of these arrays
  const totalDays = attendance.schoolDays.length > 0 ? attendance.schoolDays[attendance.schoolDays.length - 1] : 0;
  const totalPresent = attendance.daysPresent.length > 0 ? attendance.daysPresent[attendance.daysPresent.length - 1] : 0;
  const totalAbsent = attendance.daysAbsent.length > 0 ? attendance.daysAbsent[attendance.daysAbsent.length - 1] : 0;
  
  // Col 35 (AI) is the Total column
  ws.getCell(5, 35).value = totalDays || 0;
  ws.getCell(7, 35).value = totalPresent || 0;
  ws.getCell(9, 35).value = totalAbsent || 0;

  // -- Grades --
  let subjectRow = 28; // Starts at Row 28 (Row 26 & 27 are template headers)
  
  const categoryHeaderNames = [
    'Core Subjects',
    'Electives',
    'Elective Subjects',
    'Applied Subjects',
    'Specialized Subjects',
    'Contextualized Subjects'
  ];

  // Keep non-reserved subjects and category headers
  const displaySubjects = subjects.filter(s => !s.isReserved);

  // Pre-process MAPEH grades from components if MAPEH has no direct grades
  const mapehSubj = displaySubjects.find(s => s.name === 'MAPEH');
  if (mapehSubj) {
    const components = displaySubjects.filter(s => s.isComponent);
    if (components.length > 0) {
      const compGradesList = components.map(c => grades[c.name] || grades[c.id || ''] || []);
      const calculatedMapeh: number[] = [];
      for (let q = 0; q < 4; q++) {
        const validQ = compGradesList.map(g => g[q]).filter(val => typeof val === 'number' && val > 0);
        if (validQ.length > 0) {
          calculatedMapeh[q] = Math.round(validQ.reduce((sum, val) => sum + val, 0) / validQ.length);
        }
      }
      const existingMapeh = grades['MAPEH'] || grades[mapehSubj.id || ''] || [];
      if (!existingMapeh.some(g => g > 0) && calculatedMapeh.some(g => g > 0)) {
        grades['MAPEH'] = calculatedMapeh;
      }
    }
  }
  
  let totalAverageSum = 0;
  let validSubjectCount = 0;

  const HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD9D9D9' }
  };

  const NO_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'none'
  };

  displaySubjects.forEach((subject) => {
    if (subjectRow <= 41) { // Maximum 14 rows for subjects in this static template (Rows 28 to 41)
      const normName = subject.name.toLowerCase().trim();
      const isCategoryHeader = !!((subject.isHeader && subject.name !== 'MAPEH') || categoryHeaderNames.some(ch => ch.toLowerCase() === normName));

      if (isCategoryHeader) {
        // Format Category Header Row (e.g. CORE SUBJECTS, ELECTIVE SUBJECTS)
        for (let col = 4; col <= 19; col++) {
          const cell = ws.getCell(subjectRow, col);
          cell.font = { name: 'Bookman Old Style', size: 11, bold: true, italic: false, family: 1 };
          cell.fill = HEADER_FILL;
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          if (col === 4) {
            cell.value = subject.name.toUpperCase();
          }
        }
      } else {
        // Ensure regular subject cells have white background (no fill)
        for (let col = 4; col <= 19; col++) {
          const cell = ws.getCell(subjectRow, col);
          cell.fill = NO_FILL;
        }

        const isMapehSubComponent = ['music and arts', 'physical education and health', 'pe and health', 'music & arts', 'music & art', 'music and art', 'pe & health', 'physical education & health'].includes(normName);
        const isComp = !!(subject.isComponent || isMapehSubComponent);
        
        const displayName = isComp ? `   ${subject.name}` : subject.name;
        let targetFont = isComp ? FONT_SUBJECT_COMP : FONT_SUBJECT_PARENT;

        // Auto-scale font size for long subject titles so they fit perfectly without clipping
        if (displayName.length > 30) {
          targetFont = { ...targetFont, size: 9.5 };
        } else if (displayName.length > 22) {
          targetFont = { ...targetFont, size: 10.5 };
        }

        // Apply font & alignment to all merged cells in D..J (cols 4..10)
        for (let col = 4; col <= 10; col++) {
          const cell = ws.getCell(subjectRow, col);
          cell.font = targetFont;
          cell.alignment = { vertical: 'middle', horizontal: 'left', shrinkToFit: true };
          if (col === 4) cell.value = displayName;
        }

        const subjGrades = grades[subject.name] || grades[subject.id || ''] || [];
        const q1 = subjGrades[0];
        const q2 = subjGrades[1];
        const q3 = subjGrades[2];
        const q4 = subjGrades[3];
        
        const setGradeMergedCells = (startCol: number, endCol: number, gradeVal: number | string | null | undefined) => {
          if (gradeVal !== undefined && gradeVal !== null && gradeVal !== '' && Number(gradeVal) > 0) {
            const formatted = formatGradeForDisplay(gradeVal, gradeLevel, schoolYear);
            const num = gradeAsNumber(formatted);
            for (let col = startCol; col <= endCol; col++) {
              const cell = ws.getCell(subjectRow, col);
              cell.font = FONT_GRADE_VAL;
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
              if (col === startCol) {
                cell.value = num;
                if (typeof num === 'number') {
                  cell.numFmt = '0';
                }
              }
            }
          }
        };

        setGradeMergedCells(11, 12, q1); // K..L (Term 1)
        setGradeMergedCells(13, 14, q2); // M..N (Term 2)
        setGradeMergedCells(15, 16, q3); // O..P (Term 3)
        
        // Calculate average
        const avg = getSubjectAverage([q1, q2, q3, q4]);
        if (avg !== null) {
            setGradeMergedCells(17, 18, avg); // Q..R (Final Grade)

            const sCell = ws.getCell(`S${subjectRow}`);
            sCell.value = getFinalRemarks(avg);
            sCell.font = FONT_REMARKS_VAL;
            sCell.alignment = { vertical: 'middle', horizontal: 'center' };

            // Only count parent subjects towards General Average (avoid double-counting MAPEH components)
            if (!isComp) {
              totalAverageSum += avg;
              validSubjectCount++;
            }
        }
      }
      subjectRow++;
    }
  });

  // General Average
  if (validSubjectCount > 0) {
      const generalAvg = Math.round(totalAverageSum / validSubjectCount);
      
      let genAvgRemarks = generalAvg >= 75 ? 'Promoted' : 'Retained';
      if (generalAvg >= 90) {
          genAvgRemarks += '\nwith Academic\nExcellence Award';
      }
      
      // Clone base style objects to break in-memory reference sharing between Q42 and S42
      const q42Style = JSON.parse(JSON.stringify(ws.getCell('Q42').style || {}));
      q42Style.font = { name: 'Bookman Old Style', size: 12, bold: true, italic: false, family: 1 };
      q42Style.alignment = { vertical: 'middle', horizontal: 'center' };

      const s42Style = JSON.parse(JSON.stringify(ws.getCell('S42').style || {}));
      s42Style.font = { name: 'Bookman Old Style', size: genAvgRemarks.includes('Academic') ? 9 : 12, bold: true, italic: false, family: 1 };
      s42Style.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };

      // Apply isolated style to Q42:R43 General Average score (Size 12 Bold)
      for (let r = 42; r <= 43; r++) {
        for (let c = 17; c <= 18; c++) {
          const cell = ws.getCell(r, c);
          cell.style = JSON.parse(JSON.stringify(q42Style));
          if (r === 42 && c === 17) {
            cell.value = generalAvg;
            cell.numFmt = '0';
          }
        }
      }

      // Apply isolated style to S42:S43 remarks (Size 9 Bold for multi-line)
      for (let r = 42; r <= 43; r++) {
        const sCell = ws.getCell(r, 19);
        sCell.style = JSON.parse(JSON.stringify(s42Style));
        if (r === 42) {
          sCell.value = genAvgRemarks;
        }
      }
  }

  // Rename the worksheet to the student's name
  let sheetName = formatLearnerName(student).toUpperCase();
  if (sheetName.length > 31) sheetName = sheetName.substring(0, 31);
  ws.name = sheetName;

  // -- Signatures --
  if (principal) {
      ws.getCell('W42').value = principal.toUpperCase();
      ws.getCell('W50').value = principal.toUpperCase();
  }
  if (principalTitle) {
      ws.getCell('W43').value = principalTitle.toUpperCase();
      ws.getCell('W51').value = principalTitle.toUpperCase();
  }
  if (adviser) {
      ws.getCell('AC42').value = adviser.toUpperCase();
  }

  // Clear defined names (named ranges) from the template to prevent Excel corruption errors
  // since these ranges often point to external references or old sheet names.
  if (wb.definedNames) {
      wb.definedNames.model = [];
  }

  return wb;
}

/**
 * Post-process the xlsx buffer to fix font entries that ExcelJS generates
 * without the 'family' attribute. Without family="1", Excel may not properly
 * resolve Bookman Old Style and falls back to default font sizing.
 */
async function postProcessXlsxFonts(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(buffer);
  const stylesFile = zip.file('xl/styles.xml');
  if (!stylesFile) return buffer;

  let stylesXml = await stylesFile.async('string');

  // Fix any Bookman Old Style font entry missing family val="1"
  // Pattern: <font>...<name val="Bookman Old Style"/>...</font> without <family
  stylesXml = stylesXml.replace(
    /<font>((?:(?!<family)[\s\S])*?<name val="Bookman Old Style"\/>[\s\S]*?)<\/font>/g,
    (match, inner) => {
      if (!inner.includes('<family')) {
        // Insert family val="1" before the name element
        return match.replace(
          '<name val="Bookman Old Style"/>',
          '<family val="1"/><name val="Bookman Old Style"/>'
        );
      }
      return match;
    }
  );

  zip.file('xl/styles.xml', stylesXml);
  const newBuf = await zip.generateAsync({ type: 'arraybuffer' });
  return newBuf;
}

/**
 * Export a single student's SF9 to Excel
 */
export async function exportSF9ToExcel(opts: SF9ExcelExportOptions): Promise<void> {
  const buffer = await fetchTemplateBuffer();
  const wb = await populateTemplate(buffer, opts);
  
  let outBuffer = await wb.xlsx.writeBuffer();
  
  // Post-process to fix font family attributes
  outBuffer = await postProcessXlsxFonts(outBuffer as ArrayBuffer);
  
  const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const safeName = formatLearnerName(opts.student).replace(/[^a-z0-9]/gi, '_');
  a.download = `SF9_${safeName}_${opts.schoolYear}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export multiple students' SF9 to a zip of Excel files.
 */
export async function exportSF9BatchToExcel(
  studentOptions: SF9ExcelExportOptions[],
  sectionName: string,
  schoolYear: string,
  onProgress?: (pct: number) => void,
): Promise<void> {
  
  if (studentOptions.length === 0) return;
  
  const templateBuffer = await fetchTemplateBuffer();
  const zip = new JSZip();
  const total = studentOptions.length;
  
  for (let i = 0; i < total; i++) {
    const opts = studentOptions[i];
    const wb = await populateTemplate(templateBuffer, opts);
    let outBuffer = await wb.xlsx.writeBuffer();
    outBuffer = await postProcessXlsxFonts(outBuffer as ArrayBuffer);
    
    const fileName = formatLearnerName(opts.student).replace(/[^a-z0-9-_]/gi, '_');
    zip.file(`SF9_${fileName}_${schoolYear}.xlsx`, outBuffer);
    
    if (onProgress) onProgress(Math.round(((i + 1) / total) * 95));
    // Yield to keep UI responsive
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  const zipContent = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipContent);

  const a = document.createElement('a');
  a.href = url;
  a.download = `SF9_BATCH_${sectionName.replace(/\s+/g, '_')}_${schoolYear}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (onProgress) onProgress(100);
}
