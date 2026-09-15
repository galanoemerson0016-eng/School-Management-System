/**
 * FormEase Pro — School Forms Vault Archival Service
 * 
 * Generates headless, production-quality Excel (.xlsx) and vector PDF (.pdf)
 * buffers for official DepEd School Forms:
 * - SF2 (Daily Attendance Report)
 * - SF5 (Report on Promotion and Learning Progress & Achievement)
 * - SF6 (Summarized Report on Promotion and Level of Progress & Achievement)
 */

import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import type { Student, Section, Subject, ClassRecord, SchoolProfile, SF2Sheet } from '../types';
import { formatLearnerName } from '../utils/student-name';
import { computeSectionConsolidatedData } from './consolidated-export-service';
import { generateSF2WorkbookBuffer, type SF2ExportParams } from '../lib/sf2-excel-export';
import { isGrade4to10, fetchGrade4to10TemplateBuffer, populateGrade4to10TemplateBuffer } from './sf9-g4-10-excel-export';
import { isGrade11Academic, fetchGrade11AcademicTemplateBuffer, populateGrade11AcademicTemplateBuffer } from './sf9-g11-academic-excel-export';

// ---------------------------------------------------------------------------
// 1. SF2 — DAILY ATTENDANCE
// ---------------------------------------------------------------------------

export interface SF2VaultParams {
  section: Section;
  students: Student[];
  schoolProfile?: SchoolProfile;
  schoolYear: string;
  month: string;
  sheet?: SF2Sheet;
  attendanceData?: Record<string, Record<string, string>>;
}

/**
 * Generates a clean vector PDF of SF2 Daily Attendance for a section and month
 */
export async function generateSF2PDFBuffer(params: SF2VaultParams): Promise<Uint8Array> {
  const { section, students, schoolProfile, schoolYear, month, sheet, attendanceData: customAtt } = params;
  const attendance = customAtt || sheet?.attendance || {};

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [330.2, 215.9]
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let currentY = margin;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(27, 54, 93);
  doc.text('DEPARTMENT OF EDUCATION', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('SCHOOL FORM 2 (SF2) — DAILY ATTENDANCE REPORT OF LEARNERS', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  // Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, pageWidth - margin * 2, 10, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const col1 = margin + 3;
  const col2 = margin + 70;
  const col3 = margin + 150;
  const col4 = margin + 230;

  doc.text(`SCHOOL ID: ${schoolProfile?.school_id || '307014'}`, col1, currentY + 3.8);
  doc.text(`SCHOOL NAME: ${schoolProfile?.name || 'School Name'}`, col2, currentY + 3.8);
  doc.text(`SCHOOL YEAR: ${schoolYear}`, col3, currentY + 3.8);
  doc.text(`REPORT FOR MONTH OF: ${month.toUpperCase()}`, col4, currentY + 3.8);

  doc.text(`GRADE & SECTION: ${section.section_grade_level || ''} - ${section.section_name || ''}`, col1, currentY + 7.8);
  doc.text(`TRACK / STRAND: ${section.track || 'General'}`, col2, currentY + 7.8);
  doc.text(`ADVISER: ${section.adviser_name || 'Unassigned'}`, col3, currentY + 7.8);

  currentY += 13;

  // Days 1-25 columns
  const dayCols = 25;
  const numW = 7;
  const nameW = 50;
  const dayW = 8;
  const totalW = 10;

  const drawTableHeader = () => {
    doc.setFillColor(27, 54, 93);
    doc.rect(margin, currentY, pageWidth - margin * 2, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);

    let x = margin + 1;
    doc.text('NO', x, currentY + 4.5);
    x += numW;
    doc.text('LEARNER\'S NAME', x, currentY + 4.5);
    x += nameW;

    for (let d = 1; d <= dayCols; d++) {
      doc.text(String(d), x + dayW / 2, currentY + 4.5, { align: 'center' });
      x += dayW;
    }

    doc.text('ABSENT', x + totalW / 2, currentY + 4.5, { align: 'center' });
    x += totalW;
    doc.text('TARDY', x + totalW / 2, currentY + 4.5, { align: 'center' });
    currentY += 6.5;
  };

  drawTableHeader();

  // Draw learner list
  const sortLearners = (list: Student[]) =>
    [...list].sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));

  const males = sortLearners(students.filter(s => (s.gender || '').toLowerCase() === 'male'));
  const females = sortLearners(students.filter(s => (s.gender || '').toLowerCase() === 'female'));

  const drawGroup = (group: Student[], title: string) => {
    if (currentY + 12 > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      drawTableHeader();
    }

    doc.setFillColor(224, 231, 255);
    doc.rect(margin, currentY, pageWidth - margin * 2, 4.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 58, 138);
    doc.text(`${title} (${group.length})`, margin + 2, currentY + 3.2);
    currentY += 4.5;

    group.forEach((st, idx) => {
      if (currentY + 5 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        drawTableHeader();
      }

      const stAtt = attendance[st.lrn] || {};
      let absentCount = 0;
      let tardyCount = 0;

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, pageWidth - margin * 2, 4.5, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);

      let lx = margin + 1;
      doc.text(String(idx + 1), lx, currentY + 3.2);
      lx += numW;

      doc.text(formatLearnerName(st).slice(0, 28), lx, currentY + 3.2);
      lx += nameW;

      for (let d = 1; d <= dayCols; d++) {
        const mark = stAtt[`date_${d}`] || stAtt[String(d)] || '';
        let display = '';
        if (mark.toLowerCase().includes('absent') || mark === 'x' || mark === 'a') {
          display = 'x';
          absentCount++;
          doc.setTextColor(220, 38, 38);
        } else if (mark.toLowerCase().includes('late') || mark.toLowerCase().includes('tardy') || mark === 't') {
          display = 't';
          tardyCount++;
          doc.setTextColor(217, 119, 6);
        } else {
          doc.setTextColor(15, 23, 42);
        }

        doc.text(display, lx + dayW / 2, currentY + 3.2, { align: 'center' });
        lx += dayW;
      }

      doc.setTextColor(absentCount > 0 ? 220 : 15, absentCount > 0 ? 38 : 23, absentCount > 0 ? 38 : 42);
      doc.text(String(absentCount), lx + totalW / 2, currentY + 3.2, { align: 'center' });
      lx += totalW;

      doc.setTextColor(tardyCount > 0 ? 217 : 15, tardyCount > 0 ? 119 : 23, tardyCount > 0 ? 6 : 42);
      doc.text(String(tardyCount), lx + totalW / 2, currentY + 3.2, { align: 'center' });

      currentY += 4.5;
    });
  };

  if (males.length > 0) drawGroup(males, 'MALE');
  if (females.length > 0) drawGroup(females, 'FEMALE');

  return new Uint8Array(doc.output('arraybuffer'));
}

/**
 * Generates an Excel workbook buffer of SF2 Daily Attendance using official DepEd SF2 template
 */
export async function generateSF2ExcelBuffer(params: SF2VaultParams): Promise<Uint8Array> {
  const { section, students, schoolProfile, schoolYear, month, sheet, attendanceData: customAtt } = params;
  const attendance = customAtt || sheet?.attendance || {};

  try {
    const dateLabels = Array.from({ length: 25 }, (_, i) => ({
      dayNumber: String(i + 1),
      weekday: '',
      dateStr: String(i + 1)
    }));

    const defaultProfile: SchoolProfile = {
      school_id: '',
      name: 'Department of Education',
      region: '',
      division: '',
      district: '',
      head_name: '',
      head_position: 'School Head',
      grade_levels_offered: ''
    };

    const sf2Params: SF2ExportParams = {
      schoolProfile: schoolProfile || defaultProfile,
      section,
      students,
      activeSchoolYear: schoolYear,
      selectedMonth: month,
      attendanceData: attendance,
      dateLabels
    };

    return await generateSF2WorkbookBuffer(sf2Params);
  } catch (templateErr) {
    console.warn(`Notice loading official SF2 template for ${section.section_name}, using fallback workbook:`, templateErr);
    return await generateFallbackSF2ExcelBuffer(params);
  }
}

/**
 * Fallback SF2 Excel workbook generator if template binary cannot be loaded
 */
async function generateFallbackSF2ExcelBuffer(params: SF2VaultParams): Promise<Uint8Array> {
  const { section, students, schoolProfile, schoolYear, month, sheet, attendanceData: customAtt } = params;
  const attendance = customAtt || sheet?.attendance || {};

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`SF2 - ${month.slice(0, 10)}`);

  // Headers
  ws.mergeCells('A1:AC1');
  ws.getCell('A1').value = 'SCHOOL FORM 2 (SF2) — DAILY ATTENDANCE REPORT OF LEARNERS';
  ws.getCell('A1').font = { bold: true, size: 12, color: { argb: '1B365D' } };
  ws.getCell('A1').alignment = { horizontal: 'center' };

  ws.mergeCells('A2:AC2');
  ws.getCell('A2').value = `${schoolProfile?.name || 'School'} | S.Y. ${schoolYear} | Month: ${month.toUpperCase()} | Grade & Section: ${section.section_grade_level} - ${section.section_name}`;
  ws.getCell('A2').font = { italic: true, size: 10, color: { argb: '475569' } };
  ws.getCell('A2').alignment = { horizontal: 'center' };

  ws.addRow([]);

  // Table header
  const cols = ['No.', 'LRN', 'Learner Complete Name'];
  for (let d = 1; d <= 25; d++) cols.push(String(d));
  cols.push('Total Absent', 'Total Tardy');

  const hRow = ws.addRow(cols);
  hRow.height = 24;
  hRow.eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B365D' } };
    c.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const appendStudents = (group: Student[], groupTitle: string) => {
    const tRow = ws.addRow([groupTitle]);
    tRow.getCell(1).font = { bold: true, size: 9.5, color: { argb: '1E3A8A' } };
    tRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E7FF' } };

    group.forEach((st, idx) => {
      const stAtt = attendance[st.lrn] || {};
      let absentCount = 0;
      let tardyCount = 0;
      const row = [idx + 1, st.lrn, formatLearnerName(st)];

      for (let d = 1; d <= 25; d++) {
        const mark = stAtt[`date_${d}`] || stAtt[String(d)] || '';
        let display = '';
        if (mark.toLowerCase().includes('absent') || mark === 'x' || mark === 'a') {
          display = 'x';
          absentCount++;
        } else if (mark.toLowerCase().includes('late') || mark.toLowerCase().includes('tardy') || mark === 't') {
          display = 't';
          tardyCount++;
        }
        row.push(display);
      }
      row.push(String(absentCount), String(tardyCount));
      const dataRow = ws.addRow(row);
      dataRow.height = 18;
    });
  };

  const males = students.filter(s => (s.gender || '').toLowerCase() === 'male');
  const females = students.filter(s => (s.gender || '').toLowerCase() === 'female');

  if (males.length > 0) appendStudents(males, `MALE LEARNERS (${males.length})`);
  if (females.length > 0) appendStudents(females, `FEMALE LEARNERS (${females.length})`);

  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

// ---------------------------------------------------------------------------
// 2. SF5 — REPORT ON PROMOTION
// ---------------------------------------------------------------------------

export interface SF5VaultParams {
  section: Section;
  students: Student[];
  subjects: Subject[];
  classRecords: ClassRecord[];
  schoolProfile?: SchoolProfile;
  schoolYear: string;
}

/**
 * Generates a vector PDF of SF5 Report on Promotion for a section
 */
export async function generateSF5PDFBuffer(params: SF5VaultParams): Promise<Uint8Array> {
  const { section, students, subjects, classRecords, schoolProfile, schoolYear } = params;
  const { males, females } = computeSectionConsolidatedData(students, subjects, classRecords, schoolYear, 'all');

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [330.2, 215.9]
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let currentY = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(27, 54, 93);
  doc.text('DEPARTMENT OF EDUCATION', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('SCHOOL FORM 5 (SF5) — REPORT ON PROMOTION AND PROGRESS', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`School: ${schoolProfile?.name || 'School'} | School ID: ${schoolProfile?.school_id || '307014'} | S.Y. ${schoolYear} | Grade & Section: ${section.section_grade_level} - ${section.section_name}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;

  // Promotion Statistics Box
  const allGraded = [...males, ...females];
  const promotedCount = allGraded.filter(s => s.actionTaken === 'PROMOTED').length;
  const retainedCount = allGraded.filter(s => s.actionTaken === 'RETAINED').length;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, pageWidth - margin * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`SUMMARY:  TOTAL ENROLLED: ${allGraded.length}   |   PROMOTED: ${promotedCount}   |   RETAINED: ${retainedCount}   |   PROMOTION RATE: ${allGraded.length > 0 ? Math.round((promotedCount / allGraded.length) * 100) : 0}%`, margin + 3, currentY + 5.2);
  currentY += 11;

  const drawTableHeader = () => {
    doc.setFillColor(27, 54, 93);
    doc.rect(margin, currentY, pageWidth - margin * 2, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);

    doc.text('NO', margin + 2, currentY + 4.5);
    doc.text('LRN', margin + 12, currentY + 4.5);
    doc.text('LEARNER\'S COMPLETE NAME', margin + 42, currentY + 4.5);
    doc.text('GENERAL AVERAGE', margin + 150, currentY + 4.5);
    doc.text('ACTION TAKEN', margin + 200, currentY + 4.5);
    doc.text('INCOMPLETE SUBJECTS', margin + 245, currentY + 4.5);
    currentY += 6.5;
  };

  drawTableHeader();

  const drawGroup = (group: typeof males, title: string) => {
    if (currentY + 12 > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      drawTableHeader();
    }

    doc.setFillColor(224, 231, 255);
    doc.rect(margin, currentY, pageWidth - margin * 2, 4.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 58, 138);
    doc.text(`${title} (${group.length})`, margin + 2, currentY + 3.2);
    currentY += 4.5;

    group.forEach((item, idx) => {
      if (currentY + 5.5 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        drawTableHeader();
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, pageWidth - margin * 2, 5, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);

      doc.text(String(idx + 1), margin + 2, currentY + 3.5);
      doc.text(item.student.lrn, margin + 12, currentY + 3.5);
      doc.text(formatLearnerName(item.student).slice(0, 38), margin + 42, currentY + 3.5);

      doc.setFont('helvetica', 'bold');
      doc.text(item.generalAverage !== null ? String(item.generalAverage) : '—', margin + 155, currentY + 3.5);

      if (item.actionTaken === 'PROMOTED') {
        doc.setTextColor(21, 128, 61);
      } else if (item.actionTaken === 'RETAINED') {
        doc.setTextColor(220, 38, 38);
      }
      doc.text(item.actionTaken, margin + 200, currentY + 3.5);

      currentY += 5;
    });
  };

  if (males.length > 0) drawGroup(males, 'MALE');
  if (females.length > 0) drawGroup(females, 'FEMALE');

  return new Uint8Array(doc.output('arraybuffer'));
}

/**
 * Generates an Excel workbook buffer of SF5 Report on Promotion for a section
 */
export async function generateSF5ExcelBuffer(params: SF5VaultParams): Promise<Uint8Array> {
  const { section, students, subjects, classRecords, schoolProfile, schoolYear } = params;
  const { males, females } = computeSectionConsolidatedData(students, subjects, classRecords, schoolYear, 'all');

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(`SF5 - ${section.section_name}`);

  ws.mergeCells('A1:F1');
  ws.getCell('A1').value = 'SCHOOL FORM 5 (SF5) — REPORT ON PROMOTION AND PROGRESS';
  ws.getCell('A1').font = { bold: true, size: 12, color: { argb: '1B365D' } };
  ws.getCell('A1').alignment = { horizontal: 'center' };

  ws.mergeCells('A2:F2');
  ws.getCell('A2').value = `School: ${schoolProfile?.name} | S.Y. ${schoolYear} | Grade & Section: ${section.section_grade_level} - ${section.section_name}`;
  ws.getCell('A2').font = { italic: true, size: 10, color: { argb: '475569' } };
  ws.getCell('A2').alignment = { horizontal: 'center' };

  ws.addRow([]);

  const hRow = ws.addRow(['No.', 'LRN', 'Learner Complete Name', 'General Average', 'Action Taken', 'Did Not Meet Expectations In']);
  hRow.height = 24;
  hRow.eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B365D' } };
    c.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const appendList = (list: typeof males, title: string) => {
    const t = ws.addRow([title]);
    t.getCell(1).font = { bold: true, size: 9.5, color: { argb: '1E3A8A' } };
    t.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E7FF' } };

    list.forEach((item, idx) => {
      const r = ws.addRow([
        idx + 1,
        item.student.lrn,
        formatLearnerName(item.student),
        item.generalAverage !== null ? item.generalAverage : '',
        item.actionTaken,
        ''
      ]);
      r.height = 18;
    });
  };

  if (males.length > 0) appendList(males, `MALE LEARNERS (${males.length})`);
  if (females.length > 0) appendList(females, `FEMALE LEARNERS (${females.length})`);

  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

// ---------------------------------------------------------------------------
// 3. SF6 — SUMMARIZED REPORT ON PROMOTION
// ---------------------------------------------------------------------------

export interface SF6VaultParams {
  sections: Section[];
  students: Student[];
  subjects: Subject[];
  classRecords: ClassRecord[];
  schoolProfile?: SchoolProfile;
  schoolYear: string;
}

/**
 * Generates an official vector PDF of SF6 Summarized Promotion Report for the school
 */
export async function generateSF6PDFBuffer(params: SF6VaultParams): Promise<Uint8Array> {
  const { sections, students, subjects, classRecords, schoolProfile, schoolYear } = params;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [330.2, 215.9]
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  let currentY = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(27, 54, 93);
  doc.text('DEPARTMENT OF EDUCATION', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('SCHOOL FORM 6 (SF6) — SUMMARIZED REPORT ON PROMOTION', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`School: ${schoolProfile?.name || 'School'} | School ID: ${schoolProfile?.school_id || '307014'} | S.Y. ${schoolYear}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Header Table
  doc.setFillColor(27, 54, 93);
  doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);

  doc.text('GRADE LEVEL', margin + 3, currentY + 4.8);
  doc.text('SECTION', margin + 35, currentY + 4.8);
  doc.text('ENROLLED', margin + 95, currentY + 4.8);
  doc.text('PROMOTED', margin + 140, currentY + 4.8);
  doc.text('RETAINED', margin + 185, currentY + 4.8);
  doc.text('PROMOTION RATE', margin + 230, currentY + 4.8);
  currentY += 7;

  let totalEnrolled = 0;
  let totalPromoted = 0;
  let totalRetained = 0;

  sections.forEach((sec, idx) => {
    const secStudents = students.filter(s => s.student_section === sec.id || s.student_section === sec.section_name);
    const { males, females } = computeSectionConsolidatedData(secStudents, subjects, classRecords, schoolYear, 'all');
    const graded = [...males, ...females];
    const promoted = graded.filter(s => s.actionTaken === 'PROMOTED').length;
    const retained = graded.filter(s => s.actionTaken === 'RETAINED').length;

    totalEnrolled += secStudents.length;
    totalPromoted += promoted;
    totalRetained += retained;

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, pageWidth - margin * 2, 5.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);

    doc.text(sec.section_grade_level || 'Grade', margin + 3, currentY + 3.8);
    doc.text(sec.section_name || 'Section', margin + 35, currentY + 3.8);
    doc.text(String(secStudents.length), margin + 95, currentY + 3.8);
    doc.text(String(promoted), margin + 140, currentY + 3.8);
    doc.text(String(retained), margin + 185, currentY + 3.8);
    const rate = secStudents.length > 0 ? Math.round((promoted / secStudents.length) * 100) : 0;
    doc.text(`${rate}%`, margin + 230, currentY + 3.8);

    currentY += 5.5;
  });

  // Total Summary
  doc.setFillColor(224, 231, 255);
  doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 58, 138);

  doc.text('TOTAL / SCHOOL SUMMARY', margin + 3, currentY + 4.2);
  doc.text(String(totalEnrolled), margin + 95, currentY + 4.2);
  doc.text(String(totalPromoted), margin + 140, currentY + 4.2);
  doc.text(String(totalRetained), margin + 185, currentY + 4.2);
  const overallRate = totalEnrolled > 0 ? Math.round((totalPromoted / totalEnrolled) * 100) : 0;
  doc.text(`${overallRate}%`, margin + 230, currentY + 4.2);

  return new Uint8Array(doc.output('arraybuffer'));
}

/**
 * Generates an Excel workbook buffer of SF6 Summarized Promotion Report for the school
 */
export async function generateSF6ExcelBuffer(params: SF6VaultParams): Promise<Uint8Array> {
  const { sections, students, subjects, classRecords, schoolProfile, schoolYear } = params;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('SF6 Summary');

  ws.mergeCells('A1:F1');
  ws.getCell('A1').value = 'SCHOOL FORM 6 (SF6) — SUMMARIZED REPORT ON PROMOTION';
  ws.getCell('A1').font = { bold: true, size: 12, color: { argb: '1B365D' } };
  ws.getCell('A1').alignment = { horizontal: 'center' };

  ws.mergeCells('A2:F2');
  ws.getCell('A2').value = `School: ${schoolProfile?.name} | S.Y. ${schoolYear} | Total Enrolled: ${students.length}`;
  ws.getCell('A2').font = { italic: true, size: 10, color: { argb: '475569' } };
  ws.getCell('A2').alignment = { horizontal: 'center' };

  ws.addRow([]);

  const hRow = ws.addRow(['Grade Level', 'Section', 'Total Enrolled', 'Promoted', 'Retained', 'Promotion Rate']);
  hRow.height = 24;
  hRow.eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B365D' } };
    c.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  let totalEnrolled = 0;
  let totalPromoted = 0;
  let totalRetained = 0;

  sections.forEach(sec => {
    const secStudents = students.filter(s => s.student_section === sec.id || s.student_section === sec.section_name);
    const { males, females } = computeSectionConsolidatedData(secStudents, subjects, classRecords, schoolYear, 'all');
    const graded = [...males, ...females];
    const promoted = graded.filter(s => s.actionTaken === 'PROMOTED').length;
    const retained = graded.filter(s => s.actionTaken === 'RETAINED').length;

    totalEnrolled += secStudents.length;
    totalPromoted += promoted;
    totalRetained += retained;

    const rate = secStudents.length > 0 ? Math.round((promoted / secStudents.length) * 100) : 0;
    const r = ws.addRow([
      sec.section_grade_level || '',
      sec.section_name || '',
      secStudents.length,
      promoted,
      retained,
      `${rate}%`
    ]);
    r.height = 18;
  });

  const totRow = ws.addRow([
    'TOTAL',
    '',
    totalEnrolled,
    totalPromoted,
    totalRetained,
    `${totalEnrolled > 0 ? Math.round((totalPromoted / totalEnrolled) * 100) : 0}%`
  ]);
  totRow.height = 20;
  totRow.eachCell(c => {
    c.font = { bold: true };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E7FF' } };
  });

  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

// ---------------------------------------------------------------------------
// 4. SF9 — REPORT CARDS (SECTION MASTER)
// ---------------------------------------------------------------------------

export interface SF9VaultParams {
  section: Section;
  students: Student[];
  subjects: Subject[];
  classRecords: ClassRecord[];
  schoolProfile?: SchoolProfile;
  schoolYear: string;
}

/**
 * Generates an official SF9 Section Master Excel (.xlsx) workbook using official DepEd SF9 template
 */
export async function generateSF9SectionMasterExcelBuffer(params: SF9VaultParams): Promise<Uint8Array> {
  const { section, students, subjects, classRecords, schoolProfile, schoolYear } = params;
  const gradeLevel = String(section.section_grade_level || 'Grade 7');

  if (students.length > 0 && isGrade4to10(gradeLevel)) {
    try {
      const templateBuffer = await fetchGrade4to10TemplateBuffer();
      const learners = students.map((st) => {
        const grades: Record<string, { q1?: number | string; q2?: number | string; q3?: number | string; final?: number | string }> = {};
        subjects.forEach((sub) => {
          const sName = sub.subject_name;
          const q1Rec = classRecords.find(cr => cr.student_lrn === st.lrn && (cr.subject_id === sub.id || cr.subject_name === sName) && cr.quarter === 1);
          const q2Rec = classRecords.find(cr => cr.student_lrn === st.lrn && (cr.subject_id === sub.id || cr.subject_name === sName) && cr.quarter === 2);
          const q3Rec = classRecords.find(cr => cr.student_lrn === st.lrn && (cr.subject_id === sub.id || cr.subject_name === sName) && cr.quarter === 3);
          const finalRec = classRecords.find(cr => cr.student_lrn === st.lrn && (cr.subject_id === sub.id || cr.subject_name === sName) && cr.quarter === 4);
          grades[sName] = {
            q1: q1Rec?.final_grade,
            q2: q2Rec?.final_grade,
            q3: q3Rec?.final_grade,
            final: finalRec?.final_grade
          };
        });
        return {
          ...st,
          grades
        };
      });

      const populated = await populateGrade4to10TemplateBuffer(templateBuffer, {
        student: students[0],
        schoolProfile,
        schoolYear,
        section: section.section_name,
        gradeLevel,
        adviser: section.adviser_name,
        principal: schoolProfile?.head_name,
        principalTitle: schoolProfile?.head_position || 'School Head',
        subjects,
        grades: {},
        learners
      });
      return new Uint8Array(populated);
    } catch (templateErr) {
      console.warn(`Notice loading official SF9 template for ${section.section_name}, using fallback master sheet:`, templateErr);
    }
  } else if (students.length > 0 && isGrade11Academic(gradeLevel, section.track)) {
    try {
      const templateBuffer = await fetchGrade11AcademicTemplateBuffer();
      const populated = await populateGrade11AcademicTemplateBuffer(templateBuffer, {
        student: students[0],
        schoolProfile,
        schoolYear,
        section: section.section_name,
        gradeLevel,
        adviser: section.adviser_name,
        principal: schoolProfile?.head_name,
        principalTitle: schoolProfile?.head_position || 'School Head',
        subjects,
        grades: {}
      });
      return new Uint8Array(populated);
    } catch (templateErr) {
      console.warn(`Notice loading official Grade 11 SF9 template for ${section.section_name}:`, templateErr);
    }
  }

  // Fallback to structured master summary spreadsheet
  return await generateFallbackSF9SectionMasterExcelBuffer(params);
}

/**
 * Fallback SF9 Section Master Excel workbook generator
 */
async function generateFallbackSF9SectionMasterExcelBuffer(params: SF9VaultParams): Promise<Uint8Array> {
  const { section, students, subjects, classRecords, schoolProfile, schoolYear } = params;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('SF9 Master Summary');

  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 5 }];

  // Header banner
  ws.mergeCells('A1:K1');
  ws.getCell('A1').value = (schoolProfile?.name || 'DEPARTMENT OF EDUCATION').toUpperCase();
  ws.getCell('A1').font = { bold: true, size: 12, color: { argb: '1B365D' } };
  ws.getCell('A1').alignment = { horizontal: 'center' };

  ws.mergeCells('A2:K2');
  ws.getCell('A2').value = `SCHOOL FORM 9 (SF9) — SECTION MASTER PROGRESS REPORT — S.Y. ${schoolYear}`;
  ws.getCell('A2').font = { bold: true, size: 11, color: { argb: '0F172A' } };
  ws.getCell('A2').alignment = { horizontal: 'center' };

  ws.mergeCells('A3:K3');
  ws.getCell('A3').value = `Grade & Section: ${section.section_grade_level || ''} - ${section.section_name || ''} | Adviser: ${section.adviser_name || 'Unassigned'} | Track/Strand: ${section.track || 'General'}`;
  ws.getCell('A3').font = { italic: true, size: 9.5, color: { argb: '475569' } };
  ws.getCell('A3').alignment = { horizontal: 'center' };

  ws.addRow([]);

  // Header row
  const headerCols = ['No.', 'Learner LRN', 'Learner Complete Name', 'Gender'];
  subjects.forEach(sub => {
    headerCols.push(sub.subject_code || sub.subject_name || 'Subject');
  });
  headerCols.push('General Average', 'Action Taken');

  const hRow = ws.addRow(headerCols);
  hRow.height = 24;
  hRow.eachCell(c => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1B365D' } };
    c.font = { bold: true, color: { argb: 'FFFFFF' }, size: 9 };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
  });

  const { males, females } = computeSectionConsolidatedData(students, subjects, classRecords, schoolYear, 'all');

  const appendList = (list: typeof males, genderGroup: string) => {
    const groupRow = ws.addRow([genderGroup]);
    groupRow.height = 20;
    groupRow.getCell(1).font = { bold: true, size: 9, color: { argb: '1E3A8A' } };
    groupRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E0E7FF' } };

    list.forEach((item, idx) => {
      const rowVals: (string | number)[] = [
        idx + 1,
        item.student.lrn || '',
        formatLearnerName(item.student),
        item.student.gender || ''
      ];
      subjects.forEach(sub => {
        const grade = item.grades[sub.id];
        rowVals.push(grade !== null && grade !== undefined ? grade : '');
      });
      rowVals.push(item.generalAverage !== null ? item.generalAverage : '');
      rowVals.push(item.actionTaken);

      const r = ws.addRow(rowVals);
      r.height = 18;
      r.getCell(1).alignment = { horizontal: 'center' };
      r.getCell(2).alignment = { horizontal: 'center' };
      r.getCell(4).alignment = { horizontal: 'center' };
      for (let c = 5; c <= 4 + subjects.length + 2; c++) {
        r.getCell(c).alignment = { horizontal: 'center' };
      }
    });
  };

  appendList(males, 'MALE LEARNERS');
  appendList(females, 'FEMALE LEARNERS');

  ws.columns.forEach((col, idx) => {
    if (idx === 0) col.width = 6;
    else if (idx === 1) col.width = 16;
    else if (idx === 2) col.width = 30;
    else if (idx === 3) col.width = 10;
    else if (idx >= 4 && idx < 4 + subjects.length) col.width = 14;
    else col.width = 18;
  });

  const buf = await wb.xlsx.writeBuffer();
  return new Uint8Array(buf as ArrayBuffer);
}

/**
 * Generates an official SF9 Section Master PDF (.pdf) for a section
 */
export async function generateSF9SectionMasterPDFBuffer(params: SF9VaultParams): Promise<Uint8Array> {
  const { section, students, subjects, classRecords, schoolProfile, schoolYear } = params;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [330.2, 215.9]
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let currentY = margin;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(27, 54, 93);
  doc.text('DEPARTMENT OF EDUCATION', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('SCHOOL FORM 9 (SF9) — SECTION MASTER PROGRESS REPORT', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, pageWidth - margin * 2, 10, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const col1 = margin + 3;
  const col2 = margin + 70;
  const col3 = margin + 150;
  const col4 = margin + 230;

  doc.text(`SCHOOL ID: ${schoolProfile?.school_id || '307014'}`, col1, currentY + 3.8);
  doc.text(`SCHOOL NAME: ${schoolProfile?.name || 'School Name'}`, col2, currentY + 3.8);
  doc.text(`SCHOOL YEAR: ${schoolYear}`, col3, currentY + 3.8);
  doc.text(`GRADE & SECTION: ${section.section_grade_level || ''} - ${section.section_name || ''}`, col4, currentY + 3.8);

  doc.text(`ADVISER: ${section.adviser_name || 'Unassigned'}`, col1, currentY + 7.8);
  doc.text(`TRACK / STRAND: ${section.track || 'General'}`, col2, currentY + 7.8);
  doc.text(`DATE GENERATED: ${new Date().toLocaleDateString()}`, col3, currentY + 7.8);

  currentY += 13;

  const { males, females } = computeSectionConsolidatedData(students, subjects, classRecords, schoolYear, 'all');

  const numW = 8;
  const lrnW = 28;
  const nameW = 54;
  const genAvgW = 18;
  const actionW = 22;
  const availableSubjectW = (pageWidth - margin * 2) - (numW + lrnW + nameW + genAvgW + actionW);
  const subColW = subjects.length > 0 ? Math.min(22, availableSubjectW / subjects.length) : 20;

  const drawHeader = () => {
    doc.setFillColor(27, 54, 93);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);

    let x = margin + 2;
    doc.text('NO.', x, currentY + 4.5); x += numW;
    doc.text('LEARNER LRN', x, currentY + 4.5); x += lrnW;
    doc.text('LEARNER COMPLETE NAME', x, currentY + 4.5); x += nameW;

    subjects.forEach(sub => {
      const code = (sub.subject_code || sub.subject_name || 'SUB').substring(0, 8);
      doc.text(code, x, currentY + 4.5);
      x += subColW;
    });

    doc.text('GEN AVG', x, currentY + 4.5); x += genAvgW;
    doc.text('ACTION TAKEN', x, currentY + 4.5);
    currentY += 7;
  };

  drawHeader();

  const renderGroup = (list: typeof males, groupLabel: string) => {
    if (currentY > pageHeight - 25) {
      doc.addPage();
      currentY = margin;
      drawHeader();
    }

    doc.setFillColor(224, 231, 255);
    doc.rect(margin, currentY, pageWidth - margin * 2, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 58, 138);
    doc.text(groupLabel, margin + 3, currentY + 3.5);
    currentY += 5;

    list.forEach((item, idx) => {
      if (currentY > pageHeight - 15) {
        doc.addPage();
        currentY = margin;
        drawHeader();
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, pageWidth - margin * 2, 5, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);

      let x = margin + 2;
      doc.text(String(idx + 1), x, currentY + 3.5); x += numW;
      doc.text(item.student.lrn || '-', x, currentY + 3.5); x += lrnW;
      doc.text(formatLearnerName(item.student), x, currentY + 3.5); x += nameW;

      subjects.forEach(sub => {
        const val = item.grades[sub.id];
        doc.text(val !== null && val !== undefined ? String(val) : '-', x + subColW / 2, currentY + 3.5, { align: 'center' });
        x += subColW;
      });

      doc.setFont('helvetica', 'bold');
      doc.text(item.generalAverage !== null ? String(item.generalAverage) : '-', x + genAvgW / 2, currentY + 3.5, { align: 'center' });
      x += genAvgW;

      if (item.actionTaken === 'PROMOTED') doc.setTextColor(22, 101, 52);
      else if (item.actionTaken === 'RETAINED') doc.setTextColor(185, 28, 28);
      else doc.setTextColor(100, 116, 139);

      doc.text(item.actionTaken, x + 2, currentY + 3.5);
      currentY += 5;
    });
  };

  renderGroup(males, 'MALE LEARNERS');
  renderGroup(females, 'FEMALE LEARNERS');

  const pdfBytes = doc.output('arraybuffer');
  return new Uint8Array(pdfBytes);
}
