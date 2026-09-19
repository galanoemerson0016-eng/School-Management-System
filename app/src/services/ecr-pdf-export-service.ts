/**
 * FormEase Pro — Electronic Class Record (ECR) PDF Export Service
 * 
 * Generates official, high-resolution vector PDF buffers for any E-Class Record
 * across Elementary, Junior High School (JHS), and Senior High School (SSHS / G12).
 */

import { jsPDF } from 'jspdf';
import type { Student, Section, Subject, ClassRecord, HPSRecord, SchoolProfile } from '../types';
import { formatLearnerName } from '../utils/student-name';
import { getSubjectCluster, getWeights, transmuteGrade, normalizeScores } from '../lib/grading';

export interface ECRPDFExportOptions {
  section: Section;
  subject: Subject;
  students: Student[];
  classRecords: ClassRecord[];
  hpsRecords?: HPSRecord[];
  schoolProfile?: SchoolProfile;
  schoolYear: string;
  teacherName?: string;
  quarter?: number | 'summary';
}

/**
 * Generate a complete, standalone vector PDF buffer for an individual E-Class Record
 */
export async function generateECRPDFBuffer(options: ECRPDFExportOptions): Promise<Uint8Array> {
  const {
    section,
    subject,
    students,
    classRecords,
    hpsRecords = [],
    schoolProfile,
    schoolYear,
    teacherName,
    quarter = 1
  } = options;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [330.2, 215.9] // Standard DepEd Folio / Legal Landscape
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  let currentY = margin;

  const gradeLevel = section.section_grade_level || subject.grade_level || 'Grade';
  const isSHS = gradeLevel.includes('11') || gradeLevel.includes('12');
  const subjectName = (subject.subject_name || 'Subject').toUpperCase();
  const sectionName = (section.section_name || 'Section').toUpperCase();
  const teacher = (teacherName || section.adviser_name || 'Subject Teacher').toUpperCase();
  const cluster = getSubjectCluster(subject.subject_name, gradeLevel, section.track);
  const weights = getWeights(cluster, subject);

  const wwCount = isSHS ? 10 : 5;
  const ptCount = isSHS ? 10 : 3;

  // Find relevant HPS record
  const hps = hpsRecords.find(r => 
    r.subject_id === subject.id && 
    (!r.section_id || r.section_id === section.id || r.section_id === section.section_name) &&
    (quarter === 'summary' || Number(r.quarter) === Number(quarter))
  );

  const hpsWW = normalizeScores(hps?.written_works, wwCount).map(v => (v !== '' && !isNaN(Number(v)) ? Number(v) : 0));
  const hpsPT = normalizeScores(hps?.performance_tasks, ptCount).map(v => (v !== '' && !isNaN(Number(v)) ? Number(v) : 0));
  const hpsExam = Number(hps?.quarterly_exam) || 50;

  const hpsTotalWW = hpsWW.reduce((a, b) => a + b, 0) || 100;
  const hpsTotalPT = hpsPT.reduce((a, b) => a + b, 0) || 100;

  // 1. DepEd Official Banner Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(27, 54, 93);
  doc.text('DEPARTMENT OF EDUCATION', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  const recordTitle = isSHS ? 'STRENGTHENED SENIOR HIGH SCHOOL CLASS RECORD' : 'ELECTRONIC CLASS RECORD';
  doc.text(recordTitle, pageWidth / 2, currentY, { align: 'center' });
  currentY += 4.5;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('(Pursuant to DepEd Order 15 & 17, s. 2026)', pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;

  // Metadata Grid Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, pageWidth - margin * 2, 13, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  // Row 1
  const col1 = margin + 3;
  const col2 = margin + 65;
  const col3 = margin + 145;
  const col4 = margin + 225;

  doc.text(`REGION: ${schoolProfile?.region || 'Region III'}`, col1, currentY + 4);
  doc.text(`DIVISION: ${schoolProfile?.division || 'Tarlac Province'}`, col2, currentY + 4);
  doc.text(`SCHOOL ID: ${schoolProfile?.school_id || '307014'}`, col3, currentY + 4);
  doc.text(`SCHOOL YEAR: ${schoolYear}`, col4, currentY + 4);

  // Row 2
  doc.text(`SCHOOL: ${(schoolProfile?.name || '').toUpperCase()}`, col1, currentY + 9.5);
  doc.text(`GRADE & SECTION: ${gradeLevel} - ${sectionName}`, col2, currentY + 9.5);
  doc.text(`SUBJECT: ${subjectName}`, col3, currentY + 9.5);
  doc.text(`TEACHER: ${teacher}`, col4, currentY + 9.5);

  currentY += 16;

  // Table Columns Width Calculation
  const nameWidth = 48;
  const numWidth = 7;
  const wwScoreWidth = Math.max(4.5, Math.min(6.5, 45 / wwCount));
  const ptScoreWidth = Math.max(4.5, Math.min(6.5, 45 / ptCount));
  const sumColWidth = 10;
  const gradeColWidth = 12;

  const drawTableHeader = () => {
    doc.setFillColor(27, 54, 93);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);

    let x = margin + 1;
    doc.text('NO', x, currentY + 4.8);
    x += numWidth;
    doc.text('LEARNERS\' NAMES', x, currentY + 4.8);
    x += nameWidth;

    // Written Works
    doc.text(`WRITTEN WORKS (${Math.round(weights.written_works * 100)}%)`, x + (wwCount * wwScoreWidth) / 2, currentY + 4.8, { align: 'center' });
    x += (wwCount * wwScoreWidth);
    doc.text('TOTAL', x + sumColWidth / 2, currentY + 4.8, { align: 'center' });
    x += sumColWidth;
    doc.text('WS', x + sumColWidth / 2, currentY + 4.8, { align: 'center' });
    x += sumColWidth;

    // Performance Tasks
    doc.text(`PERFORMANCE TASKS (${Math.round(weights.performance_tasks * 100)}%)`, x + (ptCount * ptScoreWidth) / 2, currentY + 4.8, { align: 'center' });
    x += (ptCount * ptScoreWidth);
    doc.text('TOTAL', x + sumColWidth / 2, currentY + 4.8, { align: 'center' });
    x += sumColWidth;
    doc.text('WS', x + sumColWidth / 2, currentY + 4.8, { align: 'center' });
    x += sumColWidth;

    // Quarterly Assessment
    doc.text(`EXAM (${Math.round(weights.quarterly_exam * 100)}%)`, x + sumColWidth, currentY + 4.8, { align: 'center' });
    x += sumColWidth * 2;

    // Final Grades
    doc.text('INITIAL', x + gradeColWidth / 2, currentY + 4.8, { align: 'center' });
    x += gradeColWidth;
    doc.text('TERM GRADE', x + gradeColWidth / 2, currentY + 4.8, { align: 'center' });

    currentY += 7;
  };

  drawTableHeader();

  // Draw HPS row
  doc.setFillColor(254, 243, 199);
  doc.rect(margin, currentY, pageWidth - margin * 2, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(146, 64, 14);

  let hx = margin + 1 + numWidth;
  doc.text('HIGHEST POSSIBLE SCORE', hx, currentY + 3.5);
  hx += nameWidth;

  hpsWW.forEach(w => {
    doc.text(String(w || 0), hx + wwScoreWidth / 2, currentY + 3.5, { align: 'center' });
    hx += wwScoreWidth;
  });
  doc.text(String(hpsTotalWW), hx + sumColWidth / 2, currentY + 3.5, { align: 'center' });
  hx += sumColWidth;
  doc.text('100%', hx + sumColWidth / 2, currentY + 3.5, { align: 'center' });
  hx += sumColWidth;

  hpsPT.forEach(p => {
    doc.text(String(p || 0), hx + ptScoreWidth / 2, currentY + 3.5, { align: 'center' });
    hx += ptScoreWidth;
  });
  doc.text(String(hpsTotalPT), hx + sumColWidth / 2, currentY + 3.5, { align: 'center' });
  hx += sumColWidth;
  doc.text('100%', hx + sumColWidth / 2, currentY + 3.5, { align: 'center' });
  hx += sumColWidth;

  doc.text(String(hpsExam), hx + sumColWidth, currentY + 3.5, { align: 'center' });
  hx += sumColWidth * 2;

  doc.text('100', hx + gradeColWidth / 2, currentY + 3.5, { align: 'center' });
  hx += gradeColWidth;
  doc.text('100', hx + gradeColWidth / 2, currentY + 3.5, { align: 'center' });

  currentY += 5;

  // Separate Males and Females
  const sortLearners = (list: Student[]) =>
    [...list].sort((a, b) => {
      const nameA = `${a.last_name || ''} ${a.first_name || ''}`.trim().toLowerCase();
      const nameB = `${b.last_name || ''} ${b.first_name || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

  const males = sortLearners(students.filter(s => (s.gender || '').toLowerCase() === 'male'));
  const females = sortLearners(students.filter(s => (s.gender || '').toLowerCase() === 'female'));

  const drawLearnerGroup = (group: Student[], title: string) => {
    if (currentY + 12 > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      drawTableHeader();
    }

    // Gender Section Header
    doc.setFillColor(224, 231, 255);
    doc.rect(margin, currentY, pageWidth - margin * 2, 4.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(30, 58, 138);
    doc.text(`${title} (${group.length})`, margin + 2, currentY + 3.2);
    currentY += 4.5;

    group.forEach((st, idx) => {
      if (currentY + 5.5 > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        drawTableHeader();
      }

      const rec = classRecords.find(r => 
        r.student_lrn === st.lrn && 
        r.subject_id === subject.id &&
        (quarter === 'summary' || Number(r.quarter) === Number(quarter))
      );

      const rawWW = normalizeScores(rec?.written_works, wwCount).map(v => (v !== '' && !isNaN(Number(v)) ? Number(v) : 0));
      const rawPT = normalizeScores(rec?.performance_tasks, ptCount).map(v => (v !== '' && !isNaN(Number(v)) ? Number(v) : 0));
      const rawExam = rec?.quarterly_exam !== undefined && rec?.quarterly_exam !== '' ? Number(rec.quarterly_exam) : null;

      const totalWW = rawWW.reduce((a, b) => a + b, 0);
      const totalPT = rawPT.reduce((a, b) => a + b, 0);
      const psWW = hpsTotalWW > 0 ? (totalWW / hpsTotalWW) * 100 : 0;
      const psPT = hpsTotalPT > 0 ? (totalPT / hpsTotalPT) * 100 : 0;
      const psExam = rawExam !== null && hpsExam > 0 ? (rawExam / hpsExam) * 100 : 0;

      const wsWW = psWW * weights.written_works;
      const wsPT = psPT * weights.performance_tasks;
      const wsExam = psExam * weights.quarterly_exam;

      const initialGrade = wsWW + wsPT + wsExam;
      const recAny = rec as unknown as Record<string, unknown> | undefined;
      const rawQG = rec?.final_grade ?? recAny?.quarterly_grade ?? recAny?.quarterlyGrade;
      const finalGrade = rawQG !== undefined && rawQG !== null 
        ? Number(rawQG) 
        : (initialGrade > 0 ? transmuteGrade(initialGrade) : null);

      // Alternating row background
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, pageWidth - margin * 2, 4.5, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);

      let lx = margin + 1;
      doc.text(String(idx + 1), lx, currentY + 3.2);
      lx += numWidth;

      const fullName = formatLearnerName(st);
      doc.text(fullName.slice(0, 28), lx, currentY + 3.2);
      lx += nameWidth;

      // WW
      rawWW.forEach(w => {
        doc.text(w > 0 ? String(w) : '', lx + wwScoreWidth / 2, currentY + 3.2, { align: 'center' });
        lx += wwScoreWidth;
      });
      doc.text(totalWW > 0 ? String(totalWW) : '', lx + sumColWidth / 2, currentY + 3.2, { align: 'center' });
      lx += sumColWidth;
      doc.text(wsWW > 0 ? wsWW.toFixed(1) : '', lx + sumColWidth / 2, currentY + 3.2, { align: 'center' });
      lx += sumColWidth;

      // PT
      rawPT.forEach(p => {
        doc.text(p > 0 ? String(p) : '', lx + ptScoreWidth / 2, currentY + 3.2, { align: 'center' });
        lx += ptScoreWidth;
      });
      doc.text(totalPT > 0 ? String(totalPT) : '', lx + sumColWidth / 2, currentY + 3.2, { align: 'center' });
      lx += sumColWidth;
      doc.text(wsPT > 0 ? wsPT.toFixed(1) : '', lx + sumColWidth / 2, currentY + 3.2, { align: 'center' });
      lx += sumColWidth;

      // Exam
      doc.text(rawExam !== null ? String(rawExam) : '', lx + sumColWidth, currentY + 3.2, { align: 'center' });
      lx += sumColWidth * 2;

      // Initial & Final
      doc.text(initialGrade > 0 ? initialGrade.toFixed(2) : '', lx + gradeColWidth / 2, currentY + 3.2, { align: 'center' });
      lx += gradeColWidth;

      doc.setFont('helvetica', 'bold');
      if (finalGrade !== null) {
        doc.setTextColor(finalGrade >= 75 ? 21 : 220, finalGrade >= 75 ? 128 : 38, finalGrade >= 75 ? 61 : 38);
        doc.text(String(finalGrade), lx + gradeColWidth / 2, currentY + 3.2, { align: 'center' });
      }

      currentY += 4.5;
    });
  };

  if (males.length > 0) drawLearnerGroup(males, 'MALE');
  if (females.length > 0) drawLearnerGroup(females, 'FEMALE');

  return new Uint8Array(doc.output('arraybuffer'));
}
