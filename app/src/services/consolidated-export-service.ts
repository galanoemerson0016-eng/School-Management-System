/**
 * FormEase Pro — Consolidated Grades Export Service
 * 
 * Provides headless, on-demand generation of Consolidated Master Grading Sheets in both
 * Excel (.xlsx) and PDF formats for any section or in batch across all sections.
 */

import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import type { Student, Section, Subject, ClassRecord, SchoolProfile } from '../types';
import { formatLearnerName } from '../utils/student-name';

export interface ConsolidatedExportParams {
  section: Section;
  students: Student[];
  subjects: Subject[];
  classRecords: ClassRecord[];
  schoolYear: string;
  schoolProfile?: SchoolProfile;
  term?: 'all' | 1 | 2 | 3 | 4;
}

interface StudentGradeSummary {
  student: Student;
  grades: Record<string, number | null>; // subjectId -> final grade
  generalAverage: number | null;
  actionTaken: string;
}

interface FlexibleStudent extends Partial<Student> {
  lastName?: string;
  firstName?: string;
  middleName?: string;
  nameExtension?: string;
  sectionId?: string;
  studentId?: string;
  id?: string;
}

interface GradeEntry {
  quarterlyGrade?: number;
  finalGrade?: number;
  quarterly_grade?: number;
  final_grade?: number;
}

interface FlexibleClassRecord extends Partial<ClassRecord> {
  schoolYear?: string;
  studentLrn?: string;
  subjectId?: string;
  quarterlyGrade?: number;
  finalGrade?: number;
  student_id?: string;
  studentId?: string;
  initialGrade?: number;
  initial_grade?: number;
  quarterly_grade?: number;
  grades?: Record<string, GradeEntry>;
}

interface FlexibleSubject extends Partial<Subject> {
  name?: string;
  code?: string;
  gradeLevel?: string | number;
}

interface FlexibleSection extends Partial<Section> {
  name?: string;
  gradeLevel?: string | number;
  adviser?: string;
}

/**
 * Compute student consolidated grades for a section
 */
export function computeSectionConsolidatedData(
  students: Student[],
  subjects: Subject[],
  classRecords: ClassRecord[],
  schoolYear?: string
): { 
  males: StudentGradeSummary[]; 
  females: StudentGradeSummary[]; 
  sectionAverage: number | null;
  maleLearners: StudentGradeSummary[];
  femaleLearners: StudentGradeSummary[];
} {
  const safeStudents = Array.isArray(students) ? students : [];
  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeClassRecords = Array.isArray(classRecords) ? classRecords : [];

  // Sort learners alphabetically by Last Name, First Name
  const sortLearners = (list: Student[]) =>
    [...list].sort((a: FlexibleStudent, b: FlexibleStudent) => {
      const nameA = `${a.last_name || a.lastName || ''} ${a.first_name || a.firstName || ''}`.trim().toLowerCase();
      const nameB = `${b.last_name || b.lastName || ''} ${b.first_name || b.firstName || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const maleStudents = sortLearners(safeStudents.filter((s: FlexibleStudent) => (s.gender || '').toLowerCase() === 'male'));
  const femaleStudents = sortLearners(safeStudents.filter((s: FlexibleStudent) => (s.gender || '').toLowerCase() === 'female'));

  // Pre-index class records by `${lrn}_${subjectId}`
  const gradeMap = new Map<string, number>();
  safeClassRecords.forEach((cr: FlexibleClassRecord) => {
    const crSy = cr.school_year || cr.schoolYear;
    const studentLrn = cr.student_lrn || cr.studentLrn;
    const subjectId = cr.subject_id || cr.subjectId;
    const gradeVal = cr.final_grade ?? cr.quarterly_grade ?? cr.quarterlyGrade ?? cr.finalGrade;

    if ((!schoolYear || crSy === schoolYear) && gradeVal !== undefined && gradeVal !== null) {
      const num = typeof gradeVal === 'number' ? gradeVal : parseFloat(String(gradeVal));
      if (!isNaN(num)) {
        if (studentLrn) gradeMap.set(`${studentLrn}_${subjectId}`, num);
        if (cr.student_id || cr.studentId) gradeMap.set(`${cr.student_id || cr.studentId}_${subjectId}`, num);
      }
    }

    // Also handle nested cr.grades map: { [studentKey]: { quarterlyGrade: 89 } }
    if (cr.grades && typeof cr.grades === 'object') {
      Object.entries(cr.grades).forEach(([studentKey, g]: [string, GradeEntry]) => {
        const qg = g?.quarterlyGrade ?? g?.finalGrade ?? g?.quarterly_grade ?? g?.final_grade;
        if (qg !== undefined && qg !== null) {
          const num = typeof qg === 'number' ? qg : parseFloat(String(qg));
          if (!isNaN(num)) {
            gradeMap.set(`${studentKey}_${subjectId}`, num);
          }
        }
      });
    }
  });

  const processList = (list: Student[]): StudentGradeSummary[] => {
    return list.map((student: FlexibleStudent) => {
      const grades: Record<string, number | null> = {};
      let sum = 0;
      let count = 0;

      safeSubjects.forEach((sub: FlexibleSubject) => {
        const grade = 
          (student.lrn ? gradeMap.get(`${student.lrn}_${sub.id}`) : undefined) ??
          (student.id ? gradeMap.get(`${student.id}_${sub.id}`) : undefined);

        if (grade !== undefined && grade !== null) {
          if (sub.id) grades[sub.id] = grade;
          // Only average subjects that count in general average
          if (sub.counts_in_general_average !== false) {
            sum += grade;
            count++;
          }
        } else {
          if (sub.id) grades[sub.id] = null;
        }
      });

      const generalAverage = count > 0 ? Math.round((sum / count) * 100) / 100 : null;
      let actionTaken = '—';
      if (generalAverage !== null) {
        actionTaken = generalAverage >= 75 ? 'PROMOTED' : 'RETAINED';
      }

      return {
        student: student as Student,
        grades,
        generalAverage,
        actionTaken
      };
    });
  };

  const males = processList(maleStudents);
  const females = processList(femaleStudents);

  const allAverages = [...males, ...females]
    .map(s => s.generalAverage)
    .filter((a): a is number => a !== null && a !== undefined);

  const sectionAverage = allAverages.length > 0
    ? Math.round((allAverages.reduce((acc, v) => acc + v, 0) / allAverages.length) * 100) / 100
    : null;

  return { 
    males, 
    females, 
    sectionAverage, 
    maleLearners: males, 
    femaleLearners: females 
  };
}

function getNormalizedStudent(student: FlexibleStudent): Student {
  return {
    ...student,
    first_name: student.first_name || student.firstName || '',
    last_name: student.last_name || student.lastName || '',
    middle_name: student.middle_name || student.middleName || '',
    name_extension: student.name_extension || student.nameExtension || '',
  } as Student;
}

/**
 * Generate Consolidated Grades Excel Workbook buffer (.xlsx)
 */
export async function generateConsolidatedExcelBuffer(params: ConsolidatedExportParams): Promise<Uint8Array> {
  const { section, students, subjects, classRecords, schoolYear, schoolProfile } = params;
  const { males, females, sectionAverage } = computeSectionConsolidatedData(students, subjects, classRecords, schoolYear);

  const flexSec = section as FlexibleSection;
  const secName = (flexSec.section_name || flexSec.name || 'Section').toString();
  const secGrade = (flexSec.section_grade_level || flexSec.gradeLevel || '').toString();

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`${secName} - Consolidated`, {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 5 }]
  });

  // Header rows
  ws.mergeCells('A1:L1');
  ws.getCell('A1').value = (schoolProfile?.name || 'DEPARTMENT OF EDUCATION').toUpperCase();
  ws.getCell('A1').font = { bold: true, size: 12, color: { argb: '1B365D' } };
  ws.getCell('A1').alignment = { horizontal: 'center' };

  ws.mergeCells('A2:L2');
  ws.getCell('A2').value = `CONSOLIDATED SUMMARY OF GRADES — S.Y. ${schoolYear}`;
  ws.getCell('A2').font = { bold: true, size: 11, color: { argb: '334155' } };
  ws.getCell('A2').alignment = { horizontal: 'center' };

  ws.mergeCells('A3:L3');
  ws.getCell('A3').value = `Grade & Section: ${secGrade} - ${secName} | Adviser: ${flexSec.adviser_name || flexSec.adviser || 'Unassigned'} | Program: ${flexSec.program || 'Regular'}`;
  ws.getCell('A3').font = { italic: true, size: 10, color: { argb: '475569' } };
  ws.getCell('A3').alignment = { horizontal: 'center' };

  // Empty spacer
  ws.addRow([]);

  // Table Headers (Row 5)
  const headerCols = ['No.', 'Learner LRN', 'Learner Complete Name'];
  subjects.forEach(s => {
    const flexSub = s as FlexibleSubject;
    headerCols.push(flexSub.subject_code || flexSub.code || flexSub.subject_name || flexSub.name || 'Subject');
  });
  headerCols.push('General Average', 'Action Taken');

  const headerRow = ws.addRow(headerCols);
  headerRow.height = 26;
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B365D' } };
    cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9.5 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    };
  });

  const addStudentRows = (list: StudentGradeSummary[], genderTitle: string) => {
    // Gender title separator row
    const titleRow = ws.addRow([genderTitle]);
    titleRow.height = 20;
    titleRow.getCell(1).font = { bold: true, size: 9.5, color: { argb: '1E3A8A' } };
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E7FF' } };

    list.forEach((item, idx) => {
      const rowData: (string | number)[] = [
        idx + 1,
        item.student.lrn,
        formatLearnerName(getNormalizedStudent(item.student))
      ];

      subjects.forEach(sub => {
        const val = item.grades[sub.id];
        rowData.push(val !== null && val !== undefined ? val : '');
      });

      rowData.push(item.generalAverage !== null ? item.generalAverage : '');
      rowData.push(item.actionTaken);

      const dataRow = ws.addRow(rowData);
      dataRow.height = 19;
      dataRow.eachCell((cell, colIdx) => {
        cell.font = { size: 9, color: { argb: '0F172A' } };
        cell.alignment = { vertical: 'middle', horizontal: colIdx >= 4 ? 'center' : 'left' };
        cell.border = {
          top: { style: 'hair', color: { argb: 'CBD5E1' } },
          bottom: { style: 'hair', color: { argb: 'CBD5E1' } },
          left: { style: 'hair', color: { argb: 'CBD5E1' } },
          right: { style: 'hair', color: { argb: 'CBD5E1' } }
        };
      });
    });
  };

  if (males.length > 0) addStudentRows(males, `MALE LEARNERS (${males.length})`);
  if (females.length > 0) addStudentRows(females, `FEMALE LEARNERS (${females.length})`);

  // Section Summary Row
  ws.addRow([]);
  const summaryRow = ws.addRow([
    '',
    '',
    `SECTION GENERAL AVERAGE: ${sectionAverage !== null ? sectionAverage : '—'}`,
    ...subjects.map(() => ''),
    sectionAverage !== null ? sectionAverage : '',
    ''
  ]);
  summaryRow.getCell(3).font = { bold: true, size: 10, color: { argb: '1E3A8A' } };

  // Adjust column widths
  ws.columns.forEach((col, idx) => {
    if (idx === 0) col.width = 6;
    else if (idx === 1) col.width = 16;
    else if (idx === 2) col.width = 28;
    else col.width = 12;
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

/**
 * Generate Consolidated Grades PDF buffer (.pdf)
 */
export async function generateConsolidatedPDFBuffer(params: ConsolidatedExportParams): Promise<Uint8Array> {
  const { section, students, subjects, classRecords, schoolYear, schoolProfile } = params;
  const { males, females, sectionAverage } = computeSectionConsolidatedData(students, subjects, classRecords, schoolYear);

  // Landscape Folio / Legal format: [330.2mm x 215.9mm]
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [330.2, 215.9]
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let currentY = margin;

  // Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(27, 54, 93);
  doc.text((schoolProfile?.name || 'DEPARTMENT OF EDUCATION').toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`CONSOLIDATED SUMMARY OF GRADES — S.Y. ${schoolYear}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Grade & Section: ${section.section_grade_level || ''} - ${section.section_name || ''}   |   Adviser: ${section.adviser_name || 'Unassigned'}   |   Program: ${section.program || 'Regular'}`,
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );
  currentY += 7;

  // Table Configuration
  const colNameWidth = 48;
  const colLrnWidth = 24;
  const colSubWidth = Math.max(12, Math.min(18, (pageWidth - margin * 2 - colNameWidth - colLrnWidth - 28) / (subjects.length || 1)));
  const colAveWidth = 14;
  const colActionWidth = 14;

  const drawTableHeader = () => {
    doc.setFillColor(27, 54, 93);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let x = margin + 2;
    doc.text('LRN', x, currentY + 4.8);
    x += colLrnWidth;
    doc.text('LEARNER NAME', x, currentY + 4.8);
    x += colNameWidth;

    subjects.forEach(sub => {
      const flexSub = sub as FlexibleSubject;
      const raw = flexSub.subject_code || flexSub.code || flexSub.subject_name || flexSub.name || 'SUBJ';
      const code = String(raw).slice(0, 8);
      doc.text(code, x + colSubWidth / 2, currentY + 4.8, { align: 'center' });
      x += colSubWidth;
    });

    doc.text('GEN AVE', x + colAveWidth / 2, currentY + 4.8, { align: 'center' });
    x += colAveWidth;
    doc.text('ACTION', x + colActionWidth / 2, currentY + 4.8, { align: 'center' });

    currentY += 7;
  };

  drawTableHeader();

  const drawSectionRows = (list: StudentGradeSummary[], genderTitle: string) => {
    // Group header
    if (currentY + 12 > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      drawTableHeader();
    }

    doc.setFillColor(224, 231, 255);
    doc.rect(margin, currentY, pageWidth - margin * 2, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 58, 138);
    doc.text(genderTitle, margin + 2, currentY + 3.8);
    currentY += 5;

    list.forEach((item, idx) => {
      if (currentY + 6 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        drawTableHeader();
      }

      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, pageWidth - margin * 2, 5, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);

      let x = margin + 2;
      doc.text(item.student.lrn || '', x, currentY + 3.6);
      x += colLrnWidth;
      const formattedName = formatLearnerName(getNormalizedStudent(item.student));
      doc.text(formattedName.length > 30 ? formattedName.slice(0, 28) + '...' : formattedName, x, currentY + 3.6);
      x += colNameWidth;

      subjects.forEach(sub => {
        const val = item.grades[sub.id];
        const text = val !== null && val !== undefined ? String(val) : '—';
        doc.text(text, x + colSubWidth / 2, currentY + 3.6, { align: 'center' });
        x += colSubWidth;
      });

      doc.setFont('helvetica', 'bold');
      doc.text(item.generalAverage !== null ? String(item.generalAverage) : '—', x + colAveWidth / 2, currentY + 3.6, { align: 'center' });
      x += colAveWidth;

      doc.setTextColor(item.actionTaken === 'PROMOTED' ? 22 : 185, item.actionTaken === 'PROMOTED' ? 101 : 28, item.actionTaken === 'PROMOTED' ? 52 : 28);
      doc.text(item.actionTaken, x + colActionWidth / 2, currentY + 3.6, { align: 'center' });

      currentY += 5;
    });
  };

  if (males.length > 0) drawSectionRows(males, `MALE LEARNERS (${males.length})`);
  if (females.length > 0) drawSectionRows(females, `FEMALE LEARNERS (${females.length})`);

  // Footer summary
  if (currentY + 14 < pageHeight - margin) {
    currentY += 3;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text(`Overall Section Average: ${sectionAverage !== null ? sectionAverage : '—'}`, margin + 2, currentY);
  }

  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}
