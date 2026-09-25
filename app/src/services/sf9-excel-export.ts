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
import { getShsSubjectUnitInfo } from '../lib/curriculum';
import { calculateQuarterlyFinalGrade, calculateWeightedGradeAverage } from './grade-calculation';
import type { PaceRatingDescriptor } from '../types/pace';
import { isGrade1, fetchGrade1TemplateBuffer, populateGrade1TemplateBuffer, type SF9Grade1Remarks } from './sf9-g1-excel-export';
import { isGrade2, fetchGrade2TemplateBuffer, populateGrade2TemplateBuffer } from './sf9-g2-excel-export';
import { isGrade3, fetchGrade3TemplateBuffer, populateGrade3TemplateBuffer } from './sf9-g3-excel-export';
import { isGrade4to10, fetchGrade4to10TemplateBuffer, populateGrade4to10TemplateBuffer, exportSF9Grade4to10SectionMasterToExcel } from './sf9-g4-10-excel-export';
import { isGrade11Academic, fetchGrade11AcademicTemplateBuffer, populateGrade11AcademicTemplateBuffer, exportSF9Grade11AcademicSectionMasterToExcel } from './sf9-g11-academic-excel-export';
import { isGrade11TechPro, fetchGrade11TechProTemplateBuffer, populateGrade11TechProTemplateBuffer, exportSF9Grade11TechProSectionMasterToExcel } from './sf9-g11-techpro-excel-export';
import { isGrade12AcademicCross, fetchGrade12AcademicCrossTemplateBuffer, populateGrade12AcademicCrossTemplateBuffer, exportSF9Grade12AcademicCrossSectionMasterToExcel } from './sf9-g12-academic-cross-excel-export';
import { isGrade12TechPro, fetchGrade12TechProTemplateBuffer, populateGrade12TechProTemplateBuffer, exportSF9Grade12TechProSectionMasterToExcel } from './sf9-g12-techpro-excel-export';
import { isGrade12TechProWithCross, fetchGrade12TechProCrossTemplateBuffer, populateGrade12TechProCrossTemplateBuffer, exportSF9Grade12TechProCrossSectionMasterToExcel } from './sf9-g12-techpro-cross-excel-export';
import {
  isSpecialCurricularProgram,
  fetchSCPTemplateBuffer,
  populateSCPTemplateBuffer,
  exportSF9SCPSectionMasterToExcel
} from './sf9-scp-excel-export';
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
  track?: string;
  program?: string;
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
  g1Remarks?: SF9Grade1Remarks;
  paceRatings?: {
    reading?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
    language?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
    math?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
    gmrcMakabansa?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
  };
  sectionStudents?: Student[];
  getStudentRemarks?: (lrn?: string, studentId?: string) => SF9Grade1Remarks | undefined;
  getStudentPaceRatings?: (lrn?: string, studentId?: string) => {
    reading?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
    language?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
    math?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
    gmrcMakabansa?: Record<string, { t1?: PaceRatingDescriptor; t2?: PaceRatingDescriptor; t3?: PaceRatingDescriptor }>;
  } | undefined;
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
  const result = calculateQuarterlyFinalGrade(grades, grades.map((_, index) => index + 1));
  return result.status === 'missing' ? null : result.value;
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
  const cleanBase = (import.meta.env.BASE_URL || '/').endsWith('/') 
    ? (import.meta.env.BASE_URL || '/') 
    : `${import.meta.env.BASE_URL}/`;
  const timestamp = Date.now();
  
  const candidateUrls = [
    `${cleanBase}templates/SF9_Template_G2_G12.xlsx?t=${timestamp}`,
    `/templates/SF9_Template_G2_G12.xlsx?t=${timestamp}`,
    `templates/SF9_Template_G2_G12.xlsx?t=${timestamp}`,
    `${cleanBase}templates/SF9_Template_G2_G12.xlsm?t=${timestamp}`,
    `/templates/SF9_Template_G2_G12.xlsm?t=${timestamp}`,
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        // Validate PK\x03\x04 magic header
        if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
          return buffer;
        }
      }
    } catch {
      // Try next candidate
    }
  }

  throw new Error('Failed to load official SF9 Excel template (G2-G12). File not found or corrupted.');
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
  ws.getCell('D5').value = `${cleanDivision || '_________________'}`;
  
  ws.getCell('D6').value = schoolProfile?.district || 'District';
  
  const muniCity = (schoolProfile?.municipality || schoolProfile?.city || '').trim().toUpperCase();
  const prov = (schoolProfile?.province || '').trim().toUpperCase();
  let locationText = muniCity || prov || 'MUNICIPALITY/CITY, PROVINCE';
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
  ws.getCell('S15').value = (section || '').toUpperCase();
  
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
  const cTotDays = ws.getCell(5, 35);
  delete (cTotDays as unknown as { formula?: string }).formula;
  if (cTotDays.model) delete cTotDays.model.formula;
  cTotDays.value = totalDays || 0;

  const cTotPres = ws.getCell(7, 35);
  delete (cTotPres as unknown as { formula?: string }).formula;
  if (cTotPres.model) delete cTotPres.model.formula;
  cTotPres.value = totalPresent || 0;

  const cTotAbs = ws.getCell(9, 35);
  delete (cTotAbs as unknown as { formula?: string }).formula;
  if (cTotAbs.model) delete cTotAbs.model.formula;
  cTotAbs.value = totalAbsent || 0;

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
  
  const generalAverageEntries: Array<{ grade: number; weight: number }> = [];

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
              if (isSHS) {
                const unitInfo = getShsSubjectUnitInfo(subject.name, gradeLevel);
                const yearUnits = unitInfo.yearUnits;
                generalAverageEntries.push({ grade: avg, weight: yearUnits });
              } else {
                generalAverageEntries.push({ grade: avg, weight: 1 });
              }
            }
        }
      }
      subjectRow++;
    }
  });

  // General Average
  const average = calculateWeightedGradeAverage(generalAverageEntries);
  if (average !== null) {
      const generalAvg = Math.round(average);
      
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
 * Post-process the xlsx buffer to fix font entries and remove stale calcChain XML
 * that causes Excel to show "Removed Records: Formula from /xl/worksheets/sheet1.xml part"
 */
async function postProcessXlsxFonts(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  if (!buffer || buffer.byteLength === 0) {
    return buffer;
  }
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    return buffer;
  }
  try {
    const zip = await JSZip.loadAsync(buffer);
    
    // 1. Remove stale calcChain.xml and external links XML to prevent Excel repair warnings
    zip.remove('xl/calcChain.xml');
    zip.remove('xl/externalLinks/externalLink1.xml');
    zip.remove('xl/externalLinks/_rels/externalLink1.xml.rels');

    const wbRel = zip.file('xl/_rels/workbook.xml.rels');
    if (wbRel) {
      let xml = await wbRel.async('string');
      xml = xml.replace(/<Relationship[^>]*Target="externalLinks\/[^"]*"[^>]*\/>/g, '');
      zip.file('xl/_rels/workbook.xml.rels', xml);
    }

    const wbFile = zip.file('xl/workbook.xml');
    if (wbFile) {
      let xml = await wbFile.async('string');
      xml = xml.replace(/<externalLink[^>]*\/>/g, '').replace(/<externalReferences>[\s\S]*?<\/externalReferences>/g, '');
      zip.file('xl/workbook.xml', xml);
    }

    // 3. Fix Bookman Old Style font entries missing family val="1"
    const stylesFile = zip.file('xl/styles.xml');
    if (stylesFile) {
      let stylesXml = await stylesFile.async('string');
      stylesXml = stylesXml.replace(
        /(<font>[\s\S]*?<name val="Bookman Old Style"\/>)(?![\s\S]*?<family val="1"\/>)([\s\S]*?<\/font>)/g,
        '$1<family val="1"/>$2'
      );
      zip.file('xl/styles.xml', stylesXml);
    }

    return await zip.generateAsync({ type: 'arraybuffer' });
  } catch (err) {
    console.warn('postProcessXlsxFonts skipped due to:', err);
    return buffer;
  }
}

/**
 * Export a single student's SF9 to Excel
 */
export async function exportSF9ToExcel(opts: SF9ExcelExportOptions): Promise<void> {
  const isG1 = isGrade1(opts.gradeLevel || opts.student.grade_level);
  const isG2 = isGrade2(opts.gradeLevel || opts.student.grade_level);
  const isG3 = isGrade3(opts.gradeLevel || opts.student.grade_level);
  const isG4to10 = isGrade4to10(opts.gradeLevel || opts.student.grade_level);
  const rawProgram = opts.program || opts.student.program || opts.student.curriculum || opts.section || '';
  const isSCP = isSpecialCurricularProgram(rawProgram) && isG4to10;
  const rawTrack = opts.track || opts.student.track || opts.student.strand || opts.student.student_section || opts.section;
  const isG11Tech = !isSCP && isGrade11TechPro(opts.gradeLevel || opts.student.grade_level, rawTrack);
  const isG11Acad = !isSCP && !isG11Tech && isGrade11Academic(opts.gradeLevel || opts.student.grade_level, rawTrack);
  const isG12TechCross = !isSCP && isGrade12TechProWithCross(opts.gradeLevel || opts.student.grade_level, rawTrack, opts.subjects as Array<{ name?: string; subject_name?: string }>);
  const isG12Tech = !isSCP && !isG12TechCross && isGrade12TechPro(opts.gradeLevel || opts.student.grade_level, rawTrack);
  const isG12Cross = !isSCP && !isG12TechCross && !isG12Tech && isGrade12AcademicCross(opts.gradeLevel || opts.student.grade_level, rawTrack);
  
  let outBuffer: ArrayBuffer;
  if (isG1) {
    const buffer = await fetchGrade1TemplateBuffer();
    outBuffer = await populateGrade1TemplateBuffer(buffer, opts);
  } else if (isG2) {
    const buffer = await fetchGrade2TemplateBuffer();
    outBuffer = await populateGrade2TemplateBuffer(buffer, opts);
  } else if (isG3) {
    const buffer = await fetchGrade3TemplateBuffer();
    outBuffer = await populateGrade3TemplateBuffer(buffer, opts);
  } else if (isSCP) {
    const buffer = await fetchSCPTemplateBuffer(rawProgram, opts.gradeLevel || opts.student.grade_level);
    outBuffer = await populateSCPTemplateBuffer(buffer, {
      ...opts,
      program: rawProgram,
      pageSize: opts.pageSize === 'LETTER' ? 'Letter' : opts.pageSize === 'A4' ? 'A4' : undefined,
      grades: opts.grades as unknown as Parameters<typeof populateSCPTemplateBuffer>[1]['grades'],
      subjects: opts.subjects as unknown as Parameters<typeof populateSCPTemplateBuffer>[1]['subjects'],
      learners: opts.sectionStudents || [opts.student]
    });
  } else if (isG4to10) {
    const buffer = await fetchGrade4to10TemplateBuffer();
    outBuffer = await populateGrade4to10TemplateBuffer(buffer, {
      ...opts,
      grades: opts.grades as unknown as Parameters<typeof populateGrade4to10TemplateBuffer>[1]['grades'],
      subjects: opts.subjects as unknown as Parameters<typeof populateGrade4to10TemplateBuffer>[1]['subjects'],
      learners: opts.sectionStudents || [opts.student]
    });
  } else if (isG11Tech) {
    const buffer = await fetchGrade11TechProTemplateBuffer();
    outBuffer = await populateGrade11TechProTemplateBuffer(buffer, {
      ...opts,
      grades: opts.grades as unknown as Parameters<typeof populateGrade11TechProTemplateBuffer>[1]['grades'],
      subjects: opts.subjects as unknown as Parameters<typeof populateGrade11TechProTemplateBuffer>[1]['subjects'],
      learners: opts.sectionStudents || [opts.student]
    });
  } else if (isG11Acad) {
    const buffer = await fetchGrade11AcademicTemplateBuffer();
    outBuffer = await populateGrade11AcademicTemplateBuffer(buffer, {
      ...opts,
      grades: opts.grades as unknown as Parameters<typeof populateGrade11AcademicTemplateBuffer>[1]['grades'],
      subjects: opts.subjects as unknown as Parameters<typeof populateGrade11AcademicTemplateBuffer>[1]['subjects'],
      learners: opts.sectionStudents || [opts.student]
    });
  } else if (isG12TechCross) {
    const buffer = await fetchGrade12TechProCrossTemplateBuffer();
    outBuffer = await populateGrade12TechProCrossTemplateBuffer(buffer, {
      ...opts,
      grades: opts.grades as unknown as Parameters<typeof populateGrade12TechProCrossTemplateBuffer>[1]['grades'],
      subjects: opts.subjects as unknown as Parameters<typeof populateGrade12TechProCrossTemplateBuffer>[1]['subjects'],
      learners: opts.sectionStudents || [opts.student]
    });
  } else if (isG12Tech) {
    const buffer = await fetchGrade12TechProTemplateBuffer();
    outBuffer = await populateGrade12TechProTemplateBuffer(buffer, {
      ...opts,
      grades: opts.grades as unknown as Parameters<typeof populateGrade12TechProTemplateBuffer>[1]['grades'],
      subjects: opts.subjects as unknown as Parameters<typeof populateGrade12TechProTemplateBuffer>[1]['subjects'],
      learners: opts.sectionStudents || [opts.student]
    });
  } else if (isG12Cross) {
    const buffer = await fetchGrade12AcademicCrossTemplateBuffer();
    outBuffer = await populateGrade12AcademicCrossTemplateBuffer(buffer, {
      ...opts,
      grades: opts.grades as unknown as Parameters<typeof populateGrade12AcademicCrossTemplateBuffer>[1]['grades'],
      subjects: opts.subjects as unknown as Parameters<typeof populateGrade12AcademicCrossTemplateBuffer>[1]['subjects'],
      learners: opts.sectionStudents || [opts.student]
    });
  } else {
    const buffer = await fetchTemplateBuffer();
    const wb = await populateTemplate(buffer, opts);
    const rawBuffer = await wb.xlsx.writeBuffer();
    outBuffer = await postProcessXlsxFonts(rawBuffer as ArrayBuffer);
  }
  
  const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  if (isSCP || isG2 || isG3 || isG4to10 || isG11Acad || isG11Tech || isG12Tech || isG12Cross || isG12TechCross) {
    const safeSection = (opts.section || 'SECTION').replace(/[^a-z0-9]/gi, '_');
    const scpTag = isSCP ? `${(rawProgram || 'SCP').replace(/[^a-z0-9]/gi, '_')}_` : '';
    const safeGrade = (opts.gradeLevel || opts.student.grade_level || (isG12TechCross ? 'Grade_12_TechPro_Cross' : (isG12Tech ? 'Grade_12_TechPro' : (isG12Cross ? 'Grade_12_Academic_Cross' : (isG11Tech ? 'Grade_11_TechPro' : (isG11Acad ? 'Grade_11_Academic' : (isG4to10 ? 'Grade_4' : (isG3 ? 'Grade_3' : 'Grade_2')))))))).replace(/[^a-z0-9]/gi, '_');
    a.download = `SF9_${scpTag}${safeGrade}_${safeSection}_${opts.schoolYear}.xlsx`;
  } else {
    const safeName = formatLearnerName(opts.student).replace(/[^a-z0-9]/gi, '_');
    a.download = `SF9_${safeName}_${opts.schoolYear}.xlsx`;
  }
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export {
  exportSF9Grade4to10SectionMasterToExcel,
  exportSF9Grade11AcademicSectionMasterToExcel,
  exportSF9Grade11TechProSectionMasterToExcel,
  exportSF9Grade12AcademicCrossSectionMasterToExcel,
  exportSF9Grade12TechProSectionMasterToExcel,
  exportSF9Grade12TechProCrossSectionMasterToExcel,
  exportSF9SCPSectionMasterToExcel,
  isSpecialCurricularProgram,
  fetchSCPTemplateBuffer,
  populateSCPTemplateBuffer,
  isGrade11TechPro,
  fetchGrade11TechProTemplateBuffer,
  populateGrade11TechProTemplateBuffer,
  isGrade12AcademicCross,
  fetchGrade12AcademicCrossTemplateBuffer,
  populateGrade12AcademicCrossTemplateBuffer,
  isGrade12TechPro,
  fetchGrade12TechProTemplateBuffer,
  populateGrade12TechProTemplateBuffer,
  isGrade12TechProWithCross,
  fetchGrade12TechProCrossTemplateBuffer,
  populateGrade12TechProCrossTemplateBuffer
};

/**
 * Export the complete Grade 2 Section Master SF9 Workbook containing all learners
 */
export async function exportSF9Grade2SectionMasterToExcel(
  opts: SF9ExcelExportOptions,
  sectionName: string,
  schoolYear: string
): Promise<void> {
  const buffer = await fetchGrade2TemplateBuffer();
  const outBuffer = await populateGrade2TemplateBuffer(buffer, opts);
  
  const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const safeSection = sectionName.replace(/[^a-z0-9]/gi, '_');
  a.download = `SF9_SECTION_MASTER_${safeSection}_${schoolYear}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export the complete Grade 3 Section Master SF9 Workbook containing all learners
 */
export async function exportSF9Grade3SectionMasterToExcel(
  opts: SF9ExcelExportOptions,
  sectionName: string,
  schoolYear: string
): Promise<void> {
  const buffer = await fetchGrade3TemplateBuffer();
  const outBuffer = await populateGrade3TemplateBuffer(buffer, opts);
  
  const blob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const safeSection = sectionName.replace(/[^a-z0-9]/gi, '_');
  a.download = `SF9_SECTION_MASTER_${safeSection}_${schoolYear}.xlsx`;
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
  
  const g1Buffer = await fetchGrade1TemplateBuffer().catch(() => null);
  const g2Buffer = await fetchGrade2TemplateBuffer().catch(() => null);
  const g3Buffer = await fetchGrade3TemplateBuffer().catch(() => null);
  const g410Buffer = await fetchGrade4to10TemplateBuffer().catch(() => null);
  const g11TechBuffer = await fetchGrade11TechProTemplateBuffer().catch(() => null);
  const g11AcadBuffer = await fetchGrade11AcademicTemplateBuffer().catch(() => null);
  const g12CrossBuffer = await fetchGrade12AcademicCrossTemplateBuffer().catch(() => null);
  const g12TechBuffer = await fetchGrade12TechProTemplateBuffer().catch(() => null);
  const g12TechCrossBuffer = await fetchGrade12TechProCrossTemplateBuffer().catch(() => null);
  const legacyBuffer = await fetchTemplateBuffer().catch(() => null);
  const scpBuffers = new Map<string, ArrayBuffer>();
  const zip = new JSZip();
  const total = studentOptions.length;
  
  for (let i = 0; i < total; i++) {
    const opts = studentOptions[i];
    const isThisG1 = isGrade1(opts.gradeLevel || opts.student.grade_level);
    const isThisG2 = isGrade2(opts.gradeLevel || opts.student.grade_level);
    const isThisG3 = isGrade3(opts.gradeLevel || opts.student.grade_level);
    const isThisG4to10 = isGrade4to10(opts.gradeLevel || opts.student.grade_level);
    const rawProgram = opts.program || opts.student.program || opts.student.curriculum || opts.section || '';
    const isThisSCP = isThisG4to10 && isSpecialCurricularProgram(rawProgram);
    const rawTrack = opts.track || opts.student.track || opts.student.strand || opts.student.student_section || opts.section;
    const isThisG11Tech = !isThisSCP && isGrade11TechPro(opts.gradeLevel || opts.student.grade_level, rawTrack);
    const isThisG11Acad = !isThisSCP && !isThisG11Tech && isGrade11Academic(opts.gradeLevel || opts.student.grade_level, rawTrack);
    const isThisG12TechCross = !isThisSCP && isGrade12TechProWithCross(opts.gradeLevel || opts.student.grade_level, rawTrack, opts.subjects as Array<{ name?: string; subject_name?: string }>);
    const isThisG12Tech = !isThisSCP && !isThisG12TechCross && isGrade12TechPro(opts.gradeLevel || opts.student.grade_level, rawTrack);
    const isThisG12Cross = !isThisSCP && !isThisG12TechCross && !isThisG12Tech && isGrade12AcademicCross(opts.gradeLevel || opts.student.grade_level, rawTrack);
    
    let outBuffer: ArrayBuffer;
    if (isThisG1 && g1Buffer) {
      outBuffer = await populateGrade1TemplateBuffer(g1Buffer, opts);
    } else if (isThisG2 && g2Buffer) {
      outBuffer = await populateGrade2TemplateBuffer(g2Buffer, opts);
    } else if (isThisG3 && g3Buffer) {
      outBuffer = await populateGrade3TemplateBuffer(g3Buffer, opts);
    } else if (isThisSCP) {
      const pKey = `${rawProgram}_${opts.gradeLevel || opts.student.grade_level}`;
      let scpBuf = scpBuffers.get(pKey);
      if (!scpBuf) {
        const fetched = await fetchSCPTemplateBuffer(rawProgram, opts.gradeLevel || opts.student.grade_level).catch(() => null);
        if (fetched) {
          scpBuf = fetched;
          scpBuffers.set(pKey, fetched);
        }
      }
      if (scpBuf) {
        outBuffer = await populateSCPTemplateBuffer(scpBuf, {
          ...opts,
          program: rawProgram,
          pageSize: opts.pageSize === 'LETTER' ? 'Letter' : opts.pageSize === 'A4' ? 'A4' : undefined,
          grades: opts.grades as unknown as Parameters<typeof populateSCPTemplateBuffer>[1]['grades'],
          subjects: opts.subjects as unknown as Parameters<typeof populateSCPTemplateBuffer>[1]['subjects'],
          learners: opts.sectionStudents || [opts.student]
        });
      } else if (g410Buffer) {
        outBuffer = await populateGrade4to10TemplateBuffer(g410Buffer, {
          ...opts,
          grades: opts.grades as unknown as Parameters<typeof populateGrade4to10TemplateBuffer>[1]['grades'],
          subjects: opts.subjects as unknown as Parameters<typeof populateGrade4to10TemplateBuffer>[1]['subjects'],
          learners: opts.sectionStudents || [opts.student]
        });
      } else {
        const buf = legacyBuffer || await fetchTemplateBuffer();
        const wb = await populateTemplate(buf, opts);
        const rawBuffer = await wb.xlsx.writeBuffer();
        outBuffer = await postProcessXlsxFonts(rawBuffer as ArrayBuffer);
      }
    } else if (isThisG4to10 && g410Buffer) {
      outBuffer = await populateGrade4to10TemplateBuffer(g410Buffer, {
        ...opts,
        grades: opts.grades as unknown as Parameters<typeof populateGrade4to10TemplateBuffer>[1]['grades'],
        subjects: opts.subjects as unknown as Parameters<typeof populateGrade4to10TemplateBuffer>[1]['subjects'],
        learners: opts.sectionStudents || [opts.student]
      });
    } else if (isThisG11Tech && g11TechBuffer) {
      outBuffer = await populateGrade11TechProTemplateBuffer(g11TechBuffer, {
        ...opts,
        grades: opts.grades as unknown as Parameters<typeof populateGrade11TechProTemplateBuffer>[1]['grades'],
        subjects: opts.subjects as unknown as Parameters<typeof populateGrade11TechProTemplateBuffer>[1]['subjects'],
        learners: opts.sectionStudents || [opts.student]
      });
    } else if (isThisG11Acad && g11AcadBuffer) {
      outBuffer = await populateGrade11AcademicTemplateBuffer(g11AcadBuffer, {
        ...opts,
        grades: opts.grades as unknown as Parameters<typeof populateGrade11AcademicTemplateBuffer>[1]['grades'],
        subjects: opts.subjects as unknown as Parameters<typeof populateGrade11AcademicTemplateBuffer>[1]['subjects'],
        learners: opts.sectionStudents || [opts.student]
      });
    } else if (isThisG12TechCross && g12TechCrossBuffer) {
      outBuffer = await populateGrade12TechProCrossTemplateBuffer(g12TechCrossBuffer, {
        ...opts,
        grades: opts.grades as unknown as Parameters<typeof populateGrade12TechProCrossTemplateBuffer>[1]['grades'],
        subjects: opts.subjects as unknown as Parameters<typeof populateGrade12TechProCrossTemplateBuffer>[1]['subjects'],
        learners: opts.sectionStudents || [opts.student]
      });
    } else if (isThisG12Tech && g12TechBuffer) {
      outBuffer = await populateGrade12TechProTemplateBuffer(g12TechBuffer, {
        ...opts,
        grades: opts.grades as unknown as Parameters<typeof populateGrade12TechProTemplateBuffer>[1]['grades'],
        subjects: opts.subjects as unknown as Parameters<typeof populateGrade12TechProTemplateBuffer>[1]['subjects'],
        learners: opts.sectionStudents || [opts.student]
      });
    } else if (isThisG12Cross && g12CrossBuffer) {
      outBuffer = await populateGrade12AcademicCrossTemplateBuffer(g12CrossBuffer, {
        ...opts,
        grades: opts.grades as unknown as Parameters<typeof populateGrade12AcademicCrossTemplateBuffer>[1]['grades'],
        subjects: opts.subjects as unknown as Parameters<typeof populateGrade12AcademicCrossTemplateBuffer>[1]['subjects'],
        learners: opts.sectionStudents || [opts.student]
      });
    } else {
      const buf = legacyBuffer || await fetchTemplateBuffer();
      const wb = await populateTemplate(buf, opts);
      const rawBuffer = await wb.xlsx.writeBuffer();
      outBuffer = await postProcessXlsxFonts(rawBuffer as ArrayBuffer);
    }
    
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
